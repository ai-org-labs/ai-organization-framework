import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderOperationTargetRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-operation-targets");
}

function safeFileStem(value) {
  return String(value || "provider-operation-target")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-operation-target";
}

export async function providerOperationTargetRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-operation-target-record",
    target_id: options.targetId || makeId("POT"),
    recorded_at: nowIso(),
    provider: options.provider,
    resource: options.resource,
    operation: options.operation,
    endpoint: options.endpoint || null,
    payload_hash: options.payloadHash,
    payload_summary: options.payloadSummary,
    maximum_calls: Number.parseInt(options.maximumCalls ?? 1, 10),
    expires_at: options.expiresAt,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-provider-operation-target-record.schema.json", "provider operation target record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderOperationTargetRoot(projectRoot), `${safeFileStem(payload.target_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
