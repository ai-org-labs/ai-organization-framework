import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveExternalReferenceIntegrityRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "external-reference-integrity");
}

function safeFileStem(value) {
  return String(value || "external-reference")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "external-reference";
}

export async function externalReferenceIntegrityRecordCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "external-reference-integrity-record",
    record_id: options.recordId || makeId("ERIR"),
    recorded_at: nowIso(),
    external_ref: options.externalRef,
    external_ref_artifact_ref: options.externalRefArtifactRef,
    source_system: options.sourceSystem,
    url: options.url,
    relationship: options.relationship,
    source_of_truth: options.sourceOfTruth,
    sync_policy: options.syncPolicy,
    usage_purpose: options.usagePurpose,
    freshness_required: Boolean(options.freshnessRequired),
    observed_at: options.observedAt || nowIso(),
    freshness_status: options.freshnessStatus || "not_required",
    availability_status: options.availabilityStatus || "not_checked",
    integrity_status: options.integrityStatus || "ready",
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null
  };

  await validateWithBundledSchema(
    payload,
    "aof-external-reference-integrity-record.schema.json",
    "external reference integrity record"
  );
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveExternalReferenceIntegrityRoot(projectRoot), `${safeFileStem(payload.external_ref)}.json`),
    payload
  );

  return {
    ok: true,
    projectRoot,
    artifactPath,
    payload
  };
}
