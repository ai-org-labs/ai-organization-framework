import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveExternalResourceUseRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "external-resource-uses");
}

function safeFileStem(value) {
  return String(value || "external-resource-use")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "external-resource-use";
}

export async function externalResourceUseRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const workItemId = options.workItemId || options.sourceTaskId;
  const payload = {
    artifact_type: "external-resource-use-record",
    use_id: options.useId || makeId("ERU"),
    recorded_at: nowIso(),
    work_item_id: workItemId,
    work_item_ref: options.workItemRef,
    session_ref: options.sessionRef,
    resource_ref: options.resourceRef,
    use_purpose: options.usePurpose,
    operation_type: options.operationType || "read",
    approval_status: options.approvalStatus || "not_required",
    approval_ref: options.approvalRef || null,
    execution_status: options.executionStatus || "planned",
    output_artifact_refs: options.outputArtifactRefs ?? [],
    risk_candidates: options.riskCandidates ?? [],
    decision_candidates: options.decisionCandidates ?? [],
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-external-resource-use-record.schema.json", "external resource use record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveExternalResourceUseRoot(projectRoot), `${safeFileStem(payload.work_item_id)}-${safeFileStem(payload.use_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
