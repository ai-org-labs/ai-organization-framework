import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveWorkReadinessRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "work-readiness");
}

export async function workReadinessRecordCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const workItemId = options.workItemId || options.sourceTaskId;
  const payload = {
    artifact_type: "work-readiness-record",
    record_id: options.recordId || makeId("WRG"),
    recorded_at: nowIso(),
    work_item_id: workItemId,
    work_item_ref: options.workItemRef,
    readiness_status: options.readinessStatus || "ready",
    goal: options.goal,
    risk: options.risk,
    loss_boundary: options.lossBoundary,
    acceptance_gates: options.acceptanceGates ?? [],
    evidence_plan: options.evidencePlan ?? [],
    maker_role: options.makerRole,
    checker_role: options.checkerRole,
    council_ref: options.councilRef,
    stop_conditions: options.stopConditions ?? [],
    qif_refs: options.qifRefs ?? [],
    archmap_impact_expected: options.archmapImpactExpected || "unknown",
    notes: options.notes || null,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null
  };

  await validateWithBundledSchema(payload, "aof-work-readiness-record.schema.json", "work readiness record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveWorkReadinessRoot(projectRoot), `${payload.work_item_id}.json`),
    payload
  );

  return {
    ok: true,
    projectRoot,
    artifactPath,
    recordId: payload.record_id,
    payload
  };
}
