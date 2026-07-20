import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderAdapterPilotRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-adapter-pilots");
}

function safeFileStem(value) {
  return String(value || "provider-adapter-pilot")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-adapter-pilot";
}

export async function providerAdapterPilotRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-adapter-pilot-record",
    pilot_id: options.pilotId || makeId("PAP"),
    recorded_at: nowIso(),
    adapter_ref: options.adapterRef,
    work_item_id: options.workItemId,
    work_item_ref: options.workItemRef,
    session_ref: options.sessionRef,
    pilot_mode: options.pilotMode || "dry_run",
    approval_status: options.approvalStatus || "not_required",
    approval_ref: options.approvalRef || null,
    expected_external_effect: options.expectedExternalEffect,
    allowed_actions: options.allowedActions ?? [],
    denied_actions: options.deniedActions ?? [],
    redaction_boundary: options.redactionBoundary,
    rollback_plan: options.rollbackPlan,
    provenance_refs: options.provenanceRefs ?? [],
    verification_refs: options.verificationRefs ?? [],
    stop_conditions: options.stopConditions ?? [],
    execution_status: options.executionStatus || "planned",
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-provider-adapter-pilot-record.schema.json", "provider adapter pilot record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderAdapterPilotRoot(projectRoot), `${safeFileStem(payload.pilot_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
