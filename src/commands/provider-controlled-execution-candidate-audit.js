import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderControlledExecutionCandidateRoot } from "./provider-controlled-execution-candidate-record.js";

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
  for (const filePath of await listJsonFiles(resolveProviderControlledExecutionCandidateRoot(projectRoot))) {
    const payload = await readJson(filePath, `provider controlled execution candidate ${path.basename(filePath)}`);
    if (payload.artifact_type !== "provider-controlled-execution-candidate-record") {
      continue;
    }
    await validateWithBundledSchema(
      payload,
      "aof-provider-controlled-execution-candidate-record.schema.json",
      "provider controlled execution candidate record"
    );
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasText(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function publicCandidate(record) {
  const candidate = record.payload;
  return {
    candidate_id: candidate.candidate_id,
    release_ref: candidate.release_ref,
    work_item_id: candidate.work_item_id,
    controlled_execution_mode: candidate.controlled_execution_mode,
    candidate_status: candidate.candidate_status,
    external_write_authorized: candidate.external_write_authorized,
    production_execution_authorized: candidate.production_execution_authorized,
    go_no_go_decision: candidate.go_no_go_decision,
    artifact_ref: record.artifact_ref
  };
}

export async function providerControlledExecutionCandidateAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadRecords(projectRoot);

  pushCheck(
    checks,
    errors,
    "provider controlled execution candidate presence",
    records.length > 0,
    `${records.length} candidate record(s) found`,
    records.map((record) => record.artifact_ref)
  );

  for (const record of records) {
    const candidate = record.payload;
    const refs = [
      record.artifact_ref,
      candidate.release_ref,
      candidate.work_item_ref,
      candidate.mission_control_ref,
      candidate.approval_ref,
      candidate.target_operation_ref,
      candidate.reproduction_ref,
      candidate.rollback_ref,
      candidate.outcome_ref,
      candidate.learning_ref,
      candidate.operator_acceptance_ref,
      candidate.product_value_evidence_ref,
      candidate.production_boundary_ref,
      ...candidate.provenance_refs,
      ...candidate.verification_refs
    ].filter(Boolean);

    for (const [name, ref] of [
      ["release ref resolves", candidate.release_ref],
      ["work item ref resolves", candidate.work_item_ref],
      ["mission control ref resolves", candidate.mission_control_ref],
      ["approval ref resolves", candidate.approval_ref],
      ["target operation ref resolves", candidate.target_operation_ref],
      ["reproduction ref resolves", candidate.reproduction_ref],
      ["rollback ref resolves", candidate.rollback_ref],
      ["outcome ref resolves", candidate.outcome_ref],
      ["learning ref resolves", candidate.learning_ref],
      ["operator acceptance ref resolves", candidate.operator_acceptance_ref],
      ["product value evidence ref resolves", candidate.product_value_evidence_ref],
      ["production boundary ref resolves", candidate.production_boundary_ref]
    ]) {
      await checkRef(projectRoot, checks, errors, `${candidate.candidate_id} ${name}`, ref, refs);
    }
    for (const ref of candidate.provenance_refs) {
      await checkRef(projectRoot, checks, errors, `${candidate.candidate_id} provenance ref resolves`, ref, refs);
    }
    for (const ref of candidate.verification_refs) {
      await checkRef(projectRoot, checks, errors, `${candidate.candidate_id} verification ref resolves`, ref, refs);
    }

    for (const [name, value] of [
      ["provider scope", candidate.provider_scope],
      ["expected provider effect", candidate.expected_provider_effect],
      ["credential boundary", candidate.credential_boundary],
      ["budget boundary", candidate.budget_boundary],
      ["rollback boundary", candidate.rollback_boundary],
      ["monitoring boundary", candidate.monitoring_boundary],
      ["incident boundary", candidate.incident_boundary],
      ["not-proven boundary", candidate.not_proven]
    ]) {
      pushCheck(checks, errors, `${candidate.candidate_id} ${name}`, hasText(value), value || `missing ${name}`, refs);
    }

    pushCheck(checks, errors, `${candidate.candidate_id} stop conditions`, candidate.stop_conditions.length > 0, candidate.stop_conditions.join(", "), refs);
    pushCheck(checks, errors, `${candidate.candidate_id} provenance`, candidate.provenance_refs.length > 0, candidate.provenance_refs.join(", "), refs);
    pushCheck(checks, errors, `${candidate.candidate_id} verification`, candidate.verification_refs.length > 0, candidate.verification_refs.join(", "), refs);
    pushCheck(checks, errors, `${candidate.candidate_id} runtime provenance`, hasText(candidate.source_task_id) && hasText(candidate.source_parent_session_id), `source_task_id=${candidate.source_task_id || "missing"}, source_parent_session_id=${candidate.source_parent_session_id || "missing"}`, refs);
    pushCheck(checks, errors, `${candidate.candidate_id} production execution not authorized`, candidate.production_execution_authorized === false, `production_execution_authorized=${candidate.production_execution_authorized}`, refs);
    pushCheck(checks, errors, `${candidate.candidate_id} controlled mode is not production`, candidate.controlled_execution_mode !== "blocked" || candidate.candidate_status !== "ready_for_operator_go_no_go", `controlled_execution_mode=${candidate.controlled_execution_mode}, candidate_status=${candidate.candidate_status}`, refs);
    pushCheck(checks, errors, `${candidate.candidate_id} go/no-go remains bounded`, candidate.go_no_go_decision !== "approved_for_preproduction_only" || candidate.production_execution_authorized === false, `go_no_go_decision=${candidate.go_no_go_decision}`, refs);
  }

  const publicCandidates = records.map(publicCandidate);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-controlled-execution-candidate-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      candidate_count: publicCandidates.length,
      ready_count: publicCandidates.filter((candidate) => candidate.candidate_status === "ready_for_operator_go_no_go").length,
      blocked_count: publicCandidates.filter((candidate) => candidate.candidate_status === "blocked").length,
      external_write_authorized_count: publicCandidates.filter((candidate) => candidate.external_write_authorized).length,
      production_authorized_count: publicCandidates.filter((candidate) => candidate.production_execution_authorized).length,
      failing_check_count: errors.length
    },
    candidates: publicCandidates,
    checks,
    errors
  };

  await validateWithBundledSchema(
    payload,
    "aof-provider-controlled-execution-candidate-audit.schema.json",
    "provider controlled execution candidate audit"
  );
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
