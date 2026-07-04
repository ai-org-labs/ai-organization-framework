import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveQualityLedgerRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "quality", "ledger", "events");
}

export async function qualityLedgerRecordCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "quality-ledger-event",
    ledger_format_version: 1,
    event_id: options.eventId || makeId("QLE"),
    recorded_at: nowIso(),
    event_type: options.eventType,
    quality_intent_ref: options.qualityIntentRef,
    work_item_ref: options.workItemRef,
    claim: options.claim,
    evidence_refs: options.evidenceRefs ?? [],
    qif_refs: options.qifRefs ?? [],
    prior_state: options.priorState || null,
    new_state: options.newState || null,
    confidence: options.confidence ?? null,
    semantic_truth_claimed: options.semanticTruthClaimed === true,
    operator_validated: options.operatorValidated === true,
    governance_action: options.governanceAction || "none",
    source_task_id: options.sourceTaskId || null,
    source_parent_session_id: options.sourceParentSessionId || null,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-quality-ledger-event.schema.json", "quality ledger event");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveQualityLedgerRoot(projectRoot), `${payload.event_id}.json`),
    payload
  );

  return {
    ok: true,
    projectRoot,
    artifactPath,
    eventId: payload.event_id,
    payload
  };
}
