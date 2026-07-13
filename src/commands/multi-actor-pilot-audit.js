import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema, validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveMultiActorPilotRoot } from "./multi-actor-pilot-record.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-092";
const TASK_STATUS_DIRS = ["open", "assigned", "done"];
const ACCEPTED_STATUSES = new Set(["ready", "completed"]);
const REQUIRED_CORE_ROLES = ["visionary", "builder", "guardian"];

function taskNumber(taskId) {
  const match = String(taskId ?? "").match(/TASK-(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

function isAtOrAfterCutoff(taskId, cutoffTaskId) {
  const current = taskNumber(taskId);
  const cutoff = taskNumber(cutoffTaskId);
  return Number.isFinite(current) && Number.isFinite(cutoff) && current >= cutoff;
}

function pushCheck(checks, errors, name, condition, detail) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

async function validatePayload(payload, schemaFileName, label) {
  const schema = await loadBundledSchema(schemaFileName);
  validateAgainstSchema(payload, schema, label);
}

async function loadScopedTasks(projectRoot, cutoffTaskId) {
  const tasks = [];
  for (const statusDir of TASK_STATUS_DIRS) {
    const dirPath = path.join(projectRoot, ".aof", "tasks", statusDir);
    for (const filePath of await listJsonFiles(dirPath)) {
      const payload = await readJson(filePath, `task ${path.basename(filePath)}`);
      const taskId = payload.task_id ?? path.basename(filePath, ".json");
      if (isAtOrAfterCutoff(taskId, cutoffTaskId)) {
        tasks.push({
          task_id: taskId,
          title: payload.title ?? "",
          status: payload.status ?? statusDir,
          status_dir: statusDir,
          artifact_ref: path.relative(projectRoot, filePath)
        });
      }
    }
  }
  return tasks.sort((left, right) => taskNumber(left.task_id) - taskNumber(right.task_id));
}

async function maybeReadPilot(projectRoot, taskId) {
  const pilotPath = path.join(resolveMultiActorPilotRoot(projectRoot), `${taskId}.json`);
  try {
    return {
      artifact_ref: path.relative(projectRoot, pilotPath),
      payload: await readJson(pilotPath, `multi-actor pilot ${taskId}`)
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function checkRef(projectRoot, checks, errors, taskId, label, ref) {
  pushCheck(
    checks,
    errors,
    `${taskId} ${label} resolves`,
    Boolean(ref) && await pathExists(path.resolve(projectRoot, ref)),
    ref || `missing ${label}`
  );
}

function hasAllCoreRoles(roles) {
  return REQUIRED_CORE_ROLES.every((role) => Array.isArray(roles) && roles.includes(role));
}

export async function multiActorPilotAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const auditedTasks = await loadScopedTasks(projectRoot, cutoffTaskId);
  const pilots = [];

  pushCheck(
    checks,
    errors,
    "scoped task discovery",
    auditedTasks.length > 0,
    `${auditedTasks.length} task(s) at or after ${cutoffTaskId} in ${TASK_STATUS_DIRS.join(", ")}`
  );

  for (const task of auditedTasks) {
    const record = await maybeReadPilot(projectRoot, task.task_id);
    pushCheck(
      checks,
      errors,
      `${task.task_id} multi-actor pilot presence`,
      Boolean(record),
      record ? record.artifact_ref : `missing .aof/artifacts/multi-actor-pilots/${task.task_id}.json`
    );
    if (!record) {
      continue;
    }

    const payload = record.payload;
    try {
      await validateWithBundledSchema(payload, "aof-multi-actor-pilot.schema.json", "multi-actor pilot");
      pushCheck(checks, errors, `${task.task_id} pilot schema`, true, record.artifact_ref);
    } catch (error) {
      pushCheck(checks, errors, `${task.task_id} pilot schema`, false, error.message);
      continue;
    }

    pilots.push({
      task_id: task.task_id,
      task_ref: task.artifact_ref,
      pilot_ref: record.artifact_ref,
      pilot_status: payload.pilot_status,
      core_council_roles: payload.core_council_roles,
      actor_output_handoff_count: payload.actor_output_handoff_refs.length
    });

    pushCheck(
      checks,
      errors,
      `${task.task_id} pilot links to task`,
      payload.work_item_id === task.task_id,
      `work_item_id=${payload.work_item_id ?? "missing"}, expected=${task.task_id}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} pilot accepted status`,
      ACCEPTED_STATUSES.has(payload.pilot_status),
      `pilot_status=${payload.pilot_status}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} core council roles present`,
      hasAllCoreRoles(payload.core_council_roles),
      `roles=${(payload.core_council_roles ?? []).join(", ")}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} actor output handoffs present`,
      payload.actor_output_handoff_refs.length >= 2,
      `${payload.actor_output_handoff_refs.length} actor output handoff ref(s)`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} maker/checker/council boundary present`,
      Boolean(payload.maker_checker_council_boundary),
      payload.maker_checker_council_boundary || "missing maker/checker/council boundary"
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} not-proven boundary present`,
      Boolean(payload.not_proven),
      payload.not_proven || "missing not_proven"
    );

    await checkRef(projectRoot, checks, errors, task.task_id, "work item ref", payload.work_item_ref);
    await checkRef(projectRoot, checks, errors, task.task_id, "parent orchestrator ref", payload.parent_orchestrator_ref);
    await checkRef(projectRoot, checks, errors, task.task_id, "actor roster ref", payload.actor_roster_ref);
    for (const ref of payload.actor_output_handoff_refs) {
      await checkRef(projectRoot, checks, errors, task.task_id, "actor output handoff ref", ref);
    }
    await checkRef(projectRoot, checks, errors, task.task_id, "council judgment ref", payload.council_judgment_ref);
    await checkRef(projectRoot, checks, errors, task.task_id, "work execution packet ref", payload.work_execution_packet_ref);
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "multi-actor-pilot-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: TASK_STATUS_DIRS,
    summary: {
      scoped_task_count: auditedTasks.length,
      pilot_count: pilots.length,
      accepted_pilot_count: pilots.filter((pilot) => ACCEPTED_STATUSES.has(pilot.pilot_status)).length,
      missing_pilot_count: auditedTasks.length - pilots.length,
      failing_check_count: errors.length
    },
    tasks: auditedTasks,
    pilots,
    checks,
    errors
  };

  await validatePayload(payload, "aof-multi-actor-pilot-audit.schema.json", "multi-actor pilot audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
