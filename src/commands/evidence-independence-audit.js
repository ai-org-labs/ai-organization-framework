import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-071";
const INDEPENDENT_CATEGORIES = new Set([
  "test",
  "schema",
  "governance-review",
  "council-review",
  "guardian-result",
  "release-check"
]);

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

function classifyEvidenceRef(ref) {
  const normalized = String(ref ?? "");
  if (normalized.startsWith("test/") || normalized.includes("/test/")) {
    return "test";
  }
  if (normalized.startsWith("schemas/")) {
    return "schema";
  }
  if (normalized.includes("/council-reviews/")) {
    return "council-review";
  }
  if (normalized.includes("/role-results/") && /guardian/i.test(normalized)) {
    return "guardian-result";
  }
  if (/qif|review|checklist|audit/i.test(normalized) && normalized.startsWith("docs/")) {
    return "governance-review";
  }
  if (/release-state-audit|smoke|npm test/i.test(normalized)) {
    return "release-check";
  }
  if (normalized.startsWith(".aof/artifacts/") && /audit/i.test(normalized)) {
    return "release-check";
  }
  if (normalized.startsWith("src/")) {
    return "maker-authored";
  }
  if (normalized.startsWith(".aof/tasks/") || normalized.includes("/archmap/impact/")) {
    return "self-attested";
  }
  return "unknown";
}

async function validatePayload(payload, schemaFileName, label) {
  const schema = await loadBundledSchema(schemaFileName);
  validateAgainstSchema(payload, schema, label);
}

async function loadDoneTasks(projectRoot, cutoffTaskId) {
  const tasks = [];
  for (const filePath of await listJsonFiles(path.join(projectRoot, ".aof", "tasks", "done"))) {
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
  const reviewsByTask = new Map();
  const reviewRoot = path.join(projectRoot, ".aof", "artifacts", "execution", "council-reviews");
  for (const filePath of await listJsonFiles(reviewRoot)) {
    const payload = await readJson(filePath, `council review ${path.basename(filePath)}`);
    if (!payload.source_task_id) {
      continue;
    }
    if (!reviewsByTask.has(payload.source_task_id)) {
      reviewsByTask.set(payload.source_task_id, []);
    }
    reviewsByTask.get(payload.source_task_id).push({
      artifact_ref: path.relative(projectRoot, filePath),
      payload
    });
  }
  return reviewsByTask;
}

export async function evidenceIndependenceAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const auditedTasks = await loadDoneTasks(projectRoot, cutoffTaskId);
  const reviewsByTask = await loadCouncilReviews(projectRoot);
  const evidenceRecords = [];

  pushCheck(
    checks,
    errors,
    "done task discovery",
    auditedTasks.length > 0,
    `${auditedTasks.length} done task(s) at or after ${cutoffTaskId}`
  );

  for (const task of auditedTasks) {
    const reviews = reviewsByTask.get(task.task_id) ?? [];
    const evidenceRefs = reviews.flatMap((review) => review.payload.evidence_refs ?? []);
    const classified = evidenceRefs.map((ref) => ({
      ref,
      category: classifyEvidenceRef(ref),
      independent: INDEPENDENT_CATEGORIES.has(classifyEvidenceRef(ref))
    }));
    const independentCount = classified.filter((entry) => entry.independent).length;
    evidenceRecords.push({
      task_id: task.task_id,
      evidence_ref_count: evidenceRefs.length,
      independent_evidence_count: independentCount,
      categories: [...new Set(classified.map((entry) => entry.category))]
    });

    pushCheck(
      checks,
      errors,
      `${task.task_id} evidence presence`,
      evidenceRefs.length > 0,
      `${evidenceRefs.length} evidence ref(s)`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} independent evidence presence`,
      independentCount > 0,
      classified.map((entry) => `${entry.category}:${entry.ref}`).join(", ") || "no evidence"
    );

    for (const entry of classified) {
      pushCheck(
        checks,
        errors,
        `${task.task_id} evidence ref resolves`,
        await pathExists(path.resolve(projectRoot, entry.ref)),
        entry.ref
      );
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "evidence-independence-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: ["done"],
    independent_categories: [...INDEPENDENT_CATEGORIES],
    summary: {
      scoped_task_count: auditedTasks.length,
      evidence_record_count: evidenceRecords.length,
      low_independence_task_count: evidenceRecords.filter((record) => record.independent_evidence_count === 0).length,
      failing_check_count: errors.length
    },
    tasks: auditedTasks,
    evidence_records: evidenceRecords,
    checks,
    errors
  };

  await validatePayload(payload, "aof-evidence-independence-audit.schema.json", "evidence independence audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
