import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderOutcomeEvidenceRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-outcome-evidence");
}

function safeFileStem(value) {
  return String(value || "provider-outcome-evidence")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-outcome-evidence";
}

export async function providerOutcomeEvidenceRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-outcome-evidence-record",
    outcome_id: options.outcomeId || makeId("POE"),
    recorded_at: nowIso(),
    approval_ref: options.approvalRef,
    reproduction_ref: options.reproductionRef,
    rollback_ref: options.rollbackRef,
    target_operation_ref: options.targetOperationRef,
    work_item_id: options.workItemId,
    session_ref: options.sessionRef,
    expected_outcome: options.expectedOutcome,
    observed_result: options.observedResult,
    outcome_status: options.outcomeStatus || "blocked",
    evidence_refs: options.evidenceRefs ?? [],
    verification_refs: options.verificationRefs ?? [],
    semantic_truth_boundary: options.semanticTruthBoundary,
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-provider-outcome-evidence-record.schema.json", "provider outcome evidence record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderOutcomeEvidenceRoot(projectRoot), `${safeFileStem(payload.outcome_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
