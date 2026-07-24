import path from "node:path";

import { makeId, nowIso, writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

export function resolveProviderCostQuotaBoundaryRoot(projectRoot) {
  return path.join(projectRoot, ".aof", "artifacts", "provider-cost-quota-boundaries");
}

function safeFileStem(value) {
  return String(value || "provider-cost-quota-boundary")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "provider-cost-quota-boundary";
}

export async function providerCostQuotaBoundaryRecordCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const payload = {
    artifact_type: "provider-cost-quota-boundary-record",
    boundary_id: options.boundaryId || makeId("PCQB"),
    recorded_at: nowIso(),
    release_ref: options.releaseRef,
    work_item_id: options.workItemId,
    work_item_ref: options.workItemRef,
    candidate_ref: options.candidateRef,
    approval_ref: options.approvalRef,
    incident_recovery_ref: options.incidentRecoveryRef,
    provider_scope: options.providerScope,
    budget_owner_ref: options.budgetOwnerRef,
    budget_period: options.budgetPeriod,
    max_estimated_cost: Number(options.maxEstimatedCost),
    max_actual_cost: Number(options.maxActualCost),
    currency: options.currency || "USD",
    max_tokens: Number(options.maxTokens),
    max_provider_calls: Number(options.maxProviderCalls),
    max_retry_count: Number(options.maxRetryCount),
    rate_limit_boundary: options.rateLimitBoundary,
    quota_boundary: options.quotaBoundary,
    billing_boundary: options.billingBoundary,
    overage_policy: options.overagePolicy || "block",
    cost_status: options.costStatus || "not_ready",
    quota_status: options.quotaStatus || "not_ready",
    execution_eligibility: options.executionEligibility || "blocked",
    governance_action: options.governanceAction || "block_provider_execution",
    stop_conditions: options.stopConditions ?? [],
    evidence_refs: options.evidenceRefs ?? [],
    verification_refs: options.verificationRefs ?? [],
    not_proven: options.notProven,
    source_task_id: options.sourceTaskId,
    source_parent_session_id: options.sourceParentSessionId,
    source_decision_record_id: options.sourceDecisionRecordId || null,
    notes: options.notes || null
  };

  await validateWithBundledSchema(
    payload,
    "aof-provider-cost-quota-boundary-record.schema.json",
    "provider cost quota boundary record"
  );
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveProviderCostQuotaBoundaryRoot(projectRoot), `${safeFileStem(payload.boundary_id)}.json`),
    payload
  );

  return { ok: true, projectRoot, artifactPath, payload };
}
