import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-071";
const VALID_REVIEW_STATUSES = new Set(["approved", "changes-requested", "blocked", "deferred"]);

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

async function loadDoneTasks(projectRoot, cutoffTaskId) {
  const doneRoot = path.join(projectRoot, ".aof", "tasks", "done");
  const tasks = [];
  for (const filePath of await listJsonFiles(doneRoot)) {
    const payload = await readJson(filePath, `task ${path.basename(filePath)}`);
    const taskId = payload.task_id ?? path.basename(filePath, ".json");
    if (isAtOrAfterCutoff(taskId, cutoffTaskId)) {
      tasks.push({
        task_id: taskId,
        title: payload.title ?? "",
        artifact_ref: path.relative(projectRoot, filePath)
      });
    }
  }
  return tasks.sort((left, right) => taskNumber(left.task_id) - taskNumber(right.task_id));
}

async function loadCouncilReviews(projectRoot) {
  const reviewRoot = path.join(projectRoot, ".aof", "artifacts", "execution", "council-reviews");
  const reviewsByTask = new Map();
  for (const filePath of await listJsonFiles(reviewRoot)) {
    const payload = await readJson(filePath, `council review ${path.basename(filePath)}`);
    const taskId = payload.source_task_id;
    if (!taskId) {
      continue;
    }
    if (!reviewsByTask.has(taskId)) {
      reviewsByTask.set(taskId, []);
    }
    reviewsByTask.get(taskId).push({
      artifact_ref: path.relative(projectRoot, filePath),
      payload
    });
  }
  return reviewsByTask;
}

async function refResolves(projectRoot, ref) {
  return Boolean(ref) && await pathExists(path.resolve(projectRoot, ref));
}

export async function reviewProvenanceAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const auditedTasks = await loadDoneTasks(projectRoot, cutoffTaskId);
  const reviewsByTask = await loadCouncilReviews(projectRoot);
  const reviewRecords = [];

  pushCheck(
    checks,
    errors,
    "done task discovery",
    auditedTasks.length > 0,
    `${auditedTasks.length} done task(s) at or after ${cutoffTaskId}`
  );

  for (const task of auditedTasks) {
    const reviews = reviewsByTask.get(task.task_id) ?? [];
    pushCheck(
      checks,
      errors,
      `${task.task_id} council review presence`,
      reviews.length > 0,
      reviews.length > 0 ? `${reviews.length} review(s)` : "missing council review artifact"
    );

    for (const review of reviews) {
      const payload = review.payload;
      const roleResultRefs = payload.role_result_refs ?? [];
      const evidenceRefs = payload.evidence_refs ?? [];
      reviewRecords.push({
        task_id: task.task_id,
        review_ref: review.artifact_ref,
        council_id: payload.council_id ?? null,
        review_status: payload.review_status ?? null,
        source_parent_session_id: payload.source_parent_session_id ?? null,
        role_result_ref_count: roleResultRefs.length,
        evidence_ref_count: evidenceRefs.length
      });

      pushCheck(
        checks,
        errors,
        `${task.task_id} review status validity`,
        VALID_REVIEW_STATUSES.has(payload.review_status),
        `review_status=${payload.review_status ?? "missing"}`
      );
      pushCheck(
        checks,
        errors,
        `${task.task_id} review source task matches`,
        payload.source_task_id === task.task_id,
        `source_task_id=${payload.source_task_id ?? "missing"}, expected=${task.task_id}`
      );
      pushCheck(
        checks,
        errors,
        `${task.task_id} review parent session provenance`,
        Boolean(payload.source_parent_session_id),
        payload.source_parent_session_id ?? "missing source_parent_session_id"
      );
      pushCheck(
        checks,
        errors,
        `${task.task_id} review evidence is not empty`,
        roleResultRefs.length + evidenceRefs.length > 0,
        `role_result_refs=${roleResultRefs.length}, evidence_refs=${evidenceRefs.length}`
      );

      for (const ref of roleResultRefs) {
        pushCheck(
          checks,
          errors,
          `${task.task_id} role result ref resolves`,
          await refResolves(projectRoot, ref),
          ref
        );
      }
      for (const ref of evidenceRefs) {
        pushCheck(
          checks,
          errors,
          `${task.task_id} review evidence ref resolves`,
          await refResolves(projectRoot, ref),
          ref
        );
      }
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "review-provenance-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: ["done"],
    valid_review_statuses: [...VALID_REVIEW_STATUSES],
    summary: {
      scoped_task_count: auditedTasks.length,
      review_record_count: reviewRecords.length,
      missing_review_record_count: auditedTasks.filter((task) => (reviewsByTask.get(task.task_id) ?? []).length === 0).length,
      failing_check_count: errors.length
    },
    tasks: auditedTasks,
    review_records: reviewRecords,
    checks,
    errors
  };

  await validatePayload(payload, "aof-review-provenance-audit.schema.json", "review provenance audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
