import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveHumanApprovalRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "human-approvals");
}

function safeFileStem(value) {
  return String(value || "human-approval")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "human-approval";
}

export async function humanApprovalRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "human-approval-record",
    approval_id: options.approvalId || makeId("HAPR"),
    recorded_at: nowIso(),
    approver_type: "human",
    approver_id: options.approverId,
    decision: options.decision || "approved",
    approved_scope_hash: options.approvedScopeHash,
    approved_at: options.approvedAt || nowIso(),
    authentication_method: options.authenticationMethod,
    revocation_status: options.revocationStatus || "active",
    target_operation_ref: options.targetOperationRef,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-human-approval-record.schema.json", "human approval record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveHumanApprovalRoot(projectRoot), `${safeFileStem(payload.approval_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
