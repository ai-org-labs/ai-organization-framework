import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveMultiActorPilotRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "multi-actor-pilots");
}

export async function multiActorPilotRecordCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const workItemId = options.workItemId || options.sourceTaskId;
  const payload = {
    artifact_type: "multi-actor-pilot",
    pilot_id: options.pilotId || makeId("MAP"),
    recorded_at: nowIso(),
    work_item_id: workItemId,
    work_item_ref: options.workItemRef,
    pilot_status: options.pilotStatus || "ready",
    parent_orchestrator_ref: options.parentOrchestratorRef,
    core_council_roles: options.coreCouncilRoles ?? [],
    actor_roster_ref: options.actorRosterRef,
    actor_output_handoff_refs: options.actorOutputHandoffRefs ?? [],
    council_judgment_ref: options.councilJudgmentRef,
    work_execution_packet_ref: options.workExecutionPacketRef,
    maker_checker_council_boundary: options.makerCheckerCouncilBoundary,
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-multi-actor-pilot.schema.json", "multi-actor pilot");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveMultiActorPilotRoot(projectRoot), `${payload.work_item_id}.json`),
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
