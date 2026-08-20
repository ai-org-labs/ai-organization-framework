import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";

export function resolveProviderReadFreshnessRefreshRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-read-freshness-refreshes");
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
  for (const filePath of await listJsonFiles(resolveProviderReadFreshnessRefreshRoot(projectRoot))) {
    const payload = await readJson(filePath, `provider read freshness refresh ${path.basename(filePath)}`);
    if (payload.artifact_type !== "provider-read-freshness-refresh-record") continue;
    await validateWithBundledSchema(payload, "aof-provider-read-freshness-refresh-record.schema.json", "provider read freshness refresh record");
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasText(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function decisionAllowedForStatus(status, decision) {
  if (status === "current") return ["use_as_current", "defer"].includes(decision);
  if (status === "stale") return ["require_refresh", "block_reuse", "defer"].includes(decision);
  if (status === "expired") return decision === "block_reuse";
  return ["require_refresh", "block_reuse", "defer"].includes(decision);
}

function summarize(record) {
  const refresh = record.payload;
  return {
    refresh_id: refresh.refresh_id,
    freshness_status: refresh.freshness_status,
    refresh_decision: refresh.refresh_decision,
    max_age_hours: refresh.max_age_hours,
    refreshed_at: refresh.refreshed_at,
    operator_summary: refresh.operator_summary,
    next_action: refresh.next_action,
    artifact_ref: record.artifact_ref
  };
}

export async function providerReadFreshnessRefreshAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadRecords(projectRoot);
  pushCheck(checks, errors, "provider read freshness refresh presence", records.length > 0, `${records.length} freshness record(s) found`, records.map((record) => record.artifact_ref));

  for (const record of records) {
    const refresh = record.payload;
    const refs = [
      record.artifact_ref,
      refresh.provider_read_decision_replay_ref,
      refresh.provider_read_integration_ref,
      refresh.observation_ref,
      ...refresh.evidence_refs
    ];
    await checkRef(projectRoot, checks, errors, `${refresh.refresh_id} provider read decision replay ref resolves`, refresh.provider_read_decision_replay_ref, refs);
    await checkRef(projectRoot, checks, errors, `${refresh.refresh_id} provider read integration ref resolves`, refresh.provider_read_integration_ref, refs);
    await checkRef(projectRoot, checks, errors, `${refresh.refresh_id} observation ref resolves`, refresh.observation_ref, refs);
    for (const ref of refresh.evidence_refs) await checkRef(projectRoot, checks, errors, `${refresh.refresh_id} evidence ref resolves`, ref, refs);
    pushCheck(checks, errors, `${refresh.refresh_id} max age is positive`, Number(refresh.max_age_hours) > 0, `max_age_hours=${refresh.max_age_hours}`, refs);
    pushCheck(checks, errors, `${refresh.refresh_id} timestamps are ordered`, Date.parse(refresh.refreshed_at) >= Date.parse(refresh.original_observed_at), `original=${refresh.original_observed_at}, refreshed=${refresh.refreshed_at}`, refs);
    pushCheck(checks, errors, `${refresh.refresh_id} freshness decision matches status`, decisionAllowedForStatus(refresh.freshness_status, refresh.refresh_decision), `status=${refresh.freshness_status}, decision=${refresh.refresh_decision}`, refs);
    pushCheck(checks, errors, `${refresh.refresh_id} operator summary and next action are present`, hasText(refresh.operator_summary) && hasText(refresh.next_action), refresh.operator_summary || "missing operator summary", refs);
    pushCheck(checks, errors, `${refresh.refresh_id} not-proven boundary present`, hasText(refresh.not_proven), refresh.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${refresh.refresh_id} provenance present`, hasText(refresh.source_task_id) && hasText(refresh.source_parent_session_id), `source_task_id=${refresh.source_task_id || "missing"}, source_parent_session_id=${refresh.source_parent_session_id || "missing"}`, refs);
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-read-freshness-refresh-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      refresh_count: records.length,
      current_count: records.filter((entry) => entry.payload.freshness_status === "current").length,
      stale_count: records.filter((entry) => entry.payload.freshness_status === "stale").length,
      expired_count: records.filter((entry) => entry.payload.freshness_status === "expired").length,
      unknown_count: records.filter((entry) => entry.payload.freshness_status === "unknown").length,
      blocked_reuse_count: records.filter((entry) => entry.payload.refresh_decision === "block_reuse").length,
      require_refresh_count: records.filter((entry) => entry.payload.refresh_decision === "require_refresh").length,
      failing_check_count: errors.length
    },
    refreshes: records.map(summarize),
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-read-freshness-refresh-audit.schema.json", "provider read freshness refresh audit");
  const artifactPath = options.artifactPath ? await writeJsonArtifact(options.artifactPath, payload) : null;
  return { ok: payload.ok, artifactPath, summary: payload };
}
