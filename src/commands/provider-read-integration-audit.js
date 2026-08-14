import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderAdapterRoot } from "./provider-adapter-record.js";

export function resolveProviderReadIntegrationRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-read-integrations");
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

function summarize(record) {
  const integration = record.payload;
  return {
    integration_id: integration.integration_id,
    provider: integration.provider,
    repository: integration.repository,
    read_mode: integration.read_mode,
    decision: integration.selected_decision.decision,
    artifact_ref: record.artifact_ref
  };
}

export async function providerReadIntegrationAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const integrations = await loadRecords(
    projectRoot,
    resolveProviderReadIntegrationRoot(projectRoot),
    "aof-provider-read-integration-record.schema.json",
    "provider read integration record",
    "provider-read-integration-record"
  );
  const adapters = await loadRecords(
    projectRoot,
    resolveProviderAdapterRoot(projectRoot),
    "aof-provider-adapter-record.schema.json",
    "provider adapter record",
    "provider-adapter-record"
  );
  const adapterByRef = new Map(adapters.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "provider read integration presence", integrations.length > 0, `${integrations.length} integration(s) found`, integrations.map((record) => record.artifact_ref));

  for (const record of integrations) {
    const integration = record.payload;
    const refs = [record.artifact_ref, integration.adapter_ref, integration.resource_ref, ...integration.evidence_refs];
    await checkRef(projectRoot, checks, errors, `${integration.integration_id} adapter ref resolves`, integration.adapter_ref, refs);
    await checkRef(projectRoot, checks, errors, `${integration.integration_id} resource ref resolves`, integration.resource_ref, refs);
    for (const evidenceRef of integration.evidence_refs) {
      await checkRef(projectRoot, checks, errors, `${integration.integration_id} evidence ref resolves`, evidenceRef, refs);
    }
    const adapter = adapterByRef.get(normalizeRef(integration.adapter_ref));
    pushCheck(checks, errors, `${integration.integration_id} adapter is known`, Boolean(adapter), integration.adapter_ref || "missing adapter_ref", refs);
    pushCheck(checks, errors, `${integration.integration_id} adapter is read-only`, !adapter || adapter.adapter_kind === "read_only", adapter ? `adapter_kind=${adapter.adapter_kind}` : "missing adapter", refs);
    pushCheck(checks, errors, `${integration.integration_id} adapter allows read`, !adapter || adapter.operation_modes.includes("read"), adapter ? `operation_modes=${adapter.operation_modes.join(",")}` : "missing adapter", refs);
    pushCheck(checks, errors, `${integration.integration_id} live or cached read mode`, ["read_only_live", "read_only_cached"].includes(integration.read_mode), `read_mode=${integration.read_mode}`, refs);
    pushCheck(checks, errors, `${integration.integration_id} read commands are read-only`, integration.external_read_commands.every((entry) => entry.operation_type === "read"), "all command operation_type values must be read", refs);
    pushCheck(checks, errors, `${integration.integration_id} at least one observed command`, integration.external_read_commands.some((entry) => entry.result_state === "observed"), "at least one provider command must observe data", refs);
    for (const key of ["repo_metadata", "latest_release", "open_issues", "open_pull_requests", "workflow_runs"]) {
      pushCheck(checks, errors, `${integration.integration_id} observed ${key}`, Object.hasOwn(integration.observed_objects, key), key, refs);
    }
    pushCheck(checks, errors, `${integration.integration_id} repo metadata has owner/name`, hasText(integration.observed_objects.repo_metadata?.nameWithOwner), integration.observed_objects.repo_metadata?.nameWithOwner || "missing nameWithOwner", refs);
    pushCheck(checks, errors, `${integration.integration_id} latest release observed`, hasText(integration.observed_objects.latest_release?.tagName), integration.observed_objects.latest_release?.tagName || "missing latest release tag", refs);
    pushCheck(checks, errors, `${integration.integration_id} workflow run list observed`, Array.isArray(integration.observed_objects.workflow_runs) && integration.observed_objects.workflow_runs.length > 0, `${integration.observed_objects.workflow_runs?.length ?? 0} workflow run(s)`, refs);
    pushCheck(checks, errors, `${integration.integration_id} no external write attempted`, integration.external_write_attempted === false, `external_write_attempted=${integration.external_write_attempted}`, refs);
    pushCheck(checks, errors, `${integration.integration_id} no external write authorized`, integration.external_write_authorized === false, `external_write_authorized=${integration.external_write_authorized}`, refs);
    pushCheck(checks, errors, `${integration.integration_id} boundary text present`, [integration.read_authority_boundary, integration.write_authority_boundary, integration.side_effect_boundary, integration.freshness_boundary, integration.not_proven].every(hasText), "read/write/side-effect/freshness/not-proven boundaries required", refs);
    pushCheck(checks, errors, `${integration.integration_id} selected decision present`, hasText(integration.selected_decision.rationale) && hasText(integration.selected_decision.next_action), integration.selected_decision.decision, refs);
    pushCheck(checks, errors, `${integration.integration_id} provenance present`, hasText(integration.source_task_id) && hasText(integration.source_parent_session_id), `source_task_id=${integration.source_task_id || "missing"}, source_parent_session_id=${integration.source_parent_session_id || "missing"}`, refs);
  }

  const publicIntegrations = integrations.map(summarize);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-read-integration-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      integration_count: publicIntegrations.length,
      live_read_count: publicIntegrations.filter((entry) => entry.read_mode === "read_only_live").length,
      go_count: publicIntegrations.filter((entry) => entry.decision === "go").length,
      external_write_attempt_count: integrations.filter((entry) => entry.payload.external_write_attempted).length,
      external_write_authorized_count: integrations.filter((entry) => entry.payload.external_write_authorized).length,
      failing_check_count: errors.length
    },
    integrations: publicIntegrations,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-read-integration-audit.schema.json", "provider read integration audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
