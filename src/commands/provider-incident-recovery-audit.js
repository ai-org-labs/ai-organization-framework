import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderIncidentRecoveryRoot } from "./provider-incident-recovery-record.js";

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
  for (const filePath of await listJsonFiles(resolveProviderIncidentRecoveryRoot(projectRoot))) {
    const payload = await readJson(filePath, `provider incident recovery ${path.basename(filePath)}`);
    if (payload.artifact_type !== "provider-incident-recovery-record") {
      continue;
    }
    await validateWithBundledSchema(payload, "aof-provider-incident-recovery-record.schema.json", "provider incident recovery record");
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasText(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function publicRecovery(record) {
  const recovery = record.payload;
  return {
    recovery_id: recovery.recovery_id,
    release_ref: recovery.release_ref,
    work_item_id: recovery.work_item_id,
    severity: recovery.severity,
    rollback_decision: recovery.rollback_decision,
    resume_decision: recovery.resume_decision,
    governance_action: recovery.governance_action,
    recovery_status: recovery.recovery_status,
    artifact_ref: record.artifact_ref
  };
}

export async function providerIncidentRecoveryAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadRecords(projectRoot);

  pushCheck(
    checks,
    errors,
    "provider incident recovery presence",
    records.length > 0,
    `${records.length} recovery record(s) found`,
    records.map((record) => record.artifact_ref)
  );

  for (const record of records) {
    const recovery = record.payload;
    const refs = [
      record.artifact_ref,
      recovery.release_ref,
      recovery.work_item_ref,
      recovery.candidate_ref,
      recovery.approval_ref,
      recovery.reproduction_ref,
      recovery.rollback_ref,
      recovery.outcome_ref,
      recovery.learning_ref,
      recovery.operator_acceptance_ref,
      recovery.production_boundary_ref,
      recovery.learning_update_ref,
      ...recovery.evidence_refs,
      ...recovery.verification_refs
    ].filter(Boolean);

    for (const [name, ref] of [
      ["release ref resolves", recovery.release_ref],
      ["work item ref resolves", recovery.work_item_ref],
      ["candidate ref resolves", recovery.candidate_ref],
      ["approval ref resolves", recovery.approval_ref],
      ["reproduction ref resolves", recovery.reproduction_ref],
      ["rollback ref resolves", recovery.rollback_ref],
      ["outcome ref resolves", recovery.outcome_ref],
      ["learning ref resolves", recovery.learning_ref],
      ["operator acceptance ref resolves", recovery.operator_acceptance_ref],
      ["production boundary ref resolves", recovery.production_boundary_ref],
      ["learning update ref resolves", recovery.learning_update_ref]
    ]) {
      await checkRef(projectRoot, checks, errors, `${recovery.recovery_id} ${name}`, ref, refs);
    }
    for (const ref of recovery.evidence_refs) {
      await checkRef(projectRoot, checks, errors, `${recovery.recovery_id} evidence ref resolves`, ref, refs);
    }
    for (const ref of recovery.verification_refs) {
      await checkRef(projectRoot, checks, errors, `${recovery.recovery_id} verification ref resolves`, ref, refs);
    }

    for (const [name, value] of [
      ["incident scenario", recovery.incident_scenario],
      ["detection signal", recovery.detection_signal],
      ["containment action", recovery.containment_action],
      ["recovery action", recovery.recovery_action],
      ["operator notification", recovery.operator_notification],
      ["time to detect boundary", recovery.time_to_detect_boundary],
      ["time to contain boundary", recovery.time_to_contain_boundary],
      ["data loss boundary", recovery.data_loss_boundary],
      ["customer impact boundary", recovery.customer_impact_boundary],
      ["not-proven boundary", recovery.not_proven]
    ]) {
      pushCheck(checks, errors, `${recovery.recovery_id} ${name}`, hasText(value), value || `missing ${name}`, refs);
    }

    pushCheck(checks, errors, `${recovery.recovery_id} stop conditions`, recovery.stop_conditions.length > 0, recovery.stop_conditions.join(", "), refs);
    pushCheck(checks, errors, `${recovery.recovery_id} evidence`, recovery.evidence_refs.length > 0, recovery.evidence_refs.join(", "), refs);
    pushCheck(checks, errors, `${recovery.recovery_id} verification`, recovery.verification_refs.length > 0, recovery.verification_refs.join(", "), refs);
    pushCheck(checks, errors, `${recovery.recovery_id} runtime provenance`, hasText(recovery.source_task_id) && hasText(recovery.source_parent_session_id), `source_task_id=${recovery.source_task_id || "missing"}, source_parent_session_id=${recovery.source_parent_session_id || "missing"}`, refs);
    pushCheck(checks, errors, `${recovery.recovery_id} resume requires review`, recovery.resume_decision !== "resume_allowed" || recovery.governance_action === "resume_after_review", `resume_decision=${recovery.resume_decision}, governance_action=${recovery.governance_action}`, refs);
    pushCheck(checks, errors, `${recovery.recovery_id} incident does not hide uncertainty`, hasText(recovery.not_proven), recovery.not_proven || "missing not_proven", refs);
  }

  const publicRecoveries = records.map(publicRecovery);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-incident-recovery-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      recovery_count: publicRecoveries.length,
      ready_count: publicRecoveries.filter((recovery) => recovery.recovery_status === "ready_for_drill").length,
      blocked_count: publicRecoveries.filter((recovery) => recovery.recovery_status === "blocked").length,
      resume_allowed_count: publicRecoveries.filter((recovery) => recovery.resume_decision === "resume_allowed").length,
      stop_or_escalate_count: publicRecoveries.filter((recovery) => ["stop_provider_execution", "rollback_then_review", "escalate_to_human"].includes(recovery.governance_action)).length,
      failing_check_count: errors.length
    },
    recoveries: publicRecoveries,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-incident-recovery-audit.schema.json", "provider incident recovery audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
