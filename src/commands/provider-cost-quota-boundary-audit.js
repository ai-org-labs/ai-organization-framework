import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderCostQuotaBoundaryRoot } from "./provider-cost-quota-boundary-record.js";

function normalizeRef(ref) {
  return String(ref ?? "").replaceAll("\\", "/");
}

function hasText(value) {
  return Boolean(String(value ?? "").trim());
}

function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
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
  for (const filePath of await listJsonFiles(resolveProviderCostQuotaBoundaryRoot(projectRoot))) {
    const payload = await readJson(filePath, `provider cost quota boundary ${path.basename(filePath)}`);
    if (payload.artifact_type !== "provider-cost-quota-boundary-record") {
      continue;
    }
    await validateWithBundledSchema(payload, "aof-provider-cost-quota-boundary-record.schema.json", "provider cost quota boundary record");
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasText(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function publicBoundary(record) {
  const boundary = record.payload;
  return {
    boundary_id: boundary.boundary_id,
    release_ref: boundary.release_ref,
    work_item_id: boundary.work_item_id,
    budget_period: boundary.budget_period,
    max_estimated_cost: boundary.max_estimated_cost,
    max_actual_cost: boundary.max_actual_cost,
    currency: boundary.currency,
    max_tokens: boundary.max_tokens,
    max_provider_calls: boundary.max_provider_calls,
    cost_status: boundary.cost_status,
    quota_status: boundary.quota_status,
    execution_eligibility: boundary.execution_eligibility,
    governance_action: boundary.governance_action,
    artifact_ref: record.artifact_ref
  };
}

export async function providerCostQuotaBoundaryAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadRecords(projectRoot);

  pushCheck(
    checks,
    errors,
    "provider cost quota boundary presence",
    records.length > 0,
    `${records.length} boundary record(s) found`,
    records.map((record) => record.artifact_ref)
  );

  for (const record of records) {
    const boundary = record.payload;
    const refs = [
      record.artifact_ref,
      boundary.release_ref,
      boundary.work_item_ref,
      boundary.candidate_ref,
      boundary.approval_ref,
      boundary.incident_recovery_ref,
      boundary.budget_owner_ref,
      ...boundary.evidence_refs,
      ...boundary.verification_refs
    ].filter(Boolean);

    for (const [name, ref] of [
      ["release ref resolves", boundary.release_ref],
      ["work item ref resolves", boundary.work_item_ref],
      ["candidate ref resolves", boundary.candidate_ref],
      ["approval ref resolves", boundary.approval_ref],
      ["incident recovery ref resolves", boundary.incident_recovery_ref],
      ["budget owner ref resolves", boundary.budget_owner_ref]
    ]) {
      await checkRef(projectRoot, checks, errors, `${boundary.boundary_id} ${name}`, ref, refs);
    }
    for (const ref of boundary.evidence_refs) {
      await checkRef(projectRoot, checks, errors, `${boundary.boundary_id} evidence ref resolves`, ref, refs);
    }
    for (const ref of boundary.verification_refs) {
      await checkRef(projectRoot, checks, errors, `${boundary.boundary_id} verification ref resolves`, ref, refs);
    }

    for (const [name, value] of [
      ["provider scope", boundary.provider_scope],
      ["budget period", boundary.budget_period],
      ["currency", boundary.currency],
      ["rate limit boundary", boundary.rate_limit_boundary],
      ["quota boundary", boundary.quota_boundary],
      ["billing boundary", boundary.billing_boundary],
      ["not-proven boundary", boundary.not_proven]
    ]) {
      pushCheck(checks, errors, `${boundary.boundary_id} ${name}`, hasText(value), value || `missing ${name}`, refs);
    }

    pushCheck(checks, errors, `${boundary.boundary_id} max estimated cost positive`, isPositiveNumber(boundary.max_estimated_cost), String(boundary.max_estimated_cost), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} max actual cost positive`, isPositiveNumber(boundary.max_actual_cost), String(boundary.max_actual_cost), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} cost ordering`, boundary.max_actual_cost >= boundary.max_estimated_cost, `estimated=${boundary.max_estimated_cost}, actual=${boundary.max_actual_cost}`, refs);
    pushCheck(checks, errors, `${boundary.boundary_id} max tokens positive`, Number.isInteger(boundary.max_tokens) && boundary.max_tokens > 0, String(boundary.max_tokens), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} max provider calls positive`, Number.isInteger(boundary.max_provider_calls) && boundary.max_provider_calls > 0, String(boundary.max_provider_calls), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} max retries non-negative`, Number.isInteger(boundary.max_retry_count) && boundary.max_retry_count >= 0, String(boundary.max_retry_count), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} stop conditions`, boundary.stop_conditions.length > 0, boundary.stop_conditions.join(", "), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} evidence`, boundary.evidence_refs.length > 0, boundary.evidence_refs.join(", "), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} verification`, boundary.verification_refs.length > 0, boundary.verification_refs.join(", "), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} runtime provenance`, hasText(boundary.source_task_id) && hasText(boundary.source_parent_session_id), `source_task_id=${boundary.source_task_id || "missing"}, source_parent_session_id=${boundary.source_parent_session_id || "missing"}`, refs);
    pushCheck(checks, errors, `${boundary.boundary_id} no hidden execution permission`, boundary.execution_eligibility !== "allowed" || boundary.governance_action === "allow_bounded_execution", `execution_eligibility=${boundary.execution_eligibility}, governance_action=${boundary.governance_action}`, refs);
    pushCheck(checks, errors, `${boundary.boundary_id} overage blocks or escalates`, boundary.overage_policy !== "allow" || boundary.governance_action === "allow_bounded_execution", `overage_policy=${boundary.overage_policy}, governance_action=${boundary.governance_action}`, refs);
  }

  const publicBoundaries = records.map(publicBoundary);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-cost-quota-boundary-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      boundary_count: publicBoundaries.length,
      ready_count: publicBoundaries.filter((boundary) => boundary.cost_status === "within_boundary" && boundary.quota_status === "within_boundary").length,
      blocked_count: publicBoundaries.filter((boundary) => boundary.execution_eligibility === "blocked").length,
      escalated_count: publicBoundaries.filter((boundary) => boundary.execution_eligibility === "escalated").length,
      allowed_count: publicBoundaries.filter((boundary) => boundary.execution_eligibility === "allowed").length,
      failing_check_count: errors.length
    },
    boundaries: publicBoundaries,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-cost-quota-boundary-audit.schema.json", "provider cost quota boundary audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
