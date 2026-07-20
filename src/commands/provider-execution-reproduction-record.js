import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderExecutionReproductionRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-execution-reproductions");
}

function safeFileStem(value) {
  return String(value || "provider-execution-reproduction")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-execution-reproduction";
}

export async function providerExecutionReproductionRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-execution-reproduction-record",
    reproduction_id: options.reproductionId || makeId("PERP"),
    recorded_at: nowIso(),
    approval_ref: options.approvalRef,
    adapter_ref: options.adapterRef,
    target_operation_ref: options.targetOperationRef,
    work_item_id: options.workItemId,
    work_item_ref: options.workItemRef,
    session_ref: options.sessionRef,
    replay_mode: options.replayMode || "local_reconstruction",
    input_fingerprint: options.inputFingerprint,
    expected_side_effect: options.expectedSideEffect,
    reconstructed_steps: options.reconstructedSteps ?? [],
    replay_evidence_refs: options.replayEvidenceRefs ?? [],
    verification_refs: options.verificationRefs ?? [],
    result_status: options.resultStatus || "blocked",
    mismatch_reason: options.mismatchReason || null,
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-provider-execution-reproduction-record.schema.json", "provider execution reproduction record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderExecutionReproductionRoot(projectRoot), `${safeFileStem(payload.reproduction_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
