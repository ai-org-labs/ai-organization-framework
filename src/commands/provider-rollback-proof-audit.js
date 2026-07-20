import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderExecutionApprovalRoot } from "./provider-execution-approval-record.js";
import { resolveProviderExecutionReproductionRoot } from "./provider-execution-reproduction-record.js";
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

function publicRollback(record) {
  const rollback = record.payload;
  return {
    rollback_id: rollback.rollback_id,
    approval_ref: rollback.approval_ref,
    reproduction_ref: rollback.reproduction_ref,
    target_operation_ref: rollback.target_operation_ref,
    result_status: rollback.result_status,
    artifact_ref: record.artifact_ref
  };
}

export async function providerRollbackProofAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const rollbacks = await loadRecords(projectRoot, resolveProviderRollbackProofRoot(projectRoot), "aof-provider-rollback-proof-record.schema.json", "provider rollback proof record", "provider-rollback-proof-record");
  const approvals = await loadRecords(projectRoot, resolveProviderExecutionApprovalRoot(projectRoot), "aof-provider-execution-approval-record.schema.json", "provider execution approval record", "provider-execution-approval-record");
  const reproductions = await loadRecords(projectRoot, resolveProviderExecutionReproductionRoot(projectRoot), "aof-provider-execution-reproduction-record.schema.json", "provider execution reproduction record", "provider-execution-reproduction-record");
  const approvalsByRef = new Map(approvals.map((record) => [record.artifact_ref, record.payload]));
  const reproductionsByRef = new Map(reproductions.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "provider rollback proof presence", rollbacks.length > 0, `${rollbacks.length} rollback proof(s) found`, rollbacks.map((record) => record.artifact_ref));

  for (const record of rollbacks) {
    const rollback = record.payload;
    const refs = [
      record.artifact_ref,
      rollback.approval_ref,
      rollback.reproduction_ref,
      rollback.target_operation_ref,
      ...rollback.rollback_evidence_refs,
      ...rollback.verification_refs
    ].filter(Boolean);
    await checkRef(projectRoot, checks, errors, `${rollback.rollback_id} approval ref resolves`, rollback.approval_ref, refs);
    await checkRef(projectRoot, checks, errors, `${rollback.rollback_id} reproduction ref resolves`, rollback.reproduction_ref, refs);
    await checkRef(projectRoot, checks, errors, `${rollback.rollback_id} target operation ref resolves`, rollback.target_operation_ref, refs);
    for (const ref of rollback.rollback_evidence_refs) {
      await checkRef(projectRoot, checks, errors, `${rollback.rollback_id} rollback evidence ref resolves`, ref, refs);
    }
    for (const ref of rollback.verification_refs) {
      await checkRef(projectRoot, checks, errors, `${rollback.rollback_id} verification ref resolves`, ref, refs);
    }

    const approval = approvalsByRef.get(normalizeRef(rollback.approval_ref));
    const reproduction = reproductionsByRef.get(normalizeRef(rollback.reproduction_ref));
    pushCheck(checks, errors, `${rollback.rollback_id} linked approval exists`, Boolean(approval), rollback.approval_ref || "missing approval_ref", refs);
    pushCheck(checks, errors, `${rollback.rollback_id} linked reproduction exists`, Boolean(reproduction), rollback.reproduction_ref || "missing reproduction_ref", refs);
    pushCheck(checks, errors, `${rollback.rollback_id} rollback target matches approval`, !approval || approval.target_operation_ref === rollback.target_operation_ref, `approval.target_operation_ref=${approval?.target_operation_ref ?? "missing"}, rollback.target_operation_ref=${rollback.target_operation_ref}`, refs);
    pushCheck(checks, errors, `${rollback.rollback_id} rollback target matches reproduction`, !reproduction || reproduction.target_operation_ref === rollback.target_operation_ref, `reproduction.target_operation_ref=${reproduction?.target_operation_ref ?? "missing"}, rollback.target_operation_ref=${rollback.target_operation_ref}`, refs);
    pushCheck(checks, errors, `${rollback.rollback_id} reproduction is reproduced`, Boolean(reproduction) && reproduction.result_status === "reproduced", reproduction ? `result_status=${reproduction.result_status}` : "missing reproduction", refs);
    pushCheck(checks, errors, `${rollback.rollback_id} rollback supported`, rollback.rollback_supported === true, `rollback_supported=${rollback.rollback_supported}`, refs);
    pushCheck(checks, errors, `${rollback.rollback_id} rollback operation`, hasText(rollback.rollback_operation), rollback.rollback_operation || "missing rollback_operation", refs);
    pushCheck(checks, errors, `${rollback.rollback_id} rollback ready`, rollback.result_status === "rollback_ready", `result_status=${rollback.result_status}`, refs);
    pushCheck(checks, errors, `${rollback.rollback_id} stop conditions`, rollback.stop_conditions.length > 0, rollback.stop_conditions.join(", "), refs);
    pushCheck(checks, errors, `${rollback.rollback_id} not-proven boundary`, hasText(rollback.not_proven), rollback.not_proven || "missing not_proven", refs);
  }

  const publicRollbacks = rollbacks.map(publicRollback);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-rollback-proof-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      rollback_count: publicRollbacks.length,
      ready_count: publicRollbacks.filter((entry) => entry.result_status === "rollback_ready").length,
      blocked_count: publicRollbacks.filter((entry) => entry.result_status === "blocked").length,
      mismatch_count: publicRollbacks.filter((entry) => entry.result_status === "mismatch").length,
      missing_boundary_count: checks.filter((check) => check.status === "fail" && /boundary|ref resolves|alignment|approval|presence|rollback|stop|supported/i.test(check.name)).length,
      failing_check_count: errors.length
    },
    rollback_proofs: publicRollbacks,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-rollback-proof-audit.schema.json", "provider rollback proof audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
