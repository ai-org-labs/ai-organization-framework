import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveExternalRuntimeResourceRoot } from "./external-runtime-resource-record.js";
import { resolveExternalResourceUseRoot } from "./external-resource-use-record.js";

const READY_STATUSES = new Set(["ready", "accepted_residual_risk"]);
const APPROVED_USE_STATUSES = new Set(["approved", "not_required"]);
const WRITE_OPERATIONS = new Set(["external_write", "dangerous"]);

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

async function loadRecords(projectRoot, root, schemaFileName, label) {
  const records = [];
  for (const filePath of await listJsonFiles(root)) {
    const payload = await readJson(filePath, `${label} ${path.basename(filePath)}`);
    await validateWithBundledSchema(payload, schemaFileName, label);
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasBoundary(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function publicResource(record) {
  const payload = record.payload;
  return {
    resource_id: payload.resource_id,
    resource_kind: payload.resource_kind,
    display_name: payload.display_name,
    artifact_ref: record.artifact_ref,
    readiness_status: payload.readiness_status,
    allowed_operations: payload.allowed_operations
  };
}

function publicUse(record) {
  const payload = record.payload;
  return {
    use_id: payload.use_id,
    work_item_id: payload.work_item_id,
    resource_ref: payload.resource_ref,
    operation_type: payload.operation_type,
    approval_status: payload.approval_status,
    execution_status: payload.execution_status,
    artifact_ref: record.artifact_ref
  };
}

export async function externalResourceAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const resources = await loadRecords(projectRoot, resolveExternalRuntimeResourceRoot(projectRoot), "aof-external-runtime-resource-record.schema.json", "external runtime resource record");
  const uses = await loadRecords(projectRoot, resolveExternalResourceUseRoot(projectRoot), "aof-external-resource-use-record.schema.json", "external resource use record");
  const resourceByRef = new Map(resources.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "external runtime resource presence", resources.length > 0, `${resources.length} resource(s) found`, resources.map((record) => record.artifact_ref));
  pushCheck(checks, errors, "external resource use presence", uses.length > 0, `${uses.length} use record(s) found`, uses.map((record) => record.artifact_ref));

  for (const record of resources) {
    const resource = record.payload;
    const refs = [record.artifact_ref];
    pushCheck(checks, errors, `${resource.resource_id} source-of-truth boundary`, hasBoundary(resource.source_of_truth), resource.source_of_truth || "missing source_of_truth", refs);
    pushCheck(checks, errors, `${resource.resource_id} permission boundary`, hasBoundary(resource.permission_boundary), resource.permission_boundary || "missing permission_boundary", refs);
    pushCheck(checks, errors, `${resource.resource_id} freshness boundary`, hasBoundary(resource.freshness_boundary), resource.freshness_boundary || "missing freshness_boundary", refs);
    pushCheck(checks, errors, `${resource.resource_id} availability boundary`, hasBoundary(resource.availability_boundary), resource.availability_boundary || "missing availability_boundary", refs);
    pushCheck(checks, errors, `${resource.resource_id} approval boundary`, hasBoundary(resource.approval_boundary), resource.approval_boundary || "missing approval_boundary", refs);
    pushCheck(checks, errors, `${resource.resource_id} side-effect boundary`, hasBoundary(resource.side_effect_boundary), resource.side_effect_boundary || "missing side_effect_boundary", refs);
    pushCheck(checks, errors, `${resource.resource_id} allowed operations`, Array.isArray(resource.allowed_operations) && resource.allowed_operations.length > 0, (resource.allowed_operations ?? []).join(", ") || "missing allowed_operations", refs);
    pushCheck(checks, errors, `${resource.resource_id} readiness status`, READY_STATUSES.has(resource.readiness_status), `readiness_status=${resource.readiness_status}`, refs);
    pushCheck(checks, errors, `${resource.resource_id} not-proven boundary`, hasBoundary(resource.not_proven), resource.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${resource.resource_id} runtime provenance`, hasBoundary(resource.source_task_id) && hasBoundary(resource.source_parent_session_id), `source_task_id=${resource.source_task_id || "missing"}, source_parent_session_id=${resource.source_parent_session_id || "missing"}`, refs);
  }

  for (const record of uses) {
    const use = record.payload;
    const refs = [record.artifact_ref, use.resource_ref];
    await checkRef(projectRoot, checks, errors, `${use.use_id} work item ref resolves`, use.work_item_ref, refs);
    await checkRef(projectRoot, checks, errors, `${use.use_id} session ref resolves`, use.session_ref, refs);
    await checkRef(projectRoot, checks, errors, `${use.use_id} resource ref resolves`, use.resource_ref, refs);
    const resource = resourceByRef.get(normalizeRef(use.resource_ref));
    pushCheck(checks, errors, `${use.use_id} resource is audited`, Boolean(resource), use.resource_ref || "missing resource_ref", refs);
    pushCheck(checks, errors, `${use.use_id} operation allowed by resource`, Boolean(resource) && resource.allowed_operations.includes(use.operation_type), `operation_type=${use.operation_type}`, refs);
    pushCheck(checks, errors, `${use.use_id} resource readiness`, Boolean(resource) && READY_STATUSES.has(resource.readiness_status), resource ? `readiness_status=${resource.readiness_status}` : "missing resource", refs);
    const writeOperation = WRITE_OPERATIONS.has(use.operation_type);
    pushCheck(checks, errors, `${use.use_id} approval status`, APPROVED_USE_STATUSES.has(use.approval_status) && (!writeOperation || use.approval_status === "approved"), `operation_type=${use.operation_type}, approval_status=${use.approval_status}`, refs);
    if (writeOperation) {
      await checkRef(projectRoot, checks, errors, `${use.use_id} approval ref resolves for write operation`, use.approval_ref, refs);
    }
    for (const ref of use.output_artifact_refs) {
      await checkRef(projectRoot, checks, errors, `${use.use_id} output artifact ref resolves`, ref, refs);
    }
    pushCheck(checks, errors, `${use.use_id} not-proven boundary`, hasBoundary(use.not_proven), use.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${use.use_id} runtime provenance`, hasBoundary(use.source_task_id) && hasBoundary(use.source_parent_session_id), `source_task_id=${use.source_task_id || "missing"}, source_parent_session_id=${use.source_parent_session_id || "missing"}`, refs);
  }

  const publicResources = resources.map(publicResource);
  const publicUses = uses.map(publicUse);
  const missingBoundaryCount = checks.filter((check) => check.status === "fail" && /boundary|provenance|resolves|presence|approval/i.test(check.name)).length;
  const payload = {
    ok: errors.length === 0,
    artifact_type: "external-resource-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      resource_count: publicResources.length,
      ready_resource_count: publicResources.filter((resource) => READY_STATUSES.has(resource.readiness_status)).length,
      use_count: publicUses.length,
      approved_or_not_required_use_count: publicUses.filter((use) => APPROVED_USE_STATUSES.has(use.approval_status)).length,
      blocked_use_count: publicUses.filter((use) => use.execution_status === "blocked" || use.approval_status === "rejected").length,
      missing_boundary_count: missingBoundaryCount,
      failing_check_count: errors.length
    },
    resources: publicResources,
    uses: publicUses,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-external-resource-audit.schema.json", "external resource audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
