import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderProductionBoundaryRoot } from "./provider-production-boundary-record.js";

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
  for (const filePath of await listJsonFiles(resolveProviderProductionBoundaryRoot(projectRoot))) {
    const payload = await readJson(filePath, `provider production boundary record ${path.basename(filePath)}`);
    if (payload.artifact_type !== "provider-production-boundary-record") {
      continue;
    }
    await validateWithBundledSchema(payload, "aof-provider-production-boundary-record.schema.json", "provider production boundary record");
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
    execution_eligibility: boundary.execution_eligibility,
    production_execution_authorized: boundary.production_execution_authorized,
    go_no_go_status: boundary.go_no_go_status,
    governance_action: boundary.governance_action,
    artifact_ref: record.artifact_ref
  };
}

export async function providerProductionBoundaryAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadRecords(projectRoot);

  pushCheck(checks, errors, "provider production boundary presence", records.length > 0, `${records.length} boundary record(s) found`, records.map((record) => record.artifact_ref));

  for (const record of records) {
    const boundary = record.payload;
    const refs = [
      record.artifact_ref,
      boundary.release_ref,
      boundary.work_item_ref,
      boundary.mission_control_ref,
      boundary.approval_ref,
      boundary.reproduction_ref,
      boundary.rollback_ref,
      boundary.outcome_ref,
      boundary.learning_ref,
      boundary.operator_acceptance_ref,
      boundary.product_value_evidence_ref,
      ...boundary.provenance_refs,
      ...boundary.verification_refs
    ].filter(Boolean);

    for (const [name, ref] of [
      ["release ref resolves", boundary.release_ref],
      ["work item ref resolves", boundary.work_item_ref],
      ["mission control ref resolves", boundary.mission_control_ref],
      ["approval ref resolves", boundary.approval_ref],
      ["reproduction ref resolves", boundary.reproduction_ref],
      ["rollback ref resolves", boundary.rollback_ref],
      ["outcome ref resolves", boundary.outcome_ref],
      ["learning ref resolves", boundary.learning_ref],
      ["operator acceptance ref resolves", boundary.operator_acceptance_ref],
      ["product value evidence ref resolves", boundary.product_value_evidence_ref]
    ]) {
      await checkRef(projectRoot, checks, errors, `${boundary.boundary_id} ${name}`, ref, refs);
    }
    for (const ref of boundary.provenance_refs) {
      await checkRef(projectRoot, checks, errors, `${boundary.boundary_id} provenance ref resolves`, ref, refs);
    }
    for (const ref of boundary.verification_refs) {
      await checkRef(projectRoot, checks, errors, `${boundary.boundary_id} verification ref resolves`, ref, refs);
    }

    for (const [name, value] of [
      ["provider scope", boundary.provider_scope],
      ["credential boundary", boundary.credential_boundary],
      ["budget boundary", boundary.budget_boundary],
      ["revocation boundary", boundary.revocation_boundary],
      ["rollback boundary", boundary.rollback_boundary],
      ["monitoring boundary", boundary.monitoring_boundary],
      ["incident boundary", boundary.incident_boundary],
      ["human go/no-go boundary", boundary.human_go_no_go_boundary],
      ["product value comprehension boundary", boundary.product_value_comprehension_boundary],
      ["not-proven boundary", boundary.not_proven]
    ]) {
      pushCheck(checks, errors, `${boundary.boundary_id} ${name}`, hasText(value), value || `missing ${name}`, refs);
    }

    pushCheck(checks, errors, `${boundary.boundary_id} stop conditions`, boundary.stop_conditions.length > 0, boundary.stop_conditions.join(", "), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} provenance`, boundary.provenance_refs.length > 0, boundary.provenance_refs.join(", "), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} verification`, boundary.verification_refs.length > 0, boundary.verification_refs.join(", "), refs);
    pushCheck(checks, errors, `${boundary.boundary_id} runtime provenance`, hasText(boundary.source_task_id) && hasText(boundary.source_parent_session_id), `source_task_id=${boundary.source_task_id || "missing"}, source_parent_session_id=${boundary.source_parent_session_id || "missing"}`, refs);
    pushCheck(checks, errors, `${boundary.boundary_id} production execution not authorized in candidate release`, boundary.production_execution_authorized === false, `production_execution_authorized=${boundary.production_execution_authorized}`, refs);
    pushCheck(checks, errors, `${boundary.boundary_id} go/no-go blocks production`, boundary.go_no_go_status !== "authorized", `go_no_go_status=${boundary.go_no_go_status}`, refs);
    pushCheck(checks, errors, `${boundary.boundary_id} governance action blocks or escalates`, ["block_production_execution", "escalate_production_review"].includes(boundary.governance_action), `governance_action=${boundary.governance_action}`, refs);
  }

  const publicBoundaries = records.map(publicBoundary);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-production-boundary-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      boundary_count: publicBoundaries.length,
      candidate_count: publicBoundaries.filter((boundary) => boundary.execution_eligibility === "candidate").length,
      blocked_count: publicBoundaries.filter((boundary) => boundary.execution_eligibility === "blocked").length,
      production_authorized_count: publicBoundaries.filter((boundary) => boundary.production_execution_authorized).length,
      missing_boundary_count: checks.filter((check) => check.status === "fail" && /boundary|ref resolves|presence|provenance|verification|stop|go\/no-go|governance/i.test(check.name)).length,
      failing_check_count: errors.length
    },
    boundaries: publicBoundaries,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-production-boundary-audit.schema.json", "provider production boundary audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
