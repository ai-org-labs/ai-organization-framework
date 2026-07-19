import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveOperatorValidationRoot } from "./operator-validation-record.js";

const ACCEPTED_OUTCOMES = new Set(["accepted", "accepted_with_residual_risk"]);
const CLARIFICATION_OUTCOMES = new Set(["needs_clarification", "not_checked"]);
const BLOCKING_ACTIONS = new Set(["request_clarification", "request_reproduction", "block_release_claim", "escalate_review"]);

function normalizeRef(ref) {
  return String(ref ?? "").replaceAll("\\", "/");
}

function hasText(value) {
  return Boolean(String(value ?? "").trim());
}

function pushCheck(checks, errors, name, condition, detail, evidenceRefs = []) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail, evidence_refs: evidenceRefs.filter(Boolean) });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

async function loadRecords(projectRoot) {
  const records = [];
  for (const filePath of await listJsonFiles(resolveOperatorValidationRoot(projectRoot))) {
    const payload = await readJson(filePath, `operator validation record ${path.basename(filePath)}`);
    if (payload.artifact_type !== "operator-validation-record") {
      continue;
    }
    await validateWithBundledSchema(payload, "aof-operator-validation-record.schema.json", "operator validation record");
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function refExists(projectRoot, ref) {
  return hasText(ref) && await pathExists(path.resolve(projectRoot, ref));
}

function publicRecord(record) {
  const payload = record.payload;
  return {
    validation_id: payload.validation_id,
    operator_ref: payload.operator_ref,
    feedback_source: payload.feedback_source,
    release_ref: payload.release_ref,
    work_item_id: payload.work_item_id,
    understanding_outcome: payload.understanding_outcome,
    reproduction_outcome: payload.reproduction_outcome,
    acceptance_outcome: payload.acceptance_outcome,
    governance_action: payload.governance_action,
    artifact_ref: record.artifact_ref
  };
}

export async function operatorValidationAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadRecords(projectRoot);

  pushCheck(checks, errors, "operator validation presence", records.length > 0, `${records.length} record(s) found`, records.map((record) => record.artifact_ref));

  for (const record of records) {
    const payload = record.payload;
    const refs = [record.artifact_ref, payload.work_item_ref, payload.mission_control_ref, ...payload.evidence_refs];
    pushCheck(checks, errors, `${payload.validation_id} release ref resolves`, await refExists(projectRoot, payload.release_ref), payload.release_ref || "missing release_ref", refs);
    pushCheck(checks, errors, `${payload.validation_id} work item ref resolves`, await refExists(projectRoot, payload.work_item_ref), payload.work_item_ref || "missing work_item_ref", refs);
    pushCheck(checks, errors, `${payload.validation_id} Mission Control ref resolves`, await refExists(projectRoot, payload.mission_control_ref), payload.mission_control_ref || "missing mission_control_ref", refs);
    for (const evidenceRef of payload.evidence_refs) {
      pushCheck(checks, errors, `${payload.validation_id} evidence ref resolves`, await refExists(projectRoot, evidenceRef), evidenceRef, refs);
    }
    pushCheck(checks, errors, `${payload.validation_id} feedback summary`, hasText(payload.feedback_summary), payload.feedback_summary || "missing feedback_summary", refs);
    pushCheck(checks, errors, `${payload.validation_id} not-proven boundary`, hasText(payload.not_proven), payload.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${payload.validation_id} runtime provenance`, hasText(payload.source_task_id) && hasText(payload.source_parent_session_id), `source_task_id=${payload.source_task_id || "missing"}, source_parent_session_id=${payload.source_parent_session_id || "missing"}`, refs);
    const needsGovernance = payload.acceptance_outcome === "rejected" ||
      CLARIFICATION_OUTCOMES.has(payload.acceptance_outcome) ||
      CLARIFICATION_OUTCOMES.has(payload.understanding_outcome) ||
      CLARIFICATION_OUTCOMES.has(payload.reproduction_outcome) ||
      payload.reproduction_outcome === "not_reproduced";
    pushCheck(
      checks,
      errors,
      `${payload.validation_id} unclear or negative feedback escalates`,
      !needsGovernance || BLOCKING_ACTIONS.has(payload.governance_action),
      `governance_action=${payload.governance_action}`,
      refs
    );
    pushCheck(
      checks,
      errors,
      `${payload.validation_id} blocking reason when blocked`,
      !BLOCKING_ACTIONS.has(payload.governance_action) || hasText(payload.blocking_reason),
      BLOCKING_ACTIONS.has(payload.governance_action) ? payload.blocking_reason || "missing blocking_reason" : "not required",
      refs
    );
  }

  const publicRecords = records.map(publicRecord);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "operator-validation-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      record_count: publicRecords.length,
      accepted_count: publicRecords.filter((record) => ACCEPTED_OUTCOMES.has(record.acceptance_outcome)).length,
      rejected_count: publicRecords.filter((record) => record.acceptance_outcome === "rejected").length,
      needs_clarification_count: publicRecords.filter((record) =>
        [record.acceptance_outcome, record.understanding_outcome, record.reproduction_outcome].some((outcome) => outcome === "needs_clarification")
      ).length,
      not_reproduced_count: publicRecords.filter((record) => record.reproduction_outcome === "not_reproduced").length,
      missing_link_count: checks.filter((check) => check.status === "fail" && /ref resolves|evidence ref/i.test(check.name)).length,
      blocking_record_count: publicRecords.filter((record) => BLOCKING_ACTIONS.has(record.governance_action)).length,
      failing_check_count: errors.length
    },
    records: publicRecords,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-operator-validation-audit.schema.json", "operator validation audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
