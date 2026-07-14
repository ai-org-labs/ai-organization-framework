import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveSessionExportRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "session-exports");
}

export async function sessionExportRecordCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const workItemId = options.workItemId || options.sourceTaskId;
  const payload = {
    artifact_type: "session-export-record",
    export_id: options.exportId || makeId("SEX"),
    recorded_at: nowIso(),
    work_item_id: workItemId,
    work_item_ref: options.workItemRef,
    export_status: options.exportStatus || "ready",
    source_session_ref: options.sourceSessionRef,
    provider_source: options.providerSource,
    event_summaries: options.eventSummaries ?? [],
    links: {
      task_refs: options.taskRefs ?? [],
      requirement_refs: options.requirementRefs ?? [],
      test_evidence_refs: options.testEvidenceRefs ?? [],
      artifact_refs: options.artifactRefs ?? [],
      risk_candidates: options.riskCandidates ?? [],
      decision_candidates: options.decisionCandidates ?? [],
      release_ready_evidence_refs: options.releaseReadyEvidenceRefs ?? []
    },
    redaction_boundary: options.redactionBoundary,
    release_ready_boundary: options.releaseReadyBoundary,
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-session-export-record.schema.json", "session export record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveSessionExportRoot(projectRoot), `${payload.work_item_id}.json`),
    payload
  );

  return {
    ok: true,
    projectRoot,
    artifactPath,
    exportId: payload.export_id,
    payload
  };
}
