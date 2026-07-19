import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveOperatorValidationRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "operator-validation");
}

function safeFileStem(value) {
  return String(value || "operator-validation")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "operator-validation";
}

export async function operatorValidationRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "operator-validation-record",
    validation_id: options.validationId || makeId("OVR"),
    recorded_at: nowIso(),
    operator_ref: options.operatorRef,
    feedback_source: options.feedbackSource || "self_hosting_operator",
    release_ref: options.releaseRef,
    work_item_id: options.workItemId,
    work_item_ref: options.workItemRef,
    mission_control_ref: options.missionControlRef,
    evidence_refs: options.evidenceRefs ?? [],
    understanding_outcome: options.understandingOutcome || "not_checked",
    reproduction_outcome: options.reproductionOutcome || "not_checked",
    acceptance_outcome: options.acceptanceOutcome || "not_checked",
    feedback_summary: options.feedbackSummary,
    blocking_reason: options.blockingReason || null,
    governance_action: options.governanceAction || "none",
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-operator-validation-record.schema.json", "operator validation record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveOperatorValidationRoot(projectRoot), `${safeFileStem(payload.validation_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
