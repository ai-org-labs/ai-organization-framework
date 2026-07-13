import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveWorkExecutionPacketRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "work-execution-packets");
}

export async function workExecutionPacketRecordCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const workItemId = options.workItemId || options.sourceTaskId;
  const payload = {
    artifact_type: "work-execution-packet",
    packet_id: options.packetId || makeId("WEP"),
    recorded_at: nowIso(),
    work_item_id: workItemId,
    work_item_ref: options.workItemRef,
    execution_status: options.executionStatus || "ready",
    context_integrity_ref: options.contextIntegrityRef,
    actor_handoff_refs: options.actorHandoffRefs ?? [],
    execution_lineage_ref: options.executionLineageRef,
    verification_evidence_refs: options.verificationEvidenceRefs ?? [],
    stop_continue_decision: {
      decision: options.stopContinueDecision || "continue",
      rationale: options.stopContinueRationale,
      decided_by: options.stopContinueDecidedBy,
      evidence_refs: options.stopContinueEvidenceRefs ?? []
    },
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-work-execution-packet.schema.json", "work execution packet");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveWorkExecutionPacketRoot(projectRoot), `${payload.work_item_id}.json`),
    payload
  );

  return {
    ok: true,
    projectRoot,
    artifactPath,
    packetId: payload.packet_id,
    payload
  };
}
