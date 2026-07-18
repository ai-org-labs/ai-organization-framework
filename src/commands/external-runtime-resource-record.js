import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveExternalRuntimeResourceRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "external-runtime-resources");
}

function safeFileStem(value) {
  return String(value || "external-runtime-resource")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "external-runtime-resource";
}

export async function externalRuntimeResourceRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "external-runtime-resource-record",
    resource_id: options.resourceId || makeId("ERR"),
    recorded_at: nowIso(),
    resource_kind: options.resourceKind,
    display_name: options.displayName,
    canonical_ref: options.canonicalRef,
    source_system: options.sourceSystem,
    owner_ref: options.ownerRef,
    source_of_truth: options.sourceOfTruth,
    permission_boundary: options.permissionBoundary,
    freshness_boundary: options.freshnessBoundary,
    availability_boundary: options.availabilityBoundary,
    approval_boundary: options.approvalBoundary,
    side_effect_boundary: options.sideEffectBoundary,
    allowed_operations: options.allowedOperations ?? [],
    readiness_status: options.readinessStatus || "ready",
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-external-runtime-resource-record.schema.json", "external runtime resource record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveExternalRuntimeResourceRoot(projectRoot), `${safeFileStem(payload.resource_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
