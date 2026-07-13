import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema, validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveWorkExecutionPacketRoot } from "./work-execution-packet-record.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-091";
const TASK_STATUS_DIRS = ["open", "assigned", "done"];
const ACCEPTED_STATUSES = new Set(["ready", "completed"]);

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

async function maybeReadPacket(projectRoot, taskId) {
  const packetPath = path.join(resolveWorkExecutionPacketRoot(projectRoot), `${taskId}.json`);
  try {
    return {
      artifact_ref: path.relative(projectRoot, packetPath),
      payload: await readJson(packetPath, `work execution packet ${taskId}`)
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
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

export async function workExecutionPacketAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const auditedTasks = await loadScopedTasks(projectRoot, cutoffTaskId);
  const packets = [];

  pushCheck(
    checks,
    errors,
    "scoped task discovery",
    auditedTasks.length > 0,
    `${auditedTasks.length} task(s) at or after ${cutoffTaskId} in ${TASK_STATUS_DIRS.join(", ")}`
  );

  for (const task of auditedTasks) {
    const record = await maybeReadPacket(projectRoot, task.task_id);
    pushCheck(
      checks,
      errors,
      `${task.task_id} work execution packet presence`,
      Boolean(record),
      record ? record.artifact_ref : `missing .aof/artifacts/work-execution-packets/${task.task_id}.json`
    );
    if (!record) {
      continue;
    }

    const payload = record.payload;
    try {
      await validateWithBundledSchema(payload, "aof-work-execution-packet.schema.json", "work execution packet");
      pushCheck(checks, errors, `${task.task_id} packet schema`, true, record.artifact_ref);
    } catch (error) {
      pushCheck(checks, errors, `${task.task_id} packet schema`, false, error.message);
      continue;
    }

    packets.push({
      task_id: task.task_id,
      task_ref: task.artifact_ref,
      packet_ref: record.artifact_ref,
      execution_status: payload.execution_status,
      actor_handoff_count: payload.actor_handoff_refs.length,
      verification_evidence_count: payload.verification_evidence_refs.length,
      stop_continue_decision: payload.stop_continue_decision.decision
    });

    pushCheck(
      checks,
      errors,
      `${task.task_id} packet links to task`,
      payload.work_item_id === task.task_id,
      `work_item_id=${payload.work_item_id ?? "missing"}, expected=${task.task_id}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} packet accepted status`,
      ACCEPTED_STATUSES.has(payload.execution_status),
      `execution_status=${payload.execution_status}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} actor handoff refs present`,
      hasItems(payload.actor_handoff_refs),
      `${payload.actor_handoff_refs.length} actor handoff ref(s)`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} verification evidence refs present`,
      hasItems(payload.verification_evidence_refs),
      `${payload.verification_evidence_refs.length} verification evidence ref(s)`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} stop/continue decision present`,
      Boolean(payload.stop_continue_decision?.decision && payload.stop_continue_decision?.rationale),
      payload.stop_continue_decision?.decision || "missing stop/continue decision"
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} not-proven boundary present`,
      Boolean(payload.not_proven),
      payload.not_proven || "missing not_proven"
    );

    await checkRef(projectRoot, checks, errors, task.task_id, "work item ref", payload.work_item_ref);
    await checkRef(projectRoot, checks, errors, task.task_id, "context integrity ref", payload.context_integrity_ref);
    await checkRef(projectRoot, checks, errors, task.task_id, "execution lineage ref", payload.execution_lineage_ref);
    for (const ref of payload.actor_handoff_refs) {
      await checkRef(projectRoot, checks, errors, task.task_id, "actor handoff ref", ref);
    }
    for (const ref of payload.verification_evidence_refs) {
      await checkRef(projectRoot, checks, errors, task.task_id, "verification evidence ref", ref);
    }
    for (const ref of payload.stop_continue_decision.evidence_refs) {
      await checkRef(projectRoot, checks, errors, task.task_id, "stop/continue evidence ref", ref);
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "work-execution-packet-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: TASK_STATUS_DIRS,
    summary: {
      scoped_task_count: auditedTasks.length,
      packet_count: packets.length,
      accepted_packet_count: packets.filter((packet) => ACCEPTED_STATUSES.has(packet.execution_status)).length,
      missing_packet_count: auditedTasks.length - packets.length,
      failing_check_count: errors.length
    },
    tasks: auditedTasks,
    packets,
    checks,
    errors
  };

  await validatePayload(payload, "aof-work-execution-packet-audit.schema.json", "work execution packet audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
