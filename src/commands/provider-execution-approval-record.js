import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderExecutionApprovalRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-execution-approvals");
}

function safeFileStem(value) {
  return String(value || "provider-execution-approval")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-execution-approval";
}

export async function providerExecutionApprovalRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-execution-approval-record",
    approval_id: options.approvalId || makeId("PEA"),
    recorded_at: nowIso(),
    pilot_ref: options.pilotRef,
    adapter_ref: options.adapterRef,
    work_item_id: options.workItemId,
    work_item_ref: options.workItemRef,
    session_ref: options.sessionRef,
    approval_decision: options.approvalDecision || "pending",
    approved_execution_mode: options.approvedExecutionMode || "dry_run",
    external_write_authorized: Boolean(options.externalWriteAuthorized),
    human_approval_ref: options.humanApprovalRef || null,
    execution_scope: options.executionScope,
    target_operation_ref: options.targetOperationRef || null,
    allowed_operations: options.allowedOperations ?? [],
    denied_operations: options.deniedOperations ?? [],
    side_effect_boundary: options.sideEffectBoundary,
    redaction_boundary: options.redactionBoundary,
    rollback_plan: options.rollbackPlan,
    credential_boundary: options.credentialBoundary,
    budget_boundary: options.budgetBoundary,
    credential_scope: options.credentialScope ?? [],
    budget: options.budget ?? { currency: "none", maximum: 0 },
    rollback: options.rollback ?? { operation: "not_defined", supported: false, artifact_ref: null },
    provenance_refs: options.provenanceRefs ?? [],
    verification_refs: options.verificationRefs ?? [],
    stop_conditions: options.stopConditions ?? [],
    production_execution_status: options.productionExecutionStatus || "not_executed",
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-provider-execution-approval-record.schema.json", "provider execution approval record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderExecutionApprovalRoot(projectRoot), `${safeFileStem(payload.approval_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
