import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveOperatorAcceptanceDrillRoot } from "./operator-acceptance-drill-record.js";
import { resolveProviderExecutionApprovalRoot } from "./provider-execution-approval-record.js";
import { resolveProviderExecutionReproductionRoot } from "./provider-execution-reproduction-record.js";
import { resolveProviderLearningLoopRoot } from "./provider-learning-loop-record.js";
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

function publicDrill(record) {
  const drill = record.payload;
  return {
    drill_id: drill.drill_id,
    operator_ref: drill.operator_ref,
    work_item_id: drill.work_item_id,
    decision: drill.decision,
    artifact_ref: record.artifact_ref
  };
}

export async function operatorAcceptanceDrillAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const drills = await loadRecords(projectRoot, resolveOperatorAcceptanceDrillRoot(projectRoot), "aof-operator-acceptance-drill-record.schema.json", "operator acceptance drill record", "operator-acceptance-drill-record");
  const approvals = await loadRecords(projectRoot, resolveProviderExecutionApprovalRoot(projectRoot), "aof-provider-execution-approval-record.schema.json", "provider execution approval record", "provider-execution-approval-record");
  const reproductions = await loadRecords(projectRoot, resolveProviderExecutionReproductionRoot(projectRoot), "aof-provider-execution-reproduction-record.schema.json", "provider execution reproduction record", "provider-execution-reproduction-record");
  const rollbacks = await loadRecords(projectRoot, resolveProviderRollbackProofRoot(projectRoot), "aof-provider-rollback-proof-record.schema.json", "provider rollback proof record", "provider-rollback-proof-record");
  const outcomes = await loadRecords(projectRoot, resolveProviderOutcomeEvidenceRoot(projectRoot), "aof-provider-outcome-evidence-record.schema.json", "provider outcome evidence record", "provider-outcome-evidence-record");
  const learningUpdates = await loadRecords(projectRoot, resolveProviderLearningLoopRoot(projectRoot), "aof-provider-learning-loop-record.schema.json", "provider learning loop record", "provider-learning-loop-record");
  const approvalsByRef = new Map(approvals.map((record) => [record.artifact_ref, record.payload]));
  const reproductionsByRef = new Map(reproductions.map((record) => [record.artifact_ref, record.payload]));
  const rollbacksByRef = new Map(rollbacks.map((record) => [record.artifact_ref, record.payload]));
  const outcomesByRef = new Map(outcomes.map((record) => [record.artifact_ref, record.payload]));
  const learningByRef = new Map(learningUpdates.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "operator acceptance drill presence", drills.length > 0, `${drills.length} operator acceptance drill record(s) found`, drills.map((record) => record.artifact_ref));

  for (const record of drills) {
    const drill = record.payload;
    const refs = [
      record.artifact_ref,
      drill.approval_ref,
      drill.reproduction_ref,
      drill.rollback_ref,
      drill.outcome_ref,
      drill.learning_ref,
      drill.mission_control_ref,
      ...drill.evidence_refs
    ].filter(Boolean);
    await checkRef(projectRoot, checks, errors, `${drill.drill_id} approval ref resolves`, drill.approval_ref, refs);
    await checkRef(projectRoot, checks, errors, `${drill.drill_id} reproduction ref resolves`, drill.reproduction_ref, refs);
    await checkRef(projectRoot, checks, errors, `${drill.drill_id} rollback ref resolves`, drill.rollback_ref, refs);
    await checkRef(projectRoot, checks, errors, `${drill.drill_id} outcome ref resolves`, drill.outcome_ref, refs);
    await checkRef(projectRoot, checks, errors, `${drill.drill_id} learning ref resolves`, drill.learning_ref, refs);
    await checkRef(projectRoot, checks, errors, `${drill.drill_id} mission control ref resolves`, drill.mission_control_ref, refs);
    for (const ref of drill.evidence_refs) {
      await checkRef(projectRoot, checks, errors, `${drill.drill_id} evidence ref resolves`, ref, refs);
    }

    const approval = approvalsByRef.get(normalizeRef(drill.approval_ref));
    const reproduction = reproductionsByRef.get(normalizeRef(drill.reproduction_ref));
    const rollback = rollbacksByRef.get(normalizeRef(drill.rollback_ref));
    const outcome = outcomesByRef.get(normalizeRef(drill.outcome_ref));
    const learning = learningByRef.get(normalizeRef(drill.learning_ref));
    pushCheck(checks, errors, `${drill.drill_id} linked approval exists`, Boolean(approval), drill.approval_ref || "missing approval_ref", refs);
    pushCheck(checks, errors, `${drill.drill_id} linked reproduction exists`, Boolean(reproduction), drill.reproduction_ref || "missing reproduction_ref", refs);
    pushCheck(checks, errors, `${drill.drill_id} linked rollback exists`, Boolean(rollback), drill.rollback_ref || "missing rollback_ref", refs);
    pushCheck(checks, errors, `${drill.drill_id} linked outcome exists`, Boolean(outcome), drill.outcome_ref || "missing outcome_ref", refs);
    pushCheck(checks, errors, `${drill.drill_id} linked learning exists`, Boolean(learning), drill.learning_ref || "missing learning_ref", refs);
    pushCheck(checks, errors, `${drill.drill_id} approval is not rejected`, Boolean(approval) && approval.approval_decision !== "rejected", approval ? `approval_decision=${approval.approval_decision}` : "missing approval", refs);
    pushCheck(checks, errors, `${drill.drill_id} reproduction is reproduced`, Boolean(reproduction) && reproduction.result_status === "reproduced", reproduction ? `result_status=${reproduction.result_status}` : "missing reproduction", refs);
    pushCheck(checks, errors, `${drill.drill_id} rollback readiness is explicit`, Boolean(rollback) && rollback.result_status !== "blocked", rollback ? `result_status=${rollback.result_status}` : "missing rollback", refs);
    pushCheck(checks, errors, `${drill.drill_id} outcome is not blocked`, Boolean(outcome) && outcome.outcome_status !== "blocked", outcome ? `outcome_status=${outcome.outcome_status}` : "missing outcome", refs);
    pushCheck(checks, errors, `${drill.drill_id} learning is not blocked`, Boolean(learning) && learning.update_status !== "blocked", learning ? `update_status=${learning.update_status}` : "missing learning", refs);
    pushCheck(checks, errors, `${drill.drill_id} decision rationale`, hasText(drill.decision_rationale), drill.decision_rationale || "missing decision_rationale", refs);
    pushCheck(checks, errors, `${drill.drill_id} accepted risk`, hasText(drill.accepted_risk), drill.accepted_risk || "missing accepted_risk", refs);
    pushCheck(checks, errors, `${drill.drill_id} blocker summary`, hasText(drill.blocker_summary), drill.blocker_summary || "missing blocker_summary", refs);
    pushCheck(checks, errors, `${drill.drill_id} safety boundary`, hasText(drill.safety_boundary), drill.safety_boundary || "missing safety_boundary", refs);
    pushCheck(checks, errors, `${drill.drill_id} not-proven boundary`, hasText(drill.not_proven), drill.not_proven || "missing not_proven", refs);
  }

  const publicDrills = drills.map(publicDrill);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "operator-acceptance-drill-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      drill_count: publicDrills.length,
      accept_count: publicDrills.filter((entry) => entry.decision === "accept").length,
      stop_count: publicDrills.filter((entry) => entry.decision === "stop").length,
      rollback_count: publicDrills.filter((entry) => entry.decision === "rollback").length,
      escalate_count: publicDrills.filter((entry) => entry.decision === "escalate").length,
      defer_count: publicDrills.filter((entry) => entry.decision === "defer").length,
      missing_boundary_count: checks.filter((check) => check.status === "fail" && /boundary|ref resolves|presence|exists|reproduced|readiness|blocked|rationale|risk|summary/i.test(check.name)).length,
      failing_check_count: errors.length
    },
    drills: publicDrills,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-operator-acceptance-drill-audit.schema.json", "operator acceptance drill audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
