import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderProductionBoundaryRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-production-boundaries");
}

function safeFileStem(value) {
  return String(value || "provider-production-boundary")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-production-boundary";
}

export async function providerProductionBoundaryRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-production-boundary-record",
    boundary_id: options.boundaryId || makeId("PPB"),
    recorded_at: nowIso(),
    release_ref: options.releaseRef,
    work_item_id: options.workItemId,
    work_item_ref: options.workItemRef,
    mission_control_ref: options.missionControlRef,
    approval_ref: options.approvalRef,
    reproduction_ref: options.reproductionRef,
    rollback_ref: options.rollbackRef,
    outcome_ref: options.outcomeRef,
    learning_ref: options.learningRef,
    operator_acceptance_ref: options.operatorAcceptanceRef,
    product_value_evidence_ref: options.productValueEvidenceRef,
    provider_scope: options.providerScope,
    allowed_operation_class: options.allowedOperationClass || "controlled_write_candidate",
    execution_eligibility: options.executionEligibility || "blocked",
    production_execution_authorized: Boolean(options.productionExecutionAuthorized),
    credential_boundary: options.credentialBoundary,
    budget_boundary: options.budgetBoundary,
    revocation_boundary: options.revocationBoundary,
    rollback_boundary: options.rollbackBoundary,
    monitoring_boundary: options.monitoringBoundary,
    incident_boundary: options.incidentBoundary,
    human_go_no_go_boundary: options.humanGoNoGoBoundary,
    product_value_comprehension_boundary: options.productValueComprehensionBoundary,
    go_no_go_status: options.goNoGoStatus || "not_authorized",
    governance_action: options.governanceAction || "block_production_execution",
    stop_conditions: options.stopConditions ?? [],
    provenance_refs: options.provenanceRefs ?? [],
    verification_refs: options.verificationRefs ?? [],
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-provider-production-boundary-record.schema.json", "provider production boundary record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderProductionBoundaryRoot(projectRoot), `${safeFileStem(payload.boundary_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
