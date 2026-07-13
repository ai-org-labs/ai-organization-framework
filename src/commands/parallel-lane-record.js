import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveParallelLaneRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "parallel-lanes");
}

export async function parallelLaneRecordCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const workItemId = options.workItemId || options.sourceTaskId;
  const joinPacket = {
    join_status: options.joinStatus || "ready",
    join_decision: options.joinDecision,
    joined_lane_ids: options.joinedLaneIds ?? [],
    conflict_summary: options.conflictSummary,
    blocker_summary: options.blockerSummary,
    merge_rationale: options.mergeRationale,
    council_authority: options.councilAuthority
  };
  const payload = {
    artifact_type: "parallel-lane-pilot",
    pilot_id: options.pilotId || makeId("PLP"),
    recorded_at: nowIso(),
    work_item_id: workItemId,
    work_item_ref: options.workItemRef,
    pilot_status: options.pilotStatus || "ready",
    parent_multi_actor_pilot_ref: options.parentMultiActorPilotRef,
    work_execution_packet_ref: options.workExecutionPacketRef,
    lanes: options.lanes ?? [],
    join_packet: joinPacket,
    council_decision_ref: options.councilDecisionRef,
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-parallel-lane-pilot.schema.json", "parallel lane pilot");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveParallelLaneRoot(projectRoot), `${payload.work_item_id}.json`),
    payload
  );

  return {
    ok: true,
    projectRoot,
    artifactPath,
    pilotId: payload.pilot_id,
    payload
  };
}
