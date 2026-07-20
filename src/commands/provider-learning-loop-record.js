import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderLearningLoopRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-learning-loop");
}

function safeFileStem(value) {
  return String(value || "provider-learning-loop")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-learning-loop";
}

export async function providerLearningLoopRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-learning-loop-record",
    learning_id: options.learningId || makeId("PLL"),
    recorded_at: nowIso(),
    outcome_ref: options.outcomeRef,
    learning_summary: options.learningSummary,
    decision: options.decision || "defer",
    next_action: options.nextAction,
    update_status: options.updateStatus || "blocked",
    learning_refs: options.learningRefs ?? [],
    evidence_refs: options.evidenceRefs ?? [],
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-provider-learning-loop-record.schema.json", "provider learning loop record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderLearningLoopRoot(projectRoot), `${safeFileStem(payload.learning_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
