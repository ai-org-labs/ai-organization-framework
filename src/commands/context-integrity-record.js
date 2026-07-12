import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveContextIntegrityRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "context-integrity");
}

export async function contextIntegrityRecordCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const workItemId = options.workItemId || options.sourceTaskId;
  const payload = {
    artifact_type: "context-integrity-record",
    record_id: options.recordId || makeId("CIR"),
    recorded_at: nowIso(),
    work_item_id: workItemId,
    work_item_ref: options.workItemRef,
    session_ref: options.sessionRef,
    context_pack_refs: options.contextPackRefs || [],
    declared_context_refs: options.declaredContextRefs || [],
    required_context_refs: options.requiredContextRefs || [],
    missing_context_refs: options.missingContextRefs || [],
    hidden_context_signals: options.hiddenContextSignals || [],
    integrity_status: options.integrityStatus || "ready",
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId || workItemId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null
  };

  await validateWithBundledSchema(payload, "aof-context-integrity-record.schema.json", "context integrity record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveContextIntegrityRoot(projectRoot), `${workItemId}.json`),
    payload
  );

  return {
    ok: true,
    projectRoot,
    artifactPath,
    payload
  };
}
