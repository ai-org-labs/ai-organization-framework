import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderReadIntegrationRoot } from "./provider-read-integration-audit.js";

export function resolveExternalValidationReplayRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "external-validation-replays");
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
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

async function loadRecords(projectRoot, root, schemaFileName, label, expectedArtifactType) {
  const records = [];
  for (const filePath of await listJsonFiles(root)) {
    const payload = await readJson(filePath, `${label} ${path.basename(filePath)}`);
    if (payload.artifact_type !== expectedArtifactType) {
      continue;
    }
    await validateWithBundledSchema(payload, schemaFileName, label);
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasText(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function summarizeReplay(record) {
  const replay = record.payload;
  return {
    replay_id: replay.replay_id,
    validation_result: replay.external_validation_result.result,
    confidence_delta: replay.confidence_delta.direction,
    governance_route: replay.governance_route.route,
    decision: replay.selected_decision.decision,
    artifact_ref: record.artifact_ref
  };
}

function resultRequiresEscalation(result) {
  return ["fail", "conflicting", "context_mismatch", "unknown"].includes(result);
}

export async function externalValidationReplayAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const replays = await loadRecords(
    projectRoot,
    resolveExternalValidationReplayRoot(projectRoot),
    "aof-external-validation-replay-record.schema.json",
    "external validation replay record",
    "external-validation-replay-record"
  );
  const integrations = await loadRecords(
    projectRoot,
    resolveProviderReadIntegrationRoot(projectRoot),
    "aof-provider-read-integration-record.schema.json",
    "provider read integration record",
    "provider-read-integration-record"
  );
  const integrationByRef = new Map(integrations.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "external validation replay presence", replays.length > 0, `${replays.length} replay(s) found`, replays.map((record) => record.artifact_ref));

  for (const record of replays) {
    const replay = record.payload;
    const refs = [
      record.artifact_ref,
      replay.provider_read_integration_ref,
      ...replay.evidence_refs,
      ...replay.replay_steps.map((step) => step.input_ref)
    ];
    await checkRef(projectRoot, checks, errors, `${replay.replay_id} provider read integration ref resolves`, replay.provider_read_integration_ref, refs);
    for (const evidenceRef of replay.evidence_refs) {
      await checkRef(projectRoot, checks, errors, `${replay.replay_id} evidence ref resolves`, evidenceRef, refs);
    }
    for (const step of replay.replay_steps) {
      await checkRef(projectRoot, checks, errors, `${replay.replay_id} replay step input ref resolves`, step.input_ref, refs);
      pushCheck(checks, errors, `${replay.replay_id} replay step explains confidence effect`, hasText(step.confidence_effect), step.step, refs);
    }
    const integration = integrationByRef.get(normalizeRef(replay.provider_read_integration_ref));
    pushCheck(checks, errors, `${replay.replay_id} provider read integration is known`, Boolean(integration), replay.provider_read_integration_ref || "missing integration ref", refs);
    pushCheck(checks, errors, `${replay.replay_id} external validation source present`, hasText(replay.external_validation_result.validator) && hasText(replay.external_validation_result.source), `${replay.external_validation_result.validator}: ${replay.external_validation_result.source}`, refs);
    pushCheck(checks, errors, `${replay.replay_id} confidence basis present`, [replay.confidence_before.basis, replay.confidence_after.basis, replay.confidence_delta.rationale].every(hasText), "before/after/delta basis required", refs);
    pushCheck(checks, errors, `${replay.replay_id} confidence scores are bounded`, replay.confidence_before.score >= 0 && replay.confidence_before.score <= 1 && replay.confidence_after.score >= 0 && replay.confidence_after.score <= 1, `before=${replay.confidence_before.score}, after=${replay.confidence_after.score}`, refs);
    pushCheck(checks, errors, `${replay.replay_id} governance route has next action`, hasText(replay.governance_route.reason) && hasText(replay.governance_route.next_action), replay.governance_route.route, refs);
    const requiresEscalation = resultRequiresEscalation(replay.external_validation_result.result);
    pushCheck(
      checks,
      errors,
      `${replay.replay_id} weak or conflicting validation escalates`,
      !requiresEscalation || replay.governance_route.uncertainty_escalated === true,
      `result=${replay.external_validation_result.result}, uncertainty_escalated=${replay.governance_route.uncertainty_escalated}`,
      refs
    );
    pushCheck(
      checks,
      errors,
      `${replay.replay_id} weak or conflicting validation is not blindly accepted`,
      !requiresEscalation || !["accept_as_supporting_evidence"].includes(replay.governance_route.route),
      `result=${replay.external_validation_result.result}, route=${replay.governance_route.route}`,
      refs
    );
    pushCheck(checks, errors, `${replay.replay_id} no external write attempted`, replay.external_write_attempted === false, `external_write_attempted=${replay.external_write_attempted}`, refs);
    pushCheck(checks, errors, `${replay.replay_id} no external write authorized`, replay.external_write_authorized === false, `external_write_authorized=${replay.external_write_authorized}`, refs);
    pushCheck(checks, errors, `${replay.replay_id} not-proven boundary present`, hasText(replay.not_proven), replay.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${replay.replay_id} provenance present`, hasText(replay.source_task_id) && hasText(replay.source_parent_session_id), `source_task_id=${replay.source_task_id || "missing"}, source_parent_session_id=${replay.source_parent_session_id || "missing"}`, refs);
  }

  const publicReplays = replays.map(summarizeReplay);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "external-validation-replay-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      replay_count: publicReplays.length,
      governance_escalation_count: replays.filter((entry) => entry.payload.governance_route.uncertainty_escalated).length,
      accepted_supporting_evidence_count: replays.filter((entry) => entry.payload.governance_route.route === "accept_as_supporting_evidence").length,
      external_write_attempt_count: replays.filter((entry) => entry.payload.external_write_attempted).length,
      external_write_authorized_count: replays.filter((entry) => entry.payload.external_write_authorized).length,
      failing_check_count: errors.length
    },
    replays: publicReplays,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-external-validation-replay-audit.schema.json", "external validation replay audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
