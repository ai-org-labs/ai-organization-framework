import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveRequirementCoverageRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "requirement-coverage");
}

export async function requirementCoverageRecordCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const workItemId = options.workItemId || options.sourceTaskId;
  const payload = {
    artifact_type: "requirement-coverage-record",
    record_id: options.recordId || makeId("RCR"),
    recorded_at: nowIso(),
    work_item_id: workItemId,
    work_item_ref: options.workItemRef,
    coverage_status: options.coverageStatus || "ready",
    requirements: options.requirements ?? [],
    coverage_summary: options.coverageSummary,
    forecast: options.forecast,
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(payload, "aof-requirement-coverage-record.schema.json", "requirement coverage record");
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveRequirementCoverageRoot(projectRoot), `${payload.work_item_id}.json`),
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
