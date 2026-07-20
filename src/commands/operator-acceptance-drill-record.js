import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveOperatorAcceptanceDrillRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "operator-acceptance-drills");
}

function safeFileStem(value) {
  return String(value || "operator-acceptance-drill")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "operator-acceptance-drill";
}

export async function operatorAcceptanceDrillRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "operator-acceptance-drill-record",
    drill_id: options.drillId || makeId("OAD"),
    recorded_at: nowIso(),
    operator_ref: options.operatorRef,
    work_item_id: options.workItemId,
    approval_ref: options.approvalRef,
    reproduction_ref: options.reproductionRef,
    rollback_ref: options.rollbackRef,
    outcome_ref: options.outcomeRef,
    learning_ref: options.learningRef,
    mission_control_ref: options.missionControlRef,
    decision: options.decision || "defer",
    decision_rationale: options.decisionRationale,
    accepted_risk: options.acceptedRisk,
    blocker_summary: options.blockerSummary,
    next_action: options.nextAction,
    safety_boundary: options.safetyBoundary,
    not_proven: options.notProven,
    evidence_refs: options.evidenceRefs ?? [],
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-operator-acceptance-drill-record.schema.json", "operator acceptance drill record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveOperatorAcceptanceDrillRoot(projectRoot), `${safeFileStem(payload.drill_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
