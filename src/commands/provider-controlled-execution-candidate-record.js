import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderControlledExecutionCandidateRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-controlled-execution-candidates");
}

function safeFileStem(value) {
  return String(value || "provider-controlled-execution-candidate")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-controlled-execution-candidate";
}

export async function providerControlledExecutionCandidateRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-controlled-execution-candidate-record",
    candidate_id: options.candidateId || makeId("PCEC"),
    recorded_at: nowIso(),
    release_ref: options.releaseRef,
    work_item_id: options.workItemId,
    work_item_ref: options.workItemRef,
    mission_control_ref: options.missionControlRef,
    approval_ref: options.approvalRef,
    target_operation_ref: options.targetOperationRef,
    reproduction_ref: options.reproductionRef,
    rollback_ref: options.rollbackRef,
    outcome_ref: options.outcomeRef,
    learning_ref: options.learningRef,
    operator_acceptance_ref: options.operatorAcceptanceRef,
    product_value_evidence_ref: options.productValueEvidenceRef,
    production_boundary_ref: options.productionBoundaryRef,
    provider_scope: options.providerScope,
    controlled_execution_mode: options.controlledExecutionMode || "blocked",
    candidate_status: options.candidateStatus || "not_ready",
    expected_provider_effect: options.expectedProviderEffect,
    external_write_authorized: Boolean(options.externalWriteAuthorized),
    production_execution_authorized: Boolean(options.productionExecutionAuthorized),
    go_no_go_decision: options.goNoGoDecision || "not_requested",
    credential_boundary: options.credentialBoundary,
    budget_boundary: options.budgetBoundary,
    rollback_boundary: options.rollbackBoundary,
    monitoring_boundary: options.monitoringBoundary,
    incident_boundary: options.incidentBoundary,
    stop_conditions: options.stopConditions ?? [],
    provenance_refs: options.provenanceRefs ?? [],
    verification_refs: options.verificationRefs ?? [],
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(
    payload,
    "aof-provider-controlled-execution-candidate-record.schema.json",
    "provider controlled execution candidate record"
  );
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderControlledExecutionCandidateRoot(projectRoot), `${safeFileStem(payload.candidate_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
