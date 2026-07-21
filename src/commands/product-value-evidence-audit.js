import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProductValueEvidenceRoot } from "./product-value-evidence-record.js";

const BLOCKING_ACTIONS = new Set(["improve_release_explanation", "reopen_need", "block_release_claim", "escalate_product_review"]);

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

async function refExists(projectRoot, ref) {
  return hasText(ref) && await pathExists(path.resolve(projectRoot, ref));
}

async function loadRecords(projectRoot) {
  const records = [];
  for (const filePath of await listJsonFiles(resolveProductValueEvidenceRoot(projectRoot))) {
    const payload = await readJson(filePath, `product value evidence record ${path.basename(filePath)}`);
    if (payload.artifact_type !== "product-value-evidence-record") {
      continue;
    }
    await validateWithBundledSchema(payload, "aof-product-value-evidence-record.schema.json", "product value evidence record");
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

function publicRecord(record) {
  const payload = record.payload;
  return {
    value_evidence_id: payload.value_evidence_id,
    release_ref: payload.release_ref,
    work_item_id: payload.work_item_id,
    capability_statement: payload.capability_statement,
    before_state: payload.before_state,
    after_state: payload.after_state,
    scenario: payload.scenario,
    five_minute_demo: payload.five_minute_demo,
    understanding_outcome: payload.understanding_outcome,
    governance_action: payload.governance_action,
    artifact_ref: record.artifact_ref
  };
}

export async function productValueEvidenceAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadRecords(projectRoot);

  pushCheck(checks, errors, "product value evidence presence", records.length > 0, `${records.length} record(s) found`, records.map((record) => record.artifact_ref));

  for (const record of records) {
    const payload = record.payload;
    const refs = [record.artifact_ref, payload.release_ref, payload.work_item_ref, payload.mission_control_ref, ...payload.value_evidence_refs];
    pushCheck(checks, errors, `${payload.value_evidence_id} release ref resolves`, await refExists(projectRoot, payload.release_ref), payload.release_ref || "missing release_ref", refs);
    pushCheck(checks, errors, `${payload.value_evidence_id} work item ref resolves`, await refExists(projectRoot, payload.work_item_ref), payload.work_item_ref || "missing work_item_ref", refs);
    pushCheck(checks, errors, `${payload.value_evidence_id} Mission Control ref resolves`, await refExists(projectRoot, payload.mission_control_ref), payload.mission_control_ref || "missing mission_control_ref", refs);
    for (const evidenceRef of payload.value_evidence_refs) {
      pushCheck(checks, errors, `${payload.value_evidence_id} evidence ref resolves`, await refExists(projectRoot, evidenceRef), evidenceRef, refs);
    }
    pushCheck(checks, errors, `${payload.value_evidence_id} capability statement`, hasText(payload.capability_statement), payload.capability_statement || "missing capability_statement", refs);
    pushCheck(checks, errors, `${payload.value_evidence_id} before state`, hasText(payload.before_state), payload.before_state || "missing before_state", refs);
    pushCheck(checks, errors, `${payload.value_evidence_id} after state`, hasText(payload.after_state), payload.after_state || "missing after_state", refs);
    pushCheck(checks, errors, `${payload.value_evidence_id} product scenario`, hasText(payload.scenario), payload.scenario || "missing scenario", refs);
    pushCheck(checks, errors, `${payload.value_evidence_id} five minute demo`, hasText(payload.five_minute_demo), payload.five_minute_demo || "missing five_minute_demo", refs);
    pushCheck(checks, errors, `${payload.value_evidence_id} user benefit`, hasText(payload.time_saved_or_work_reduced) && hasText(payload.cognitive_load_removed), "time_saved_or_work_reduced and cognitive_load_removed must be explicit", refs);
    pushCheck(checks, errors, `${payload.value_evidence_id} capability matrix`, Array.isArray(payload.capability_matrix) && payload.capability_matrix.length > 0, `${payload.capability_matrix?.length ?? 0} row(s)`, refs);
    pushCheck(checks, errors, `${payload.value_evidence_id} not-proven boundary`, hasText(payload.not_proven), payload.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${payload.value_evidence_id} runtime provenance`, hasText(payload.source_task_id) && hasText(payload.source_parent_session_id), `source_task_id=${payload.source_task_id || "missing"}, source_parent_session_id=${payload.source_parent_session_id || "missing"}`, refs);

    const understandingFailed = ["not_understood", "not_checked"].includes(payload.understanding_outcome);
    pushCheck(
      checks,
      errors,
      `${payload.value_evidence_id} missing understanding escalates`,
      !understandingFailed || BLOCKING_ACTIONS.has(payload.governance_action),
      `understanding_outcome=${payload.understanding_outcome}, governance_action=${payload.governance_action}`,
      refs
    );
  }

  const publicRecords = records.map(publicRecord);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "product-value-evidence-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      record_count: publicRecords.length,
      understood_count: publicRecords.filter((record) => record.understanding_outcome === "understood").length,
      not_understood_count: publicRecords.filter((record) => ["not_understood", "not_checked"].includes(record.understanding_outcome)).length,
      blocking_record_count: publicRecords.filter((record) => BLOCKING_ACTIONS.has(record.governance_action)).length,
      capability_row_count: records.reduce((total, record) => total + (record.payload.capability_matrix?.length ?? 0), 0),
      missing_link_count: checks.filter((check) => check.status === "fail" && /ref resolves|evidence ref/i.test(check.name)).length,
      failing_check_count: errors.length
    },
    records: publicRecords,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-product-value-evidence-audit.schema.json", "product value evidence audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
