import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";

const REPRODUCTION_ROOT = [".aof", "artifacts", "operator-reproduction"];

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

export function resolveExternalOperatorReproductionRoot(projectRoot) {
  return path.join(projectRoot, ...REPRODUCTION_ROOT);
}

async function loadReproductionRecords(projectRoot) {
  const root = resolveExternalOperatorReproductionRoot(projectRoot);
  const records = [];
  for (const filePath of await listJsonFiles(root)) {
    const payload = await readJson(filePath, `external operator reproduction ${path.basename(filePath)}`);
    if (payload.artifact_type !== "external-operator-reproduction") {
      continue;
    }
    await validateWithBundledSchema(payload, "aof-external-operator-reproduction-record.schema.json", "external operator reproduction record");
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasText(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

async function checkTaskRef(projectRoot, checks, errors, recordId, taskId, evidenceRefs) {
  const candidateRefs = [
    `.aof/tasks/open/${taskId}.json`,
    `.aof/tasks/done/${taskId}.json`,
    `.aof/tasks/active/${taskId}.json`
  ];
  const resolvedRef = await candidateRefs.reduce(async (previous, ref) => {
    const found = await previous;
    if (found) {
      return found;
    }
    return await pathExists(path.resolve(projectRoot, ref)) ? ref : null;
  }, Promise.resolve(null));
  pushCheck(checks, errors, `${recordId} selected task ref resolves`, Boolean(resolvedRef), resolvedRef || candidateRefs.join(" | "), evidenceRefs);
}

function publicRecord(record) {
  const payload = record.payload;
  return {
    record_id: payload.record_id,
    work_item_id: payload.work_item_id,
    selected_task_id: payload.judgment_to_reproduce.selected_task_id,
    operator_profile_id: payload.operator_profile.profile_id,
    decision: payload.go_no_go_result.decision,
    operator_can_reproduce: payload.go_no_go_result.operator_can_reproduce,
    artifact_ref: record.artifact_ref
  };
}

function allComprehensionChecksPass(payload) {
  return payload.comprehension_checks.every((check) => check.status === "pass");
}

export async function externalOperatorReproductionAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadReproductionRecords(projectRoot);

  pushCheck(checks, errors, "external operator reproduction presence", records.length > 0, `${records.length} record(s) found`, records.map((record) => record.artifact_ref));

  for (const record of records) {
    const payload = record.payload;
    const refs = [record.artifact_ref];
    await checkTaskRef(projectRoot, checks, errors, payload.record_id, payload.judgment_to_reproduce.selected_task_id, refs);
    pushCheck(checks, errors, `${payload.record_id} first-time operator profile`, payload.operator_profile.aof_prior_knowledge !== "experienced", payload.operator_profile.aof_prior_knowledge, refs);
    pushCheck(checks, errors, `${payload.record_id} five minute timebox`, payload.timebox_minutes <= 5, `${payload.timebox_minutes} minute(s)`, refs);
    pushCheck(checks, errors, `${payload.record_id} candidate comparison`, payload.candidate_tasks.length >= 2, `${payload.candidate_tasks.length} candidate(s)`, refs);
    pushCheck(checks, errors, `${payload.record_id} selected task appears in candidates`, payload.candidate_tasks.some((candidate) => candidate.task_id === payload.judgment_to_reproduce.selected_task_id), payload.judgment_to_reproduce.selected_task_id, refs);
    pushCheck(checks, errors, `${payload.record_id} evidence path length`, payload.evidence_path.length >= 3, `${payload.evidence_path.length} evidence step(s)`, refs);
    pushCheck(checks, errors, `${payload.record_id} bounded reproduction steps`, payload.reproduction_steps.length <= 5, `${payload.reproduction_steps.length} step(s)`, refs);
    pushCheck(checks, errors, `${payload.record_id} comprehension checks pass`, allComprehensionChecksPass(payload), `${payload.comprehension_checks.filter((check) => check.status === "pass").length}/${payload.comprehension_checks.length} pass`, refs);
    pushCheck(checks, errors, `${payload.record_id} go/no-go reproducible`, payload.go_no_go_result.operator_can_reproduce === true, String(payload.go_no_go_result.operator_can_reproduce), refs);
    pushCheck(checks, errors, `${payload.record_id} human next action`, hasText(payload.human_next_action), payload.human_next_action || "missing human_next_action", refs);
    pushCheck(checks, errors, `${payload.record_id} not-proven boundary`, hasText(payload.not_proven), payload.not_proven || "missing not_proven", refs);
    for (const step of payload.evidence_path) {
      await checkRef(projectRoot, checks, errors, `${payload.record_id} evidence path ref resolves`, step.artifact_ref, refs);
    }
    for (const candidate of payload.candidate_tasks) {
      for (const ref of candidate.evidence_refs) {
        await checkRef(projectRoot, checks, errors, `${payload.record_id} candidate evidence ref resolves`, ref, refs);
      }
    }
  }

  const publicRecords = records.map(publicRecord);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "external-operator-reproduction-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      record_count: publicRecords.length,
      go_count: publicRecords.filter((record) => record.decision === "go").length,
      reproducible_count: publicRecords.filter((record) => record.operator_can_reproduce).length,
      timebox_pass_count: records.filter((record) => record.payload.timebox_minutes <= 5).length,
      failing_check_count: errors.length
    },
    records: publicRecords,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-external-operator-reproduction-audit.schema.json", "external operator reproduction audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
