import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderIncidentRecoveryRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-incident-recoveries");
}

function safeFileStem(value) {
  return String(value || "provider-incident-recovery")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-incident-recovery";
}

export async function providerIncidentRecoveryRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-incident-recovery-record",
    recovery_id: options.recoveryId || makeId("PIR"),
    recorded_at: nowIso(),
    release_ref: options.releaseRef,
    work_item_id: options.workItemId,
    work_item_ref: options.workItemRef,
    candidate_ref: options.candidateRef,
    approval_ref: options.approvalRef,
    reproduction_ref: options.reproductionRef,
    rollback_ref: options.rollbackRef,
    outcome_ref: options.outcomeRef,
    learning_ref: options.learningRef,
    operator_acceptance_ref: options.operatorAcceptanceRef,
    production_boundary_ref: options.productionBoundaryRef,
    incident_scenario: options.incidentScenario,
    detection_signal: options.detectionSignal,
    severity: options.severity || "medium",
    containment_action: options.containmentAction,
    rollback_decision: options.rollbackDecision || "blocked",
    recovery_action: options.recoveryAction,
    resume_decision: options.resumeDecision || "resume_blocked",
    operator_notification: options.operatorNotification,
    learning_update_ref: options.learningUpdateRef,
    governance_action: options.governanceAction || "stop_provider_execution",
    recovery_status: options.recoveryStatus || "not_ready",
    time_to_detect_boundary: options.timeToDetectBoundary,
    time_to_contain_boundary: options.timeToContainBoundary,
    data_loss_boundary: options.dataLossBoundary,
    customer_impact_boundary: options.customerImpactBoundary,
    stop_conditions: options.stopConditions ?? [],
    evidence_refs: options.evidenceRefs ?? [],
    verification_refs: options.verificationRefs ?? [],
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(
    payload,
    "aof-provider-incident-recovery-record.schema.json",
    "provider incident recovery record"
  );
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderIncidentRecoveryRoot(projectRoot), `${safeFileStem(payload.recovery_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
