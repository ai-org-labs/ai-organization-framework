import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";

export function resolveProviderReadDecisionReplayRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-read-decision-replays");
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
  for (const filePath of await listJsonFiles(resolveProviderReadDecisionReplayRoot(projectRoot))) {
    const payload = await readJson(filePath, `provider read decision replay ${path.basename(filePath)}`);
    if (payload.artifact_type !== "provider-read-decision-replay-record") continue;
    await validateWithBundledSchema(payload, "aof-provider-read-decision-replay-record.schema.json", "provider read decision replay record");
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasText(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function expectedDecisionState(route) {
  return {
    accept_as_product_evidence: "accepted",
    request_clarification: "needs_review",
    reopen_product_work: "reopened",
    block_release_claim: "blocked",
    defer: "deferred"
  }[route] ?? null;
}

function summarize(record) {
  const replay = record.payload;
  return {
    replay_id: replay.replay_id,
    decision_state: replay.decision_state,
    feedback_route: replay.feedback_route,
    operator_summary: replay.operator_summary,
    mission_control_summary: replay.mission_control_summary,
    next_action: replay.next_action,
    artifact_ref: record.artifact_ref
  };
}

export async function providerReadDecisionReplayAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadRecords(projectRoot);
  pushCheck(checks, errors, "provider read decision replay presence", records.length > 0, `${records.length} replay record(s) found`, records.map((record) => record.artifact_ref));

  for (const record of records) {
    const replay = record.payload;
    const refs = [
      record.artifact_ref,
      replay.provider_read_integration_ref,
      replay.provider_observation_replay_ref,
      replay.external_operator_feedback_ref,
      ...replay.evidence_refs
    ];
    await checkRef(projectRoot, checks, errors, `${replay.replay_id} provider read integration ref resolves`, replay.provider_read_integration_ref, refs);
    await checkRef(projectRoot, checks, errors, `${replay.replay_id} provider observation replay ref resolves`, replay.provider_observation_replay_ref, refs);
    await checkRef(projectRoot, checks, errors, `${replay.replay_id} external operator feedback ref resolves`, replay.external_operator_feedback_ref, refs);
    for (const ref of replay.evidence_refs) await checkRef(projectRoot, checks, errors, `${replay.replay_id} evidence ref resolves`, ref, refs);
    pushCheck(checks, errors, `${replay.replay_id} summaries are operator-readable`, hasText(replay.operator_summary) && hasText(replay.mission_control_summary), replay.mission_control_summary || "missing Mission Control summary", refs);
    pushCheck(checks, errors, `${replay.replay_id} decision reason and delta are present`, hasText(replay.why_this_decision) && hasText(replay.what_changed), replay.why_this_decision || "missing decision reason", refs);
    pushCheck(checks, errors, `${replay.replay_id} next action is present`, hasText(replay.next_action), replay.next_action || "missing next action", refs);
    pushCheck(checks, errors, `${replay.replay_id} feedback route maps to decision state`, replay.decision_state === expectedDecisionState(replay.feedback_route), `route=${replay.feedback_route}, decision_state=${replay.decision_state}, expected=${expectedDecisionState(replay.feedback_route)}`, refs);
    pushCheck(checks, errors, `${replay.replay_id} not-proven boundary present`, hasText(replay.not_proven), replay.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${replay.replay_id} provenance present`, hasText(replay.source_task_id) && hasText(replay.source_parent_session_id), `source_task_id=${replay.source_task_id || "missing"}, source_parent_session_id=${replay.source_parent_session_id || "missing"}`, refs);
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-read-decision-replay-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      replay_count: records.length,
      accepted_count: records.filter((entry) => entry.payload.decision_state === "accepted").length,
      blocked_count: records.filter((entry) => entry.payload.decision_state === "blocked").length,
      reopened_count: records.filter((entry) => entry.payload.decision_state === "reopened").length,
      deferred_count: records.filter((entry) => entry.payload.decision_state === "deferred").length,
      needs_review_count: records.filter((entry) => entry.payload.decision_state === "needs_review").length,
      failing_check_count: errors.length
    },
    replays: records.map(summarize),
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-read-decision-replay-audit.schema.json", "provider read decision replay audit");
  const artifactPath = options.artifactPath ? await writeJsonArtifact(options.artifactPath, payload) : null;
  return { ok: payload.ok, artifactPath, summary: payload };
}
