import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { resolveExternalRuntimeResourceRoot } from "./external-runtime-resource-record.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderAdapterRoot } from "./provider-adapter-record.js";

const READY_STATUSES = new Set(["ready", "accepted_residual_risk"]);
const WRITE_OPERATIONS = new Set(["local_write", "external_write", "dangerous"]);

function normalizeRef(ref) {
  return String(ref ?? "").replaceAll("\\", "/");
}

function hasBoundary(value) {
  return Boolean(String(value ?? "").trim());
}

function pushCheck(checks, errors, name, condition, detail, evidenceRefs = []) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail, evidence_refs: evidenceRefs.filter(Boolean) });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

async function loadRecords(projectRoot, root, schemaFileName, label, expectedArtifactType = null) {
  const records = [];
  for (const filePath of await listJsonFiles(root)) {
    const payload = await readJson(filePath, `${label} ${path.basename(filePath)}`);
    if (expectedArtifactType && payload.artifact_type !== expectedArtifactType) {
      continue;
    }
    await validateWithBundledSchema(payload, schemaFileName, label);
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasBoundary(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function publicAdapter(record) {
  const adapter = record.payload;
  return {
    adapter_id: adapter.adapter_id,
    display_name: adapter.display_name,
    adapter_kind: adapter.adapter_kind,
    operation_modes: adapter.operation_modes,
    readiness_status: adapter.readiness_status,
    artifact_ref: record.artifact_ref
  };
}

export async function providerAdapterAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const adapters = await loadRecords(projectRoot, resolveProviderAdapterRoot(projectRoot), "aof-provider-adapter-record.schema.json", "provider adapter record", "provider-adapter-record");
  const resources = await loadRecords(projectRoot, resolveExternalRuntimeResourceRoot(projectRoot), "aof-external-runtime-resource-record.schema.json", "external runtime resource record");
  const resourceByRef = new Map(resources.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "provider adapter presence", adapters.length > 0, `${adapters.length} adapter(s) found`, adapters.map((record) => record.artifact_ref));

  for (const record of adapters) {
    const adapter = record.payload;
    const refs = [record.artifact_ref, adapter.resource_ref, adapter.approval_policy_ref];
    await checkRef(projectRoot, checks, errors, `${adapter.adapter_id} provider ref resolves`, adapter.provider_ref, refs);
    await checkRef(projectRoot, checks, errors, `${adapter.adapter_id} resource ref resolves`, adapter.resource_ref, refs);
    await checkRef(projectRoot, checks, errors, `${adapter.adapter_id} approval policy ref resolves`, adapter.approval_policy_ref, refs);
    const resource = resourceByRef.get(normalizeRef(adapter.resource_ref));
    pushCheck(checks, errors, `${adapter.adapter_id} external resource is audited`, Boolean(resource), adapter.resource_ref || "missing resource_ref", refs);
    pushCheck(checks, errors, `${adapter.adapter_id} read boundary`, hasBoundary(adapter.read_authority_boundary), adapter.read_authority_boundary || "missing read_authority_boundary", refs);
    pushCheck(checks, errors, `${adapter.adapter_id} write boundary`, hasBoundary(adapter.write_authority_boundary), adapter.write_authority_boundary || "missing write_authority_boundary", refs);
    pushCheck(checks, errors, `${adapter.adapter_id} freshness check`, hasBoundary(adapter.freshness_check), adapter.freshness_check || "missing freshness_check", refs);
    pushCheck(checks, errors, `${adapter.adapter_id} side-effect boundary`, hasBoundary(adapter.side_effect_boundary), adapter.side_effect_boundary || "missing side_effect_boundary", refs);
    pushCheck(checks, errors, `${adapter.adapter_id} readiness status`, READY_STATUSES.has(adapter.readiness_status), `readiness_status=${adapter.readiness_status}`, refs);
    pushCheck(checks, errors, `${adapter.adapter_id} not-proven boundary`, hasBoundary(adapter.not_proven), adapter.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${adapter.adapter_id} runtime provenance`, hasBoundary(adapter.source_task_id) && hasBoundary(adapter.source_parent_session_id), `source_task_id=${adapter.source_task_id || "missing"}, source_parent_session_id=${adapter.source_parent_session_id || "missing"}`, refs);
    if (resource) {
      const unsupportedModes = adapter.operation_modes.filter((mode) => !resource.allowed_operations.includes(mode));
      pushCheck(checks, errors, `${adapter.adapter_id} operation modes allowed by resource`, unsupportedModes.length === 0, unsupportedModes.length === 0 ? adapter.operation_modes.join(", ") : `unsupported: ${unsupportedModes.join(", ")}`, refs);
    }
    const writeModes = adapter.operation_modes.filter((mode) => WRITE_OPERATIONS.has(mode));
    const missingEscalation = writeModes.filter((mode) => !adapter.escalation_required_for.includes(mode));
    pushCheck(checks, errors, `${adapter.adapter_id} write modes require escalation`, missingEscalation.length === 0, missingEscalation.length === 0 ? "all write-capable modes are escalation-bound" : `missing escalation for: ${missingEscalation.join(", ")}`, refs);
    if (adapter.operation_modes.includes("dangerous")) {
      pushCheck(checks, errors, `${adapter.adapter_id} dangerous mode is not ready`, adapter.readiness_status !== "ready", `readiness_status=${adapter.readiness_status}`, refs);
    }
  }

  const publicAdapters = adapters.map(publicAdapter);
  const writeCapableAdapters = publicAdapters.filter((adapter) => adapter.operation_modes.some((mode) => WRITE_OPERATIONS.has(mode)));
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-adapter-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      adapter_count: publicAdapters.length,
      ready_adapter_count: publicAdapters.filter((adapter) => READY_STATUSES.has(adapter.readiness_status)).length,
      write_capable_adapter_count: writeCapableAdapters.length,
      blocked_adapter_count: publicAdapters.filter((adapter) => adapter.readiness_status === "blocked").length,
      missing_boundary_count: checks.filter((check) => check.status === "fail" && /boundary|ref resolves|freshness|provenance|presence|escalation/i.test(check.name)).length,
      failing_check_count: errors.length
    },
    adapters: publicAdapters,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-adapter-audit.schema.json", "provider adapter audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
