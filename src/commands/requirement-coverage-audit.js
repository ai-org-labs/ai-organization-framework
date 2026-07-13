import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema, validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveRequirementCoverageRoot } from "./requirement-coverage-record.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-094";
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

async function maybeReadRecord(projectRoot, taskId) {
  const recordPath = path.join(resolveRequirementCoverageRoot(projectRoot), `${taskId}.json`);
  try {
    return {
      artifact_ref: path.relative(projectRoot, recordPath),
      payload: await readJson(recordPath, `requirement coverage record ${taskId}`)
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

function requirementCounts(requirements) {
  return {
    total_requirements: requirements.length,
    covered_count: requirements.filter((entry) => entry.status === "covered").length,
    partial_count: requirements.filter((entry) => entry.status === "partial").length,
    blocked_count: requirements.filter((entry) => entry.status === "blocked").length,
    at_risk_count: requirements.filter((entry) => entry.status === "at_risk").length,
    unstarted_count: requirements.filter((entry) => entry.status === "unstarted").length
  };
}

function countsMatch(actual, expected) {
  return Object.entries(expected).every(([key, value]) => actual?.[key] === value);
}

export async function requirementCoverageAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const auditedTasks = await loadScopedTasks(projectRoot, cutoffTaskId);
  const records = [];

  pushCheck(
    checks,
    errors,
    "scoped task discovery",
    auditedTasks.length > 0,
    `${auditedTasks.length} task(s) at or after ${cutoffTaskId} in ${TASK_STATUS_DIRS.join(", ")}`
  );

  for (const task of auditedTasks) {
    const record = await maybeReadRecord(projectRoot, task.task_id);
    pushCheck(
      checks,
      errors,
      `${task.task_id} requirement coverage record presence`,
      Boolean(record),
      record ? record.artifact_ref : `missing .aof/artifacts/requirement-coverage/${task.task_id}.json`
    );
    if (!record) {
      continue;
    }

    const payload = record.payload;
    try {
      await validateWithBundledSchema(payload, "aof-requirement-coverage-record.schema.json", "requirement coverage record");
      pushCheck(checks, errors, `${task.task_id} requirement coverage schema`, true, record.artifact_ref);
    } catch (error) {
      pushCheck(checks, errors, `${task.task_id} requirement coverage schema`, false, error.message);
      continue;
    }

    records.push({
      task_id: task.task_id,
      task_ref: task.artifact_ref,
      record_ref: record.artifact_ref,
      coverage_status: payload.coverage_status,
      requirement_count: payload.requirements.length,
      blocked_count: payload.coverage_summary.blocked_count,
      estimated_remaining_work_items: payload.forecast.estimated_remaining_work_items
    });

    pushCheck(
      checks,
      errors,
      `${task.task_id} record links to task`,
      payload.work_item_id === task.task_id,
      `work_item_id=${payload.work_item_id ?? "missing"}, expected=${task.task_id}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} accepted coverage status`,
      ACCEPTED_STATUSES.has(payload.coverage_status),
      `coverage_status=${payload.coverage_status}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} has requirement entries`,
      payload.requirements.length > 0,
      `${payload.requirements.length} requirement(s)`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} coverage counts match requirements`,
      countsMatch(payload.coverage_summary, requirementCounts(payload.requirements)),
      JSON.stringify(payload.coverage_summary)
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} forecast boundary present`,
      Boolean(payload.forecast.forecast_boundary),
      payload.forecast.forecast_boundary || "missing forecast boundary"
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} not-proven boundary present`,
      Boolean(payload.not_proven),
      payload.not_proven || "missing not_proven"
    );

    await checkRef(projectRoot, checks, errors, task.task_id, "work item ref", payload.work_item_ref);
    if (payload.forecast.burndown_ref) {
      await checkRef(projectRoot, checks, errors, task.task_id, "burndown ref", payload.forecast.burndown_ref);
    }
    for (const requirement of payload.requirements) {
      await checkRef(projectRoot, checks, errors, task.task_id, `requirement ${requirement.requirement_id} source ref`, requirement.source_ref);
      for (const ref of requirement.linked_work_item_refs) {
        await checkRef(projectRoot, checks, errors, task.task_id, `requirement ${requirement.requirement_id} work ref`, ref);
      }
      for (const ref of requirement.evidence_refs) {
        await checkRef(projectRoot, checks, errors, task.task_id, `requirement ${requirement.requirement_id} evidence ref`, ref);
      }
      for (const ref of requirement.blocker_refs ?? []) {
        await checkRef(projectRoot, checks, errors, task.task_id, `requirement ${requirement.requirement_id} blocker ref`, ref);
      }
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "requirement-coverage-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: TASK_STATUS_DIRS,
    summary: {
      scoped_task_count: auditedTasks.length,
      record_count: records.length,
      accepted_record_count: records.filter((record) => ACCEPTED_STATUSES.has(record.coverage_status)).length,
      missing_record_count: auditedTasks.length - records.length,
      failing_check_count: errors.length
    },
    tasks: auditedTasks,
    records,
    checks,
    errors
  };

  await validatePayload(payload, "aof-requirement-coverage-audit.schema.json", "requirement coverage audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
