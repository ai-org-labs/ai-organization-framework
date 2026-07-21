import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveCapabilityReleaseDeltaRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "capability-release-deltas");
}

function safeFileStem(value) {
  return String(value || "capability-release-delta")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "capability-release-delta";
}

export async function capabilityReleaseDeltaRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "capability-release-delta",
    delta_id: options.deltaId || makeId("CRD"),
    recorded_at: nowIso(),
    release_version: options.releaseVersion,
    release_ref: options.releaseRef,
    work_item_id: options.workItemId,
    work_item_ref: options.workItemRef,
    one_minute_value_explanation: options.oneMinuteValueExplanation,
    thirty_second_version_delta: options.thirtySecondVersionDelta,
    new_capability_ids: options.newCapabilityIds ?? [],
    updated_capability_ids: options.updatedCapabilityIds ?? [],
    removed_capability_ids: options.removedCapabilityIds ?? [],
    value_evidence_refs: options.valueEvidenceRefs ?? [],
    product_review_trigger: options.productReviewTrigger,
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-capability-release-delta.schema.json", "capability release delta");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveCapabilityReleaseDeltaRoot(projectRoot), `${safeFileStem(payload.delta_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
