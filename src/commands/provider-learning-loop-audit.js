import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderLearningLoopRoot } from "./provider-learning-loop-record.js";
import { resolveProviderOutcomeEvidenceRoot } from "./provider-outcome-evidence-record.js";

function normalizeRef(ref) {
  return String(ref ?? "").replaceAll("\\", "/");
}

function hasText(value) {
  return Boolean(String(value ?? "").trim());
}

function pushCheck(checks, errors, name, condition, detail, evidenceRefs = []) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail, evidence_refs: evidenceRefs.filter(Boolean) });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

async function loadRecords(projectRoot, root, schemaFileName, label, expectedArtifactType) {
  const records = [];
  for (const filePath of await listJsonFiles(root)) {
    const payload = await readJson(filePath, `${label} ${path.basename(filePath)}`);
    if (expectedArtifactType && payload.artifact_type !== expectedArtifactType) {
      continue;
    }
    await validateWithBundledSchema(payload, schemaFileName, label);
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasText(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function publicLearning(record) {
  const learning = record.payload;
  return {
    learning_id: learning.learning_id,
    outcome_ref: learning.outcome_ref,
    decision: learning.decision,
    update_status: learning.update_status,
    artifact_ref: record.artifact_ref
  };
}

export async function providerLearningLoopAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const learningUpdates = await loadRecords(projectRoot, resolveProviderLearningLoopRoot(projectRoot), "aof-provider-learning-loop-record.schema.json", "provider learning loop record", "provider-learning-loop-record");
  const outcomes = await loadRecords(projectRoot, resolveProviderOutcomeEvidenceRoot(projectRoot), "aof-provider-outcome-evidence-record.schema.json", "provider outcome evidence record", "provider-outcome-evidence-record");
  const outcomesByRef = new Map(outcomes.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "provider learning loop presence", learningUpdates.length > 0, `${learningUpdates.length} learning update(s) found`, learningUpdates.map((record) => record.artifact_ref));

  for (const record of learningUpdates) {
    const learning = record.payload;
    const refs = [
      record.artifact_ref,
      learning.outcome_ref,
      ...learning.learning_refs,
      ...learning.evidence_refs
    ].filter(Boolean);
    await checkRef(projectRoot, checks, errors, `${learning.learning_id} outcome ref resolves`, learning.outcome_ref, refs);
    for (const ref of learning.learning_refs) {
      await checkRef(projectRoot, checks, errors, `${learning.learning_id} learning ref resolves`, ref, refs);
    }
    for (const ref of learning.evidence_refs) {
      await checkRef(projectRoot, checks, errors, `${learning.learning_id} evidence ref resolves`, ref, refs);
    }

    const outcome = outcomesByRef.get(normalizeRef(learning.outcome_ref));
    pushCheck(checks, errors, `${learning.learning_id} linked outcome exists`, Boolean(outcome), learning.outcome_ref || "missing outcome_ref", refs);
    pushCheck(checks, errors, `${learning.learning_id} linked outcome is usable`, Boolean(outcome) && outcome.outcome_status !== "blocked", outcome ? `outcome_status=${outcome.outcome_status}` : "missing outcome", refs);
    pushCheck(checks, errors, `${learning.learning_id} update not blocked`, learning.update_status !== "blocked", `update_status=${learning.update_status}`, refs);
    pushCheck(checks, errors, `${learning.learning_id} learning summary`, hasText(learning.learning_summary), learning.learning_summary || "missing learning_summary", refs);
    pushCheck(checks, errors, `${learning.learning_id} next action`, hasText(learning.next_action), learning.next_action || "missing next_action", refs);
    pushCheck(checks, errors, `${learning.learning_id} not-proven boundary`, hasText(learning.not_proven), learning.not_proven || "missing not_proven", refs);
  }

  const publicLearningUpdates = learningUpdates.map(publicLearning);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-learning-loop-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      learning_count: publicLearningUpdates.length,
      updated_count: publicLearningUpdates.filter((entry) => entry.update_status === "updated").length,
      escalated_count: publicLearningUpdates.filter((entry) => entry.update_status === "escalated").length,
      blocked_count: publicLearningUpdates.filter((entry) => entry.update_status === "blocked").length,
      missing_boundary_count: checks.filter((check) => check.status === "fail" && /boundary|ref resolves|presence|outcome|blocked|summary|action/i.test(check.name)).length,
      failing_check_count: errors.length
    },
    learning_updates: publicLearningUpdates,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-learning-loop-audit.schema.json", "provider learning loop audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
