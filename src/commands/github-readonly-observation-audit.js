import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";

const OBSERVATION_ROOT = [".aof", "artifacts", "provider-observations"];
const WRITE_WORDS = /\b(write|push|create|delete|deploy|publish|secret|billing|external write|issue creation|pull request creation|release mutation|workflow mutation)\b/i;

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

export function resolveGitHubReadonlyObservationRoot(projectRoot) {
  return path.join(projectRoot, ...OBSERVATION_ROOT);
}

async function loadObservationRecords(projectRoot) {
  const root = resolveGitHubReadonlyObservationRoot(projectRoot);
  const records = [];
  for (const filePath of await listJsonFiles(root)) {
    const payload = await readJson(filePath, `github read-only observation ${path.basename(filePath)}`);
    if (payload.artifact_type !== "github-readonly-observation") {
      continue;
    }
    await validateWithBundledSchema(payload, "aof-github-readonly-observation-record.schema.json", "github read-only observation record");
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
  pushCheck(
    checks,
    errors,
    `${recordId} selected task ref resolves`,
    Boolean(resolvedRef),
    resolvedRef || candidateRefs.join(" | "),
    evidenceRefs
  );
}

function publicObservation(record) {
  const payload = record.payload;
  return {
    record_id: payload.record_id,
    work_item_id: payload.work_item_id,
    repository: payload.repository,
    selected_task_id: payload.selected_task.task_id,
    go_no_go: payload.selected_task.go_no_go,
    artifact_ref: record.artifact_ref
  };
}

function includesWriteAuthority(payload) {
  const allowed = payload.permission_boundary?.allowed ?? [];
  return allowed.some((entry) => WRITE_WORDS.test(String(entry)));
}

function deniesWriteAuthority(payload) {
  const denied = (payload.permission_boundary?.not_authorized ?? []).join(" ");
  return /issue creation/i.test(denied)
    && /pull request creation/i.test(denied)
    && /push/i.test(denied)
    && /secret/i.test(denied)
    && /external write/i.test(denied);
}

export async function githubReadonlyObservationAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const records = await loadObservationRecords(projectRoot);

  pushCheck(checks, errors, "github read-only observation presence", records.length > 0, `${records.length} observation(s) found`, records.map((record) => record.artifact_ref));

  for (const record of records) {
    const payload = record.payload;
    const refs = [record.artifact_ref];
    await checkTaskRef(projectRoot, checks, errors, payload.record_id, payload.selected_task.task_id, refs);
    pushCheck(checks, errors, `${payload.record_id} permission mode`, payload.permission_boundary.mode === "read_only", `mode=${payload.permission_boundary.mode}`, refs);
    pushCheck(checks, errors, `${payload.record_id} no allowed write authority`, !includesWriteAuthority(payload), (payload.permission_boundary.allowed ?? []).join(", "), refs);
    pushCheck(checks, errors, `${payload.record_id} denied write authority`, deniesWriteAuthority(payload), (payload.permission_boundary.not_authorized ?? []).join(", "), refs);
    pushCheck(checks, errors, `${payload.record_id} candidate task count`, payload.candidate_tasks.length >= 1, `${payload.candidate_tasks.length} candidate(s)`, refs);
    pushCheck(checks, errors, `${payload.record_id} selected task is candidate-aligned`, payload.candidate_tasks.some((candidate) => payload.selected_task.title_ja.includes(candidate.label_ja.slice(0, 8)) || candidate.label_ja.includes("GitHub")), payload.selected_task.title_ja, refs);
    pushCheck(checks, errors, `${payload.record_id} human next action`, hasText(payload.human_next_action), payload.human_next_action || "missing human_next_action", refs);
    pushCheck(checks, errors, `${payload.record_id} not-proven boundary`, hasText(payload.not_proven), payload.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${payload.record_id} latest actions observed`, Array.isArray(payload.observations.latest_actions) && payload.observations.latest_actions.length > 0, `${payload.observations.latest_actions?.length ?? 0} action run(s)`, refs);
    for (const candidate of payload.candidate_tasks) {
      for (const ref of candidate.evidence_refs) {
        await checkRef(projectRoot, checks, errors, `${payload.record_id} candidate evidence ref resolves`, ref, refs);
      }
    }
  }

  const observations = records.map(publicObservation);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "github-readonly-observation-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      observation_count: observations.length,
      ready_observation_count: observations.filter((observation) => observation.go_no_go === "go").length,
      selected_task_count: new Set(observations.map((observation) => observation.selected_task_id)).size,
      external_write_authorized_count: records.filter((record) => includesWriteAuthority(record.payload)).length,
      failing_check_count: errors.length
    },
    observations,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-github-readonly-observation-audit.schema.json", "github read-only observation audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
