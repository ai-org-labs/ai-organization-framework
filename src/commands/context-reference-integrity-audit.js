import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema, validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveContextIntegrityRoot } from "./context-integrity-record.js";
import { resolveExternalReferenceIntegrityRoot } from "./external-reference-integrity-record.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-090";
const TASK_STATUS_DIRS = ["open", "assigned", "done"];
const READY_STATUSES = new Set(["ready", "accepted_residual_risk"]);
const RESIDUAL_RISK_STATUSES = new Set(["blocked", "accepted_residual_risk"]);

function taskNumber(taskId) {
  const match = String(taskId ?? "").match(/TASK-(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

function isAtOrAfterCutoff(taskId, cutoffTaskId) {
  const current = taskNumber(taskId);
  const cutoff = taskNumber(cutoffTaskId);
  return Number.isFinite(current) && Number.isFinite(cutoff) && current >= cutoff;
}

function normalizeRef(ref) {
  return String(ref ?? "").replaceAll("\\", "/");
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
          artifact_ref: normalizeRef(path.relative(projectRoot, filePath))
        });
      }
    }
  }
  return tasks.sort((left, right) => taskNumber(left.task_id) - taskNumber(right.task_id));
}

async function maybeReadContextRecord(projectRoot, taskId) {
  const recordPath = path.join(resolveContextIntegrityRoot(projectRoot), `${taskId}.json`);
  try {
    return {
      artifact_ref: normalizeRef(path.relative(projectRoot, recordPath)),
      payload: await readJson(recordPath, `context integrity ${taskId}`)
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function loadExternalReferenceRecords(projectRoot) {
  const records = [];
  for (const filePath of await listJsonFiles(resolveExternalReferenceIntegrityRoot(projectRoot))) {
    records.push({
      artifact_ref: normalizeRef(path.relative(projectRoot, filePath)),
      payload: await readJson(filePath, `external reference integrity ${path.basename(filePath)}`)
    });
  }
  return records;
}

async function collectExternalRefsFromContextPacks(projectRoot, contextPackRefs) {
  const refs = [];
  for (const contextPackRef of contextPackRefs) {
    const absolutePath = path.resolve(projectRoot, contextPackRef);
    if (!(await pathExists(absolutePath))) {
      continue;
    }
    const payload = await readJson(absolutePath, `context pack ${contextPackRef}`);
    const externalRefs = payload.external_refs || payload.externalRefs || [];
    for (const externalRef of externalRefs) {
      if (typeof externalRef === "string") {
        refs.push(externalRef);
      } else if (externalRef && typeof externalRef === "object") {
        refs.push(externalRef.artifact_ref || externalRef.ref || externalRef.url || externalRef.id);
      }
    }
  }
  return refs.filter(Boolean).map(normalizeRef);
}

function externalRecordMatches(record, externalRef) {
  const payload = record.payload;
  const normalizedExternalRef = normalizeRef(externalRef);
  return normalizeRef(payload.external_ref) === normalizedExternalRef
    || normalizeRef(payload.external_ref_artifact_ref) === normalizedExternalRef
    || path.basename(normalizeRef(payload.external_ref_artifact_ref), ".json") === path.basename(normalizedExternalRef, ".json");
}

export async function contextReferenceIntegrityAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const auditedTasks = await loadScopedTasks(projectRoot, cutoffTaskId);
  const contextRecords = [];
  const externalRecords = await loadExternalReferenceRecords(projectRoot);
  const externalRecordSummaries = [];

  pushCheck(
    checks,
    errors,
    "scoped task discovery",
    auditedTasks.length > 0,
    `${auditedTasks.length} task(s) at or after ${cutoffTaskId} in ${TASK_STATUS_DIRS.join(", ")}`
  );

  for (const externalRecord of externalRecords) {
    const payload = externalRecord.payload;
    try {
      await validateWithBundledSchema(
        payload,
        "aof-external-reference-integrity-record.schema.json",
        "external reference integrity record"
      );
      pushCheck(checks, errors, `${payload.external_ref} external reference schema`, true, externalRecord.artifact_ref);
    } catch (error) {
      pushCheck(checks, errors, `${payload.external_ref ?? externalRecord.artifact_ref} external reference schema`, false, error.message);
      continue;
    }

    externalRecordSummaries.push({
      external_ref: payload.external_ref,
      external_ref_artifact_ref: payload.external_ref_artifact_ref,
      integrity_ref: externalRecord.artifact_ref,
      freshness_status: payload.freshness_status,
      availability_status: payload.availability_status,
      integrity_status: payload.integrity_status
    });

    pushCheck(
      checks,
      errors,
      `${payload.external_ref} external artifact ref resolves`,
      await pathExists(path.resolve(projectRoot, payload.external_ref_artifact_ref)),
      payload.external_ref_artifact_ref
    );
    pushCheck(
      checks,
      errors,
      `${payload.external_ref} not_proven boundary present`,
      Boolean(payload.not_proven),
      payload.not_proven || "missing not_proven"
    );
    pushCheck(
      checks,
      errors,
      `${payload.external_ref} is not blocked`,
      payload.integrity_status !== "blocked",
      `integrity_status=${payload.integrity_status}`
    );
    pushCheck(
      checks,
      errors,
      `${payload.external_ref} stale/unavailable refs are accepted or repaired`,
      !["stale"].includes(payload.freshness_status) && !["unavailable"].includes(payload.availability_status)
        || payload.integrity_status === "accepted_residual_risk",
      `freshness=${payload.freshness_status}, availability=${payload.availability_status}, integrity=${payload.integrity_status}`
    );
  }

  for (const task of auditedTasks) {
    const record = await maybeReadContextRecord(projectRoot, task.task_id);
    pushCheck(
      checks,
      errors,
      `${task.task_id} context integrity record presence`,
      Boolean(record),
      record ? record.artifact_ref : `missing .aof/artifacts/context-integrity/${task.task_id}.json`
    );
    if (!record) {
      continue;
    }

    const payload = record.payload;
    try {
      await validateWithBundledSchema(payload, "aof-context-integrity-record.schema.json", "context integrity record");
      pushCheck(checks, errors, `${task.task_id} context schema`, true, record.artifact_ref);
    } catch (error) {
      pushCheck(checks, errors, `${task.task_id} context schema`, false, error.message);
      continue;
    }

    contextRecords.push({
      task_id: task.task_id,
      task_ref: task.artifact_ref,
      context_integrity_ref: record.artifact_ref,
      integrity_status: payload.integrity_status,
      missing_context_count: payload.missing_context_refs.length,
      hidden_signal_count: payload.hidden_context_signals.length
    });

    pushCheck(
      checks,
      errors,
      `${task.task_id} context links to task`,
      payload.work_item_id === task.task_id,
      `work_item_id=${payload.work_item_id ?? "missing"}, expected=${task.task_id}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} context is release-usable`,
      READY_STATUSES.has(payload.integrity_status),
      `integrity_status=${payload.integrity_status}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} hidden/missing context is explicit`,
      payload.missing_context_refs.length === 0 && payload.hidden_context_signals.length === 0
        || RESIDUAL_RISK_STATUSES.has(payload.integrity_status),
      `missing=${payload.missing_context_refs.length}, hidden=${payload.hidden_context_signals.length}, status=${payload.integrity_status}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} not_proven boundary present`,
      Boolean(payload.not_proven),
      payload.not_proven || "missing not_proven"
    );

    for (const ref of [
      payload.work_item_ref,
      payload.session_ref,
      ...payload.context_pack_refs,
      ...payload.declared_context_refs,
      ...payload.required_context_refs
    ]) {
      pushCheck(
        checks,
        errors,
        `${task.task_id} context ref resolves`,
        await pathExists(path.resolve(projectRoot, ref)),
        ref
      );
    }

    const externalRefs = await collectExternalRefsFromContextPacks(projectRoot, payload.context_pack_refs);
    for (const externalRef of externalRefs) {
      const matchingRecord = externalRecords.find((candidate) => externalRecordMatches(candidate, externalRef));
      pushCheck(
        checks,
        errors,
        `${task.task_id} external ref has integrity record`,
        Boolean(matchingRecord),
        matchingRecord ? `${externalRef} -> ${matchingRecord.artifact_ref}` : externalRef
      );
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "context-reference-integrity-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: TASK_STATUS_DIRS,
    summary: {
      scoped_task_count: auditedTasks.length,
      context_record_count: contextRecords.length,
      external_reference_record_count: externalRecordSummaries.length,
      missing_context_record_count: auditedTasks.length - contextRecords.length,
      blocked_context_count: contextRecords.filter((record) => record.integrity_status === "blocked").length,
      stale_external_reference_count: externalRecordSummaries.filter((record) => record.freshness_status === "stale").length,
      failing_check_count: errors.length
    },
    tasks: auditedTasks,
    context_integrity_records: contextRecords,
    external_reference_integrity_records: externalRecordSummaries,
    checks,
    errors
  };

  await validatePayload(payload, "aof-context-reference-integrity-audit.schema.json", "context reference integrity audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
