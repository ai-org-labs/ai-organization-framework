import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { pathExists } from "./operator-surface-helpers.js";
import { visibilityExportCommand } from "./visibility-export.js";

function pushCheck(checks, errors, name, condition, detail, evidenceRefs = []) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail, evidence_refs: evidenceRefs.filter(Boolean) });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

function requiredSource(missionControl, sourceId) {
  return (missionControl.evidence_completeness_projection?.required_sources ?? [])
    .find((entry) => entry.source_id === sourceId) ?? null;
}

async function refResolves(projectRoot, ref) {
  if (!ref) {
    return false;
  }
  if (!String(ref).startsWith(".aof/") && !String(ref).startsWith("docs/") && !String(ref).startsWith("schemas/") && !String(ref).startsWith("test/") && !String(ref).startsWith("src/")) {
    return true;
  }
  return pathExists(path.resolve(projectRoot, ref));
}

export async function missionControlProjectionAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const visibilityResult = await visibilityExportCommand({ project: projectRoot });
  const missionControl = visibilityResult.payloads.mission_control;
  const requirementCoverage = missionControl.requirement_coverage_projection;
  const adoptionProof = missionControl.adoption_proof_projection;
  const evidenceCompleteness = missionControl.evidence_completeness_projection;

  pushCheck(
    checks,
    errors,
    "mission control projection schema",
    Boolean(missionControl.view_type === "mission_control"),
    visibilityResult.missionPath,
    [path.relative(projectRoot, visibilityResult.missionPath).replaceAll("\\", "/")]
  );
  pushCheck(
    checks,
    errors,
    "requirement coverage projection present",
    Boolean(requirementCoverage?.present && requirementCoverage.latest_record_ref),
    requirementCoverage?.latest_record_ref ?? "missing requirement coverage projection",
    [requirementCoverage?.latest_record_ref]
  );
  pushCheck(
    checks,
    errors,
    "requirement coverage includes forecast boundary",
    Boolean(requirementCoverage?.forecast && requirementCoverage.forecast_boundary),
    requirementCoverage?.forecast_boundary ?? "missing forecast boundary",
    [requirementCoverage?.latest_record_ref]
  );
  pushCheck(
    checks,
    errors,
    "requirement coverage includes requirement rows",
    Number(requirementCoverage?.total_requirements ?? 0) > 0 && (requirementCoverage?.requirements ?? []).length > 0,
    `${requirementCoverage?.total_requirements ?? 0} requirement(s)`,
    [requirementCoverage?.latest_record_ref]
  );
  pushCheck(
    checks,
    errors,
    "adoption proof projection present",
    Boolean(adoptionProof?.present && adoptionProof.benchmark_ref),
    adoptionProof?.benchmark_ref ?? "missing adoption proof benchmark",
    [adoptionProof?.benchmark_ref]
  );
  pushCheck(
    checks,
    errors,
    "adoption proof benchmark passes",
    adoptionProof?.benchmark_status === "pass",
    `benchmark_status=${adoptionProof?.benchmark_status ?? "missing"}`,
    [adoptionProof?.benchmark_ref]
  );
  pushCheck(
    checks,
    errors,
    "evidence completeness projection ready",
    evidenceCompleteness?.completeness_status === "ready" && (evidenceCompleteness?.missing_sources ?? []).length === 0,
    `status=${evidenceCompleteness?.completeness_status ?? "missing"}, missing=${(evidenceCompleteness?.missing_sources ?? []).join(",")}`,
    [
      evidenceCompleteness?.latest_requirement_coverage_ref,
      evidenceCompleteness?.latest_adoption_proof_ref,
      evidenceCompleteness?.latest_session_ref
    ]
  );
  pushCheck(
    checks,
    errors,
    "mission control states read-only source boundary",
    /read-only projection of canonical AOF artifacts/i.test(String(evidenceCompleteness?.source_of_truth_boundary ?? "")),
    evidenceCompleteness?.source_of_truth_boundary ?? "missing source of truth boundary",
    [path.relative(projectRoot, visibilityResult.missionPath).replaceAll("\\", "/")]
  );

  for (const sourceId of ["requirement-coverage", "adoption-proof", "agent-session", "context-integrity", "release-definition", "archmap-impact"]) {
    const source = requiredSource(missionControl, sourceId);
    pushCheck(
      checks,
      errors,
      `${sourceId} source declared`,
      Boolean(source?.present && source.artifact_ref),
      source?.artifact_ref ?? `missing ${sourceId}`,
      [source?.artifact_ref]
    );
    pushCheck(
      checks,
      errors,
      `${sourceId} source resolves`,
      Boolean(source?.artifact_ref) && await refResolves(projectRoot, source.artifact_ref),
      source?.artifact_ref ?? `missing ${sourceId}`,
      [source?.artifact_ref]
    );
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "mission-control-projection-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    mission_control_ref: path.relative(projectRoot, visibilityResult.missionPath).replaceAll("\\", "/"),
    summary: {
      check_count: checks.length,
      failing_check_count: errors.length,
      required_source_count: evidenceCompleteness?.required_sources?.length ?? 0,
      missing_source_count: evidenceCompleteness?.missing_sources?.length ?? 0
    },
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-mission-control-projection-audit.schema.json", "mission control projection audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
