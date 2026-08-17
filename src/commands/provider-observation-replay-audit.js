import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveExternalValidationReplayRoot } from "./external-validation-replay-audit.js";
import { resolveGitHubReadonlyObservationRoot } from "./github-readonly-observation-audit.js";
import { resolveProviderReadIntegrationRoot } from "./provider-read-integration-audit.js";

export function resolveProviderObservationReplayRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-observation-replays");
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

function isHumanReadableReplay(replay) {
  return [
    replay.operator_summary?.headline,
    replay.operator_summary?.plain_language_summary,
    replay.operator_summary?.operator_can_conclude,
    replay.operator_summary?.operator_must_not_conclude,
    replay.why_it_mattered,
    replay.not_proven,
    replay.next_action
  ].every(hasText) &&
    replay.what_was_read.length > 0 &&
    replay.what_was_read.every((entry) => hasText(entry.plain_language_observation)) &&
    replay.what_changed.length > 0 &&
    replay.what_changed.every((entry) => hasText(entry.meaning)) &&
    replay.replay_timeline.length > 0 &&
    replay.replay_timeline.every((entry) => hasText(entry.operator_reading));
}

function summarizeReplay(record) {
  const replay = record.payload;
  return {
    replay_id: replay.replay_id,
    provider: replay.provider,
    repository: replay.repository,
    headline: replay.operator_summary.headline,
    next_action: replay.next_action,
    artifact_ref: record.artifact_ref
  };
}

export async function providerObservationReplayAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const replays = await loadRecords(
    projectRoot,
    resolveProviderObservationReplayRoot(projectRoot),
    "aof-provider-observation-replay-record.schema.json",
    "provider observation replay record",
    "provider-observation-replay-record"
  );
  const providerReads = await loadRecords(
    projectRoot,
    resolveProviderReadIntegrationRoot(projectRoot),
    "aof-provider-read-integration-record.schema.json",
    "provider read integration record",
    "provider-read-integration-record"
  );
  const githubObservations = await loadRecords(
    projectRoot,
    resolveGitHubReadonlyObservationRoot(projectRoot),
    "aof-github-readonly-observation-record.schema.json",
    "github read-only observation record",
    "github-readonly-observation"
  );
  const validationReplays = await loadRecords(
    projectRoot,
    resolveExternalValidationReplayRoot(projectRoot),
    "aof-external-validation-replay-record.schema.json",
    "external validation replay record",
    "external-validation-replay-record"
  );
  const providerReadByRef = new Map(providerReads.map((record) => [record.artifact_ref, record.payload]));
  const githubObservationByRef = new Map(githubObservations.map((record) => [record.artifact_ref, record.payload]));
  const validationReplayByRef = new Map(validationReplays.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "provider observation replay presence", replays.length > 0, `${replays.length} replay(s) found`, replays.map((record) => record.artifact_ref));

  for (const record of replays) {
    const replay = record.payload;
    const refs = [
      record.artifact_ref,
      replay.provider_read_integration_ref,
      replay.github_readonly_observation_ref,
      replay.external_validation_replay_ref,
      ...replay.evidence_refs,
      ...replay.what_was_read.map((entry) => entry.source_ref),
      ...replay.replay_timeline.map((entry) => entry.input_ref)
    ];

    await checkRef(projectRoot, checks, errors, `${replay.replay_id} provider read integration ref resolves`, replay.provider_read_integration_ref, refs);
    await checkRef(projectRoot, checks, errors, `${replay.replay_id} github read-only observation ref resolves`, replay.github_readonly_observation_ref, refs);
    await checkRef(projectRoot, checks, errors, `${replay.replay_id} external validation replay ref resolves`, replay.external_validation_replay_ref, refs);
    for (const evidenceRef of replay.evidence_refs) {
      await checkRef(projectRoot, checks, errors, `${replay.replay_id} evidence ref resolves`, evidenceRef, refs);
    }
    for (const entry of replay.what_was_read) {
      await checkRef(projectRoot, checks, errors, `${replay.replay_id} read source ref resolves`, entry.source_ref, refs);
    }
    for (const entry of replay.replay_timeline) {
      await checkRef(projectRoot, checks, errors, `${replay.replay_id} timeline input ref resolves`, entry.input_ref, refs);
    }

    const providerRead = providerReadByRef.get(normalizeRef(replay.provider_read_integration_ref));
    const githubObservation = githubObservationByRef.get(normalizeRef(replay.github_readonly_observation_ref));
    const validationReplay = validationReplayByRef.get(normalizeRef(replay.external_validation_replay_ref));
    pushCheck(checks, errors, `${replay.replay_id} provider read integration is known`, Boolean(providerRead), replay.provider_read_integration_ref || "missing provider read integration", refs);
    pushCheck(checks, errors, `${replay.replay_id} github observation is known`, Boolean(githubObservation), replay.github_readonly_observation_ref || "missing github observation", refs);
    pushCheck(checks, errors, `${replay.replay_id} external validation replay is known`, Boolean(validationReplay), replay.external_validation_replay_ref || "missing external validation replay", refs);
    pushCheck(checks, errors, `${replay.replay_id} provider matches provider-read chain`, !providerRead || providerRead.provider === replay.provider, `record=${replay.provider}, integration=${providerRead?.provider ?? "missing"}`, refs);
    pushCheck(checks, errors, `${replay.replay_id} repository matches provider-read chain`, !providerRead || providerRead.repository === replay.repository, `record=${replay.repository}, integration=${providerRead?.repository ?? "missing"}`, refs);
    pushCheck(checks, errors, `${replay.replay_id} provider-read chain remains no-write`, !providerRead || (providerRead.external_write_attempted === false && providerRead.external_write_authorized === false), "provider read integration must remain read-only", refs);
    pushCheck(checks, errors, `${replay.replay_id} replay is human-readable`, isHumanReadableReplay(replay), "operator summary, read list, change explanation, not-proven boundary, and next action are required", refs);
    pushCheck(checks, errors, `${replay.replay_id} at least three read objects summarized`, replay.what_was_read.length >= 3, `${replay.what_was_read.length} read object(s)`, refs);
    pushCheck(checks, errors, `${replay.replay_id} no external write attempted`, replay.external_write_attempted === false, `external_write_attempted=${replay.external_write_attempted}`, refs);
    pushCheck(checks, errors, `${replay.replay_id} no external write authorized`, replay.external_write_authorized === false, `external_write_authorized=${replay.external_write_authorized}`, refs);
    pushCheck(checks, errors, `${replay.replay_id} provenance present`, hasText(replay.source_task_id) && hasText(replay.source_parent_session_id), `source_task_id=${replay.source_task_id || "missing"}, source_parent_session_id=${replay.source_parent_session_id || "missing"}`, refs);
  }

  const publicReplays = replays.map(summarizeReplay);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-observation-replay-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      replay_count: publicReplays.length,
      human_readable_replay_count: replays.filter((entry) => isHumanReadableReplay(entry.payload)).length,
      external_write_attempt_count: replays.filter((entry) => entry.payload.external_write_attempted).length,
      external_write_authorized_count: replays.filter((entry) => entry.payload.external_write_authorized).length,
      failing_check_count: errors.length
    },
    replays: publicReplays,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-observation-replay-audit.schema.json", "provider observation replay audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
