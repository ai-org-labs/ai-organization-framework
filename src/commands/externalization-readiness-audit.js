import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveExternalReferenceIntegrityRoot } from "./external-reference-integrity-record.js";

const READY_STATUSES = new Set(["ready", "accepted_residual_risk"]);
const BLOCKED_STATUSES = new Set(["blocked", "warning"]);

function normalizeRef(ref) {
  return String(ref ?? "").replaceAll("\\", "/");
}

function pushCheck(checks, errors, name, condition, detail, evidenceRefs = []) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail, evidence_refs: evidenceRefs.filter(Boolean) });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

async function loadExternalReferenceClaims(projectRoot) {
  const claims = [];
  for (const filePath of await listJsonFiles(resolveExternalReferenceIntegrityRoot(projectRoot))) {
    const payload = await readJson(filePath, `external reference integrity ${path.basename(filePath)}`);
    claims.push({
      claim_id: payload.record_id ?? payload.external_ref ?? path.basename(filePath, ".json"),
      claim_type: "external-reference",
      artifact_ref: normalizeRef(path.relative(projectRoot, filePath)),
      readiness_status: payload.integrity_status ?? "blocked",
      source_of_truth: payload.source_of_truth ?? "",
      permission_boundary: payload.sync_policy ?? "",
      freshness_boundary: payload.freshness_required
        ? `freshness_required:${payload.freshness_status ?? "unknown"}`
        : `freshness_not_required:${payload.freshness_status ?? "not_required"}`,
      availability_boundary: payload.availability_status ?? "",
      approval_boundary: payload.relationship ?? "",
      not_proven: payload.not_proven ?? "",
      external_ref_artifact_ref: payload.external_ref_artifact_ref ?? "",
      source_task_id: payload.source_task_id ?? "",
      source_parent_session_id: payload.source_parent_session_id ?? ""
    });
  }
  return claims.sort((left, right) => left.claim_id.localeCompare(right.claim_id));
}

function publicClaim(claim) {
  return {
    claim_id: claim.claim_id,
    claim_type: claim.claim_type,
    artifact_ref: claim.artifact_ref,
    readiness_status: claim.readiness_status,
    source_of_truth: claim.source_of_truth,
    permission_boundary: claim.permission_boundary,
    freshness_boundary: claim.freshness_boundary,
    availability_boundary: claim.availability_boundary,
    approval_boundary: claim.approval_boundary,
    not_proven: claim.not_proven
  };
}

function hasBoundary(value) {
  return Boolean(String(value ?? "").trim());
}

export async function externalizationReadinessAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const claims = await loadExternalReferenceClaims(projectRoot);

  pushCheck(
    checks,
    errors,
    "externalization claim presence",
    claims.length > 0,
    `${claims.length} claim(s) found`,
    claims.map((claim) => claim.artifact_ref)
  );

  for (const claim of claims) {
    const evidenceRefs = [claim.artifact_ref];
    pushCheck(checks, errors, `${claim.claim_id} source artifact resolves`, await pathExists(path.resolve(projectRoot, claim.artifact_ref)), claim.artifact_ref, evidenceRefs);
    pushCheck(checks, errors, `${claim.claim_id} external source ref resolves`, await pathExists(path.resolve(projectRoot, claim.external_ref_artifact_ref)), claim.external_ref_artifact_ref || "missing external_ref_artifact_ref", evidenceRefs);
    pushCheck(checks, errors, `${claim.claim_id} source-of-truth boundary`, hasBoundary(claim.source_of_truth), claim.source_of_truth || "missing source_of_truth", evidenceRefs);
    pushCheck(checks, errors, `${claim.claim_id} permission boundary`, hasBoundary(claim.permission_boundary), claim.permission_boundary || "missing permission/sync policy", evidenceRefs);
    pushCheck(checks, errors, `${claim.claim_id} freshness boundary`, hasBoundary(claim.freshness_boundary) && !/unknown|stale/i.test(claim.freshness_boundary), claim.freshness_boundary || "missing freshness boundary", evidenceRefs);
    pushCheck(checks, errors, `${claim.claim_id} availability boundary`, hasBoundary(claim.availability_boundary) && claim.availability_boundary !== "not_checked" && claim.availability_boundary !== "unavailable", claim.availability_boundary || "missing availability boundary", evidenceRefs);
    pushCheck(checks, errors, `${claim.claim_id} approval boundary`, hasBoundary(claim.approval_boundary), claim.approval_boundary || "missing approval/relationship boundary", evidenceRefs);
    pushCheck(checks, errors, `${claim.claim_id} not-proven boundary`, hasBoundary(claim.not_proven), claim.not_proven || "missing not_proven boundary", evidenceRefs);
    pushCheck(checks, errors, `${claim.claim_id} readiness status`, READY_STATUSES.has(claim.readiness_status), `readiness_status=${claim.readiness_status}`, evidenceRefs);
    pushCheck(checks, errors, `${claim.claim_id} runtime provenance`, hasBoundary(claim.source_task_id) && hasBoundary(claim.source_parent_session_id), `source_task_id=${claim.source_task_id || "missing"}, source_parent_session_id=${claim.source_parent_session_id || "missing"}`, evidenceRefs);
  }

  const missingBoundaryCount = checks.filter((check) => check.status === "fail" && /boundary|resolves|provenance|presence/i.test(check.name)).length;
  const publicClaims = claims.map(publicClaim);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "externalization-readiness-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      externalization_claim_count: publicClaims.length,
      ready_claim_count: publicClaims.filter((claim) => READY_STATUSES.has(claim.readiness_status)).length,
      blocked_claim_count: publicClaims.filter((claim) => BLOCKED_STATUSES.has(claim.readiness_status)).length,
      missing_boundary_count: missingBoundaryCount,
      failing_check_count: errors.length
    },
    externalization_claims: publicClaims,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-externalization-readiness-audit.schema.json", "externalization readiness audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
