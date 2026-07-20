import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderExecutionApprovalRoot } from "./provider-execution-approval-record.js";
import { resolveProviderExecutionReproductionRoot } from "./provider-execution-reproduction-record.js";

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

function publicReproduction(record) {
  const reproduction = record.payload;
  return {
    reproduction_id: reproduction.reproduction_id,
    approval_ref: reproduction.approval_ref,
    target_operation_ref: reproduction.target_operation_ref,
    work_item_id: reproduction.work_item_id,
    result_status: reproduction.result_status,
    artifact_ref: record.artifact_ref
  };
}

export async function providerExecutionReproductionAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const reproductions = await loadRecords(projectRoot, resolveProviderExecutionReproductionRoot(projectRoot), "aof-provider-execution-reproduction-record.schema.json", "provider execution reproduction record", "provider-execution-reproduction-record");
  const approvals = await loadRecords(projectRoot, resolveProviderExecutionApprovalRoot(projectRoot), "aof-provider-execution-approval-record.schema.json", "provider execution approval record", "provider-execution-approval-record");
  const approvalsByRef = new Map(approvals.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "provider execution reproduction presence", reproductions.length > 0, `${reproductions.length} reproduction(s) found`, reproductions.map((record) => record.artifact_ref));

  for (const record of reproductions) {
    const reproduction = record.payload;
    const refs = [
      record.artifact_ref,
      reproduction.approval_ref,
      reproduction.adapter_ref,
      reproduction.target_operation_ref,
      reproduction.work_item_ref,
      reproduction.session_ref,
      ...reproduction.replay_evidence_refs,
      ...reproduction.verification_refs
    ].filter(Boolean);
    await checkRef(projectRoot, checks, errors, `${reproduction.reproduction_id} approval ref resolves`, reproduction.approval_ref, refs);
    await checkRef(projectRoot, checks, errors, `${reproduction.reproduction_id} adapter ref resolves`, reproduction.adapter_ref, refs);
    await checkRef(projectRoot, checks, errors, `${reproduction.reproduction_id} target operation ref resolves`, reproduction.target_operation_ref, refs);
    await checkRef(projectRoot, checks, errors, `${reproduction.reproduction_id} work item ref resolves`, reproduction.work_item_ref, refs);
    await checkRef(projectRoot, checks, errors, `${reproduction.reproduction_id} session ref resolves`, reproduction.session_ref, refs);
    for (const ref of reproduction.replay_evidence_refs) {
      await checkRef(projectRoot, checks, errors, `${reproduction.reproduction_id} replay evidence ref resolves`, ref, refs);
    }
    for (const ref of reproduction.verification_refs) {
      await checkRef(projectRoot, checks, errors, `${reproduction.reproduction_id} verification ref resolves`, ref, refs);
    }

    const approval = approvalsByRef.get(normalizeRef(reproduction.approval_ref));
    pushCheck(checks, errors, `${reproduction.reproduction_id} linked approval exists`, Boolean(approval), reproduction.approval_ref || "missing approval_ref", refs);
    pushCheck(checks, errors, `${reproduction.reproduction_id} approval target alignment`, !approval || approval.target_operation_ref === reproduction.target_operation_ref, `approval.target_operation_ref=${approval?.target_operation_ref ?? "missing"}, reproduction.target_operation_ref=${reproduction.target_operation_ref}`, refs);
    pushCheck(checks, errors, `${reproduction.reproduction_id} approval adapter alignment`, !approval || approval.adapter_ref === reproduction.adapter_ref, `approval.adapter_ref=${approval?.adapter_ref ?? "missing"}, reproduction.adapter_ref=${reproduction.adapter_ref}`, refs);
    pushCheck(checks, errors, `${reproduction.reproduction_id} approval work item alignment`, !approval || approval.work_item_id === reproduction.work_item_id, `approval.work_item_id=${approval?.work_item_id ?? "missing"}, reproduction.work_item_id=${reproduction.work_item_id}`, refs);
    pushCheck(checks, errors, `${reproduction.reproduction_id} approval session alignment`, !approval || approval.session_ref === reproduction.session_ref, `approval.session_ref=${approval?.session_ref ?? "missing"}, reproduction.session_ref=${reproduction.session_ref}`, refs);
    pushCheck(checks, errors, `${reproduction.reproduction_id} approval is reconstructable preflight`, Boolean(approval) && approval.external_write_authorized === true && approval.production_execution_status === "preflight_approved", approval ? `external_write_authorized=${approval.external_write_authorized}, production_execution_status=${approval.production_execution_status}` : "missing approval", refs);
    pushCheck(checks, errors, `${reproduction.reproduction_id} input fingerprint`, hasText(reproduction.input_fingerprint), reproduction.input_fingerprint || "missing input_fingerprint", refs);
    pushCheck(checks, errors, `${reproduction.reproduction_id} reconstructed steps`, reproduction.reconstructed_steps.length > 0, `${reproduction.reconstructed_steps.length} step(s)`, refs);
    pushCheck(checks, errors, `${reproduction.reproduction_id} result reproduced`, reproduction.result_status === "reproduced", `result_status=${reproduction.result_status}`, refs);
    pushCheck(checks, errors, `${reproduction.reproduction_id} not-proven boundary`, hasText(reproduction.not_proven), reproduction.not_proven || "missing not_proven", refs);
  }

  const publicReproductions = reproductions.map(publicReproduction);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-execution-reproduction-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      reproduction_count: publicReproductions.length,
      reproduced_count: publicReproductions.filter((entry) => entry.result_status === "reproduced").length,
      blocked_count: publicReproductions.filter((entry) => entry.result_status === "blocked").length,
      mismatch_count: publicReproductions.filter((entry) => entry.result_status === "mismatch").length,
      missing_boundary_count: checks.filter((check) => check.status === "fail" && /boundary|ref resolves|alignment|approval|presence|fingerprint|steps/i.test(check.name)).length,
      failing_check_count: errors.length
    },
    reproductions: publicReproductions,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-execution-reproduction-audit.schema.json", "provider execution reproduction audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
