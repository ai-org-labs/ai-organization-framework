import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProductValueEvidenceRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "product-value-evidence");
}

function safeFileStem(value) {
  return String(value || "product-value-evidence")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "product-value-evidence";
}

function parseCapabilityRow(value) {
  if (typeof value === "object" && value !== null) {
    return value;
  }
  return JSON.parse(String(value ?? "{}"));
}

export async function productValueEvidenceRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "product-value-evidence-record",
    value_evidence_id: options.valueEvidenceId || makeId("PVE"),
    recorded_at: nowIso(),
    release_ref: options.releaseRef,
    work_item_id: options.workItemId,
    work_item_ref: options.workItemRef,
    mission_control_ref: options.missionControlRef,
    capability_statement: options.capabilityStatement,
    before_state: options.beforeState,
    after_state: options.afterState,
    scenario: options.scenario,
    five_minute_demo: options.fiveMinuteDemo,
    time_saved_or_work_reduced: options.timeSavedOrWorkReduced,
    cognitive_load_removed: options.cognitiveLoadRemoved,
    capability_matrix: (options.capabilityRows ?? []).map(parseCapabilityRow),
    understanding_outcome: options.understandingOutcome || "not_checked",
    value_evidence_refs: options.evidenceRefs ?? [],
    governance_action: options.governanceAction || "none",
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-product-value-evidence-record.schema.json", "product value evidence record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProductValueEvidenceRoot(projectRoot), `${safeFileStem(payload.value_evidence_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
