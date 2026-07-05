import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema, validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveWorkReadinessRoot } from "./work-readiness-record.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-082";
const TASK_STATUS_DIRS = ["open", "assigned", "done"];
const READY_STATUSES = new Set(["ready"]);

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

async function maybeReadReadinessRecord(projectRoot, taskId) {
  const recordPath = path.join(resolveWorkReadinessRoot(projectRoot), `${taskId}.json`);
  try {
    return {
      artifact_ref: path.relative(projectRoot, recordPath),
      payload: await readJson(recordPath, `work readiness ${taskId}`)
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

export async function workReadinessAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const auditedTasks = await loadScopedTasks(projectRoot, cutoffTaskId);
  const readinessRecords = [];

  pushCheck(
    checks,
    errors,
    "scoped task discovery",
    auditedTasks.length > 0,
    `${auditedTasks.length} task(s) at or after ${cutoffTaskId} in ${TASK_STATUS_DIRS.join(", ")}`
  );

  for (const task of auditedTasks) {
    const record = await maybeReadReadinessRecord(projectRoot, task.task_id);
    pushCheck(
      checks,
      errors,
      `${task.task_id} work readiness record presence`,
      Boolean(record),
      record ? record.artifact_ref : `missing .aof/artifacts/work-readiness/${task.task_id}.json`
    );
    if (!record) {
      continue;
    }

    const payload = record.payload;
    try {
      await validateWithBundledSchema(payload, "aof-work-readiness-record.schema.json", "work readiness record");
      pushCheck(checks, errors, `${task.task_id} readiness schema`, true, record.artifact_ref);
    } catch (error) {
      pushCheck(checks, errors, `${task.task_id} readiness schema`, false, error.message);
      continue;
    }

    readinessRecords.push({
      task_id: task.task_id,
      task_ref: task.artifact_ref,
      readiness_ref: record.artifact_ref,
      readiness_status: payload.readiness_status,
      acceptance_gate_count: payload.acceptance_gates.length,
      evidence_plan_count: payload.evidence_plan.length,
      stop_condition_count: payload.stop_conditions.length
    });

    pushCheck(
      checks,
      errors,
      `${task.task_id} readiness links to task`,
      payload.work_item_id === task.task_id,
      `work_item_id=${payload.work_item_id ?? "missing"}, expected=${task.task_id}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} readiness is ready`,
      READY_STATUSES.has(payload.readiness_status),
      `readiness_status=${payload.readiness_status}`
    );
    pushCheck(checks, errors, `${task.task_id} goal present`, Boolean(payload.goal), payload.goal || "missing goal");
    pushCheck(checks, errors, `${task.task_id} risk present`, Boolean(payload.risk), payload.risk || "missing risk");
    pushCheck(
      checks,
      errors,
      `${task.task_id} loss boundary present`,
      Boolean(payload.loss_boundary),
      payload.loss_boundary || "missing loss boundary"
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} acceptance gates present`,
      hasItems(payload.acceptance_gates),
      `${payload.acceptance_gates.length} acceptance gate(s)`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} evidence plan present`,
      hasItems(payload.evidence_plan),
      `${payload.evidence_plan.length} evidence plan item(s)`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} maker/checker separation`,
      payload.maker_role && payload.checker_role && payload.maker_role !== payload.checker_role,
      `maker=${payload.maker_role || "missing"}, checker=${payload.checker_role || "missing"}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} stop conditions present`,
      hasItems(payload.stop_conditions),
      `${payload.stop_conditions.length} stop condition(s)`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} QIF refs present`,
      hasItems(payload.qif_refs),
      `${payload.qif_refs.length} QIF ref(s)`
    );

    for (const ref of [payload.work_item_ref, ...payload.qif_refs]) {
      pushCheck(
        checks,
        errors,
        `${task.task_id} readiness ref resolves`,
        await pathExists(path.resolve(projectRoot, ref)),
        ref
      );
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "work-readiness-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: TASK_STATUS_DIRS,
    summary: {
      scoped_task_count: auditedTasks.length,
      readiness_record_count: readinessRecords.length,
      ready_record_count: readinessRecords.filter((record) => record.readiness_status === "ready").length,
      missing_readiness_record_count: auditedTasks.length - readinessRecords.length,
      failing_check_count: errors.length
    },
    tasks: auditedTasks,
    readiness_records: readinessRecords,
    checks,
    errors
  };

  await validatePayload(payload, "aof-work-readiness-audit.schema.json", "work readiness audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
