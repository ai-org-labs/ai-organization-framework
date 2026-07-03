import fs from "node:fs/promises";
import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-071";
const TASK_STATUS_DIRS = ["open", "assigned", "done"];
const VALID_IMPACT_STATUSES = new Set([
  "archmap_update_required",
  "archmap_unaffected",
  "archmap_deferred_with_reason"
]);
const PENDING_COUNCIL_STATUSES = new Set(["", "pending", "not_reviewed"]);

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

async function validatePayload(payload, schemaFileName, label) {
  const schema = await loadBundledSchema(schemaFileName);
  validateAgainstSchema(payload, schema, label);
}

async function maybeReadImpactRecord(projectRoot, taskId) {
  const recordPath = path.join(projectRoot, ".aof", "artifacts", "archmap", "impact", `${taskId}.json`);
  try {
    return {
      artifact_ref: path.relative(projectRoot, recordPath),
      payload: await readJson(recordPath, `archmap impact ${taskId}`)
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function archmapImpactAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const auditedTasks = await loadScopedTasks(projectRoot, cutoffTaskId);
  const impactRecords = [];

  pushCheck(
    checks,
    errors,
    "scoped task discovery",
    auditedTasks.length > 0,
    `${auditedTasks.length} task(s) at or after ${cutoffTaskId} in ${TASK_STATUS_DIRS.join(", ")}`
  );

  for (const task of auditedTasks) {
    const record = await maybeReadImpactRecord(projectRoot, task.task_id);
    pushCheck(
      checks,
      errors,
      `${task.task_id} archmap impact record presence`,
      Boolean(record),
      record ? record.artifact_ref : `missing .aof/artifacts/archmap/impact/${task.task_id}.json`
    );
    if (!record) {
      continue;
    }

    const payload = record.payload;
    impactRecords.push({
      task_id: task.task_id,
      task_ref: task.artifact_ref,
      impact_ref: record.artifact_ref,
      status: payload.status ?? null,
      council_review_status: payload.council_review_status ?? null,
      archmap_source_ref: payload.archmap_source_ref ?? null
    });

    pushCheck(
      checks,
      errors,
      `${task.task_id} impact record links to task`,
      payload.work_item_id === task.task_id,
      `work_item_id=${payload.work_item_id ?? "missing"}, expected=${task.task_id}`
    );

    pushCheck(
      checks,
      errors,
      `${task.task_id} impact status validity`,
      VALID_IMPACT_STATUSES.has(payload.status),
      `status=${payload.status ?? "missing"}`
    );

    pushCheck(
      checks,
      errors,
      `${task.task_id} council impact disposition`,
      !PENDING_COUNCIL_STATUSES.has(String(payload.council_review_status ?? "").toLowerCase()),
      `council_review_status=${payload.council_review_status ?? "missing"}`
    );

    const workItemRef = payload.work_item_ref ? path.resolve(projectRoot, payload.work_item_ref) : null;
    pushCheck(
      checks,
      errors,
      `${task.task_id} work item ref resolves`,
      Boolean(workItemRef) && await pathExists(workItemRef),
      payload.work_item_ref ?? "missing work_item_ref"
    );

    const archmapSourceRef = payload.archmap_source_ref ? path.resolve(projectRoot, payload.archmap_source_ref) : null;
    pushCheck(
      checks,
      errors,
      `${task.task_id} archmap source ref resolves`,
      Boolean(archmapSourceRef) && await pathExists(archmapSourceRef),
      payload.archmap_source_ref ?? "missing archmap_source_ref"
    );
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "archmap-impact-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: TASK_STATUS_DIRS,
    valid_impact_statuses: [...VALID_IMPACT_STATUSES],
    summary: {
      scoped_task_count: auditedTasks.length,
      impact_record_count: impactRecords.length,
      missing_impact_record_count: auditedTasks.length - impactRecords.length,
      failing_check_count: errors.length
    },
    tasks: auditedTasks,
    impact_records: impactRecords,
    checks,
    errors
  };

  await validatePayload(payload, "aof-archmap-impact-audit.schema.json", "archmap impact audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
