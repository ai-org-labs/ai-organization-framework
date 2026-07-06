import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveAgentSessionRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "agent-sessions");
}

function buildEvent(event, index) {
  const occurredAt = event.occurred_at || event.occurredAt || nowIso();
  return {
    event_id: event.event_id || event.eventId || makeId(`ASEV${index + 1}`),
    event_type: event.event_type || event.eventType,
    occurred_at: occurredAt,
    summary: event.summary,
    artifact_refs: event.artifact_refs || event.artifactRefs || [],
    tool_name: event.tool_name || event.toolName || null,
    safety_level: event.safety_level || event.safetyLevel || null,
    approval_policy: event.approval_policy || event.approvalPolicy || null
  };
}

export async function agentSessionRecordCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const sessionId = options.sessionId;
  const events = (options.events || []).map(buildEvent);
  const payload = {
    artifact_type: "agent-session-record",
    stream_format_version: 1,
    stream_id: options.streamId || makeId("ASTR"),
    recorded_at: nowIso(),
    session_id: sessionId,
    parent_session_id: options.parentSessionId || null,
    actor_ref: options.actorRef,
    role_ref: options.roleRef,
    provider: options.provider || "local",
    model: options.model || "unspecified",
    events,
    links: {
      task_refs: options.taskRefs || [],
      requirement_refs: options.requirementRefs || [],
      test_evidence_refs: options.testEvidenceRefs || [],
      commit_refs: options.commitRefs || [],
      pr_refs: options.prRefs || [],
      artifact_refs: options.artifactRefs || []
    },
    risk_candidates: options.riskCandidates || [],
    decision_candidates: options.decisionCandidates || [],
    release_ready_evidence: {
      claim: options.releaseReadyClaim || "Release readiness is not claimed from this session alone.",
      evidence_refs: options.releaseReadyEvidenceRefs || [],
      verdict: options.releaseReadyVerdict || "not_ready"
    },
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null
  };

  await validateWithBundledSchema(payload, "aof-agent-session-record.schema.json", "agent session record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveAgentSessionRoot(projectRoot), `${sessionId}.json`),
    payload
  );

  return {
    ok: true,
    projectRoot,
    artifactPath,
    streamId: payload.stream_id,
    payload
  };
}
