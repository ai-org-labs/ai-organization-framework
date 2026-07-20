import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderAdapterRoot } from "./provider-adapter-record.js";
import { resolveProviderAdapterPilotRoot } from "./provider-adapter-pilot-record.js";
import { resolveProviderExecutionApprovalRoot } from "./provider-execution-approval-record.js";
import { resolveHumanApprovalRoot } from "./human-approval-record.js";
import { resolveProviderOperationTargetRoot } from "./provider-operation-target-record.js";

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

function publicApproval(record) {
  const approval = record.payload;
  return {
    approval_id: approval.approval_id,
    pilot_ref: approval.pilot_ref,
    adapter_ref: approval.adapter_ref,
    work_item_id: approval.work_item_id,
    approval_decision: approval.approval_decision,
    approved_execution_mode: approval.approved_execution_mode,
    external_write_authorized: approval.external_write_authorized,
    production_execution_status: approval.production_execution_status,
    artifact_ref: record.artifact_ref
  };
}

export async function providerExecutionApprovalAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const approvals = await loadRecords(projectRoot, resolveProviderExecutionApprovalRoot(projectRoot), "aof-provider-execution-approval-record.schema.json", "provider execution approval record", "provider-execution-approval-record");
  const pilots = await loadRecords(projectRoot, resolveProviderAdapterPilotRoot(projectRoot), "aof-provider-adapter-pilot-record.schema.json", "provider adapter pilot record", "provider-adapter-pilot-record");
  const adapters = await loadRecords(projectRoot, resolveProviderAdapterRoot(projectRoot), "aof-provider-adapter-record.schema.json", "provider adapter record", "provider-adapter-record");
  const humanApprovals = await loadRecords(projectRoot, resolveHumanApprovalRoot(projectRoot), "aof-human-approval-record.schema.json", "human approval record", "human-approval-record");
  const operationTargets = await loadRecords(projectRoot, resolveProviderOperationTargetRoot(projectRoot), "aof-provider-operation-target-record.schema.json", "provider operation target record", "provider-operation-target-record");
  const pilotsByRef = new Map(pilots.map((record) => [record.artifact_ref, record.payload]));
  const adaptersByRef = new Map(adapters.map((record) => [record.artifact_ref, record.payload]));
  const humanApprovalsByRef = new Map(humanApprovals.map((record) => [record.artifact_ref, record.payload]));
  const operationTargetsByRef = new Map(operationTargets.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "provider execution approval presence", approvals.length > 0, `${approvals.length} approval(s) found`, approvals.map((record) => record.artifact_ref));

  for (const record of approvals) {
    const approval = record.payload;
    const refs = [
      record.artifact_ref,
      approval.pilot_ref,
      approval.adapter_ref,
      approval.work_item_ref,
      approval.session_ref,
      approval.human_approval_ref,
      approval.target_operation_ref,
      ...approval.provenance_refs,
      ...approval.verification_refs
    ].filter(Boolean);
    await checkRef(projectRoot, checks, errors, `${approval.approval_id} pilot ref resolves`, approval.pilot_ref, refs);
    await checkRef(projectRoot, checks, errors, `${approval.approval_id} adapter ref resolves`, approval.adapter_ref, refs);
    await checkRef(projectRoot, checks, errors, `${approval.approval_id} work item ref resolves`, approval.work_item_ref, refs);
    await checkRef(projectRoot, checks, errors, `${approval.approval_id} session ref resolves`, approval.session_ref, refs);
    if (approval.target_operation_ref) {
      await checkRef(projectRoot, checks, errors, `${approval.approval_id} target operation ref resolves`, approval.target_operation_ref, refs);
    }
    for (const ref of approval.provenance_refs) {
      await checkRef(projectRoot, checks, errors, `${approval.approval_id} provenance ref resolves`, ref, refs);
    }
    for (const ref of approval.verification_refs) {
      await checkRef(projectRoot, checks, errors, `${approval.approval_id} verification ref resolves`, ref, refs);
    }

    const pilot = pilotsByRef.get(normalizeRef(approval.pilot_ref));
    const adapter = adaptersByRef.get(normalizeRef(approval.adapter_ref));
    const humanApproval = humanApprovalsByRef.get(normalizeRef(approval.human_approval_ref));
    const operationTarget = operationTargetsByRef.get(normalizeRef(approval.target_operation_ref));
    pushCheck(checks, errors, `${approval.approval_id} linked pilot exists`, Boolean(pilot), approval.pilot_ref || "missing pilot_ref", refs);
    pushCheck(checks, errors, `${approval.approval_id} linked adapter exists`, Boolean(adapter), approval.adapter_ref || "missing adapter_ref", refs);
    pushCheck(checks, errors, `${approval.approval_id} pilot adapter alignment`, !pilot || pilot.adapter_ref === approval.adapter_ref, `pilot.adapter_ref=${pilot?.adapter_ref ?? "missing"}, approval.adapter_ref=${approval.adapter_ref}`, refs);
    const adapterOperations = new Set(adapter?.operation_modes ?? []);
    const unauthorizedOperations = approval.allowed_operations.filter((operation) => !adapterOperations.has(operation));
    pushCheck(
      checks,
      errors,
      `${approval.approval_id} allowed operations align with adapter capability`,
      !adapter || unauthorizedOperations.length === 0,
      unauthorizedOperations.length > 0
        ? `adapter.operation_modes=${[...adapterOperations].join(", ") || "none"}, unauthorized=${unauthorizedOperations.join(", ")}`
        : `adapter.operation_modes=${[...adapterOperations].join(", ") || "none"}`,
      refs
    );
    pushCheck(checks, errors, `${approval.approval_id} execution scope`, hasText(approval.execution_scope), approval.execution_scope || "missing execution_scope", refs);
    pushCheck(checks, errors, `${approval.approval_id} side-effect boundary`, hasText(approval.side_effect_boundary), approval.side_effect_boundary || "missing side_effect_boundary", refs);
    pushCheck(checks, errors, `${approval.approval_id} redaction boundary`, hasText(approval.redaction_boundary), approval.redaction_boundary || "missing redaction_boundary", refs);
    pushCheck(checks, errors, `${approval.approval_id} rollback plan`, hasText(approval.rollback_plan), approval.rollback_plan || "missing rollback_plan", refs);
    pushCheck(checks, errors, `${approval.approval_id} credential boundary`, hasText(approval.credential_boundary), approval.credential_boundary || "missing credential_boundary", refs);
    pushCheck(checks, errors, `${approval.approval_id} budget boundary`, hasText(approval.budget_boundary), approval.budget_boundary || "missing budget_boundary", refs);
    pushCheck(checks, errors, `${approval.approval_id} stop conditions`, approval.stop_conditions.length > 0, approval.stop_conditions.join(", "), refs);
    pushCheck(checks, errors, `${approval.approval_id} not-proven boundary`, hasText(approval.not_proven), approval.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${approval.approval_id} runtime provenance`, hasText(approval.source_task_id) && hasText(approval.source_parent_session_id), `source_task_id=${approval.source_task_id || "missing"}, source_parent_session_id=${approval.source_parent_session_id || "missing"}`, refs);
    pushCheck(checks, errors, `${approval.approval_id} production not executed by bridge`, approval.production_execution_status !== "executed", `production_execution_status=${approval.production_execution_status}`, refs);

    if (approval.external_write_authorized) {
      await checkRef(projectRoot, checks, errors, `${approval.approval_id} human approval ref resolves`, approval.human_approval_ref, refs);
      pushCheck(checks, errors, `${approval.approval_id} human approval record authenticity`, Boolean(humanApproval) && humanApproval.approver_type === "human", humanApproval ? `approver_type=${humanApproval.approver_type}` : "missing human-approval-record", refs);
      pushCheck(checks, errors, `${approval.approval_id} human approval decision active`, Boolean(humanApproval) && humanApproval.decision === "approved" && humanApproval.revocation_status === "active", humanApproval ? `decision=${humanApproval.decision}, revocation_status=${humanApproval.revocation_status}` : "missing human approval", refs);
      pushCheck(checks, errors, `${approval.approval_id} target operation presence`, Boolean(operationTarget), approval.target_operation_ref || "missing target_operation_ref", refs);
      pushCheck(checks, errors, `${approval.approval_id} human approval target alignment`, !humanApproval || humanApproval.target_operation_ref === approval.target_operation_ref, `human.target_operation_ref=${humanApproval?.target_operation_ref ?? "missing"}, approval.target_operation_ref=${approval.target_operation_ref ?? "missing"}`, refs);
      pushCheck(checks, errors, `${approval.approval_id} human approval scope hash alignment`, !humanApproval || !operationTarget || humanApproval.approved_scope_hash === operationTarget.payload_hash, `human.approved_scope_hash=${humanApproval?.approved_scope_hash ?? "missing"}, target.payload_hash=${operationTarget?.payload_hash ?? "missing"}`, refs);
      pushCheck(checks, errors, `${approval.approval_id} external write approval decision`, approval.approval_decision === "approved", `approval_decision=${approval.approval_decision}`, refs);
      pushCheck(checks, errors, `${approval.approval_id} bounded external write mode`, approval.approved_execution_mode === "bounded_external_write", `approved_execution_mode=${approval.approved_execution_mode}`, refs);
      pushCheck(checks, errors, `${approval.approval_id} external write explicitly allowed`, approval.allowed_operations.includes("external_write"), approval.allowed_operations.join(", "), refs);
      pushCheck(checks, errors, `${approval.approval_id} adapter supports external write`, Boolean(adapter) && adapter.operation_modes.includes("external_write"), `adapter.operation_modes=${adapter?.operation_modes?.join(", ") ?? "missing"}`, refs);
      pushCheck(checks, errors, `${approval.approval_id} credential scope structured`, Array.isArray(approval.credential_scope) && approval.credential_scope.length > 0, approval.credential_scope?.join(", ") || "missing credential_scope", refs);
      pushCheck(checks, errors, `${approval.approval_id} budget structured`, Boolean(approval.budget) && hasText(approval.budget.currency) && Number.isFinite(approval.budget.maximum), approval.budget ? `${approval.budget.currency} ${approval.budget.maximum}` : "missing budget", refs);
      pushCheck(checks, errors, `${approval.approval_id} rollback structured and supported`, Boolean(approval.rollback) && hasText(approval.rollback.operation) && approval.rollback.supported === true, approval.rollback ? `${approval.rollback.operation}, supported=${approval.rollback.supported}` : "missing rollback", refs);
      pushCheck(checks, errors, `${approval.approval_id} dangerous operations denied`, approval.denied_operations.some((operation) => /dangerous|billing|secret|deploy|irreversible|production/i.test(operation)), approval.denied_operations.join(", "), refs);
      pushCheck(checks, errors, `${approval.approval_id} preflight only`, approval.production_execution_status === "preflight_approved", `production_execution_status=${approval.production_execution_status}`, refs);
    } else {
      pushCheck(checks, errors, `${approval.approval_id} non-write bridge does not claim approval`, approval.approved_execution_mode !== "bounded_external_write", `approved_execution_mode=${approval.approved_execution_mode}`, refs);
    }
  }

  const publicApprovals = approvals.map(publicApproval);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-execution-approval-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      approval_count: publicApprovals.length,
      approved_count: publicApprovals.filter((approval) => approval.approval_decision === "approved").length,
      pending_count: publicApprovals.filter((approval) => approval.approval_decision === "pending").length,
      blocked_count: publicApprovals.filter((approval) => ["blocked", "rejected"].includes(approval.approval_decision)).length,
      external_write_authorized_count: publicApprovals.filter((approval) => approval.external_write_authorized).length,
      production_executed_count: publicApprovals.filter((approval) => approval.production_execution_status === "executed").length,
      missing_boundary_count: checks.filter((check) => check.status === "fail" && /boundary|ref resolves|approval|provenance|presence|rollback|redaction|stop|budget|credential/i.test(check.name)).length,
      failing_check_count: errors.length
    },
    approvals: publicApprovals,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-execution-approval-audit.schema.json", "provider execution approval audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
