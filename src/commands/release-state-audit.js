import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema } from "../runtime/validation.js";
import { archmapImpactAuditCommand } from "./archmap-impact-audit.js";
import { capabilityFirstReleaseAuditCommand } from "./capability-first-release-audit.js";
import { adoptionProofBenchmarkCommand } from "./adoption-proof-benchmark.js";
import { contextReferenceIntegrityAuditCommand } from "./context-reference-integrity-audit.js";
import { evidenceIndependenceAuditCommand } from "./evidence-independence-audit.js";
import { externalizationReadinessAuditCommand } from "./externalization-readiness-audit.js";
import { externalResourceAuditCommand } from "./external-resource-audit.js";
import { operatorAcceptanceDrillAuditCommand } from "./operator-acceptance-drill-audit.js";
import { operatorValidationAuditCommand } from "./operator-validation-audit.js";
import { pathExists, readJson } from "./operator-surface-helpers.js";
import { productValueEvidenceAuditCommand } from "./product-value-evidence-audit.js";
import { providerAdapterAuditCommand } from "./provider-adapter-audit.js";
import { providerAdapterPilotAuditCommand } from "./provider-adapter-pilot-audit.js";
import { providerControlledExecutionCandidateAuditCommand } from "./provider-controlled-execution-candidate-audit.js";
import { providerExecutionApprovalAuditCommand } from "./provider-execution-approval-audit.js";
import { providerExecutionReproductionAuditCommand } from "./provider-execution-reproduction-audit.js";
import { providerLearningLoopAuditCommand } from "./provider-learning-loop-audit.js";
import { providerOutcomeEvidenceAuditCommand } from "./provider-outcome-evidence-audit.js";
import { providerProductionBoundaryAuditCommand } from "./provider-production-boundary-audit.js";
import { providerRollbackProofAuditCommand } from "./provider-rollback-proof-audit.js";
import { qualityLedgerAuditCommand } from "./quality-ledger-audit.js";
import { loadActiveReleaseManifest } from "./release-state-helpers.js";
import { reviewProvenanceAuditCommand } from "./review-provenance-audit.js";
import { workExecutionPacketAuditCommand } from "./work-execution-packet-audit.js";
import { multiActorPilotAuditCommand } from "./multi-actor-pilot-audit.js";
import { missionControlProjectionAuditCommand } from "./mission-control-projection-audit.js";
import { parallelLaneAuditCommand } from "./parallel-lane-audit.js";
import { requirementCoverageAuditCommand } from "./requirement-coverage-audit.js";
import { sessionExportAuditCommand } from "./session-export-audit.js";
import { workReadinessAuditCommand } from "./work-readiness-audit.js";

const DEFAULT_GOVERNANCE_AUDIT_CUTOFF_TASK_ID = "TASK-071";

function pushCheck(checks, errors, name, condition, detail) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

async function validatePayload(payload, schemaFileName, label) {
  const schema = await loadBundledSchema(schemaFileName);
  validateAgainstSchema(payload, schema, label);
}

function summarizeGovernanceAudit(name, result) {
  return {
    name,
    ok: Boolean(result.ok),
    artifact_type: result.summary?.artifact_type ?? null,
    scoped_task_count: result.summary?.summary?.scoped_task_count ?? result.summary?.summary?.event_count ?? null,
    failing_check_count: result.summary?.summary?.failing_check_count ?? result.summary?.errors?.length ?? 0,
    error_count: result.summary?.errors?.length ?? 0,
    errors: result.summary?.errors ?? []
  };
}

function requiresQualityLedgerAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 6 || (major === 6 && minor >= 8);
}

function requiresWorkReadinessAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 6 || (major === 6 && minor >= 9);
}

function requiresContextReferenceIntegrityAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 7 || (major === 7 && minor >= 1);
}

function requiresWorkExecutionPacketAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 7 || (major === 7 && minor >= 2);
}

function requiresMultiActorPilotAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 7 || (major === 7 && minor >= 3);
}

function requiresParallelLaneAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 7 || (major === 7 && minor >= 4);
}

function requiresRequirementCoverageAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 7 || (major === 7 && minor >= 5);
}

function requiresSessionExportAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 7 || (major === 7 && minor >= 6);
}

function requiresAdoptionProofBenchmark(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 7 || (major === 7 && minor >= 7);
}

function requiresMissionControlProjectionAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 7 || (major === 7 && minor >= 8);
}

function requiresExternalizationReadinessAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 7 || (major === 7 && minor >= 9);
}

function requiresExternalResourceAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major] = match.map(Number);
  return major >= 8;
}

function requiresProviderAdapterAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 8 || (major === 8 && minor >= 1);
}

function requiresProviderAdapterPilotAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 8 || (major === 8 && minor >= 5);
}

function requiresProviderExecutionApprovalAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 8 || (major === 8 && minor >= 6);
}

function requiresProviderExecutionReproductionAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 8 || (major === 8 && minor >= 8);
}

function requiresProviderRollbackProofAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 8 || (major === 8 && minor >= 8);
}

function requiresProviderOutcomeEvidenceAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 8 || (major === 8 && minor >= 9);
}

function requiresProviderLearningLoopAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 8 || (major === 8 && minor >= 9);
}

function requiresOperatorValidationAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 8 || (major === 8 && minor >= 2);
}

function requiresOperatorAcceptanceDrillAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major] = match.map(Number);
  return major >= 9;
}

function requiresProductValueEvidenceAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 9 || (major === 9 && minor >= 1);
}

function requiresProviderProductionBoundaryAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 9 || (major === 9 && minor >= 2);
}

function requiresCapabilityFirstReleaseAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 9 || (major === 9 && minor >= 3);
}

function requiresProviderControlledExecutionCandidateAudit(releaseVersion) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > 9 || (major === 9 && minor >= 4);
}

async function runGovernanceAudits(projectRoot, cutoffTaskId, manifest) {
  const options = { project: projectRoot, cutoffTaskId };
  const auditResults = [
    summarizeGovernanceAudit("archmap-impact-audit", await archmapImpactAuditCommand(options)),
    summarizeGovernanceAudit("review-provenance-audit", await reviewProvenanceAuditCommand(options)),
    summarizeGovernanceAudit("evidence-independence-audit", await evidenceIndependenceAuditCommand(options))
  ];
  if (requiresQualityLedgerAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("quality-ledger-audit", await qualityLedgerAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresWorkReadinessAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("work-readiness-audit", await workReadinessAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresContextReferenceIntegrityAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("context-reference-integrity-audit", await contextReferenceIntegrityAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresWorkExecutionPacketAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("work-execution-packet-audit", await workExecutionPacketAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresMultiActorPilotAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("multi-actor-pilot-audit", await multiActorPilotAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresParallelLaneAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("parallel-lane-audit", await parallelLaneAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresRequirementCoverageAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("requirement-coverage-audit", await requirementCoverageAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresSessionExportAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("session-export-audit", await sessionExportAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresAdoptionProofBenchmark(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("adoption-proof-benchmark", await adoptionProofBenchmarkCommand({ project: projectRoot }))
    );
  }
  if (requiresMissionControlProjectionAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("mission-control-projection-audit", await missionControlProjectionAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresExternalizationReadinessAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("externalization-readiness-audit", await externalizationReadinessAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresExternalResourceAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("external-resource-audit", await externalResourceAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresProviderAdapterAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("provider-adapter-audit", await providerAdapterAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresProviderAdapterPilotAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("provider-adapter-pilot-audit", await providerAdapterPilotAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresProviderExecutionApprovalAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("provider-execution-approval-audit", await providerExecutionApprovalAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresProviderExecutionReproductionAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("provider-execution-reproduction-audit", await providerExecutionReproductionAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresProviderRollbackProofAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("provider-rollback-proof-audit", await providerRollbackProofAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresProviderOutcomeEvidenceAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("provider-outcome-evidence-audit", await providerOutcomeEvidenceAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresProviderLearningLoopAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("provider-learning-loop-audit", await providerLearningLoopAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresOperatorAcceptanceDrillAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("operator-acceptance-drill-audit", await operatorAcceptanceDrillAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresProductValueEvidenceAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("product-value-evidence-audit", await productValueEvidenceAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresProviderProductionBoundaryAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("provider-production-boundary-audit", await providerProductionBoundaryAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresCapabilityFirstReleaseAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("capability-first-release-audit", await capabilityFirstReleaseAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresProviderControlledExecutionCandidateAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("provider-controlled-execution-candidate-audit", await providerControlledExecutionCandidateAuditCommand({ project: projectRoot }))
    );
  }
  if (requiresOperatorValidationAudit(manifest?.release_version)) {
    auditResults.push(
      summarizeGovernanceAudit("operator-validation-audit", await operatorValidationAuditCommand({ project: projectRoot }))
    );
  }
  return auditResults;
}

export async function releaseStateAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const governanceAuditCutoffTaskId = options.cutoffTaskId || DEFAULT_GOVERNANCE_AUDIT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const manifestRecord = await loadActiveReleaseManifest(projectRoot);

  if (!manifestRecord) {
    pushCheck(checks, errors, "active release manifest presence", false, "no active release manifest was found");
  }

  const bootstrapPath = path.join(projectRoot, ".aof", "project-bootstrap.json");
  const organizationPath = path.join(projectRoot, ".aof", "organization.json");
  const bootstrap = await readJson(bootstrapPath, "project bootstrap");
  const organization = await readJson(organizationPath, "organization");
  await validatePayload(bootstrap, "aof-project-bootstrap.schema.json", "project bootstrap");
  await validatePayload(organization, "aof-organization.schema.json", "organization");

  const manifest = manifestRecord?.manifest ?? null;
  const releaseContract = (organization.contracts ?? []).find((contract) => contract.contract_id === "contract-governance-to-release");

  if (manifest) {
    for (const [name, ref] of [
      ["release definition ref", manifest.release_definition_ref],
      ["release notes ref", manifest.release_notes_ref],
      ["release checklist ref", manifest.release_checklist_ref],
      ["roadmap ref", manifest.roadmap_ref],
      ["release plan ref", manifest.release_plan_ref]
    ]) {
      pushCheck(checks, errors, name, await pathExists(path.resolve(projectRoot, ref)), `${ref}${await pathExists(path.resolve(projectRoot, ref)) ? "" : " does not exist"}`);
    }

    pushCheck(
      checks,
      errors,
      "bootstrap version alignment",
      bootstrap.aof_version === manifest.release_version,
      `bootstrap.aof_version=${bootstrap.aof_version}, manifest.release_version=${manifest.release_version}`
    );

    pushCheck(
      checks,
      errors,
      "governance release contract alignment",
      releaseContract?.artifact_ref === manifest.release_definition_ref,
      `contract-governance-to-release artifact_ref=${releaseContract?.artifact_ref ?? "missing"}, manifest.release_definition_ref=${manifest.release_definition_ref}`
    );
  } else {
    pushCheck(checks, errors, "bootstrap version alignment", false, "cannot evaluate without an active release manifest");
    pushCheck(checks, errors, "governance release contract alignment", false, "cannot evaluate without an active release manifest");
  }

  const governanceAudits = await runGovernanceAudits(projectRoot, governanceAuditCutoffTaskId, manifest);
  for (const audit of governanceAudits) {
    pushCheck(
      checks,
      errors,
      `${audit.name} release gate`,
      audit.ok,
      audit.ok
        ? `${audit.scoped_task_count ?? 0} scoped task(s), ${audit.failing_check_count} failing check(s)`
        : `${audit.error_count} error(s): ${audit.errors.slice(0, 3).join("; ")}`
    );
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "release-state-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    active_release: manifest,
    governance_audit_cutoff_task_id: governanceAuditCutoffTaskId,
    governance_audits: governanceAudits,
    checks,
    errors
  };

  await validatePayload(payload, "aof-release-state-audit.schema.json", "release state audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
