import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderExecutionApprovalRoot } from "./provider-execution-approval-record.js";
import { resolveProviderExecutionReproductionRoot } from "./provider-execution-reproduction-record.js";
import { resolveProviderOutcomeEvidenceRoot } from "./provider-outcome-evidence-record.js";
import { resolveProviderRollbackProofRoot } from "./provider-rollback-proof-record.js";

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
    if (expectedArtifactType && payload.artifact_type !== expectedArtifactType) {
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

function publicOutcome(record) {
  const outcome = record.payload;
  return {
    outcome_id: outcome.outcome_id,
    approval_ref: outcome.approval_ref,
    reproduction_ref: outcome.reproduction_ref,
    rollback_ref: outcome.rollback_ref,
    target_operation_ref: outcome.target_operation_ref,
    work_item_id: outcome.work_item_id,
    outcome_status: outcome.outcome_status,
    artifact_ref: record.artifact_ref
  };
}

export async function providerOutcomeEvidenceAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const outcomes = await loadRecords(projectRoot, resolveProviderOutcomeEvidenceRoot(projectRoot), "aof-provider-outcome-evidence-record.schema.json", "provider outcome evidence record", "provider-outcome-evidence-record");
  const approvals = await loadRecords(projectRoot, resolveProviderExecutionApprovalRoot(projectRoot), "aof-provider-execution-approval-record.schema.json", "provider execution approval record", "provider-execution-approval-record");
  const reproductions = await loadRecords(projectRoot, resolveProviderExecutionReproductionRoot(projectRoot), "aof-provider-execution-reproduction-record.schema.json", "provider execution reproduction record", "provider-execution-reproduction-record");
  const rollbacks = await loadRecords(projectRoot, resolveProviderRollbackProofRoot(projectRoot), "aof-provider-rollback-proof-record.schema.json", "provider rollback proof record", "provider-rollback-proof-record");
  const approvalsByRef = new Map(approvals.map((record) => [record.artifact_ref, record.payload]));
  const reproductionsByRef = new Map(reproductions.map((record) => [record.artifact_ref, record.payload]));
  const rollbacksByRef = new Map(rollbacks.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "provider outcome evidence presence", outcomes.length > 0, `${outcomes.length} outcome evidence record(s) found`, outcomes.map((record) => record.artifact_ref));

  for (const record of outcomes) {
    const outcome = record.payload;
    const refs = [
      record.artifact_ref,
      outcome.approval_ref,
      outcome.reproduction_ref,
      outcome.rollback_ref,
      outcome.target_operation_ref,
      outcome.session_ref,
      ...outcome.evidence_refs,
      ...outcome.verification_refs
    ].filter(Boolean);
    await checkRef(projectRoot, checks, errors, `${outcome.outcome_id} approval ref resolves`, outcome.approval_ref, refs);
    await checkRef(projectRoot, checks, errors, `${outcome.outcome_id} reproduction ref resolves`, outcome.reproduction_ref, refs);
    await checkRef(projectRoot, checks, errors, `${outcome.outcome_id} rollback ref resolves`, outcome.rollback_ref, refs);
    await checkRef(projectRoot, checks, errors, `${outcome.outcome_id} target operation ref resolves`, outcome.target_operation_ref, refs);
    await checkRef(projectRoot, checks, errors, `${outcome.outcome_id} session ref resolves`, outcome.session_ref, refs);
    for (const ref of outcome.evidence_refs) {
      await checkRef(projectRoot, checks, errors, `${outcome.outcome_id} evidence ref resolves`, ref, refs);
    }
    for (const ref of outcome.verification_refs) {
      await checkRef(projectRoot, checks, errors, `${outcome.outcome_id} verification ref resolves`, ref, refs);
    }

    const approval = approvalsByRef.get(normalizeRef(outcome.approval_ref));
    const reproduction = reproductionsByRef.get(normalizeRef(outcome.reproduction_ref));
    const rollback = rollbacksByRef.get(normalizeRef(outcome.rollback_ref));
    pushCheck(checks, errors, `${outcome.outcome_id} linked approval exists`, Boolean(approval), outcome.approval_ref || "missing approval_ref", refs);
    pushCheck(checks, errors, `${outcome.outcome_id} linked reproduction exists`, Boolean(reproduction), outcome.reproduction_ref || "missing reproduction_ref", refs);
    pushCheck(checks, errors, `${outcome.outcome_id} linked rollback exists`, Boolean(rollback), outcome.rollback_ref || "missing rollback_ref", refs);
    pushCheck(checks, errors, `${outcome.outcome_id} target matches approval`, !approval || approval.target_operation_ref === outcome.target_operation_ref, `approval.target_operation_ref=${approval?.target_operation_ref ?? "missing"}, outcome.target_operation_ref=${outcome.target_operation_ref}`, refs);
    pushCheck(checks, errors, `${outcome.outcome_id} target matches reproduction`, !reproduction || reproduction.target_operation_ref === outcome.target_operation_ref, `reproduction.target_operation_ref=${reproduction?.target_operation_ref ?? "missing"}, outcome.target_operation_ref=${outcome.target_operation_ref}`, refs);
    pushCheck(checks, errors, `${outcome.outcome_id} target matches rollback`, !rollback || rollback.target_operation_ref === outcome.target_operation_ref, `rollback.target_operation_ref=${rollback?.target_operation_ref ?? "missing"}, outcome.target_operation_ref=${outcome.target_operation_ref}`, refs);
    pushCheck(checks, errors, `${outcome.outcome_id} reproduction is reproduced`, Boolean(reproduction) && reproduction.result_status === "reproduced", reproduction ? `result_status=${reproduction.result_status}` : "missing reproduction", refs);
    pushCheck(checks, errors, `${outcome.outcome_id} rollback is ready`, Boolean(rollback) && rollback.result_status === "rollback_ready", rollback ? `result_status=${rollback.result_status}` : "missing rollback", refs);
    pushCheck(checks, errors, `${outcome.outcome_id} outcome not blocked`, outcome.outcome_status !== "blocked", `outcome_status=${outcome.outcome_status}`, refs);
    pushCheck(checks, errors, `${outcome.outcome_id} expected outcome`, hasText(outcome.expected_outcome), outcome.expected_outcome || "missing expected_outcome", refs);
    pushCheck(checks, errors, `${outcome.outcome_id} observed result`, hasText(outcome.observed_result), outcome.observed_result || "missing observed_result", refs);
    pushCheck(checks, errors, `${outcome.outcome_id} semantic truth boundary`, hasText(outcome.semantic_truth_boundary), outcome.semantic_truth_boundary || "missing semantic_truth_boundary", refs);
    pushCheck(checks, errors, `${outcome.outcome_id} not-proven boundary`, hasText(outcome.not_proven), outcome.not_proven || "missing not_proven", refs);
  }

  const publicOutcomes = outcomes.map(publicOutcome);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-outcome-evidence-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      outcome_count: publicOutcomes.length,
      accepted_count: publicOutcomes.filter((entry) => entry.outcome_status === "accepted").length,
      corrected_count: publicOutcomes.filter((entry) => entry.outcome_status === "corrected").length,
      rollback_recommended_count: publicOutcomes.filter((entry) => entry.outcome_status === "rollback_recommended").length,
      blocked_count: publicOutcomes.filter((entry) => entry.outcome_status === "blocked").length,
      missing_boundary_count: checks.filter((check) => check.status === "fail" && /boundary|ref resolves|matches|presence|reproduced|ready|blocked|outcome|result/i.test(check.name)).length,
      failing_check_count: errors.length
    },
    outcomes: publicOutcomes,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-outcome-evidence-audit.schema.json", "provider outcome evidence audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
