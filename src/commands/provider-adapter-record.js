import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderAdapterRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-adapters");
}

function safeFileStem(value) {
  return String(value || "provider-adapter")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-adapter";
}

export async function providerAdapterRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-adapter-record",
    adapter_id: options.adapterId || makeId("PAD"),
    recorded_at: nowIso(),
    display_name: options.displayName,
    provider_ref: options.providerRef,
    resource_ref: options.resourceRef,
    adapter_kind: options.adapterKind || "read_only",
    operation_modes: options.operationModes ?? ["read"],
    read_authority_boundary: options.readAuthorityBoundary,
    write_authority_boundary: options.writeAuthorityBoundary,
    freshness_check: options.freshnessCheck,
    approval_policy_ref: options.approvalPolicyRef,
    side_effect_boundary: options.sideEffectBoundary,
    escalation_required_for: options.escalationRequiredFor ?? [],
    readiness_status: options.readinessStatus || "ready",
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-provider-adapter-record.schema.json", "provider adapter record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderAdapterRoot(projectRoot), `${safeFileStem(payload.adapter_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
