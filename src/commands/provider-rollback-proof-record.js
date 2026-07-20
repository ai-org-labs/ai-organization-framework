import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderRollbackProofRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-rollback-proofs");
}

function safeFileStem(value) {
  return String(value || "provider-rollback-proof")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-rollback-proof";
}

export async function providerRollbackProofRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-rollback-proof-record",
    rollback_id: options.rollbackId || makeId("PRB"),
    recorded_at: nowIso(),
    approval_ref: options.approvalRef,
    reproduction_ref: options.reproductionRef,
    target_operation_ref: options.targetOperationRef,
    rollback_operation: options.rollbackOperation,
    rollback_mode: options.rollbackMode || "simulated",
    rollback_supported: Boolean(options.rollbackSupported),
    rollback_evidence_refs: options.rollbackEvidenceRefs ?? [],
    verification_refs: options.verificationRefs ?? [],
    stop_conditions: options.stopConditions ?? [],
    result_status: options.resultStatus || "blocked",
    blocking_reason: options.blockingReason || null,
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-provider-rollback-proof-record.schema.json", "provider rollback proof record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderRollbackProofRoot(projectRoot), `${safeFileStem(payload.rollback_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
