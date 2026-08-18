import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";

export function resolveExternalOperatorFeedbackRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "external-operator-feedback");
}

function normalizeRef(ref) {
  return String(ref ?? "").replaceAll("\\", "/");
}

function hasText(value) {
  return Boolean(String(value ?? "").trim());
}

function pushCheck(checks, errors, name, condition, detail, evidenceRefs = []) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail, evidence_refs: evidenceRefs.filter(Boolean) });
  if (!condition) errors.push(`${name}: ${detail}`);
}

async function loadRecords(projectRoot) {
  const records = [];
  for (const filePath of await listJsonFiles(resolveExternalOperatorFeedbackRoot(projectRoot))) {
    const payload = await readJson(filePath, `external operator feedback ${path.basename(filePath)}`);
    if (payload.artifact_type !== "external-operator-feedback-record") continue;
    await validateWithBundledSchema(payload, "aof-external-operator-feedback-record.schema.json", "external operator feedback record");
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasText(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function weakFeedback(record) {
  return ["partial", "confused", "rejected"].includes(record.understanding_result) ||
    ["partial", "failed", "not_attempted"].includes(record.reproduction_result);
}

function summarize(record) {
  const feedback = record.payload;
  return {
    feedback_id: feedback.feedback_id,
    operator_ref: feedback.operator_ref,
    understanding_result: feedback.understanding_result,
    reproduction_result: feedback.reproduction_result,
    route: feedback.governance_route.route,
    artifact_ref: record.artifact_ref
  };
}

export async function externalOperatorFeedbackAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadRecords(projectRoot);
  pushCheck(checks, errors, "external operator feedback presence", records.length > 0, `${records.length} feedback record(s) found`, records.map((record) => record.artifact_ref));

  for (const record of records) {
    const feedback = record.payload;
    const refs = [record.artifact_ref, feedback.provider_observation_replay_ref, ...feedback.evidence_refs];
    await checkRef(projectRoot, checks, errors, `${feedback.feedback_id} provider observation replay ref resolves`, feedback.provider_observation_replay_ref, refs);
    for (const ref of feedback.evidence_refs) await checkRef(projectRoot, checks, errors, `${feedback.feedback_id} evidence ref resolves`, ref, refs);
    pushCheck(checks, errors, `${feedback.feedback_id} feedback summary is concrete`, hasText(feedback.feedback_summary) && hasText(feedback.product_evidence_value), feedback.feedback_summary || "missing summary", refs);
    pushCheck(checks, errors, `${feedback.feedback_id} governance route has reason and next action`, hasText(feedback.governance_route.reason) && hasText(feedback.governance_route.next_action), feedback.governance_route.route, refs);
    pushCheck(
      checks,
      errors,
      `${feedback.feedback_id} weak feedback escalates to product review`,
      !weakFeedback(feedback) || feedback.governance_route.requires_product_review === true,
      `understanding=${feedback.understanding_result}, reproduction=${feedback.reproduction_result}, requires_product_review=${feedback.governance_route.requires_product_review}`,
      refs
    );
    pushCheck(
      checks,
      errors,
      `${feedback.feedback_id} rejected or failed feedback is not accepted as product evidence`,
      !(["rejected"].includes(feedback.understanding_result) || ["failed"].includes(feedback.reproduction_result)) || feedback.governance_route.route !== "accept_as_product_evidence",
      `route=${feedback.governance_route.route}`,
      refs
    );
    pushCheck(checks, errors, `${feedback.feedback_id} not-proven boundary present`, hasText(feedback.not_proven), feedback.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${feedback.feedback_id} provenance present`, hasText(feedback.source_task_id) && hasText(feedback.source_parent_session_id), `source_task_id=${feedback.source_task_id || "missing"}, source_parent_session_id=${feedback.source_parent_session_id || "missing"}`, refs);
  }

  const publicFeedback = records.map(summarize);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "external-operator-feedback-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      feedback_count: records.length,
      accepted_count: records.filter((entry) => entry.payload.governance_route.route === "accept_as_product_evidence").length,
      review_required_count: records.filter((entry) => entry.payload.governance_route.requires_product_review).length,
      failing_check_count: errors.length
    },
    feedback: publicFeedback,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-external-operator-feedback-audit.schema.json", "external operator feedback audit");
  const artifactPath = options.artifactPath ? await writeJsonArtifact(options.artifactPath, payload) : null;
  return { ok: payload.ok, artifactPath, summary: payload };
}
