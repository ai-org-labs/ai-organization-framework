import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema, validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveSessionExportRoot } from "./session-export-record.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-095";
const TASK_STATUS_DIRS = ["open", "assigned", "done"];
const ACCEPTED_STATUSES = new Set(["ready", "completed"]);
const REQUIRED_EVENT_TYPES = ["prompt", "response", "tool_call", "artifact_write", "verification", "blocker", "stop_condition"];

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

async function maybeReadExport(projectRoot, taskId) {
  const exportPath = path.join(resolveSessionExportRoot(projectRoot), `${taskId}.json`);
  try {
    return {
      artifact_ref: path.relative(projectRoot, exportPath),
      payload: await readJson(exportPath, `session export ${taskId}`)
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

function eventTypes(events) {
  return new Set((events ?? []).map((event) => event.event_type));
}

function hasAllRequiredEventTypes(events) {
  const present = eventTypes(events);
  return REQUIRED_EVENT_TYPES.every((eventType) => present.has(eventType));
}

export async function sessionExportAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const auditedTasks = await loadScopedTasks(projectRoot, cutoffTaskId);
  const exports = [];

  pushCheck(
    checks,
    errors,
    "scoped task discovery",
    auditedTasks.length > 0,
    `${auditedTasks.length} task(s) at or after ${cutoffTaskId} in ${TASK_STATUS_DIRS.join(", ")}`
  );

  for (const task of auditedTasks) {
    const record = await maybeReadExport(projectRoot, task.task_id);
    pushCheck(
      checks,
      errors,
      `${task.task_id} session export presence`,
      Boolean(record),
      record ? record.artifact_ref : `missing .aof/artifacts/session-exports/${task.task_id}.json`
    );
    if (!record) {
      continue;
    }

    const payload = record.payload;
    try {
      await validateWithBundledSchema(payload, "aof-session-export-record.schema.json", "session export record");
      pushCheck(checks, errors, `${task.task_id} session export schema`, true, record.artifact_ref);
    } catch (error) {
      pushCheck(checks, errors, `${task.task_id} session export schema`, false, error.message);
      continue;
    }

    exports.push({
      task_id: task.task_id,
      task_ref: task.artifact_ref,
      export_ref: record.artifact_ref,
      export_status: payload.export_status,
      event_count: payload.event_summaries.length,
      provider: payload.provider_source.provider
    });

    pushCheck(checks, errors, `${task.task_id} export links to task`, payload.work_item_id === task.task_id, `work_item_id=${payload.work_item_id ?? "missing"}, expected=${task.task_id}`);
    pushCheck(checks, errors, `${task.task_id} accepted export status`, ACCEPTED_STATUSES.has(payload.export_status), `export_status=${payload.export_status}`);
    pushCheck(checks, errors, `${task.task_id} required event types present`, hasAllRequiredEventTypes(payload.event_summaries), `types=${Array.from(eventTypes(payload.event_summaries)).join(", ")}`);
    pushCheck(checks, errors, `${task.task_id} source-of-truth boundary present`, Boolean(payload.provider_source.source_of_truth_boundary), payload.provider_source.source_of_truth_boundary || "missing source_of_truth_boundary");
    pushCheck(checks, errors, `${task.task_id} redaction boundary present`, Boolean(payload.redaction_boundary), payload.redaction_boundary || "missing redaction_boundary");
    pushCheck(checks, errors, `${task.task_id} release-ready boundary present`, Boolean(payload.release_ready_boundary), payload.release_ready_boundary || "missing release_ready_boundary");
    pushCheck(checks, errors, `${task.task_id} not-proven boundary present`, Boolean(payload.not_proven), payload.not_proven || "missing not_proven");

    await checkRef(projectRoot, checks, errors, task.task_id, "work item ref", payload.work_item_ref);
    await checkRef(projectRoot, checks, errors, task.task_id, "source session ref", payload.source_session_ref);
    for (const event of payload.event_summaries) {
      for (const ref of event.artifact_refs) {
        await checkRef(projectRoot, checks, errors, task.task_id, `event ${event.event_id} artifact ref`, ref);
      }
    }
    for (const [label, refs] of [
      ["task ref", payload.links.task_refs],
      ["requirement ref", payload.links.requirement_refs],
      ["test evidence ref", payload.links.test_evidence_refs],
      ["artifact ref", payload.links.artifact_refs],
      ["release-ready evidence ref", payload.links.release_ready_evidence_refs]
    ]) {
      for (const ref of refs) {
        await checkRef(projectRoot, checks, errors, task.task_id, label, ref);
      }
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "session-export-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: TASK_STATUS_DIRS,
    summary: {
      scoped_task_count: auditedTasks.length,
      export_count: exports.length,
      accepted_export_count: exports.filter((record) => ACCEPTED_STATUSES.has(record.export_status)).length,
      missing_export_count: auditedTasks.length - exports.length,
      failing_check_count: errors.length
    },
    tasks: auditedTasks,
    exports,
    checks,
    errors
  };

  await validatePayload(payload, "aof-session-export-audit.schema.json", "session export audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
