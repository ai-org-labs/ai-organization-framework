import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { actorAssignmentEvaluationRecordCommand } from "../src/commands/actor-assignment-evaluation-record.js";
import { actorExecutionGateRecordCommand } from "../src/commands/actor-execution-gate-record.js";
import { agentSessionRecordCommand } from "../src/commands/agent-session-record.js";
import { actorSkillPacketRecordCommand } from "../src/commands/actor-skill-packet-record.js";
import { answerCommand } from "../src/commands/answer.js";
import { alternativeAnalysisRecordCommand } from "../src/commands/alternative-analysis-record.js";
import { anomalyLogRecordCommand } from "../src/commands/anomaly-log-record.js";
import { archmapImpactAuditCommand } from "../src/commands/archmap-impact-audit.js";
import { assumptionMapRecordCommand } from "../src/commands/assumption-map-record.js";
import { commandRegisterCommand } from "../src/commands/command-register.js";
import { commandRegistryRefreshCommand } from "../src/commands/command-registry-refresh.js";
import { commandRoutingAuditCommand } from "../src/commands/command-routing-audit.js";
import { confirmationWindowRecordCommand } from "../src/commands/confirmation-window-record.js";
import { contextIntegrityRecordCommand } from "../src/commands/context-integrity-record.js";
import { contextReferenceIntegrityAuditCommand } from "../src/commands/context-reference-integrity-audit.js";
import { councilReviewPacketCommand } from "../src/commands/council-review-packet.js";
import { decisionRegisterCommand } from "../src/commands/decision-register.js";
import { discoveryHandoffBenchmarkCommand } from "../src/commands/discovery-handoff-benchmark.js";
import { discoveryJudgmentPacketCommand } from "../src/commands/discovery-judgment-packet.js";
import { discoveryHandoffRecordCommand } from "../src/commands/discovery-handoff-record.js";
import { discoveryQuestionSetRecordCommand } from "../src/commands/discovery-question-set-record.js";
import { evidenceIndependenceAuditCommand } from "../src/commands/evidence-independence-audit.js";
import { executionLineageCommand } from "../src/commands/execution-lineage.js";
import { externalReferenceIntegrityRecordCommand } from "../src/commands/external-reference-integrity-record.js";
import { externalResourceAuditCommand } from "../src/commands/external-resource-audit.js";
import { externalResourceUseRecordCommand } from "../src/commands/external-resource-use-record.js";
import { externalRuntimeResourceRecordCommand } from "../src/commands/external-runtime-resource-record.js";
import { initProjectCommand } from "../src/commands/init-project.js";
import { learningLoopSnapshotCommand } from "../src/commands/learning-loop-snapshot.js";
import { missionControlBenchmarkCommand } from "../src/commands/mission-control-benchmark.js";
import { missionControlCommand, visibilitySessionCommand } from "../src/commands/visibility-session.js";
import { multiActorPilotAuditCommand } from "../src/commands/multi-actor-pilot-audit.js";
import { multiActorPilotRecordCommand } from "../src/commands/multi-actor-pilot-record.js";
import { parallelLaneAuditCommand } from "../src/commands/parallel-lane-audit.js";
import { parallelLaneRecordCommand } from "../src/commands/parallel-lane-record.js";
import { providerAdapterAuditCommand } from "../src/commands/provider-adapter-audit.js";
import { providerAdapterRecordCommand } from "../src/commands/provider-adapter-record.js";
import { requirementCoverageAuditCommand } from "../src/commands/requirement-coverage-audit.js";
import { requirementCoverageRecordCommand } from "../src/commands/requirement-coverage-record.js";
import { sessionExportAuditCommand } from "../src/commands/session-export-audit.js";
import { sessionExportRecordCommand } from "../src/commands/session-export-record.js";
import { operatorBriefCommand } from "../src/commands/operator-brief.js";
import { contractRegisterCommand } from "../src/commands/contract-register.js";
import { dependencyGraphCommand } from "../src/commands/dependency-graph.js";
import { organizationAuditCommand } from "../src/commands/organization-audit.js";
import { organizationStatusCommand } from "../src/commands/organization-status.js";
import { organizationAnalyticsSnapshotCommand } from "../src/commands/organization-analytics-snapshot.js";
import { outcomeReportCommand } from "../src/commands/outcome-report.js";
import { policyEvaluationReportCommand } from "../src/commands/policy-evaluation-report.js";
import { problemStatementRecordCommand } from "../src/commands/problem-statement-record.js";
import { qualityLedgerAuditCommand } from "../src/commands/quality-ledger-audit.js";
import { qualityLedgerRecordCommand } from "../src/commands/quality-ledger-record.js";
import { releaseStateAuditCommand } from "../src/commands/release-state-audit.js";
import { reviewProvenanceAuditCommand } from "../src/commands/review-provenance-audit.js";
import { resourceClaimRecordCommand } from "../src/commands/resource-claim-record.js";
import { releaseStateRefreshCommand } from "../src/commands/release-state-refresh.js";
import { roleJoinRecordCommand } from "../src/commands/role-join-record.js";
import { roadmapStatusCommand } from "../src/commands/roadmap-status.js";
import { runtimeDisciplineBenchmarkCommand } from "../src/commands/runtime-discipline-benchmark.js";
import { runtimeLoopProofCommand } from "../src/commands/runtime-loop-proof.js";
import { roleResultRecordCommand } from "../src/commands/role-result-record.js";
import { runCommand } from "../src/commands/run.js";
import { selfAuditRecordCommand } from "../src/commands/self-audit-record.js";
import { sessionObservabilityAuditCommand } from "../src/commands/session-observability-audit.js";
import { skillfulActorBenchmarkCommand } from "../src/commands/skillful-actor-benchmark.js";
import { skillfulActorHriProjectionCommand } from "../src/commands/skillful-actor-hri-projection.js";
import { taskOpenCommand } from "../src/commands/task-open.js";
import { taskUpdateCommand } from "../src/commands/task-update.js";
import { teamOutputRecordCommand } from "../src/commands/team-output-record.js";
import { needValidationRecordCommand } from "../src/commands/need-validation-record.js";
import { valueHypothesisRecordCommand } from "../src/commands/value-hypothesis-record.js";
import { buildVisibilityPageHtml, loadVisibilityViews, readProjectTextRef } from "../src/commands/visibility-serve.js";
import { visibilityExportCommand } from "../src/commands/visibility-export.js";
import { workExecutionPacketAuditCommand } from "../src/commands/work-execution-packet-audit.js";
import { workExecutionPacketRecordCommand } from "../src/commands/work-execution-packet-record.js";
import { workReadinessAuditCommand } from "../src/commands/work-readiness-audit.js";
import { workReadinessRecordCommand } from "../src/commands/work-readiness-record.js";
import { deriveInitialClarification } from "../src/runtime/clarification.js";
import { loadSession } from "../src/runtime/session.js";
import { loadTemplate } from "../src/runtime/template-loader.js";
import { validateWithBundledSchema } from "../src/runtime/validation.js";
import { repoRoot, genericExampleProjectRoot, createTempProject, createTempProjectFrom, createTempProjectWithDecisions, createInitializedProject, createInitializedProjectWithDocsDecision, ensureReleaseRefFixtures, ensureReleaseContractFixture, advanceSessionToPlanning, writeVisibilityFixture } from "./runtime-test-helpers.js";

test("actor skill packet schema defines the v5.0 contract surface", async () => {
  const payload = {
    packet_type: "actor-skill-packet",
    packet_format_version: 1,
    recorded_at: "2026-06-20T10:00:00.000Z",
    packet_id: "ASP-TASK-049-BUILDER",
    source_task_id: "TASK-049",
    source_parent_session_id: "SESS-MQM6-V50-SKILLFUL-ACTOR",
    source_decision_record_id: null,
    objective: "Define the v5.0 actor skill packet contract.",
    assignment: {
      actor_ref: "codex",
      role_ref: "builder",
      team_ref: "runtime-team",
      assignment_reason: "Builder owns runtime artifact contract implementation.",
      execution_mode: "single-actor"
    },
    required_skill_refs: ["skill-schema-review"],
    capability_fit: [{
      capability_ref: "cap-schema-review",
      fit_state: "sufficient",
      evidence_refs: ["schemas/aof-actor-skill-packet.schema.json"],
      rationale: "The task is contract-first and schema-centered."
    }],
    resource_refs: ["resource-repo-main"],
    policy_refs: ["policy-runtime-backed-answer-discipline"],
    expected_output_contract: {
      artifact_type: "actor-skill-packet-contract",
      artifact_schema_ref: "schemas/aof-actor-skill-packet.schema.json",
      required_sections: ["assignment", "capability_fit", "expected_output_contract", "review_criteria"],
      acceptance_criteria: ["Schema validates", "HRI projection fields are present"]
    },
    review_criteria: [{
      criterion: "Packet has enough evidence to explain actor selection.",
      evaluator_ref: "guardian",
      evidence_required: "skill, capability, resource, policy, and output contract refs",
      blocking: true
    }],
    blocker_semantics: [{
      blocker_code: "missing-skill-evidence",
      trigger_condition: "required_skill_refs is empty or capability evidence is missing",
      consequence: "block-assignment",
      recovery_action: "Add skill and capability evidence before assignment."
    }],
    hri_projection: {
      character_label: "Builder",
      speech_bubble: "I have the schema contract and can start the writer after review.",
      current_action: "Define actor skill packet contract",
      confidence_label: "medium",
      visible_blockers: [],
      next_action: "Submit contract for Guardian review"
    },
    status: "draft"
  };

  await validateWithBundledSchema(payload, "aof-actor-skill-packet.schema.json", "actor skill packet");

  await assert.rejects(
    validateWithBundledSchema({ ...payload, unexpected_field: true }, "aof-actor-skill-packet.schema.json", "actor skill packet"),
    /unexpected_field is not allowed/
  );

  const missingSkillRefs = { ...payload };
  delete missingSkillRefs.required_skill_refs;
  await assert.rejects(
    validateWithBundledSchema(missingSkillRefs, "aof-actor-skill-packet.schema.json", "actor skill packet"),
    /missing required key 'required_skill_refs'/
  );
});

test("quality ledger event schema defines append-only quality evidence without semantic truth claims", async () => {
  const payload = {
    artifact_type: "quality-ledger-event",
    ledger_format_version: 1,
    event_id: "QLE-TASK-078-UNIT",
    recorded_at: "2026-07-03T20:05:00.000Z",
    event_type: "claim_contradicted",
    quality_intent_ref: "QIN-AOF-RUNTIME",
    work_item_ref: "TASK-078",
    claim: "A release claim was contradicted by missing runtime evidence.",
    evidence_refs: ["test/runtime-core-2.test.js"],
    qif_refs: ["docs/aof-qif-quality-definition.md"],
    prior_state: "release claim accepted from maker evidence",
    new_state: "release claim requires independent runtime evidence",
    confidence: 0.7,
    semantic_truth_claimed: false,
    operator_validated: false,
    governance_action: "review-required",
    source_task_id: "TASK-078",
    source_parent_session_id: "SESS-V68-DIRECTION",
    source_decision_record_id: null,
    notes: null
  };

  await validateWithBundledSchema(payload, "aof-quality-ledger-event.schema.json", "quality ledger event");

  await assert.rejects(
    validateWithBundledSchema({ ...payload, unexpected_field: true }, "aof-quality-ledger-event.schema.json", "quality ledger event"),
    /unexpected_field is not allowed/
  );

  const missingClaim = { ...payload };
  delete missingClaim.claim;
  await assert.rejects(
    validateWithBundledSchema(missingClaim, "aof-quality-ledger-event.schema.json", "quality ledger event"),
    /missing required key 'claim'/
  );
});

test("work readiness record schema defines executable pre-implementation gates", async () => {
  const payload = {
    artifact_type: "work-readiness-record",
    record_id: "WRG-TASK-082",
    recorded_at: "2026-07-06T00:00:00.000Z",
    work_item_id: "TASK-082",
    work_item_ref: ".aof/tasks/open/TASK-082.json",
    readiness_status: "ready",
    goal: "Implement pre-implementation quality gates.",
    risk: "Work starts before success is defined.",
    loss_boundary: "No implementation-ready claim without explicit gates.",
    acceptance_gates: ["work-readiness-audit passes"],
    evidence_plan: ["schema, command, tests, Council review"],
    maker_role: "builder",
    checker_role: "guardian",
    council_ref: "architecture-council",
    stop_conditions: ["stop if audit cannot fail missing gates"],
    qif_refs: ["docs/aof-qif-quality-definition.md"],
    archmap_impact_expected: "yes",
    notes: null,
    source_task_id: "TASK-082",
    source_parent_session_id: "SESS-V69-DIRECTION",
    source_decision_record_id: null
  };

  await validateWithBundledSchema(payload, "aof-work-readiness-record.schema.json", "work readiness record");

  const missingLossBoundary = { ...payload };
  delete missingLossBoundary.loss_boundary;
  await assert.rejects(
    validateWithBundledSchema(missingLossBoundary, "aof-work-readiness-record.schema.json", "work readiness record"),
    /missing required key 'loss_boundary'/
  );
});

test("workReadinessRecordCommand writes a schema-valid readiness artifact", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "docs", "aof-qif-quality-definition.md"), "# QIF\n");
  await taskOpenCommand({
    project: projectRoot,
    title: "Implement readiness gate",
    description: "Fixture task",
    origin: "human"
  });
  const result = await workReadinessRecordCommand({
    project: projectRoot,
    workItemId: "TASK-001",
    workItemRef: ".aof/tasks/open/TASK-001.json",
    goal: "Define the smallest useful pre-implementation gate.",
    risk: "The work starts without a concrete expectation.",
    lossBoundary: "Do not call the work ready without explicit acceptance gates.",
    acceptanceGates: ["audit passes"],
    evidencePlan: ["schema and tests"],
    makerRole: "builder",
    checkerRole: "guardian",
    councilRef: "architecture-council",
    stopConditions: ["stop after one failed audit"],
    qifRefs: ["docs/aof-qif-quality-definition.md"],
    archmapImpactExpected: "yes",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-TEST"
  });

  assert.equal(result.ok, true);
  const written = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-work-readiness-record.schema.json", "work readiness record");
});

test("workReadinessAuditCommand fails missing readiness and passes complete gate records", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "docs", "aof-qif-quality-definition.md"), "# QIF\n");
  await taskOpenCommand({
    project: projectRoot,
    title: "Implement readiness gate",
    description: "Fixture task",
    origin: "human"
  });

  const failing = await workReadinessAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(failing.ok, false);
  assert.ok(failing.summary.errors.some((entry) => entry.includes("work readiness record presence")));

  await workReadinessRecordCommand({
    project: projectRoot,
    workItemId: "TASK-001",
    workItemRef: ".aof/tasks/open/TASK-001.json",
    goal: "Define the smallest useful pre-implementation gate.",
    risk: "The work starts without a concrete expectation.",
    lossBoundary: "Do not call the work ready without explicit acceptance gates.",
    acceptanceGates: ["audit passes"],
    evidencePlan: ["schema and tests"],
    makerRole: "builder",
    checkerRole: "guardian",
    councilRef: "architecture-council",
    stopConditions: ["stop after one failed audit"],
    qifRefs: ["docs/aof-qif-quality-definition.md"],
    archmapImpactExpected: "yes",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-TEST"
  });

  const passing = await workReadinessAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(passing.ok, true);
  assert.equal(passing.summary.summary.ready_record_count, 1);
});

test("work execution packet schema requires handoff, verification, stop decision, and not-proven boundary", async () => {
  const payload = {
    artifact_type: "work-execution-packet",
    packet_id: "WEP-TASK-091",
    recorded_at: "2026-07-13T00:00:00.000Z",
    work_item_id: "TASK-091",
    work_item_ref: ".aof/tasks/open/TASK-091.json",
    execution_status: "ready",
    context_integrity_ref: ".aof/artifacts/context-integrity/TASK-091.json",
    actor_handoff_refs: [".aof/artifacts/agent-sessions/SESS-V72-WORK-EXECUTION-PACKET.json"],
    execution_lineage_ref: ".aof/context/active/execution-lineage.json",
    verification_evidence_refs: ["test/runtime-core-2.test.js"],
    stop_continue_decision: {
      decision: "continue",
      rationale: "Focused verification passed.",
      decided_by: "architecture-council",
      evidence_refs: [".aof/artifacts/execution/council-reviews/CREV-TASK-091-V72.json"]
    },
    not_proven: "semantic value still requires operator review",
    source_task_id: "TASK-091",
    source_parent_session_id: "SESS-V72-WORK-EXECUTION-PACKET",
    source_decision_record_id: null,
    notes: null
  };

  await validateWithBundledSchema(payload, "aof-work-execution-packet.schema.json", "work execution packet");

  const missingDecision = { ...payload };
  delete missingDecision.stop_continue_decision;
  await assert.rejects(
    validateWithBundledSchema(missingDecision, "aof-work-execution-packet.schema.json", "work execution packet"),
    /missing required key 'stop_continue_decision'/
  );

  const missingBoundary = { ...payload };
  delete missingBoundary.not_proven;
  await assert.rejects(
    validateWithBundledSchema(missingBoundary, "aof-work-execution-packet.schema.json", "work execution packet"),
    /missing required key 'not_proven'/
  );
});

async function writeWorkExecutionPacketFixtures(projectRoot) {
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "test"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "artifacts", "context-integrity"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "artifacts", "agent-sessions"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "artifacts", "execution", "council-reviews"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "context", "active"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "docs", "requirement.md"), "# Requirement\n");
  await fs.writeFile(path.join(projectRoot, "test", "runtime-core-2.test.js"), "test evidence\n");
  await taskOpenCommand({
    project: projectRoot,
    title: "Implement work execution packet",
    description: "Fixture task",
    origin: "human"
  });
  await contextIntegrityRecordCommand({
    project: projectRoot,
    workItemId: "TASK-001",
    workItemRef: ".aof/tasks/open/TASK-001.json",
    sessionRef: ".aof/artifacts/agent-sessions/SESS-V72-TEST.json",
    declaredContextRefs: ["docs/requirement.md"],
    requiredContextRefs: ["docs/requirement.md"],
    integrityStatus: "ready",
    notProven: "semantic adequacy still requires operator review",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-V72-TEST",
    artifactPath: path.join(projectRoot, ".aof", "artifacts", "context-integrity", "TASK-001.json")
  });
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "agent-sessions", "SESS-V72-TEST.json"), "{}\n");
  await fs.writeFile(path.join(projectRoot, ".aof", "context", "active", "execution-lineage.json"), "{}\n");
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "execution", "council-reviews", "CREV-TASK-001-V72.json"), "{}\n");
}

function completeWorkExecutionPacketOptions(projectRoot) {
  return {
    project: projectRoot,
    workItemId: "TASK-001",
    workItemRef: ".aof/tasks/open/TASK-001.json",
    executionStatus: "ready",
    contextIntegrityRef: ".aof/artifacts/context-integrity/TASK-001.json",
    actorHandoffRefs: [".aof/artifacts/agent-sessions/SESS-V72-TEST.json"],
    executionLineageRef: ".aof/context/active/execution-lineage.json",
    verificationEvidenceRefs: ["test/runtime-core-2.test.js"],
    stopContinueDecision: "continue",
    stopContinueRationale: "Focused verification passed and no blocker remains.",
    stopContinueDecidedBy: "architecture-council",
    stopContinueEvidenceRefs: [".aof/artifacts/execution/council-reviews/CREV-TASK-001-V72.json"],
    notProven: "semantic value still requires operator review",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-V72-TEST"
  };
}

test("workExecutionPacketRecordCommand writes a schema-valid packet", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeWorkExecutionPacketFixtures(projectRoot);

  const result = await workExecutionPacketRecordCommand(completeWorkExecutionPacketOptions(projectRoot));

  assert.equal(result.ok, true);
  const written = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-work-execution-packet.schema.json", "work execution packet");
  assert.equal(written.stop_continue_decision.decision, "continue");
});

test("workExecutionPacketAuditCommand fails missing packets and passes complete execution packets", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeWorkExecutionPacketFixtures(projectRoot);

  const failing = await workExecutionPacketAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(failing.ok, false);
  assert.ok(failing.summary.errors.some((entry) => entry.includes("work execution packet presence")));

  await workExecutionPacketRecordCommand(completeWorkExecutionPacketOptions(projectRoot));

  const passing = await workExecutionPacketAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(passing.ok, true);
  assert.equal(passing.summary.summary.accepted_packet_count, 1);
});

test("multi-actor pilot schema requires council roles, handoffs, judgment, packet, and not-proven boundary", async () => {
  const payload = {
    artifact_type: "multi-actor-pilot",
    pilot_id: "MAP-TASK-092",
    recorded_at: "2026-07-13T00:00:00.000Z",
    work_item_id: "TASK-092",
    work_item_ref: ".aof/tasks/open/TASK-092.json",
    pilot_status: "ready",
    parent_orchestrator_ref: ".aof/artifacts/agent-sessions/SESS-V73-MULTI-ACTOR-PILOT.json",
    core_council_roles: ["visionary", "builder", "guardian"],
    actor_roster_ref: ".aof/artifacts/work-governance/actor-compositions/ACT-TASK-092-V73.json",
    actor_output_handoff_refs: [
      ".aof/artifacts/execution/role-results/RRES-TASK-092-BUILDER.json",
      ".aof/artifacts/execution/role-results/RRES-TASK-092-GUARDIAN.json"
    ],
    council_judgment_ref: ".aof/artifacts/execution/council-reviews/CREV-TASK-092-V73.json",
    work_execution_packet_ref: ".aof/artifacts/work-execution-packets/TASK-092.json",
    maker_checker_council_boundary: "Builder makes, Guardian checks, Council judges.",
    not_proven: "This pilot proves governance evidence, not autonomous workforce performance.",
    source_task_id: "TASK-092",
    source_parent_session_id: "SESS-V73-MULTI-ACTOR-PILOT",
    source_decision_record_id: null,
    notes: null
  };

  await validateWithBundledSchema(payload, "aof-multi-actor-pilot.schema.json", "multi-actor pilot");

  const missingGuardian = { ...payload, core_council_roles: ["visionary", "builder"] };
  await assert.rejects(
    validateWithBundledSchema(missingGuardian, "aof-multi-actor-pilot.schema.json", "multi-actor pilot"),
    /must contain at least 3 items|must be equal to one of the allowed values|missing/
  );

  const missingBoundary = { ...payload };
  delete missingBoundary.not_proven;
  await assert.rejects(
    validateWithBundledSchema(missingBoundary, "aof-multi-actor-pilot.schema.json", "multi-actor pilot"),
    /missing required key 'not_proven'/
  );
});

async function writeMultiActorPilotFixtures(projectRoot) {
  await writeWorkExecutionPacketFixtures(projectRoot);
  await fs.mkdir(path.join(projectRoot, ".aof", "artifacts", "work-governance", "actor-compositions"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "artifacts", "execution", "role-results"), { recursive: true });
  await workExecutionPacketRecordCommand(completeWorkExecutionPacketOptions(projectRoot));
  await fs.writeFile(
    path.join(projectRoot, ".aof", "artifacts", "work-governance", "actor-compositions", "ACT-TASK-001-V73.json"),
    "{}\n"
  );
  await fs.writeFile(
    path.join(projectRoot, ".aof", "artifacts", "execution", "role-results", "RRES-TASK-001-BUILDER.json"),
    "{}\n"
  );
  await fs.writeFile(
    path.join(projectRoot, ".aof", "artifacts", "execution", "role-results", "RRES-TASK-001-GUARDIAN.json"),
    "{}\n"
  );
}

function completeMultiActorPilotOptions(projectRoot) {
  return {
    project: projectRoot,
    workItemId: "TASK-001",
    workItemRef: ".aof/tasks/open/TASK-001.json",
    pilotStatus: "ready",
    parentOrchestratorRef: ".aof/artifacts/agent-sessions/SESS-V72-TEST.json",
    coreCouncilRoles: ["visionary", "builder", "guardian"],
    actorRosterRef: ".aof/artifacts/work-governance/actor-compositions/ACT-TASK-001-V73.json",
    actorOutputHandoffRefs: [
      ".aof/artifacts/execution/role-results/RRES-TASK-001-BUILDER.json",
      ".aof/artifacts/execution/role-results/RRES-TASK-001-GUARDIAN.json"
    ],
    councilJudgmentRef: ".aof/artifacts/execution/council-reviews/CREV-TASK-001-V72.json",
    workExecutionPacketRef: ".aof/artifacts/work-execution-packets/TASK-001.json",
    makerCheckerCouncilBoundary: "Builder makes, Guardian checks, Council judges.",
    notProven: "multi-actor pilot evidence does not prove autonomous workforce performance",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-V73-TEST"
  };
}

test("multiActorPilotRecordCommand writes a schema-valid pilot", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeMultiActorPilotFixtures(projectRoot);

  const result = await multiActorPilotRecordCommand(completeMultiActorPilotOptions(projectRoot));

  assert.equal(result.ok, true);
  const written = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-multi-actor-pilot.schema.json", "multi-actor pilot");
  assert.deepEqual(written.core_council_roles, ["visionary", "builder", "guardian"]);
});

test("multiActorPilotAuditCommand fails missing pilots and passes complete multi-actor evidence", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeMultiActorPilotFixtures(projectRoot);

  const failing = await multiActorPilotAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(failing.ok, false);
  assert.ok(failing.summary.errors.some((entry) => entry.includes("multi-actor pilot presence")));

  await multiActorPilotRecordCommand(completeMultiActorPilotOptions(projectRoot));

  const passing = await multiActorPilotAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(passing.ok, true);
  assert.equal(passing.summary.summary.accepted_pilot_count, 1);
});

test("parallel lane pilot schema requires lanes, join semantics, Council decision, and not-proven boundary", async () => {
  const payload = {
    artifact_type: "parallel-lane-pilot",
    pilot_id: "PLP-TASK-093",
    recorded_at: "2026-07-13T00:00:00.000Z",
    work_item_id: "TASK-093",
    work_item_ref: ".aof/tasks/open/TASK-093.json",
    pilot_status: "ready",
    parent_multi_actor_pilot_ref: ".aof/artifacts/multi-actor-pilots/TASK-093.json",
    work_execution_packet_ref: ".aof/artifacts/work-execution-packets/TASK-093.json",
    lanes: [
      {
        lane_id: "schema",
        goal: "Define the parallel lane contract.",
        owner_actor_ref: "builder",
        input_refs: ["docs/v7.4-release-definition.md"],
        expected_output: "Schema and writer",
        output_refs: ["schemas/aof-parallel-lane-pilot.schema.json"],
        verification_refs: ["test/runtime-core-2.test.js"],
        blocker_refs: [],
        stop_condition: "Stop if lane evidence cannot fail missing refs.",
        lane_status: "completed"
      },
      {
        lane_id: "audit",
        goal: "Verify join semantics.",
        owner_actor_ref: "guardian",
        input_refs: ["docs/v7.4-release-definition.md"],
        expected_output: "Audit and negative checks",
        output_refs: ["src/commands/parallel-lane-audit.js"],
        verification_refs: ["test/runtime-core-2.test.js"],
        blocker_refs: [],
        stop_condition: "Stop if join claims can pass without Council decision.",
        lane_status: "completed"
      }
    ],
    join_packet: {
      join_status: "merged",
      join_decision: "merge",
      joined_lane_ids: ["schema", "audit"],
      conflict_summary: "No unresolved lane conflict.",
      blocker_summary: "No active blocker.",
      merge_rationale: "Both lanes have independent verification refs.",
      council_authority: "architecture-council"
    },
    council_decision_ref: ".aof/artifacts/execution/council-reviews/CREV-TASK-093-V74.json",
    not_proven: "Parallel lane evidence does not prove autonomous scheduling or speed improvement.",
    source_task_id: "TASK-093",
    source_parent_session_id: "SESS-V74-PARALLEL-LANES",
    source_decision_record_id: null,
    notes: null
  };

  await validateWithBundledSchema(payload, "aof-parallel-lane-pilot.schema.json", "parallel lane pilot");

  const oneLaneOnly = { ...payload, lanes: [payload.lanes[0]], join_packet: { ...payload.join_packet, joined_lane_ids: ["schema"] } };
  await assert.rejects(
    validateWithBundledSchema(oneLaneOnly, "aof-parallel-lane-pilot.schema.json", "parallel lane pilot"),
    /must contain at least 2 items/
  );

  const missingBoundary = { ...payload };
  delete missingBoundary.not_proven;
  await assert.rejects(
    validateWithBundledSchema(missingBoundary, "aof-parallel-lane-pilot.schema.json", "parallel lane pilot"),
    /missing required key 'not_proven'/
  );
});

async function writeParallelLaneFixtures(projectRoot) {
  await writeMultiActorPilotFixtures(projectRoot);
  await multiActorPilotRecordCommand(completeMultiActorPilotOptions(projectRoot));
  await fs.mkdir(path.join(projectRoot, ".aof", "artifacts", "parallel-lanes", "fixtures"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "parallel-lanes", "fixtures", "schema-input.json"), "{}\n");
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "parallel-lanes", "fixtures", "audit-input.json"), "{}\n");
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "parallel-lanes", "fixtures", "schema-output.json"), "{}\n");
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "parallel-lanes", "fixtures", "audit-output.json"), "{}\n");
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "parallel-lanes", "fixtures", "schema-verify.json"), "{}\n");
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "parallel-lanes", "fixtures", "audit-verify.json"), "{}\n");
}

function completeParallelLaneOptions(projectRoot) {
  return {
    project: projectRoot,
    workItemId: "TASK-001",
    workItemRef: ".aof/tasks/open/TASK-001.json",
    pilotStatus: "ready",
    parentMultiActorPilotRef: ".aof/artifacts/multi-actor-pilots/TASK-001.json",
    workExecutionPacketRef: ".aof/artifacts/work-execution-packets/TASK-001.json",
    lanes: [
      {
        lane_id: "schema",
        goal: "Define the parallel lane contract.",
        owner_actor_ref: "builder",
        input_refs: [".aof/artifacts/parallel-lanes/fixtures/schema-input.json"],
        expected_output: "Schema and writer",
        output_refs: [".aof/artifacts/parallel-lanes/fixtures/schema-output.json"],
        verification_refs: [".aof/artifacts/parallel-lanes/fixtures/schema-verify.json"],
        blocker_refs: [],
        stop_condition: "Stop if lane evidence cannot fail missing refs.",
        lane_status: "completed"
      },
      {
        lane_id: "audit",
        goal: "Verify join semantics.",
        owner_actor_ref: "guardian",
        input_refs: [".aof/artifacts/parallel-lanes/fixtures/audit-input.json"],
        expected_output: "Audit and negative checks",
        output_refs: [".aof/artifacts/parallel-lanes/fixtures/audit-output.json"],
        verification_refs: [".aof/artifacts/parallel-lanes/fixtures/audit-verify.json"],
        blocker_refs: [],
        stop_condition: "Stop if join claims can pass without Council decision.",
        lane_status: "completed"
      }
    ],
    joinStatus: "merged",
    joinDecision: "merge",
    joinedLaneIds: ["schema", "audit"],
    conflictSummary: "No unresolved lane conflict.",
    blockerSummary: "No active blocker.",
    mergeRationale: "Both lanes have independent verification refs and no conflict.",
    councilAuthority: "architecture-council",
    councilDecisionRef: ".aof/artifacts/execution/council-reviews/CREV-TASK-001-V72.json",
    notProven: "parallel lane evidence does not prove autonomous scheduling or speed improvement",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-V74-TEST"
  };
}

test("parallelLaneRecordCommand writes a schema-valid pilot", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeParallelLaneFixtures(projectRoot);

  const result = await parallelLaneRecordCommand(completeParallelLaneOptions(projectRoot));

  assert.equal(result.ok, true);
  const written = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-parallel-lane-pilot.schema.json", "parallel lane pilot");
  assert.deepEqual(written.join_packet.joined_lane_ids, ["schema", "audit"]);
});

test("parallelLaneAuditCommand fails missing pilots and passes complete lane evidence", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeParallelLaneFixtures(projectRoot);

  const failing = await parallelLaneAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(failing.ok, false);
  assert.ok(failing.summary.errors.some((entry) => entry.includes("parallel lane pilot presence")));

  await parallelLaneRecordCommand(completeParallelLaneOptions(projectRoot));

  const passing = await parallelLaneAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(passing.ok, true);
  assert.equal(passing.summary.summary.accepted_pilot_count, 1);
});

async function writeRequirementCoverageFixtures(projectRoot) {
  await fs.mkdir(path.join(projectRoot, ".aof", "artifacts", "requirement-coverage", "fixtures"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "tasks", "open"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, ".aof", "tasks", "open", "TASK-001.json"), JSON.stringify({
    task_id: "TASK-001",
    title: "Test requirement coverage",
    description: "Fixture task for requirement coverage audit.",
    status: "open",
    origin: "orchestrator",
    orchestrator_session_id: "SESS-V75-TEST",
    assigned_session_ids: [],
    related_decision_record_id: null,
    operating_goal_ref: null,
    created_at: "2026-07-13T00:00:00.000Z",
    updated_at: "2026-07-13T00:00:00.000Z",
    assigned_at: null,
    done_at: null,
    retired_at: null,
    last_triaged_at: null,
    stale_candidate_at: null,
    retire_candidate_at: null,
    triage_notes: null
  }, null, 2));
  await fs.writeFile(path.join(projectRoot, "docs", "v7.5-release-definition.md"), "# v7.5\n");
  await fs.writeFile(path.join(projectRoot, "docs", "v7.5-release-checklist.md"), "# checklist\n");
  await fs.writeFile(path.join(projectRoot, "docs", "aof-qif-quality-definition.md"), "# QIF\n");
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "requirement-coverage", "fixtures", "evidence.json"), "{}\n");
}

function completeRequirementCoverageOptions(projectRoot) {
  return {
    project: projectRoot,
    workItemId: "TASK-001",
    workItemRef: ".aof/tasks/open/TASK-001.json",
    coverageStatus: "ready",
    requirements: [
      {
        requirement_id: "REQ-V75-001",
        requirement_type: "functional",
        source_ref: "docs/v7.5-release-definition.md",
        title: "Record requirement coverage.",
        owner_ref: "builder",
        acceptance_boundary: "Coverage only counts when linked work and evidence refs resolve.",
        status: "covered",
        linked_work_item_refs: [".aof/tasks/open/TASK-001.json"],
        evidence_refs: [".aof/artifacts/requirement-coverage/fixtures/evidence.json"],
        blocker_refs: []
      },
      {
        requirement_id: "REQ-V75-002",
        requirement_type: "qif_quality_intent",
        source_ref: "docs/aof-qif-quality-definition.md",
        title: "Do not claim semantic satisfaction from counts.",
        owner_ref: "guardian",
        acceptance_boundary: "Counts are evidence only when tied to risk and not-proven boundaries.",
        status: "covered",
        linked_work_item_refs: [".aof/tasks/open/TASK-001.json"],
        evidence_refs: ["docs/aof-qif-quality-definition.md"],
        blocker_refs: []
      }
    ],
    coverageSummary: {
      total_requirements: 2,
      covered_count: 2,
      partial_count: 0,
      blocked_count: 0,
      at_risk_count: 0,
      unstarted_count: 0
    },
    forecast: {
      estimated_remaining_work_items: 0,
      estimated_token_cost_range: "bounded test fixture only",
      burndown_ref: "docs/v7.5-release-checklist.md",
      forecast_boundary: "forecast is planning evidence, not delivery certainty"
    },
    notProven: "Requirement coverage does not prove semantic satisfaction.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-V75-TEST"
  };
}

test("requirementCoverageRecordCommand writes a schema-valid coverage record", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeRequirementCoverageFixtures(projectRoot);

  const result = await requirementCoverageRecordCommand(completeRequirementCoverageOptions(projectRoot));

  assert.equal(result.ok, true);
  const written = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-requirement-coverage-record.schema.json", "requirement coverage record");
  assert.equal(written.coverage_summary.covered_count, 2);
});

test("requirementCoverageAuditCommand fails missing coverage and passes complete coverage evidence", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeRequirementCoverageFixtures(projectRoot);

  const failing = await requirementCoverageAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(failing.ok, false);
  assert.ok(failing.summary.errors.some((entry) => entry.includes("requirement coverage record presence")));

  await requirementCoverageRecordCommand(completeRequirementCoverageOptions(projectRoot));

  const passing = await requirementCoverageAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(passing.ok, true);
  assert.equal(passing.summary.summary.accepted_record_count, 1);
});

async function writeSessionExportFixtures(projectRoot) {
  await fs.mkdir(path.join(projectRoot, ".aof", "tasks", "open"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "artifacts", "agent-sessions"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "artifacts", "session-exports", "fixtures"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "test"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, ".aof", "tasks", "open", "TASK-001.json"), JSON.stringify({
    task_id: "TASK-001",
    title: "Test session export",
    description: "Fixture task for session export audit.",
    status: "open",
    origin: "orchestrator",
    orchestrator_session_id: "SESS-V76-TEST",
    assigned_session_ids: [],
    related_decision_record_id: null,
    operating_goal_ref: null,
    created_at: "2026-07-14T00:00:00.000Z",
    updated_at: "2026-07-14T00:00:00.000Z",
    assigned_at: null,
    done_at: null,
    retired_at: null,
    last_triaged_at: null,
    stale_candidate_at: null,
    retire_candidate_at: null,
    triage_notes: null
  }, null, 2));
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "agent-sessions", "SESS-V76-TEST.json"), "{}\n");
  await fs.writeFile(path.join(projectRoot, "docs", "v7.6-release-definition.md"), "# v7.6\n");
  await fs.writeFile(path.join(projectRoot, "docs", "v7.6-release-checklist.md"), "# checklist\n");
  await fs.writeFile(path.join(projectRoot, "test", "runtime-core-2.test.js"), "// fixture\n");
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "session-exports", "fixtures", "artifact.json"), "{}\n");
}

function completeSessionExportOptions(projectRoot) {
  return {
    project: projectRoot,
    workItemId: "TASK-001",
    workItemRef: ".aof/tasks/open/TASK-001.json",
    exportStatus: "ready",
    sourceSessionRef: ".aof/artifacts/agent-sessions/SESS-V76-TEST.json",
    providerSource: {
      provider: "local",
      model: "test-model",
      source_format: "aof-agent-session-record",
      source_of_truth_boundary: "Provider stream is input evidence; AOF export is canonical."
    },
    eventSummaries: [
      { event_id: "EVT-1", event_type: "prompt", summary: "User requested export.", artifact_refs: [".aof/tasks/open/TASK-001.json"] },
      { event_id: "EVT-2", event_type: "response", summary: "AI proposed export.", artifact_refs: ["docs/v7.6-release-definition.md"] },
      { event_id: "EVT-3", event_type: "tool_call", summary: "Runtime command executed.", artifact_refs: [".aof/artifacts/agent-sessions/SESS-V76-TEST.json"] },
      { event_id: "EVT-4", event_type: "artifact_write", summary: "Schema written.", artifact_refs: [".aof/artifacts/session-exports/fixtures/artifact.json"] },
      { event_id: "EVT-5", event_type: "verification", summary: "Focused test passed.", artifact_refs: ["test/runtime-core-2.test.js"] },
      { event_id: "EVT-6", event_type: "blocker", summary: "No active blocker.", artifact_refs: ["docs/v7.6-release-checklist.md"] },
      { event_id: "EVT-7", event_type: "stop_condition", summary: "Stop if redaction boundary is missing.", artifact_refs: ["docs/v7.6-release-checklist.md"] }
    ],
    taskRefs: [".aof/tasks/open/TASK-001.json"],
    requirementRefs: ["docs/v7.6-release-definition.md"],
    testEvidenceRefs: ["test/runtime-core-2.test.js"],
    artifactRefs: [".aof/artifacts/session-exports/fixtures/artifact.json"],
    riskCandidates: ["provider stream lock-in"],
    decisionCandidates: ["make session export audit a release gate"],
    releaseReadyEvidenceRefs: ["docs/v7.6-release-checklist.md"],
    redactionBoundary: "Summaries only; raw secrets and private prompt bodies are not exported.",
    releaseReadyBoundary: "Export readiness is structural evidence only.",
    notProven: "Session export does not prove semantic correctness or privacy safety in every downstream context.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-V76-TEST"
  };
}

test("sessionExportRecordCommand writes a schema-valid provider-neutral export", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeSessionExportFixtures(projectRoot);

  const result = await sessionExportRecordCommand(completeSessionExportOptions(projectRoot));

  assert.equal(result.ok, true);
  const written = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-session-export-record.schema.json", "session export record");
  assert.equal(written.event_summaries.length, 7);
});

test("sessionExportAuditCommand fails missing exports and passes complete export evidence", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeSessionExportFixtures(projectRoot);

  const failing = await sessionExportAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(failing.ok, false);
  assert.ok(failing.summary.errors.some((entry) => entry.includes("session export presence")));

  await sessionExportRecordCommand(completeSessionExportOptions(projectRoot));

  const passing = await sessionExportAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(passing.ok, true);
  assert.equal(passing.summary.summary.accepted_export_count, 1);
});

test("agent session record schema defines task, requirement, test, risk, decision, and release-ready links", async () => {
  const payload = {
    artifact_type: "agent-session-record",
    stream_format_version: 1,
    stream_id: "ASR-SESS-V70-TEST",
    recorded_at: "2026-07-06T00:00:00.000Z",
    session_id: "SESS-V70-TEST",
    parent_session_id: "SESS-PARENT-TEST",
    actor_ref: "codex",
    role_ref: "builder",
    provider: "local",
    model: "test-model",
    events: [{
      event_id: "EVT-1",
      event_type: "prompt",
      occurred_at: "2026-07-06T00:00:00.000Z",
      summary: "User asked for session observability.",
      artifact_refs: [],
      tool_name: null,
      safety_level: null,
      approval_policy: null
    }],
    links: {
      task_refs: [".aof/tasks/open/TASK-085.json"],
      requirement_refs: ["docs/v7.0-agent-session-observability-direction.md"],
      test_evidence_refs: ["test/runtime-core-2.test.js"],
      commit_refs: [],
      pr_refs: [],
      artifact_refs: ["schemas/aof-agent-session-record.schema.json"]
    },
    risk_candidates: ["AI work cannot be reconstructed."],
    decision_candidates: ["Promote session stream to release gate."],
    release_ready_evidence: {
      claim: "Session observability is structurally ready.",
      evidence_refs: ["test/runtime-core-2.test.js"],
      verdict: "runtime_ready"
    },
    source_task_id: "TASK-085",
    source_parent_session_id: "SESS-V70-TEST",
    source_decision_record_id: null,
    notes: null
  };

  await validateWithBundledSchema(payload, "aof-agent-session-record.schema.json", "agent session record");

  const missingLinks = { ...payload };
  delete missingLinks.links;
  await assert.rejects(
    validateWithBundledSchema(missingLinks, "aof-agent-session-record.schema.json", "agent session record"),
    /missing required key 'links'/
  );
});

async function writeSessionObservabilityFixtures(projectRoot) {
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "test"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "schemas"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "docs", "requirement.md"), "# Requirement\n");
  await fs.writeFile(path.join(projectRoot, "test", "runtime-core-2.test.js"), "test evidence\n");
  await fs.writeFile(path.join(projectRoot, "schemas", "aof-agent-session-record.schema.json"), "{}\n");
  await taskOpenCommand({
    project: projectRoot,
    title: "Implement session observability",
    description: "Fixture task",
    origin: "human"
  });
}

function completeAgentSessionOptions(projectRoot) {
  return {
    project: projectRoot,
    sessionId: "SESS-V70-TEST",
    parentSessionId: "SESS-PARENT-TEST",
    actorRef: "codex",
    roleRef: "builder",
    provider: "local",
    model: "test-model",
    events: [
      { event_type: "prompt", summary: "User asked for session observability." },
      { event_type: "response", summary: "Agent selected the v7 session stream slice." },
      { event_type: "tool_call", summary: "Ran local runtime test.", tool_name: "node --test", safety_level: "safe_read", approval_policy: "preapproved" },
      { event_type: "artifact_write", summary: "Wrote schema and command artifacts.", artifact_refs: ["schemas/aof-agent-session-record.schema.json"] },
      { event_type: "verification_result", summary: "Focused tests passed.", artifact_refs: ["test/runtime-core-2.test.js"] },
      { event_type: "risk_candidate", summary: "Session work may not be reconstructable." },
      { event_type: "decision_candidate", summary: "Make session observability a release gate." },
      { event_type: "stop_condition", summary: "Stop after audit and tests pass." }
    ],
    taskRefs: [".aof/tasks/open/TASK-001.json"],
    requirementRefs: ["docs/requirement.md"],
    testEvidenceRefs: ["test/runtime-core-2.test.js"],
    artifactRefs: ["schemas/aof-agent-session-record.schema.json"],
    riskCandidates: ["Session work may not be reconstructable."],
    decisionCandidates: ["Make session observability a release gate."],
    releaseReadyClaim: "Session observability has runtime-backed structural evidence.",
    releaseReadyEvidenceRefs: ["test/runtime-core-2.test.js"],
    releaseReadyVerdict: "runtime_ready",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-PARENT-TEST",
    artifactPath: path.join(projectRoot, ".aof", "artifacts", "agent-sessions", "SESS-V70-TEST.json")
  };
}

test("agentSessionRecordCommand writes a schema-valid event stream", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeSessionObservabilityFixtures(projectRoot);

  const result = await agentSessionRecordCommand(completeAgentSessionOptions(projectRoot));

  assert.equal(result.ok, true);
  const written = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-agent-session-record.schema.json", "agent session record");
  assert.equal(written.links.task_refs[0], ".aof/tasks/open/TASK-001.json");
  assert.equal(written.release_ready_evidence.verdict, "runtime_ready");
});

test("sessionObservabilityAuditCommand fails weak streams and passes complete reconstructable streams", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeSessionObservabilityFixtures(projectRoot);
  const sessionRoot = path.join(projectRoot, ".aof", "artifacts", "agent-sessions");
  await fs.mkdir(sessionRoot, { recursive: true });
  await fs.writeFile(path.join(sessionRoot, "BAD.json"), `${JSON.stringify({
    artifact_type: "agent-session-record",
    stream_format_version: 1,
    stream_id: "BAD",
    recorded_at: "2026-07-06T00:00:00.000Z",
    session_id: "BAD",
    parent_session_id: null,
    actor_ref: "codex",
    role_ref: "builder",
    provider: "local",
    model: "test-model",
    events: [{ event_id: "EVT-BAD", event_type: "prompt", occurred_at: "2026-07-06T00:00:00.000Z", summary: "Only prompt exists.", artifact_refs: [], tool_name: null, safety_level: null, approval_policy: null }],
    links: { task_refs: [".aof/tasks/open/TASK-001.json"], requirement_refs: [], test_evidence_refs: [], commit_refs: [], pr_refs: [], artifact_refs: [] },
    risk_candidates: [],
    decision_candidates: [],
    release_ready_evidence: { claim: "This weak stream should not be release-ready.", evidence_refs: [], verdict: "not_ready" },
    source_task_id: "TASK-001",
    source_parent_session_id: "SESS-PARENT-TEST",
    source_decision_record_id: null,
    notes: null
  }, null, 2)}\n`);

  const failing = await sessionObservabilityAuditCommand({ project: projectRoot });
  assert.equal(failing.ok, false);
  assert.ok(failing.summary.errors.some((entry) => entry.includes("requirement linkage")));
  assert.ok(failing.summary.errors.some((entry) => entry.includes("risk candidates")));
  assert.ok(failing.summary.errors.some((entry) => entry.includes("release-ready evidence")));

  await fs.rm(path.join(sessionRoot, "BAD.json"));
  await agentSessionRecordCommand(completeAgentSessionOptions(projectRoot));

  const passing = await sessionObservabilityAuditCommand({ project: projectRoot });
  assert.equal(passing.ok, true);
  assert.equal(passing.summary.summary.stream_count, 1);
});

test("context integrity schemas require explicit not-proven and reference status boundaries", async () => {
  const contextPayload = {
    artifact_type: "context-integrity-record",
    record_id: "CIR-TASK-090",
    recorded_at: "2026-07-12T00:00:00.000Z",
    work_item_id: "TASK-090",
    work_item_ref: ".aof/tasks/open/TASK-090.json",
    session_ref: ".aof/artifacts/agent-sessions/SESS-V71-TEST.json",
    context_pack_refs: [".aof/artifacts/work-governance/context-packs/CTX-TASK-090.json"],
    declared_context_refs: ["docs/v7.1-context-reference-integrity-design.md"],
    required_context_refs: ["docs/v7.1-context-reference-integrity-design.md"],
    missing_context_refs: [],
    hidden_context_signals: [],
    integrity_status: "ready",
    not_proven: "This record proves declared context structure, not semantic truth.",
    source_task_id: "TASK-090",
    source_parent_session_id: "SESS-V71-TEST",
    source_decision_record_id: null
  };
  await validateWithBundledSchema(contextPayload, "aof-context-integrity-record.schema.json", "context integrity record");

  const missingBoundary = { ...contextPayload };
  delete missingBoundary.not_proven;
  await assert.rejects(
    validateWithBundledSchema(missingBoundary, "aof-context-integrity-record.schema.json", "context integrity record"),
    /missing required key 'not_proven'/
  );

  const externalPayload = {
    artifact_type: "external-reference-integrity-record",
    record_id: "ERIR-QIF-V030",
    recorded_at: "2026-07-12T00:00:00.000Z",
    external_ref: "QIF-v0.3.0",
    external_ref_artifact_ref: ".aof/external-refs/QIF-v0.3.0.json",
    source_system: "github",
    url: "https://github.com/ai-org-labs/quality-intent-framework/releases/tag/v0.3.0",
    relationship: "quality provider dependency",
    source_of_truth: "GitHub release tag",
    sync_policy: "manual release-linked check",
    usage_purpose: "AOF/QIF integration boundary",
    freshness_required: true,
    observed_at: "2026-07-12T00:00:00.000Z",
    freshness_status: "current",
    availability_status: "available",
    integrity_status: "ready",
    not_proven: "Availability does not prove QIF semantic fitness for every AOF work product.",
    source_task_id: "TASK-090",
    source_parent_session_id: "SESS-V71-TEST",
    source_decision_record_id: null
  };
  await validateWithBundledSchema(
    externalPayload,
    "aof-external-reference-integrity-record.schema.json",
    "external reference integrity record"
  );
});

async function writeContextReferenceIntegrityFixtures(projectRoot) {
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "test"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "external-refs"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "artifacts", "work-governance", "context-packs"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "docs", "v7.1-context-reference-integrity-design.md"), "# v7.1 design\n");
  await fs.writeFile(path.join(projectRoot, "test", "runtime-core-2.test.js"), "test evidence\n");
  await fs.writeFile(path.join(projectRoot, ".aof", "external-refs", "QIF-v0.3.0.json"), "{}\n");
  await taskOpenCommand({
    project: projectRoot,
    title: "Implement context reference integrity",
    description: "Fixture task",
    origin: "human"
  });
  await agentSessionRecordCommand({
    ...completeAgentSessionOptions(projectRoot),
    sessionId: "SESS-V71-TEST",
    artifactPath: path.join(projectRoot, ".aof", "artifacts", "agent-sessions", "SESS-V71-TEST.json")
  });
  await fs.writeFile(path.join(projectRoot, ".aof", "artifacts", "work-governance", "context-packs", "CTX-TASK-001.json"), `${JSON.stringify({
    artifact_type: "context-pack",
    recorded_at: "2026-07-12T00:00:00.000Z",
    pack_id: "CTX-TASK-001",
    audience: "codex",
    current_mission: "Verify context/reference integrity.",
    current_frontier: "TASK-001",
    active_work_items: [{ work_item_id: "TASK-001", summary: "Implement context reference integrity.", state: "in_progress" }],
    open_blockers: [],
    pending_human_approvals: [],
    latest_decisions: [],
    applicable_quality_intents: ["QIN-AOF-RUNTIME"],
    priority_summary: "Keep references declared and auditable.",
    operational_map_refs: [],
    go_no_go_status_summary: "go",
    actor_composition_summary: "builder/guardian/council",
    next_recommended_action: "Run context-reference-integrity-audit.",
    evidence_refs: ["docs/v7.1-context-reference-integrity-design.md"],
    external_refs: [".aof/external-refs/QIF-v0.3.0.json"],
    raw_artifact_bodies_included: false,
    source_task_id: "TASK-001",
    source_parent_session_id: "SESS-V71-TEST",
    source_decision_record_id: null
  }, null, 2)}\n`);
}

test("context integrity writers create schema-valid artifacts", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeContextReferenceIntegrityFixtures(projectRoot);

  const contextResult = await contextIntegrityRecordCommand({
    project: projectRoot,
    workItemId: "TASK-001",
    workItemRef: ".aof/tasks/open/TASK-001.json",
    sessionRef: ".aof/artifacts/agent-sessions/SESS-V71-TEST.json",
    contextPackRefs: [".aof/artifacts/work-governance/context-packs/CTX-TASK-001.json"],
    declaredContextRefs: ["docs/v7.1-context-reference-integrity-design.md"],
    requiredContextRefs: ["docs/v7.1-context-reference-integrity-design.md"],
    integrityStatus: "ready",
    notProven: "This proves context declaration structure, not semantic truth.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-V71-TEST"
  });
  const contextPayload = JSON.parse(await fs.readFile(contextResult.artifactPath, "utf8"));
  await validateWithBundledSchema(contextPayload, "aof-context-integrity-record.schema.json", "context integrity record");

  const externalResult = await externalReferenceIntegrityRecordCommand({
    project: projectRoot,
    externalRef: "QIF-v0.3.0",
    externalRefArtifactRef: ".aof/external-refs/QIF-v0.3.0.json",
    sourceSystem: "github",
    url: "https://github.com/ai-org-labs/quality-intent-framework/releases/tag/v0.3.0",
    relationship: "quality provider dependency",
    sourceOfTruth: "GitHub release tag",
    syncPolicy: "manual release-linked check",
    usagePurpose: "AOF/QIF integration boundary",
    freshnessRequired: true,
    freshnessStatus: "current",
    availabilityStatus: "available",
    integrityStatus: "ready",
    notProven: "Availability does not prove semantic suitability for every AOF work product.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-V71-TEST"
  });
  const externalPayload = JSON.parse(await fs.readFile(externalResult.artifactPath, "utf8"));
  await validateWithBundledSchema(
    externalPayload,
    "aof-external-reference-integrity-record.schema.json",
    "external reference integrity record"
  );
});

test("contextReferenceIntegrityAuditCommand fails missing context and passes complete references", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeContextReferenceIntegrityFixtures(projectRoot);

  const failing = await contextReferenceIntegrityAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(failing.ok, false);
  assert.ok(failing.summary.errors.some((entry) => entry.includes("context integrity record presence")));

  await contextIntegrityRecordCommand({
    project: projectRoot,
    workItemId: "TASK-001",
    workItemRef: ".aof/tasks/open/TASK-001.json",
    sessionRef: ".aof/artifacts/agent-sessions/SESS-V71-TEST.json",
    contextPackRefs: [".aof/artifacts/work-governance/context-packs/CTX-TASK-001.json"],
    declaredContextRefs: ["docs/v7.1-context-reference-integrity-design.md"],
    requiredContextRefs: ["docs/v7.1-context-reference-integrity-design.md"],
    integrityStatus: "ready",
    notProven: "This proves context declaration structure, not semantic truth.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-V71-TEST"
  });
  await externalReferenceIntegrityRecordCommand({
    project: projectRoot,
    externalRef: "QIF-v0.3.0",
    externalRefArtifactRef: ".aof/external-refs/QIF-v0.3.0.json",
    sourceSystem: "github",
    url: "https://github.com/ai-org-labs/quality-intent-framework/releases/tag/v0.3.0",
    relationship: "quality provider dependency",
    sourceOfTruth: "GitHub release tag",
    syncPolicy: "manual release-linked check",
    usagePurpose: "AOF/QIF integration boundary",
    freshnessRequired: true,
    freshnessStatus: "current",
    availabilityStatus: "available",
    integrityStatus: "ready",
    notProven: "Availability does not prove semantic suitability for every AOF work product.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-V71-TEST"
  });

  const passing = await contextReferenceIntegrityAuditCommand({ project: projectRoot, cutoffTaskId: "TASK-001" });
  assert.equal(passing.ok, true);
  assert.equal(passing.summary.summary.context_record_count, 1);
  assert.equal(passing.summary.summary.external_reference_record_count, 1);
});

test("qualityLedgerRecordCommand writes a schema-valid quality ledger event", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const artifactPath = path.join(projectRoot, "quality-event.json");
  const result = await qualityLedgerRecordCommand({
    project: projectRoot,
    eventId: "QLE-TASK-078-WRITER",
    eventType: "runtime_evidence_missing",
    qualityIntentRef: "QIN-AOF-RUNTIME",
    workItemRef: "TASK-078",
    claim: "Runtime evidence is required before a quality claim can be accepted.",
    qifRefs: ["docs/aof-qif-quality-definition.md"],
    governanceAction: "request-evidence",
    confidence: 0.66,
    sourceTaskId: "TASK-078",
    sourceParentSessionId: "SESS-V68-DIRECTION",
    artifactPath
  });

  assert.equal(result.ok, true);
  assert.equal(result.payload.semantic_truth_claimed, false);
  assert.equal(result.payload.operator_validated, false);
  assert.equal(result.payload.governance_action, "request-evidence");

  const written = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-quality-ledger-event.schema.json", "quality ledger event");
});

test("qualityLedgerAuditCommand fails missing escalation, semantic truth claims, unresolved refs, and missing state transitions", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const eventRoot = path.join(projectRoot, ".aof", "quality", "ledger", "events");
  await fs.mkdir(eventRoot, { recursive: true });
  await fs.writeFile(path.join(eventRoot, "QLE-BAD.json"), `${JSON.stringify({
    artifact_type: "quality-ledger-event",
    ledger_format_version: 1,
    event_id: "QLE-BAD",
    recorded_at: "2026-07-03T20:10:00.000Z",
    event_type: "claim_contradicted",
    quality_intent_ref: "QIN-AOF-RUNTIME",
    work_item_ref: "TASK-078",
    claim: "This bad event should be rejected by audit checks.",
    evidence_refs: ["docs/missing-evidence.md"],
    qif_refs: [],
    prior_state: null,
    new_state: null,
    confidence: 0.2,
    semantic_truth_claimed: true,
    operator_validated: false,
    governance_action: "none",
    source_task_id: "TASK-078",
    source_parent_session_id: "SESS-V68-DIRECTION",
    source_decision_record_id: null,
    notes: null
  }, null, 2)}\n`);

  const result = await qualityLedgerAuditCommand({ project: projectRoot });

  assert.equal(result.ok, false);
  assert.ok(result.summary.errors.some((error) => /does not claim semantic truth/.test(error)));
  assert.ok(result.summary.errors.some((error) => /evidence ref resolves/.test(error)));
  assert.ok(result.summary.errors.some((error) => /QIF refs present/.test(error)));
  assert.ok(result.summary.errors.some((error) => /escalates non-green quality signal/.test(error)));
  assert.ok(result.summary.errors.some((error) => /records state transition/.test(error)));
});

test("committed quality ledger fixture stays auditable and does not claim semantic truth", async () => {
  const fixturePath = path.join(repoRoot, ".aof", "quality", "ledger", "events", "QLE-TASK-078-RUNTIME-EVIDENCE.json");
  const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));
  await validateWithBundledSchema(fixture, "aof-quality-ledger-event.schema.json", "quality ledger event fixture");

  const result = await qualityLedgerAuditCommand({ project: repoRoot });
  assert.equal(result.ok, true);
  assert.ok(result.summary.events.some((event) => event.event_id === "QLE-TASK-078-RUNTIME-EVIDENCE"));
  assert.equal(result.summary.summary.semantic_truth_claim_count, 0);
  assert.equal(result.summary.summary.operator_validated_count, 0);
});

test("actorSkillPacketRecordCommand writes a provenance-backed assignment packet", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const result = await actorSkillPacketRecordCommand({
    project: projectRoot,
    packetId: "ASP-TASK-050-BUILDER",
    objective: "Implement the actor skill packet writer and fixtures.",
    actorRef: "codex",
    roleRef: "builder",
    teamRef: "runtime-team",
    assignmentReason: "Builder owns runtime writer implementation.",
    executionMode: "single-actor",
    requiredSkillRefs: ["skill-schema-review"],
    capabilityFit: [{
      capability_ref: "cap-schema-review",
      fit_state: "sufficient",
      evidence_refs: ["schemas/aof-actor-skill-packet.schema.json"],
      rationale: "The command is schema-backed."
    }],
    resourceRefs: ["resource-repo-main"],
    policyRefs: ["policy-runtime-backed-answer-discipline"],
    outputArtifactType: "actor-skill-packet",
    outputArtifactSchemaRef: "schemas/aof-actor-skill-packet.schema.json",
    requiredSections: ["assignment", "capability_fit", "review_criteria"],
    acceptanceCriteria: ["Writer output validates", "Provenance is present"],
    reviewCriteria: [{
      criterion: "Packet validates and explains actor selection.",
      evaluator_ref: "guardian",
      evidence_required: "schema validation and source task/session refs",
      blocking: true
    }],
    blockerSemantics: [{
      blocker_code: "missing-skill-evidence",
      trigger_condition: "required skill refs are missing",
      consequence: "block-assignment",
      recovery_action: "add skill evidence"
    }],
    characterLabel: "Builder",
    speechBubble: "I can write the first skill packet with provenance.",
    currentAction: "Implement actor skill packet writer",
    confidenceLabel: "medium",
    visibleBlockers: [],
    nextAction: "Submit packet for Guardian validation",
    sourceTaskId: "TASK-050",
    sourceParentSessionId: "SESS-MQM6-V50-SKILLFUL-ACTOR",
    status: "draft"
  });

  assert.equal(result.ok, true);
  assert.match(result.artifactPath, /ASP-TASK-050-BUILDER\.json$/);
  assert.equal(result.payload.source_task_id, "TASK-050");
  assert.equal(result.payload.source_parent_session_id, "SESS-MQM6-V50-SKILLFUL-ACTOR");
  assert.deepEqual(result.payload.required_skill_refs, ["skill-schema-review"]);

  const written = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-actor-skill-packet.schema.json", "actor skill packet");
});

test("committed actor skill packet fixture stays schema-valid", async () => {
  const fixturePath = path.join(repoRoot, ".aof", "artifacts", "benchmarks", "fixtures", "ASP-TASK-050-BUILDER.json");
  const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));
  assert.equal(fixture.packet_id, "ASP-TASK-050-BUILDER-FIXTURE");
  assert.equal(fixture.source_task_id, "TASK-050");
  await validateWithBundledSchema(fixture, "aof-actor-skill-packet.schema.json", "actor skill packet fixture");
});

test("CLI actor-skill-packet-record writes packet and rejects missing skill refs", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const artifactPath = path.join(projectRoot, "packet.json");
  const args = [
    "./src/cli.js",
    "actor-skill-packet-record",
    "--project", projectRoot,
    "--packet-id", "ASP-CLI-TASK-050",
    "--objective", "Implement the actor skill packet writer.",
    "--actor-ref", "codex",
    "--role-ref", "builder",
    "--team-ref", "runtime-team",
    "--assignment-reason", "Builder owns runtime writer implementation.",
    "--execution-mode", "single-actor",
    "--skill-ref", "skill-schema-review",
    "--capability-fit-json", JSON.stringify({
      capability_ref: "cap-schema-review",
      fit_state: "sufficient",
      evidence_refs: ["schemas/aof-actor-skill-packet.schema.json"],
      rationale: "schema-backed writer task"
    }),
    "--resource-ref", "resource-repo-main",
    "--policy-ref", "policy-runtime-backed-answer-discipline",
    "--output-artifact-type", "actor-skill-packet",
    "--output-artifact-schema-ref", "schemas/aof-actor-skill-packet.schema.json",
    "--required-section", "assignment",
    "--acceptance-criterion", "schema validates",
    "--review-criterion-json", JSON.stringify({
      criterion: "packet validates",
      evaluator_ref: "guardian",
      evidence_required: "schema validation",
      blocking: true
    }),
    "--blocker-json", JSON.stringify({
      blocker_code: "missing-skill-evidence",
      trigger_condition: "skill evidence missing",
      consequence: "block-assignment",
      recovery_action: "add skill evidence"
    }),
    "--character-label", "Builder",
    "--speech-bubble", "I can write the packet.",
    "--current-action", "Implement writer",
    "--confidence-label", "medium",
    "--next-action", "Submit packet for review",
    "--source-task-id", "TASK-050",
    "--source-parent-session-id", "SESS-PARENT-CLI",
    "--write-artifact", artifactPath
  ];
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, AOF_SUPPRESS_NODE_WARNING: "1" }
  });
  assert.equal(result.status, 0, result.stderr);
  const cliPayload = JSON.parse(result.stdout);
  assert.equal(cliPayload.ok, true);
  assert.equal(cliPayload.payload.packet_id, "ASP-CLI-TASK-050");
  assert.equal(cliPayload.payload.source_parent_session_id, "SESS-PARENT-CLI");

  const written = JSON.parse(await fs.readFile(artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-actor-skill-packet.schema.json", "CLI actor skill packet");

  const missingSkillArgs = args.filter((arg, index, array) => arg !== "--skill-ref" && array[index - 1] !== "--skill-ref");
  const rejected = spawnSync(process.execPath, missingSkillArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, AOF_SUPPRESS_NODE_WARNING: "1" }
  });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /At least one --skill-ref is required/);
});

test("actorAssignmentEvaluationRecordCommand evaluates selected and blocked assignment states", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const selectedPacket = await actorSkillPacketRecordCommand({
    project: projectRoot,
    packetId: "ASP-TASK-051-SELECTED",
    objective: "Evaluate selected assignment state.",
    actorRef: "codex",
    roleRef: "builder",
    teamRef: "runtime-team",
    assignmentReason: "Builder has schema review evidence.",
    executionMode: "single-actor",
    requiredSkillRefs: ["skill-schema-review"],
    capabilityFit: [{
      capability_ref: "cap-schema-review",
      fit_state: "sufficient",
      evidence_refs: ["schemas/aof-actor-skill-packet.schema.json"],
      rationale: "Schema-backed assignment has sufficient evidence."
    }],
    resourceRefs: ["resource-repo-main"],
    policyRefs: ["policy-runtime-backed-answer-discipline"],
    outputArtifactType: "actor-assignment-evaluation",
    outputArtifactSchemaRef: "schemas/aof-actor-assignment-evaluation.schema.json",
    requiredSections: ["assignment_decision", "capability_fit_summary"],
    acceptanceCriteria: ["assignment is selected"],
    reviewCriteria: [{
      criterion: "Evaluation explains actor selection.",
      evaluator_ref: "guardian",
      evidence_required: "capability fit summary",
      blocking: true
    }],
    blockerSemantics: [{
      blocker_code: "missing-capability-evidence",
      trigger_condition: "capability evidence is missing",
      consequence: "block-assignment",
      recovery_action: "add capability evidence"
    }],
    characterLabel: "Builder",
    speechBubble: "I have enough capability evidence to proceed.",
    currentAction: "Evaluate assignment",
    confidenceLabel: "medium",
    visibleBlockers: [],
    nextAction: "Run assignment evaluation",
    sourceTaskId: "TASK-051",
    sourceParentSessionId: "SESS-MQM6-V50-SKILLFUL-ACTOR"
  });

  const selected = await actorAssignmentEvaluationRecordCommand({
    project: projectRoot,
    evaluationId: "AAE-TASK-051-SELECTED",
    actorSkillPacketRef: path.relative(projectRoot, selectedPacket.artifactPath),
    sourceTaskId: "TASK-051"
  });
  assert.equal(selected.payload.assignment_decision.assignment_state, "selected");
  assert.equal(selected.payload.capability_fit_summary.sufficient_count, 1);
  assert.equal(selected.payload.missing_evidence.length, 0);
  assert.equal(selected.payload.review_required, true);
  await validateWithBundledSchema(selected.payload, "aof-actor-assignment-evaluation.schema.json", "actor assignment evaluation");

  const blockedPacket = await actorSkillPacketRecordCommand({
    project: projectRoot,
    packetId: "ASP-TASK-051-BLOCKED",
    objective: "Evaluate blocked assignment state.",
    actorRef: "codex",
    roleRef: "builder",
    teamRef: "runtime-team",
    assignmentReason: "Builder is proposed but evidence is absent.",
    executionMode: "single-actor",
    requiredSkillRefs: ["skill-schema-review"],
    capabilityFit: [{
      capability_ref: "cap-schema-review",
      fit_state: "missing",
      evidence_refs: [],
      rationale: "No capability evidence is present."
    }],
    resourceRefs: ["resource-repo-main"],
    policyRefs: ["policy-runtime-backed-answer-discipline"],
    outputArtifactType: "actor-assignment-evaluation",
    outputArtifactSchemaRef: "schemas/aof-actor-assignment-evaluation.schema.json",
    requiredSections: ["assignment_decision", "capability_fit_summary"],
    acceptanceCriteria: ["assignment is blocked"],
    reviewCriteria: [{
      criterion: "Missing capability evidence blocks assignment.",
      evaluator_ref: "guardian",
      evidence_required: "capability evidence refs",
      blocking: true
    }],
    blockerSemantics: [{
      blocker_code: "missing-capability-evidence",
      trigger_condition: "capability evidence is missing",
      consequence: "block-assignment",
      recovery_action: "add capability evidence"
    }],
    characterLabel: "Builder",
    speechBubble: "I should not act without evidence.",
    currentAction: "Evaluate assignment",
    confidenceLabel: "blocked",
    visibleBlockers: ["capability evidence missing"],
    nextAction: "Add evidence before assignment",
    sourceTaskId: "TASK-051",
    sourceParentSessionId: "SESS-MQM6-V50-SKILLFUL-ACTOR"
  });
  const blocked = await actorAssignmentEvaluationRecordCommand({
    project: projectRoot,
    evaluationId: "AAE-TASK-051-BLOCKED",
    actorSkillPacketRef: path.relative(projectRoot, blockedPacket.artifactPath),
    sourceTaskId: "TASK-051"
  });
  assert.equal(blocked.payload.assignment_decision.assignment_state, "blocked");
  assert.equal(blocked.payload.assignment_decision.confidence_label, "blocked");
  assert.equal(blocked.payload.missing_evidence[0].capability_ref, "cap-schema-review");
  assert.match(blocked.payload.hri_projection.speech_bubble, /stronger capability evidence/);
});

test("committed actor assignment evaluation fixture stays schema-valid", async () => {
  const fixturePath = path.join(repoRoot, ".aof", "artifacts", "benchmarks", "fixtures", "AAE-TASK-051-SELECTED.json");
  const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));
  assert.equal(fixture.evaluation_id, "AAE-TASK-051-SELECTED-FIXTURE");
  assert.equal(fixture.assignment_decision.assignment_state, "selected");
  await validateWithBundledSchema(fixture, "aof-actor-assignment-evaluation.schema.json", "actor assignment evaluation fixture");
});

test("CLI actor-assignment-evaluation-record writes evaluation artifact", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const packet = await actorSkillPacketRecordCommand({
    project: projectRoot,
    packetId: "ASP-CLI-TASK-051",
    objective: "Evaluate CLI assignment.",
    actorRef: "codex",
    roleRef: "builder",
    teamRef: "runtime-team",
    assignmentReason: "Builder has sufficient schema capability evidence.",
    executionMode: "single-actor",
    requiredSkillRefs: ["skill-schema-review"],
    capabilityFit: [{
      capability_ref: "cap-schema-review",
      fit_state: "sufficient",
      evidence_refs: ["schemas/aof-actor-skill-packet.schema.json"],
      rationale: "schema-backed CLI fixture"
    }],
    resourceRefs: ["resource-repo-main"],
    policyRefs: ["policy-runtime-backed-answer-discipline"],
    outputArtifactType: "actor-assignment-evaluation",
    outputArtifactSchemaRef: "schemas/aof-actor-assignment-evaluation.schema.json",
    requiredSections: ["assignment_decision"],
    acceptanceCriteria: ["selected assignment"],
    reviewCriteria: [{
      criterion: "packet evaluates",
      evaluator_ref: "guardian",
      evidence_required: "evaluation artifact",
      blocking: true
    }],
    blockerSemantics: [{
      blocker_code: "missing-capability-evidence",
      trigger_condition: "capability evidence missing",
      consequence: "block-assignment",
      recovery_action: "add capability evidence"
    }],
    characterLabel: "Builder",
    speechBubble: "I can be evaluated.",
    currentAction: "Evaluate assignment",
    confidenceLabel: "medium",
    visibleBlockers: [],
    nextAction: "Evaluate packet",
    sourceTaskId: "TASK-051",
    sourceParentSessionId: "SESS-PARENT-CLI"
  });
  const artifactPath = path.join(projectRoot, "assignment-evaluation.json");
  const result = spawnSync(process.execPath, [
    "./src/cli.js",
    "actor-assignment-evaluation-record",
    "--project", projectRoot,
    "--evaluation-id", "AAE-CLI-TASK-051",
    "--actor-skill-packet-ref", path.relative(projectRoot, packet.artifactPath),
    "--source-task-id", "TASK-051",
    "--source-parent-session-id", "SESS-PARENT-CLI",
    "--write-artifact", artifactPath
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, AOF_SUPPRESS_NODE_WARNING: "1" }
  });
  assert.equal(result.status, 0, result.stderr);
  const cliPayload = JSON.parse(result.stdout);
  assert.equal(cliPayload.payload.assignment_decision.assignment_state, "selected");
  const written = JSON.parse(await fs.readFile(artifactPath, "utf8"));
  assert.equal(written.evaluation_id, "AAE-CLI-TASK-051");
  await validateWithBundledSchema(written, "aof-actor-assignment-evaluation.schema.json", "CLI actor assignment evaluation");
});

test("actorExecutionGateRecordCommand gates assignment through resource and policy evidence", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const packet = await actorSkillPacketRecordCommand({
    project: projectRoot,
    packetId: "ASP-TASK-052-GATE",
    objective: "Gate a selected actor before execution.",
    actorRef: "codex",
    roleRef: "builder",
    teamRef: "runtime-team",
    assignmentReason: "Builder has sufficient evidence for the gate test.",
    executionMode: "single-actor",
    requiredSkillRefs: ["skill-schema-review"],
    capabilityFit: [{
      capability_ref: "cap-schema-review",
      fit_state: "sufficient",
      evidence_refs: ["schemas/aof-actor-assignment-evaluation.schema.json"],
      rationale: "Assignment has sufficient evidence before resource and policy gates."
    }],
    resourceRefs: ["resource-repo-main"],
    policyRefs: ["policy-runtime-backed-answer-discipline"],
    outputArtifactType: "actor-execution-gate",
    outputArtifactSchemaRef: "schemas/aof-actor-execution-gate.schema.json",
    requiredSections: ["resource_gate", "policy_gate", "gate_decision"],
    acceptanceCriteria: ["gate explains execution readiness"],
    reviewCriteria: [{
      criterion: "Gate explains resource and policy readiness.",
      evaluator_ref: "guardian",
      evidence_required: "resource claim and policy evaluation refs",
      blocking: true
    }],
    blockerSemantics: [{
      blocker_code: "missing-resource-or-policy-evidence",
      trigger_condition: "resource claim or policy evaluation is missing",
      consequence: "block-assignment",
      recovery_action: "add resource and policy evidence"
    }],
    characterLabel: "Builder",
    speechBubble: "I can execute only after resource and policy gates pass.",
    currentAction: "Evaluate execution gate",
    confidenceLabel: "medium",
    visibleBlockers: [],
    nextAction: "Run execution gate",
    sourceTaskId: "TASK-052",
    sourceParentSessionId: "SESS-MQM6-V50-SKILLFUL-ACTOR"
  });
  const assignment = await actorAssignmentEvaluationRecordCommand({
    project: projectRoot,
    evaluationId: "AAE-TASK-052-GATE",
    actorSkillPacketRef: path.relative(projectRoot, packet.artifactPath),
    sourceTaskId: "TASK-052",
    sourceParentSessionId: "SESS-MQM6-V50-SKILLFUL-ACTOR"
  });
  const resourceClaim = await resourceClaimRecordCommand({
    project: projectRoot,
    claimId: "RCL-TASK-052-APPROVED",
    subjectRef: assignment.payload.evaluation_id,
    resourceRef: "resource-repo-main",
    claimantRoleRef: "builder",
    claimScope: "repo writes for TASK-052 gate implementation",
    claimStatus: "approved",
    approvalPolicyRefs: ["policy-main-branch-access"],
    justification: "The actor needs repo access to implement the gate.",
    sourceTaskId: "TASK-052",
    sourceParentSessionId: "SESS-MQM6-V50-SKILLFUL-ACTOR"
  });
  const allowedPolicy = await policyEvaluationReportCommand({
    project: projectRoot,
    evaluationId: "PER-TASK-052-ALLOWED",
    subjectRef: assignment.payload.evaluation_id,
    evaluationScope: "actor execution gate",
    policyRefs: ["policy-runtime-backed-answer-discipline"],
    overallOutcome: "allowed",
    results: [{
      policy_id: "policy-runtime-backed-answer-discipline",
      effect: "allow",
      outcome: "allowed",
      reason: "runtime evidence is present",
      blocking: false
    }],
    recommendedActions: ["Proceed"],
    sourceTaskId: "TASK-052",
    sourceParentSessionId: "SESS-MQM6-V50-SKILLFUL-ACTOR"
  });

  const allowed = await actorExecutionGateRecordCommand({
    project: projectRoot,
    gateId: "AEG-TASK-052-ALLOWED",
    actorAssignmentEvaluationRef: path.relative(projectRoot, assignment.artifactPath),
    resourceClaimRefs: [path.relative(projectRoot, resourceClaim.artifactPath)],
    policyEvaluationRefs: [path.relative(projectRoot, allowedPolicy.artifactPath)],
    sourceTaskId: "TASK-052",
    sourceParentSessionId: "SESS-MQM6-V50-SKILLFUL-ACTOR"
  });
  assert.equal(allowed.payload.gate_decision.execution_gate_state, "allowed");
  assert.equal(allowed.payload.resource_gate.state, "allowed");
  assert.equal(allowed.payload.policy_gate.state, "allowed");
  await validateWithBundledSchema(allowed.payload, "aof-actor-execution-gate.schema.json", "actor execution gate");

  const missingPolicy = await actorExecutionGateRecordCommand({
    project: projectRoot,
    gateId: "AEG-TASK-052-MISSING-POLICY",
    actorAssignmentEvaluationRef: path.relative(projectRoot, assignment.artifactPath),
    resourceClaimRefs: [path.relative(projectRoot, resourceClaim.artifactPath)],
    policyEvaluationRefs: [],
    sourceTaskId: "TASK-052"
  });
  assert.equal(missingPolicy.payload.gate_decision.execution_gate_state, "blocked");
  assert.deepEqual(missingPolicy.payload.policy_gate.missing_policy_refs, ["policy-runtime-backed-answer-discipline"]);

  const reviewPolicy = await policyEvaluationReportCommand({
    project: projectRoot,
    evaluationId: "PER-TASK-052-REVIEW",
    subjectRef: assignment.payload.evaluation_id,
    evaluationScope: "actor execution gate",
    policyRefs: ["policy-runtime-backed-answer-discipline"],
    overallOutcome: "requires-review",
    results: [{
      policy_id: "policy-runtime-backed-answer-discipline",
      effect: "require-review",
      outcome: "requires-review",
      reason: "runtime-backed claims still require review",
      blocking: false
    }],
    recommendedActions: ["Submit to council review"],
    sourceTaskId: "TASK-052"
  });
  const requiresReview = await actorExecutionGateRecordCommand({
    project: projectRoot,
    gateId: "AEG-TASK-052-REVIEW",
    actorAssignmentEvaluationRef: path.relative(projectRoot, assignment.artifactPath),
    resourceClaimRefs: [path.relative(projectRoot, resourceClaim.artifactPath)],
    policyEvaluationRefs: [path.relative(projectRoot, reviewPolicy.artifactPath)],
    sourceTaskId: "TASK-052"
  });
  assert.equal(requiresReview.payload.gate_decision.execution_gate_state, "requires-council-review");
  assert.match(requiresReview.payload.hri_projection.speech_bubble, /council review/);
});

test("committed actor execution gate fixtures stay schema-valid", async () => {
  const fixtureRoot = path.join(repoRoot, ".aof", "artifacts", "benchmarks", "fixtures");
  const claim = JSON.parse(await fs.readFile(path.join(fixtureRoot, "RCL-TASK-052-REPO-MAIN.json"), "utf8"));
  const policy = JSON.parse(await fs.readFile(path.join(fixtureRoot, "PER-TASK-052-RUNTIME-DISCIPLINE.json"), "utf8"));
  const gate = JSON.parse(await fs.readFile(path.join(fixtureRoot, "AEG-TASK-052-REQUIRES-REVIEW.json"), "utf8"));
  await validateWithBundledSchema(claim, "aof-resource-claim.schema.json", "resource claim fixture");
  await validateWithBundledSchema(policy, "aof-policy-evaluation-report.schema.json", "policy evaluation fixture");
  await validateWithBundledSchema(gate, "aof-actor-execution-gate.schema.json", "actor execution gate fixture");
  assert.equal(gate.gate_decision.execution_gate_state, "requires-council-review");
});

test("CLI actor-execution-gate-record writes gate artifact", async (t) => {
  const artifactPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "aof-gate-cli-")), "gate.json");
  const result = spawnSync(process.execPath, [
    "./src/cli.js",
    "actor-execution-gate-record",
    "--project", repoRoot,
    "--gate-id", "AEG-CLI-TASK-052",
    "--actor-assignment-evaluation-ref", ".aof/artifacts/benchmarks/fixtures/AAE-TASK-051-SELECTED.json",
    "--resource-claim-ref", ".aof/artifacts/benchmarks/fixtures/RCL-TASK-052-REPO-MAIN.json",
    "--policy-evaluation-ref", ".aof/artifacts/benchmarks/fixtures/PER-TASK-052-RUNTIME-DISCIPLINE.json",
    "--source-task-id", "TASK-052",
    "--source-parent-session-id", "SESS-PARENT-CLI",
    "--write-artifact", artifactPath
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, AOF_SUPPRESS_NODE_WARNING: "1" }
  });
  assert.equal(result.status, 0, result.stderr);
  const cliPayload = JSON.parse(result.stdout);
  assert.equal(cliPayload.payload.gate_decision.execution_gate_state, "requires-council-review");
  const written = JSON.parse(await fs.readFile(artifactPath, "utf8"));
  assert.equal(written.gate_id, "AEG-CLI-TASK-052");
  await validateWithBundledSchema(written, "aof-actor-execution-gate.schema.json", "CLI actor execution gate");
});

test("skillfulActorBenchmarkCommand proves v5.0 negative actor checks", async () => {
  const artifactPath = path.join(os.tmpdir(), "aof-skillful-actor-benchmark-test.json");
  const result = await skillfulActorBenchmarkCommand({
    project: repoRoot,
    artifactPath
  });
  assert.equal(result.ok, true);
  assert.equal(result.summary.summary.failed, 0);
  assert.equal(result.summary.summary.total, 6);
  assert.equal(result.summary.benchmarks["SAB-001"].status, "pass");
  assert.equal(result.summary.benchmarks["SAB-002"].status, "pass");
  assert.equal(result.summary.benchmarks["SAB-003"].status, "pass");
  assert.equal(result.summary.benchmarks["SAB-004"].status, "pass");
  assert.equal(result.summary.benchmarks["SAB-005"].status, "pass");
  assert.equal(result.summary.benchmarks["SAB-006"].status, "pass");
  const written = JSON.parse(await fs.readFile(artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-skillful-actor-benchmark.schema.json", "skillful actor benchmark");
});

test("CLI skillful-actor-benchmark writes benchmark artifact", async () => {
  const artifactPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "aof-sab-cli-")), "benchmark.json");
  const result = spawnSync(process.execPath, [
    "./src/cli.js",
    "skillful-actor-benchmark",
    "--project", repoRoot,
    "--write-artifact", artifactPath
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, AOF_SUPPRESS_NODE_WARNING: "1" }
  });
  assert.equal(result.status, 0, result.stderr);
  const cliPayload = JSON.parse(result.stdout);
  assert.equal(cliPayload.ok, true);
  assert.equal(cliPayload.summary.summary.failed, 0);
  const written = JSON.parse(await fs.readFile(artifactPath, "utf8"));
  assert.equal(written.artifact_type, "skillful-actor-benchmark");
  assert.equal(written.benchmarks["SAB-004"].status, "pass");
});

test("skillfulActorHriProjectionCommand projects actor gate state into HRI", async () => {
  const artifactPath = path.join(os.tmpdir(), "aof-skillful-actor-hri-projection-test.json");
  const result = await skillfulActorHriProjectionCommand({
    project: repoRoot,
    projectionId: "SAHRI-TASK-054-TEST",
    actorSkillPacketRef: ".aof/artifacts/benchmarks/fixtures/ASP-TASK-050-BUILDER.json",
    actorAssignmentEvaluationRef: ".aof/artifacts/benchmarks/fixtures/AAE-TASK-051-SELECTED.json",
    actorExecutionGateRef: ".aof/artifacts/benchmarks/fixtures/AEG-TASK-052-REQUIRES-REVIEW.json",
    skillfulActorBenchmarkRef: ".aof/artifacts/benchmarks/fixtures/SAB-TASK-053-GREEN.json",
    sourceTaskId: "TASK-054",
    sourceParentSessionId: "SESS-MQM6-V50-SKILLFUL-ACTOR",
    artifactPath
  });

  assert.equal(result.ok, true);
  assert.equal(result.payload.actor.character_label, "Builder");
  assert.equal(result.payload.visible_state.execution_gate_state, "requires-council-review");
  assert.equal(result.payload.visible_state.benchmark_status, "pass");
  assert.equal(result.payload.visible_state.council_review_needed, true);
  assert.equal(result.payload.self_hosting_proof_chain.length, 5);

  const written = JSON.parse(await fs.readFile(artifactPath, "utf8"));
  await validateWithBundledSchema(written, "aof-skillful-actor-hri-projection.schema.json", "skillful actor HRI projection");
});

test("CLI skillful-actor-hri-projection writes HRI projection artifact", async () => {
  const artifactPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "aof-sahri-cli-")), "projection.json");
  const result = spawnSync(process.execPath, [
    "./src/cli.js",
    "skillful-actor-hri-projection",
    "--project", repoRoot,
    "--projection-id", "SAHRI-CLI-TASK-054",
    "--actor-skill-packet-ref", ".aof/artifacts/benchmarks/fixtures/ASP-TASK-050-BUILDER.json",
    "--actor-assignment-evaluation-ref", ".aof/artifacts/benchmarks/fixtures/AAE-TASK-051-SELECTED.json",
    "--actor-execution-gate-ref", ".aof/artifacts/benchmarks/fixtures/AEG-TASK-052-REQUIRES-REVIEW.json",
    "--skillful-actor-benchmark-ref", ".aof/artifacts/benchmarks/fixtures/SAB-TASK-053-GREEN.json",
    "--source-task-id", "TASK-054",
    "--source-parent-session-id", "SESS-MQM6-V50-SKILLFUL-ACTOR",
    "--write-artifact", artifactPath
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, AOF_SUPPRESS_NODE_WARNING: "1" }
  });
  assert.equal(result.status, 0, result.stderr);
  const cliPayload = JSON.parse(result.stdout);
  assert.equal(cliPayload.payload.visible_state.execution_gate_state, "requires-council-review");
  const written = JSON.parse(await fs.readFile(artifactPath, "utf8"));
  assert.equal(written.projection_id, "SAHRI-CLI-TASK-054");
  await validateWithBundledSchema(written, "aof-skillful-actor-hri-projection.schema.json", "CLI skillful actor HRI projection");
});

test("visibilityExportCommand includes committed Skillful Actor HRI projection", async () => {
  const result = await visibilityExportCommand({ project: repoRoot });
  const projection = result.payloads.operator_brief.current_state.skillful_actor_projection;
  assert.equal(projection.projection_id, "SAHRI-TASK-054-PROOF");
  assert.equal(projection.actor.character_label, "Builder");
  assert.equal(projection.visible_state.execution_gate_state, "requires-council-review");
  assert.equal(result.payloads.mission_control.skillful_actor_projection.projection_id, "SAHRI-TASK-054-PROOF");
});

test("discoveryHandoffBenchmarkCommand fails when handoff lacks need-validation linkage", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const questionSet = await discoveryQuestionSetRecordCommand({
    project: projectRoot,
    discoveryObjective: "Test missing linkage",
    keyQuestions: ["Can linkage be omitted?"],
    targetUserOrMarketSlice: "test",
    signals: ["handoff if everything else is present"],
    sourceTaskId: "TASK-DHB-NOLINK"
  });
  const assumptionMap = await assumptionMapRecordCommand({
    project: projectRoot,
    subject: "missing linkage case",
    assumptions: [{
      assumption: "Everything except charter linkage exists",
      assumption_type: "technology",
      confidence: 0.6,
      evidence_state: "moderate",
      break_test_question: "Will the benchmark catch the missing linkage?"
    }],
    sourceTaskId: "TASK-DHB-NOLINK"
  });
  const anomalyLog = await anomalyLogRecordCommand({
    project: projectRoot,
    subject: "missing linkage case",
    anomalies: [{
      observed_anomaly: "No project charter is linked",
      why_it_matters: "The chain should fail linkage checks",
      challenged_assumption: "The chain is project-ready",
      follow_up_recommendation: "Require a linked charter"
    }],
    sourceTaskId: "TASK-DHB-NOLINK"
  });
  await discoveryJudgmentPacketCommand({
    project: projectRoot,
    councilId: "discovery-council",
    judgmentStatus: "synthesize-handoff",
    decisionSummary: "The chain can hand off.",
    rationale: "Everything except final linkage exists.",
    desirabilityAssessment: "Useful for test coverage.",
    feasibilityAssessment: "Simple to reproduce.",
    riskAssessment: "Missing linkage should still block the benchmark.",
    evidenceQualityState: "sufficient",
    recommendedNextStep: "Create a handoff.",
    questionSetRefs: [path.relative(projectRoot, questionSet.artifactPath).replaceAll("\\", "/")],
    artifactRefs: [
      path.relative(projectRoot, assumptionMap.artifactPath).replaceAll("\\", "/"),
      path.relative(projectRoot, anomalyLog.artifactPath).replaceAll("\\", "/")
    ],
    promotionReady: true,
    handoffRequired: true,
    sourceTaskId: "TASK-DHB-NOLINK"
  });
  const handoff = await discoveryHandoffRecordCommand({
    project: projectRoot,
    selectedNeed: "Test missing linkage",
    intendedUserOrSegment: "test segment",
    contextSummary: "Linked charter is absent",
    hypothesis: "DH-004 should fail",
    evidenceRefs: ["docs/test.md"],
    rejectedAlternatives: ["pretend linkage is enough"],
    explicitRisks: ["charter is missing"],
    deliveryValidationRequirements: ["linked charter must exist"],
    need: "Test missing linkage",
    intent: "Fail DH-004",
    context: "No linked charter exists",
    sourceTaskId: "TASK-DHB-NOLINK"
  });
  const problem = await problemStatementRecordCommand({
    project: projectRoot,
    affectedParty: "test user",
    actualProblem: "Linked charter is absent",
    whyItMatters: "The chain should fail",
    whyNow: "Coverage for DH-004 is needed",
    evidenceRefs: ["docs/test.md"]
  });
  const value = await valueHypothesisRecordCommand({
    project: projectRoot,
    expectedValueCreation: "Catch missing linkage",
    beneficiary: "test user",
    supportingEvidence: ["benchmark expectations"],
    successCriteria: ["DH-004 fails"]
  });
  const alternatives = await alternativeAnalysisRecordCommand({
    project: projectRoot,
    subjectNeed: "Test missing linkage",
    alternativeSolutions: ["link the charter correctly"],
    stopOptions: ["stop the chain"]
  });
  await needValidationRecordCommand({
    project: projectRoot,
    rawNeed: "Test missing linkage",
    validationStatus: "validated",
    validatedNeed: "Test missing linkage",
    decisionSummary: "The benchmark should detect missing charter linkage.",
    authorityAction: "approve-project-charter",
    projectCreationRecommendation: "create-project",
    validationQuestionsAnswered: [
      { question: "Who is affected?", answer: "test user", evidence_state: "sufficient" }
    ],
    hiddenAssumptions: [],
    evidenceGaps: [],
    problemStatementRef: path.relative(projectRoot, problem.artifactPath).replaceAll("\\", "/"),
    valueHypothesisRef: path.relative(projectRoot, value.artifactPath).replaceAll("\\", "/"),
    alternativeAnalysisRef: path.relative(projectRoot, alternatives.artifactPath).replaceAll("\\", "/"),
    discoveryHandoffRef: path.relative(projectRoot, handoff.artifactPath).replaceAll("\\", "/"),
    sourceTaskId: "TASK-DHB-NOLINK"
  });

  const result = await discoveryHandoffBenchmarkCommand({
    project: projectRoot
  });

  assert.equal(result.ok, false);
  assert.equal(result.summary.benchmarks["DH-004"].status, "fail");
});

test("roleResultRecordCommand writes a valid execution role result artifact", async (t) => {
  const projectRoot = await createInitializedProject(t);

  const result = await roleResultRecordCommand({
    project: projectRoot,
    role: "Builder",
    stage: "planning",
    sessionId: "SESS-BUILD-001",
    status: "completed",
    recommendation: "Merge into the team packet.",
    rationale: "Implementation direction is coherent.",
    signals: ["guardian review pending"],
    artifactRefs: ["docs/v6.0-release-definition.md"],
    decisionRequired: true,
    sourceTaskId: "TASK-012",
    sourceParentSessionId: "SESS-PARENT-001",
    confidence: 0.8
  });

  assert.equal(result.ok, true);
  const payload = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  assert.equal(payload.result_type, "role-result");
  assert.equal(payload.session_id, "SESS-BUILD-001");
  assert.deepEqual(payload.signals, ["guardian review pending"]);
  assert.equal(payload.decision_required, true);
});

test("teamOutputRecordCommand derives missing roles and writes a valid team output artifact", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const roleResult = await roleResultRecordCommand({
    project: projectRoot,
    role: "Builder",
    stage: "planning",
    sessionId: "SESS-BUILD-001",
    status: "completed",
    recommendation: "Ready for aggregation.",
    rationale: "Builder packet is complete."
  });

  const result = await teamOutputRecordCommand({
    project: projectRoot,
    teamId: "runtime-team",
    stage: "planning",
    expectedRoles: ["Builder", "Guardian"],
    receivedRoles: ["Builder"],
    aggregateState: "waiting-for-missing-roles",
    blockingSignals: ["guardian pending"],
    recommendedNextStep: "Wait for Guardian role result.",
    joinedRoleResultRefs: [path.relative(projectRoot, roleResult.artifactPath)],
    sourceTaskId: "TASK-012",
    sourceParentSessionId: "SESS-PARENT-001"
  });

  assert.equal(result.ok, true);
  const payload = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  assert.deepEqual(payload.expected_roles, ["Builder", "Guardian"]);
  assert.deepEqual(payload.received_roles, ["Builder"]);
  assert.deepEqual(payload.missing_roles, ["Guardian"]);
  assert.equal(payload.aggregate_state, "waiting-for-missing-roles");
});

test("operatorBriefCommand writes a schema-valid operator briefing artifact", async (t) => {
  const projectRoot = await createInitializedProject(t);

  await fs.mkdir(path.join(projectRoot, ".aof", "goals"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".aof", "tasks", "open"), { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, ".aof", "goals", "operating-goal.json"),
    `${JSON.stringify({
      artifact_type: "operating-goal",
      content: "AOF needs a v3.8 operator briefing layer above runtime situation assessment."
    }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(projectRoot, ".aof", "goals", "next-value-slice.json"),
    `${JSON.stringify({
      artifact_type: "next-value-slice",
      content: "Define v3.8 as an operator briefing layer that compresses runtime situation judgment into one truthful answer surface for operators."
    }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(projectRoot, ".aof", "tasks", "open", "TASK-044.json"),
    `${JSON.stringify({
      task_id: "TASK-044",
      title: "Define v3.8 operator briefing layer above situation assessment",
      status: "open",
      created_at: "2026-06-18T11:56:21.341Z",
      updated_at: "2026-06-18T11:56:38.083Z",
      description: "Turn runtime situation judgment into a compact operator-facing brief."
    }, null, 2)}\n`,
    "utf8"
  );

  const result = await operatorBriefCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.brief.view_type, "operator_brief");
  assert.equal(result.brief.current_state.primary_frontier_task?.task_id, "TASK-044");
  assert.match(result.brief.next_action.recommended_action, /TASK-044/);
});

test("roleJoinRecordCommand derives missing roles and writes a valid orchestrator join artifact", async (t) => {
  const projectRoot = await createInitializedProject(t);

  const result = await roleJoinRecordCommand({
    project: projectRoot,
    stage: "planning",
    expectedRoles: ["Builder", "Guardian", "Visionary"],
    receivedRoles: ["Builder", "Guardian"],
    aggregateState: "waiting-for-missing-roles",
    blockingSignals: ["visionary pending"],
    recommendedNextStep: "Wait for Visionary role result.",
    receivedSessionIds: ["SESS-BUILD-001", "SESS-GUARD-001"],
    sourceTaskId: "TASK-011",
    sourceParentSessionId: "SESS-PARENT-001",
    summary: "Two of three child role outputs have arrived."
  });

  assert.equal(result.ok, true);
  const payload = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  assert.equal(payload.join_type, "role-join");
  assert.deepEqual(payload.expected_roles, ["Builder", "Guardian", "Visionary"]);
  assert.deepEqual(payload.received_roles, ["Builder", "Guardian"]);
  assert.deepEqual(payload.missing_roles, ["Visionary"]);
  assert.equal(payload.aggregate_state, "waiting-for-missing-roles");
});

test("CLI role-join-record accepts repeated role and session flags", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const artifactPath = path.join(projectRoot, ".aof", "artifacts", "execution", "role-joins", "RJOIN-CLI-001.json");

  const result = spawnSync(process.execPath, [
    "./src/cli.js",
    "role-join-record",
    "--project", projectRoot,
    "--stage", "planning",
    "--expected-role", "Visionary",
    "--expected-role", "Builder",
    "--expected-role", "Guardian",
    "--received-role", "Visionary",
    "--received-role", "Builder",
    "--received-role", "Guardian",
    "--aggregate-state", "ready-for-orchestrator-decision",
    "--recommended-next-step", "Submit the joined role outputs to council review.",
    "--received-session-id", "SESS-VISIONARY-001",
    "--received-session-id", "SESS-BUILDER-001",
    "--received-session-id", "SESS-GUARDIAN-001",
    "--join-status", "resolved",
    "--source-task-id", "TASK-047",
    "--source-parent-session-id", "SESS-PARENT-001",
    "--write-artifact", artifactPath
  ], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(await fs.readFile(artifactPath, "utf8"));
  assert.deepEqual(payload.expected_roles, ["Visionary", "Builder", "Guardian"]);
  assert.deepEqual(payload.received_roles, ["Visionary", "Builder", "Guardian"]);
  assert.deepEqual(payload.received_session_ids, ["SESS-VISIONARY-001", "SESS-BUILDER-001", "SESS-GUARDIAN-001"]);
  assert.equal(payload.join_status, "resolved");
});

test("councilReviewPacketCommand writes a valid council review packet", async (t) => {
  const projectRoot = await createInitializedProject(t);

  const result = await councilReviewPacketCommand({
    project: projectRoot,
    councilId: "architecture-council",
    stage: "review",
    reviewStatus: "changes-requested",
    decisionSummary: "Guardian evidence is still missing.",
    rationale: "Council approval requires both execution and risk views.",
    recommendation: "Collect Guardian output and resubmit.",
    targetAudience: "An operator deciding whether this slice is ready for external review.",
    expectedUserReaction: "The operator should block release because the evidence is incomplete.",
    blockingReasons: [
      "Guardian evidence is missing.",
      "The current packet cannot justify external confidence."
    ],
    artifactChangeRecommendations: [
      "Add the missing Guardian output summary.",
      "Show the missing evidence directly in the packet."
    ],
    organizationChangeRecommendations: [
      "Require a human-facing quality check before council approval."
    ],
    diagnosisCategory: "role-gap",
    diagnosisConfidence: 0.8,
    diagnosisEvidenceRefs: [
      ".aof/artifacts/execution/team-outputs/TOUT-001.json"
    ],
    humanOverrideSignal: "Owner judged the current packet not yet credible.",
    teamOutputRefs: [".aof/artifacts/execution/team-outputs/TOUT-001.json"],
    roleResultRefs: [".aof/artifacts/execution/role-results/RRES-001.json"],
    evidenceRefs: ["docs/v6.0-release-definition.md"],
    followUpTaskIds: ["TASK-012"],
    escalationRequired: false,
    sourceTaskId: "TASK-012",
    sourceParentSessionId: "SESS-PARENT-001"
  });

  assert.equal(result.ok, true);
  const payload = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  assert.equal(payload.packet_type, "council-review-packet");
  assert.equal(payload.review_status, "changes-requested");
  assert.equal(payload.target_audience, "An operator deciding whether this slice is ready for external review.");
  assert.equal(payload.expected_user_reaction, "The operator should block release because the evidence is incomplete.");
  assert.deepEqual(payload.blocking_reasons, [
    "Guardian evidence is missing.",
    "The current packet cannot justify external confidence."
  ]);
  assert.deepEqual(payload.organization_change_recommendations, [
    "Require a human-facing quality check before council approval."
  ]);
  assert.equal(payload.diagnosis_category, "role-gap");
  assert.equal(payload.diagnosis_confidence, 0.8);
  assert.deepEqual(payload.diagnosis_evidence_refs, [
    ".aof/artifacts/execution/team-outputs/TOUT-001.json"
  ]);
  assert.equal(payload.human_override_signal, "Owner judged the current packet not yet credible.");
  assert.deepEqual(payload.follow_up_task_ids, ["TASK-012"]);
});

test("executionLineageCommand aggregates execution artifacts by source task", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const roleResult = await roleResultRecordCommand({
    project: projectRoot,
    role: "Builder",
    stage: "planning",
    sessionId: "SESS-BUILD-001",
    status: "completed",
    recommendation: "Merge into the team packet.",
    rationale: "Builder execution is complete.",
    signals: ["guardian review pending"],
    sourceTaskId: "TASK-012",
    sourceParentSessionId: "SESS-PARENT-001"
  });
  const teamOutput = await teamOutputRecordCommand({
    project: projectRoot,
    teamId: "runtime-team",
    stage: "planning",
    expectedRoles: ["Builder", "Guardian"],
    receivedRoles: ["Builder"],
    aggregateState: "waiting-for-missing-roles",
    blockingSignals: ["guardian pending"],
    recommendedNextStep: "Wait for Guardian role result.",
    joinedRoleResultRefs: [path.relative(projectRoot, roleResult.artifactPath)],
    sourceTaskId: "TASK-012",
    sourceParentSessionId: "SESS-PARENT-001"
  });
  await roleJoinRecordCommand({
    project: projectRoot,
    stage: "planning",
    expectedRoles: ["Builder", "Guardian"],
    receivedRoles: ["Builder"],
    aggregateState: "waiting-for-missing-roles",
    blockingSignals: ["guardian pending"],
    recommendedNextStep: "Wait for Guardian role result.",
    receivedSessionIds: ["SESS-BUILD-001"],
    sourceTaskId: "TASK-012",
    sourceParentSessionId: "SESS-PARENT-001"
  });
  await councilReviewPacketCommand({
    project: projectRoot,
    councilId: "architecture-council",
    stage: "review",
    reviewStatus: "deferred",
    decisionSummary: "Waiting for complete team packet.",
    rationale: "Guardian output has not arrived.",
    recommendation: "Wait for Guardian role result.",
    teamOutputRefs: [path.relative(projectRoot, teamOutput.artifactPath)],
    roleResultRefs: [path.relative(projectRoot, roleResult.artifactPath)],
    followUpTaskIds: ["TASK-012"],
    sourceTaskId: "TASK-012",
    sourceParentSessionId: "SESS-PARENT-001"
  });

  const result = await executionLineageCommand({
    project: projectRoot,
    sourceTaskId: "TASK-012"
  });

  assert.equal(result.ok, true);
  assert.equal(result.payload.role_result_count, 1);
  assert.equal(result.payload.role_join_count, 1);
  assert.equal(result.payload.team_output_count, 1);
  assert.equal(result.payload.council_review_count, 1);
  assert.equal(result.payload.recommended_next_step, "Wait for Guardian role result.");
  assert.equal(result.payload.stages_observed.includes("planning"), true);
});

test("runtimeLoopProofCommand generates an auditable backend-neutral loop proof bundle", async (t) => {
  const projectRoot = await createTempProject(t);

  const result = await runtimeLoopProofCommand({
    project: projectRoot,
    provider: "mock",
    sourceTaskId: "TASK-011"
  });

  assert.equal(result.ok, true);
  assert.equal(result.payload.proof_type, "runtime-loop-proof");
  assert.equal(result.payload.proof_status, "passed");
  assert.equal(result.payload.phases.framing, "completed");
  assert.equal(result.payload.phases.review, "approved");
  assert.equal(result.payload.phases.outcome, "success");
  assert.equal(result.payload.role_result_refs.length, 2);
  assert.equal(typeof result.payload.role_join_ref, "string");
  assert.equal(typeof result.payload.execution_lineage_ref, "string");
  assert.equal(typeof result.payload.learning_loop_ref, "string");

  const proofArtifact = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  assert.equal(proofArtifact.proof_type, "runtime-loop-proof");

  const learningLoop = JSON.parse(await fs.readFile(path.join(projectRoot, result.payload.learning_loop_ref), "utf8"));
  assert.equal(learningLoop.learning_state.has_outcome_evidence, true);
  assert.equal(learningLoop.improvement_proposal.proposal_basis, "framework-self-audit");

  const lineage = JSON.parse(await fs.readFile(path.join(projectRoot, result.payload.execution_lineage_ref), "utf8"));
  assert.equal(lineage.role_result_count, 2);
  assert.equal(lineage.role_join_count, 1);
  assert.equal(lineage.team_output_count, 1);
  assert.equal(lineage.council_review_count, 1);
});

test("runtimeDisciplineBenchmarkCommand writes reusable RD-003 and RD-004 benchmark summaries", async (t) => {
  const projectRoot = await createTempProject(t);

  await runtimeLoopProofCommand({
    project: projectRoot,
    provider: "mock",
    sourceTaskId: "TASK-011"
  });
  await organizationAuditCommand({
    project: projectRoot
  });

  const result = await runtimeDisciplineBenchmarkCommand({
    project: projectRoot,
    sourceTaskId: "TASK-011"
  });

  assert.equal(result.ok, true);
  const payload = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  const markdown = await fs.readFile(result.markdownPath, "utf8");
  assert.equal(payload.artifact_type, "runtime-discipline-benchmark-run");
  assert.equal(payload.source_task_id, "TASK-011");
  assert.equal(payload.rd001.status, "pass");
  assert.equal(payload.rd001.task_count, 0);
  assert.equal(payload.rd001.execution_packet_count, 0);
  assert.equal(payload.rd002.status, "pass");
  assert.equal(payload.rd002.failure_family_count, 3);
  assert.equal(payload.rd002.failure_families.length, 3);
  const missingJoinFamily = payload.rd002.failure_families.find((family) => family.family_id === "missing-join-and-review");
  const missingCouncilFamily = payload.rd002.failure_families.find((family) => family.family_id === "missing-council-review-only");
  const missingTeamOutputFamily = payload.rd002.failure_families.find((family) => family.family_id === "missing-team-output-and-review");
  assert.deepEqual(missingJoinFamily.missing_artifact_refs, ["role-join", "team-output", "council-review"]);
  assert.equal(missingJoinFamily.role_result_count, 1);
  assert.equal(missingJoinFamily.role_join_count, 0);
  assert.deepEqual(missingCouncilFamily.missing_artifact_refs, ["council-review"]);
  assert.equal(missingCouncilFamily.role_join_count, 1);
  assert.equal(missingCouncilFamily.team_output_count, 1);
  assert.deepEqual(missingTeamOutputFamily.missing_artifact_refs, ["team-output", "council-review"]);
  assert.equal(missingTeamOutputFamily.role_join_count, 1);
  assert.equal(missingTeamOutputFamily.team_output_count, 0);
  assert.equal(payload.rd003.status, "pass");
  assert.equal(payload.rd004.status, "pass");
  assert.equal(typeof payload.rd004.generated_audit_note_ref, "string");
  assert.equal(typeof payload.rd004.generated_audit_packet_ref, "string");
  assert.equal(typeof payload.rd004.generated_reconstruction_map_ref, "string");
  assert.equal(typeof payload.rd004.generated_audit_index_ref, "string");
  assert.equal(typeof payload.rd004.generated_audit_gate_ref, "string");
  assert.equal(typeof payload.rd004.generated_audit_shortcut_ref, "string");
  assert.equal(payload.rd004.primary_artifact_count > 0, true);
  assert.equal(payload.rd004.extended_artifact_count >= payload.rd004.primary_artifact_count, true);
  assert.equal(payload.rd004.audit_cost_score > 0, true);
  assert.equal(payload.rd004.cost_thresholds.primary_artifact_limit, 4);
  assert.equal(payload.rd004.cost_thresholds.extended_artifact_limit, 13);
  assert.equal(payload.rd004.cost_thresholds.score_limit, 17);
  const auditPacket = JSON.parse(await fs.readFile(path.join(projectRoot, payload.rd004.generated_audit_packet_ref), "utf8"));
  const reconstructionMap = JSON.parse(await fs.readFile(path.join(projectRoot, payload.rd004.generated_reconstruction_map_ref), "utf8"));
  const auditIndex = JSON.parse(await fs.readFile(path.join(projectRoot, payload.rd004.generated_audit_index_ref), "utf8"));
  const auditGate = JSON.parse(await fs.readFile(path.join(projectRoot, payload.rd004.generated_audit_gate_ref), "utf8"));
  const auditShortcut = JSON.parse(await fs.readFile(path.join(projectRoot, payload.rd004.generated_audit_shortcut_ref), "utf8"));
  assert.equal(auditPacket.packet_type, "rd004-human-audit-summary");
  assert.equal(auditPacket.review_checklist.length, 5);
  assert.equal(auditPacket.review_checklist.every((entry) => entry.status === "pass"), true);
  assert.equal(auditPacket.fail_triggers.length, 4);
  assert.equal(auditPacket.audit_cost_score, payload.rd004.audit_cost_score);
  assert.equal(reconstructionMap.packet_type, "rd004-audit-reconstruction-map");
  assert.equal(reconstructionMap.reconstruction_steps.length, 4);
  assert.equal(reconstructionMap.negative_runtime_families.length, 3);
  assert.equal(reconstructionMap.audit_cost.score, payload.rd004.audit_cost_score);
  assert.equal(auditIndex.packet_type, "rd004-audit-index");
  assert.equal(auditIndex.low_cost_review_path.length, 4);
  assert.equal(auditIndex.compressed_counts.primary_artifact_count, payload.rd004.primary_artifact_count);
  assert.equal(auditIndex.required_refs.generated_reconstruction_map_ref, payload.rd004.generated_reconstruction_map_ref);
  assert.equal(auditGate.packet_type, "rd004-audit-gate");
  assert.equal(auditGate.gate_count, 4);
  assert.equal(auditGate.blocking_gate_count, 0);
  assert.equal(auditGate.gates.every((gate) => gate.status === "pass"), true);
  assert.equal(auditShortcut.packet_type, "rd004-audit-shortcut");
  assert.equal(auditShortcut.low_cost_review_path.length, 4);
  assert.equal(auditShortcut.gate_checks.length, 4);
  assert.equal(auditShortcut.gate_checks.every((gate) => gate.status === "pass"), true);
  assert.equal(auditShortcut.canonical_review_surface.runtime_loop_proof_ref, payload.runtime_loop_proof_ref);
  assert.equal(auditShortcut.negative_runtime_family_ids.length, 3);
  assert.equal(Number.isInteger(payload.audit.organization_checks.passed), true);
  assert.equal(Number.isInteger(payload.audit.decision_checks.passed), true);
  assert.match(markdown, /RD-001/);
  assert.match(markdown, /RD-002/);
  assert.match(markdown, /missing-council-review-only/);
  assert.match(markdown, /missing-team-output-and-review/);
  assert.match(markdown, /RD-004/);
  assert.match(markdown, /Generated audit note/);
  assert.match(markdown, /Generated audit packet/);
  assert.match(markdown, /Generated reconstruction map/);
  assert.match(markdown, /Generated audit index/);
  assert.match(markdown, /Generated audit gate/);
  assert.match(markdown, /Generated audit shortcut/);
  assert.match(markdown, /Remaining Gap/);
});

test("organizationAnalyticsSnapshotCommand writes an inspectable organization analytics artifact", async (t) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aof-analytics-"));
  const projectRoot = path.join(tempRoot, "target-project");
  await fs.mkdir(projectRoot, { recursive: true });
  t.after(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  await initProjectCommand({
    project: projectRoot,
    topology: "managed-project",
    projectType: "web-app",
    domainSummary: "Internal operations dashboard",
    installMode: "runtime-on"
  });

  await taskOpenCommand({
    project: projectRoot,
    title: "Create analytics slice"
  });

  const result = await organizationAnalyticsSnapshotCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(result.payload.snapshot_type, "aof-organization-analytics");
  assert.equal(typeof result.payload.contract_health.coverage_ratio, "number");
  assert.ok(Array.isArray(result.payload.observations));
});

test("organizationStatusCommand returns an operator-facing organization summary", async (t) => {
  const projectRoot = await createInitializedProject(t);

  const result = await organizationStatusCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(result.topology, "managed-project");
  assert.equal(typeof result.goals.next_value_slice, "string");
  assert.equal(result.organization_summary.council_count > 0, true);
  assert.equal(result.command_surface.command_registry_present, true);
  assert.equal(result.command_surface.command_count > 0, true);
});

test("commandRegistryRefreshCommand writes the canonical command registry artifact", async (t) => {
  const projectRoot = await createInitializedProject(t);

  const result = await commandRegistryRefreshCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  const registry = JSON.parse(await fs.readFile(result.artifactPath, "utf8"));
  assert.equal(registry.artifact_type, "command-registry");
  assert.equal(registry.commands.some((entry) => entry.command === "command-register"), true);
  assert.equal(registry.commands.some((entry) => entry.command === "external-runtime-resource-record"), true);
  assert.equal(registry.commands.some((entry) => entry.command === "external-resource-use-record"), true);
  assert.equal(registry.commands.some((entry) => entry.command === "external-resource-audit"), true);
  assert.equal(registry.commands.some((entry) => entry.command === "provider-adapter-record"), true);
  assert.equal(registry.commands.some((entry) => entry.command === "provider-adapter-audit"), true);
  assert.equal(typeof result.orientationPath, "string");
  const orientation = JSON.parse(await fs.readFile(result.orientationPath, "utf8"));
  const registryTopCommands = registry.commands.filter((entry) => entry.top_command).map((entry) => entry.command).sort();
  const orientationTopCommands = orientation.command_routing_summary.top_commands.map((entry) => entry.command).sort();
  assert.deepEqual(orientationTopCommands, registryTopCommands);
});

test("external resource commands write bounded records and audit read-only use", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "docs", "external-output.md"), "# External Output\n", "utf8");
  await taskOpenCommand({
    project: projectRoot,
    title: "Use governed external reference",
    description: "Fixture task for external resource governance.",
    origin: "human"
  });
  const taskRef = ".aof/tasks/open/TASK-001.json";
  const sessionResult = await agentSessionRecordCommand({
    project: projectRoot,
    sessionId: "SESS-EXTERNAL-READ",
    actorRef: "codex",
    roleRef: "builder",
    events: [{
      eventType: "tool_call",
      summary: "Read an external reference under an approved boundary."
    }],
    taskRefs: [taskRef],
    requirementRefs: ["docs/external-output.md"],
    testEvidenceRefs: ["docs/external-output.md"],
    artifactRefs: ["docs/external-output.md"],
    releaseReadyVerdict: "structurally_ready",
    releaseReadyEvidenceRefs: ["docs/external-output.md"],
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-EXTERNAL-READ"
  });
  const sessionRef = path.relative(projectRoot, sessionResult.artifactPath).replaceAll(path.sep, "/");

  const resourceResult = await externalRuntimeResourceRecordCommand({
    project: projectRoot,
    resourceId: "ERR-TEST-REFERENCE",
    resourceKind: "reference",
    displayName: "Test external reference",
    canonicalRef: "https://example.invalid/reference",
    sourceSystem: "example",
    ownerRef: "runtime-team",
    sourceOfTruth: "fixture reference boundary",
    permissionBoundary: "read-only fixture",
    freshnessBoundary: "static fixture",
    availabilityBoundary: "local test artifact",
    approvalBoundary: "read does not require approval",
    sideEffectBoundary: "no side effects",
    allowedOperations: ["read"],
    readinessStatus: "ready",
    notProven: "This fixture does not prove external semantic truth.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-EXTERNAL-READ"
  });
  const resourceRef = path.relative(projectRoot, resourceResult.artifactPath).replaceAll(path.sep, "/");

  await externalResourceUseRecordCommand({
    project: projectRoot,
    useId: "ERU-TEST-READ",
    workItemId: "TASK-001",
    workItemRef: taskRef,
    sessionRef,
    resourceRef,
    usePurpose: "Read a governed reference during test work.",
    operationType: "read",
    approvalStatus: "not_required",
    executionStatus: "executed",
    outputArtifactRefs: ["docs/external-output.md"],
    riskCandidates: ["semantic truth not proven"],
    decisionCandidates: ["keep external reference bounded"],
    notProven: "This use record proves only bounded read linkage.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-EXTERNAL-READ"
  });

  const audit = await externalResourceAuditCommand({ project: projectRoot });
  assert.equal(audit.ok, true);
  assert.equal(audit.summary.summary.resource_count, 1);
  assert.equal(audit.summary.summary.use_count, 1);
  assert.equal(audit.summary.errors.length, 0);
});

test("externalResourceAuditCommand fails unapproved external writes", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await taskOpenCommand({
    project: projectRoot,
    title: "Attempt external write",
    description: "Fixture task for external write gate.",
    origin: "human"
  });
  const taskRef = ".aof/tasks/open/TASK-001.json";
  const sessionResult = await agentSessionRecordCommand({
    project: projectRoot,
    sessionId: "SESS-EXTERNAL-WRITE",
    actorRef: "codex",
    roleRef: "builder",
    events: [{
      eventType: "tool_call",
      summary: "Attempted external write without approval."
    }],
    taskRefs: [taskRef],
    requirementRefs: [taskRef],
    testEvidenceRefs: [taskRef],
    artifactRefs: [taskRef],
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-EXTERNAL-WRITE"
  });
  const sessionRef = path.relative(projectRoot, sessionResult.artifactPath).replaceAll(path.sep, "/");
  const resourceResult = await externalRuntimeResourceRecordCommand({
    project: projectRoot,
    resourceId: "ERR-TEST-WRITE",
    resourceKind: "provider",
    displayName: "Test write provider",
    canonicalRef: "https://example.invalid/provider",
    sourceSystem: "example",
    ownerRef: "runtime-team",
    sourceOfTruth: "fixture provider boundary",
    permissionBoundary: "external writes require approval",
    freshnessBoundary: "static fixture",
    availabilityBoundary: "local test artifact",
    approvalBoundary: "Council approval required for external_write",
    sideEffectBoundary: "external write has side effects",
    allowedOperations: ["external_write"],
    readinessStatus: "ready",
    notProven: "This fixture does not prove write safety.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-EXTERNAL-WRITE"
  });
  const resourceRef = path.relative(projectRoot, resourceResult.artifactPath).replaceAll(path.sep, "/");

  await externalResourceUseRecordCommand({
    project: projectRoot,
    useId: "ERU-TEST-WRITE",
    workItemId: "TASK-001",
    workItemRef: taskRef,
    sessionRef,
    resourceRef,
    usePurpose: "Attempt an external write without explicit approval.",
    operationType: "external_write",
    approvalStatus: "not_required",
    executionStatus: "planned",
    outputArtifactRefs: [],
    riskCandidates: ["external write without approval"],
    decisionCandidates: ["block unapproved external write"],
    notProven: "This use record intentionally lacks approval.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-EXTERNAL-WRITE"
  });

  const audit = await externalResourceAuditCommand({ project: projectRoot });
  assert.equal(audit.ok, false);
  assert.ok(audit.summary.errors.some((entry) => entry.includes("approval status")));
});

test("provider adapter commands write bounded adapter contracts and audit readiness", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "docs", "adapter-policy.md"), "# Adapter Policy\n", "utf8");
  await taskOpenCommand({
    project: projectRoot,
    title: "Govern provider adapter",
    description: "Fixture task for provider adapter governance.",
    origin: "human"
  });

  const resourceResult = await externalRuntimeResourceRecordCommand({
    project: projectRoot,
    resourceId: "ERR-TEST-PROVIDER",
    resourceKind: "provider",
    displayName: "Test provider",
    canonicalRef: "https://example.invalid/provider",
    sourceSystem: "example",
    ownerRef: "runtime-team",
    sourceOfTruth: "fixture provider boundary",
    permissionBoundary: "read-only provider adapter fixture",
    freshnessBoundary: "freshness checked by adapter policy",
    availabilityBoundary: "local test artifact",
    approvalBoundary: "read does not require approval",
    sideEffectBoundary: "read-only provider use has no external mutation",
    allowedOperations: ["read"],
    readinessStatus: "ready",
    notProven: "This fixture does not prove provider semantic truth.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-PROVIDER-ADAPTER"
  });
  const resourceRef = path.relative(projectRoot, resourceResult.artifactPath).replaceAll(path.sep, "/");

  await providerAdapterRecordCommand({
    project: projectRoot,
    adapterId: "PAD-TEST-READ",
    displayName: "Read-only provider adapter",
    providerRef: "docs/adapter-policy.md",
    resourceRef,
    adapterKind: "read_only",
    operationModes: ["read"],
    readAuthorityBoundary: "Adapter may read provider output only for the linked work item.",
    writeAuthorityBoundary: "Adapter has no write authority.",
    freshnessCheck: "Operator must confirm provider context freshness before use.",
    approvalPolicyRef: "docs/adapter-policy.md",
    sideEffectBoundary: "No external side effects are allowed.",
    escalationRequiredFor: [],
    readinessStatus: "ready",
    notProven: "Adapter readiness does not prove provider output correctness.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-PROVIDER-ADAPTER"
  });

  const audit = await providerAdapterAuditCommand({ project: projectRoot });
  assert.equal(audit.ok, true);
  assert.equal(audit.summary.summary.adapter_count, 1);
  assert.equal(audit.summary.summary.ready_adapter_count, 1);
});

test("providerAdapterAuditCommand fails write-capable adapters without escalation", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "docs", "adapter-policy.md"), "# Adapter Policy\n", "utf8");
  await taskOpenCommand({
    project: projectRoot,
    title: "Attempt write adapter",
    description: "Fixture task for provider adapter escalation gate.",
    origin: "human"
  });

  const resourceResult = await externalRuntimeResourceRecordCommand({
    project: projectRoot,
    resourceId: "ERR-TEST-WRITE-PROVIDER",
    resourceKind: "provider",
    displayName: "Test write provider",
    canonicalRef: "https://example.invalid/provider",
    sourceSystem: "example",
    ownerRef: "runtime-team",
    sourceOfTruth: "fixture provider boundary",
    permissionBoundary: "external writes require approval",
    freshnessBoundary: "freshness checked by adapter policy",
    availabilityBoundary: "local test artifact",
    approvalBoundary: "Council approval required for external_write",
    sideEffectBoundary: "external write has side effects",
    allowedOperations: ["external_write"],
    readinessStatus: "ready",
    notProven: "This fixture does not prove provider write safety.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-PROVIDER-ADAPTER-WRITE"
  });
  const resourceRef = path.relative(projectRoot, resourceResult.artifactPath).replaceAll(path.sep, "/");

  await providerAdapterRecordCommand({
    project: projectRoot,
    adapterId: "PAD-TEST-WRITE",
    displayName: "Write-capable provider adapter",
    providerRef: "docs/adapter-policy.md",
    resourceRef,
    adapterKind: "external_write",
    operationModes: ["external_write"],
    readAuthorityBoundary: "Adapter may inspect write preconditions.",
    writeAuthorityBoundary: "Adapter may not write without explicit approval.",
    freshnessCheck: "Operator must confirm provider state before write.",
    approvalPolicyRef: "docs/adapter-policy.md",
    sideEffectBoundary: "External writes mutate provider state.",
    escalationRequiredFor: [],
    readinessStatus: "ready",
    notProven: "This fixture intentionally lacks write escalation.",
    sourceTaskId: "TASK-001",
    sourceParentSessionId: "SESS-PROVIDER-ADAPTER-WRITE"
  });

  const audit = await providerAdapterAuditCommand({ project: projectRoot });
  assert.equal(audit.ok, false);
  assert.ok(audit.summary.errors.some((entry) => entry.includes("write modes require escalation")));
});

test("commandRegisterCommand exposes command taxonomy and top commands", async (t) => {
  const projectRoot = await createInitializedProject(t);

  const result = await commandRegisterCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(result.command_count > 0, true);
  assert.equal(result.top_commands.includes("organization-status"), true);
  assert.equal(result.commands.some((entry) => entry.category === "verify"), true);
});

test("commandRoutingAuditCommand reports aligned routing surfaces as green", async (t) => {
  const projectRoot = await createInitializedProject(t);

  const result = await commandRoutingAuditCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.errors.length, 0);
});

test("commandRoutingAuditCommand detects routing drift", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const orientationPath = path.join(projectRoot, ".aof", "context", "active", "project-orientation.json");
  const orientation = JSON.parse(await fs.readFile(orientationPath, "utf8"));
  orientation.command_routing_summary.top_commands = [];
  await fs.writeFile(orientationPath, `${JSON.stringify(orientation, null, 2)}\n`, "utf8");

  const result = await commandRoutingAuditCommand({
    project: projectRoot
  });

  assert.equal(result.ok, false);
  assert.ok(result.summary.errors.some((entry) => entry.includes("top command")));
});

test("releaseStateRefreshCommand writes an active release manifest and repairs active refs", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await ensureReleaseContractFixture(projectRoot);

  const result = await releaseStateRefreshCommand({
    project: projectRoot,
    releaseVersion: "3.4.0",
    releaseTag: "v3.4.0",
    releaseDefinitionRef: "docs/v3.4-release-definition.md",
    releaseNotesRef: "docs/v3.4.0-release-notes.md",
    releaseChecklistRef: "docs/v3.4-release-checklist.md",
    organizationMission: "Keep the self-hosting runtime truthful about the active release baseline after a real release."
  });

  assert.equal(result.ok, true);
  const manifest = JSON.parse(await fs.readFile(result.activeReleaseManifestPath, "utf8"));
  const bootstrap = JSON.parse(await fs.readFile(path.join(projectRoot, ".aof", "project-bootstrap.json"), "utf8"));
  const organization = JSON.parse(await fs.readFile(path.join(projectRoot, ".aof", "organization.json"), "utf8"));
  const releaseContract = organization.contracts.find((contract) => contract.contract_id === "contract-governance-to-release");

  assert.equal(manifest.release_version, "3.4.0");
  assert.equal(bootstrap.aof_version, "3.4.0");
  assert.equal(releaseContract.artifact_ref, "docs/v3.4-release-definition.md");
  assert.match(organization.mission, /active release baseline/i);
});

test("releaseStateAuditCommand reports aligned release-state surfaces as green", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await ensureReleaseRefFixtures(projectRoot);
  await ensureReleaseContractFixture(projectRoot);
  await writeArchmapAuditFixture(projectRoot);
  await writeEvidenceIndependenceFixture(projectRoot);

  await releaseStateRefreshCommand({
    project: projectRoot,
    releaseVersion: "3.4.0",
    releaseTag: "v3.4.0",
    releaseDefinitionRef: "docs/v3.4-release-definition.md",
    releaseNotesRef: "docs/v3.4.0-release-notes.md",
    releaseChecklistRef: "docs/v3.4-release-checklist.md"
  });

  const result = await releaseStateAuditCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.summary.active_release.release_tag, "v3.4.0");
  assert.equal(result.summary.governance_audits.length, 3);
  assert.equal(result.summary.governance_audits.every((audit) => audit.ok), true);
  assert.equal(result.summary.errors.length, 0);
});

test("releaseStateAuditCommand includes quality ledger gate for v6.8 and later", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await ensureReleaseRefFixtures(projectRoot, {
    releaseDefinitionRef: "docs/v6.8-release-definition.md",
    releaseNotesRef: "docs/v6.8.0-release-notes.md",
    releaseChecklistRef: "docs/v6.8-release-checklist.md"
  });
  await ensureReleaseContractFixture(projectRoot);
  await writeArchmapAuditFixture(projectRoot);
  await writeEvidenceIndependenceFixture(projectRoot);
  await writeQualityLedgerFixture(projectRoot);

  await releaseStateRefreshCommand({
    project: projectRoot,
    releaseVersion: "6.8.0",
    releaseTag: "v6.8.0",
    releaseDefinitionRef: "docs/v6.8-release-definition.md",
    releaseNotesRef: "docs/v6.8.0-release-notes.md",
    releaseChecklistRef: "docs/v6.8-release-checklist.md"
  });

  const result = await releaseStateAuditCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  const ledgerAudit = result.summary.governance_audits.find((audit) => audit.name === "quality-ledger-audit");
  assert.equal(ledgerAudit.ok, true);
  assert.equal(ledgerAudit.scoped_task_count, 1);
  assert.equal(result.summary.errors.length, 0);
});

test("releaseStateAuditCommand fails v6.8 release when quality ledger audit fails", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await ensureReleaseRefFixtures(projectRoot, {
    releaseDefinitionRef: "docs/v6.8-release-definition.md",
    releaseNotesRef: "docs/v6.8.0-release-notes.md",
    releaseChecklistRef: "docs/v6.8-release-checklist.md"
  });
  await ensureReleaseContractFixture(projectRoot);
  await writeArchmapAuditFixture(projectRoot);
  await writeEvidenceIndependenceFixture(projectRoot);

  await releaseStateRefreshCommand({
    project: projectRoot,
    releaseVersion: "6.8.0",
    releaseTag: "v6.8.0",
    releaseDefinitionRef: "docs/v6.8-release-definition.md",
    releaseNotesRef: "docs/v6.8.0-release-notes.md",
    releaseChecklistRef: "docs/v6.8-release-checklist.md"
  });

  const result = await releaseStateAuditCommand({ project: projectRoot });

  assert.equal(result.ok, false);
  const ledgerAudit = result.summary.governance_audits.find((audit) => audit.name === "quality-ledger-audit");
  assert.equal(ledgerAudit.ok, false);
  assert.ok(result.summary.errors.some((entry) => entry.includes("quality-ledger-audit release gate")));
});

test("releaseStateAuditCommand detects bootstrap and contract drift", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await ensureReleaseRefFixtures(projectRoot);
  await ensureReleaseContractFixture(projectRoot);
  await writeArchmapAuditFixture(projectRoot);
  await writeEvidenceIndependenceFixture(projectRoot);

  await releaseStateRefreshCommand({
    project: projectRoot,
    releaseVersion: "3.4.0",
    releaseTag: "v3.4.0",
    releaseDefinitionRef: "docs/v3.4-release-definition.md",
    releaseNotesRef: "docs/v3.4.0-release-notes.md",
    releaseChecklistRef: "docs/v3.4-release-checklist.md"
  });

  const bootstrapPath = path.join(projectRoot, ".aof", "project-bootstrap.json");
  const organizationPath = path.join(projectRoot, ".aof", "organization.json");
  const bootstrap = JSON.parse(await fs.readFile(bootstrapPath, "utf8"));
  bootstrap.aof_version = "2.2.0";
  await fs.writeFile(bootstrapPath, `${JSON.stringify(bootstrap, null, 2)}\n`, "utf8");

  const organization = JSON.parse(await fs.readFile(organizationPath, "utf8"));
  const releaseContract = organization.contracts.find((contract) => contract.contract_id === "contract-governance-to-release");
  releaseContract.artifact_ref = "docs/v3.0-release-definition.md";
  await fs.writeFile(organizationPath, `${JSON.stringify(organization, null, 2)}\n`, "utf8");

  const result = await releaseStateAuditCommand({ project: projectRoot });

  assert.equal(result.ok, false);
  assert.ok(result.summary.errors.some((entry) => entry.includes("bootstrap version alignment")));
  assert.ok(result.summary.errors.some((entry) => entry.includes("governance release contract alignment")));
});

test("releaseStateAuditCommand fails when a v6.7 governance audit fails", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await ensureReleaseRefFixtures(projectRoot);
  await ensureReleaseContractFixture(projectRoot);
  await writeArchmapAuditFixture(projectRoot, { writeImpactRecord: false });
  await writeEvidenceIndependenceFixture(projectRoot);

  await releaseStateRefreshCommand({
    project: projectRoot,
    releaseVersion: "3.4.0",
    releaseTag: "v3.4.0",
    releaseDefinitionRef: "docs/v3.4-release-definition.md",
    releaseNotesRef: "docs/v3.4.0-release-notes.md",
    releaseChecklistRef: "docs/v3.4-release-checklist.md"
  });

  const result = await releaseStateAuditCommand({ project: projectRoot });

  assert.equal(result.ok, false);
  const archmapAudit = result.summary.governance_audits.find((audit) => audit.name === "archmap-impact-audit");
  assert.equal(archmapAudit.ok, false);
  assert.ok(result.summary.errors.some((entry) => entry.includes("archmap-impact-audit release gate")));
});

async function writeArchmapAuditFixture(projectRoot, {
  taskId = "TASK-071",
  taskStatusDir = "done",
  impactStatus = "archmap_update_required",
  councilReviewStatus = "approved",
  writeImpactRecord = true
} = {}) {
  const taskDir = path.join(projectRoot, ".aof", "tasks", taskStatusDir);
  const impactDir = path.join(projectRoot, ".aof", "artifacts", "archmap", "impact");
  const archmapDir = path.join(projectRoot, "docs", "archmaps");
  await fs.mkdir(taskDir, { recursive: true });
  await fs.mkdir(impactDir, { recursive: true });
  await fs.mkdir(archmapDir, { recursive: true });

  const taskRef = `.aof/tasks/${taskStatusDir}/${taskId}.json`;
  await fs.writeFile(path.join(projectRoot, taskRef), `${JSON.stringify({
    task_id: taskId,
    title: `${taskId} implementation work`,
    status: taskStatusDir === "done" ? "done" : "open",
    description: "Implementation-grade work item for Archmap audit coverage."
  }, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(archmapDir, "aof-runtime-current.archmap"), "graph LR\n  Runtime --> Archmap\n", "utf8");

  if (!writeImpactRecord) {
    return;
  }

  await fs.writeFile(path.join(impactDir, `${taskId}.json`), `${JSON.stringify({
    artifact_type: "archmap-impact-record",
    record_id: `ARCHMAP-IMPACT-${taskId}`,
    work_item_ref: taskRef,
    work_item_id: taskId,
    status: impactStatus,
    archmap_source_ref: "docs/archmaps/aof-runtime-current.archmap",
    changed_elements: [{
      kind: "node",
      id: "Runtime",
      reason: "Runtime command surface changed."
    }],
    owner_actor: "builder",
    reviewer_role: "guardian",
    council_review_status: councilReviewStatus,
    evidence_refs: ["src/commands/archmap-impact-audit.js"],
    recorded_at: "2026-07-04T00:00:00.000Z"
  }, null, 2)}\n`, "utf8");
}

async function writeQualityLedgerFixture(projectRoot) {
  const ledgerDir = path.join(projectRoot, ".aof", "quality", "ledger", "events");
  const qifDoc = path.join(projectRoot, "docs", "aof-qif-quality-definition.md");
  const releaseDefinitionDoc = path.join(projectRoot, "docs", "v6.8-release-definition.md");
  const releaseNotesDoc = path.join(projectRoot, "docs", "v6.8.0-release-notes.md");
  const releaseChecklistDoc = path.join(projectRoot, "docs", "v6.8-release-checklist.md");
  await fs.mkdir(ledgerDir, { recursive: true });
  await fs.writeFile(qifDoc, "# QIF Quality Definition\n", "utf8");
  await fs.writeFile(releaseDefinitionDoc, "# v6.8 Release Definition\n", "utf8");
  await fs.writeFile(releaseNotesDoc, "# v6.8.0 Release Notes\n", "utf8");
  await fs.writeFile(releaseChecklistDoc, "# v6.8 Release Checklist\n", "utf8");
  await fs.writeFile(
    path.join(ledgerDir, "QLE-TEST-RUNTIME-EVIDENCE.json"),
    `${JSON.stringify({
      artifact_type: "quality-ledger-event",
      ledger_format_version: 1,
      event_id: "QLE-TEST-RUNTIME-EVIDENCE",
      recorded_at: "2026-07-04T00:00:00.000Z",
      event_type: "evidence_added",
      quality_intent_ref: "QIN-AOF-RUNTIME",
      work_item_ref: "TASK-071",
      claim: "Runtime evidence was added for release audit.",
      evidence_refs: ["docs/v6.8-release-definition.md"],
      qif_refs: ["docs/aof-qif-quality-definition.md"],
      prior_state: null,
      new_state: "traceability_evidence_added",
      confidence: 0.7,
      semantic_truth_claimed: false,
      operator_validated: false,
      governance_action: "none",
      source_task_id: "TASK-071",
      source_parent_session_id: "SESS-TEST",
      source_decision_record_id: null,
      notes: "Fixture event for release-state-audit v6.8 ledger gate."
    }, null, 2)}\n`,
    "utf8"
  );
}

test("archmapImpactAuditCommand passes when implementation tasks have approved impact records", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeArchmapAuditFixture(projectRoot);

  const result = await archmapImpactAuditCommand({
    project: projectRoot,
    cutoffTaskId: "TASK-071"
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.summary.scoped_task_count, 1);
  assert.equal(result.summary.errors.length, 0);
});

test("archmapImpactAuditCommand fails when impact disposition is missing", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeArchmapAuditFixture(projectRoot, { writeImpactRecord: false });

  const result = await archmapImpactAuditCommand({
    project: projectRoot,
    cutoffTaskId: "TASK-071"
  });

  assert.equal(result.ok, false);
  assert.ok(result.summary.errors.some((entry) => entry.includes("archmap impact record presence")));
});

test("archmapImpactAuditCommand fails when council disposition is pending", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeArchmapAuditFixture(projectRoot, { councilReviewStatus: "pending" });

  const result = await archmapImpactAuditCommand({
    project: projectRoot,
    cutoffTaskId: "TASK-071"
  });

  assert.equal(result.ok, false);
  assert.ok(result.summary.errors.some((entry) => entry.includes("council impact disposition")));
});

async function writeReviewProvenanceFixture(projectRoot, {
  taskId = "TASK-071",
  writeReviewRecord = true,
  sourceParentSessionId = "SESS-REVIEW-PROVENANCE",
  reviewStatus = "approved"
} = {}) {
  const taskDir = path.join(projectRoot, ".aof", "tasks", "done");
  const reviewDir = path.join(projectRoot, ".aof", "artifacts", "execution", "council-reviews");
  await fs.mkdir(taskDir, { recursive: true });
  await fs.mkdir(reviewDir, { recursive: true });
  await fs.mkdir(path.join(projectRoot, "docs"), { recursive: true });

  await fs.writeFile(path.join(projectRoot, "docs", "review-evidence.md"), "Review evidence fixture.\n", "utf8");
  await fs.writeFile(path.join(taskDir, `${taskId}.json`), `${JSON.stringify({
    task_id: taskId,
    title: `${taskId} reviewed implementation work`,
    status: "done",
    description: "Implementation-grade work item for review provenance audit coverage."
  }, null, 2)}\n`, "utf8");

  if (!writeReviewRecord) {
    return;
  }

  await fs.writeFile(path.join(reviewDir, `CRP-${taskId}.json`), `${JSON.stringify({
    packet_type: "council-review-packet",
    recorded_at: "2026-07-04T00:00:00.000Z",
    review_packet_id: `CRP-${taskId}`,
    council_id: "architecture-council",
    stage: "review",
    review_status: reviewStatus,
    decision_summary: "Review completed with traceable evidence.",
    rationale: "The fixture proves review provenance is not self-attested.",
    recommendation: "Proceed.",
    target_audience: "operator",
    expected_user_reaction: "review provenance is visible",
    blocking_reasons: [],
    artifact_change_recommendations: [],
    organization_change_recommendations: [],
    diagnosis_category: null,
    diagnosis_confidence: null,
    diagnosis_evidence_refs: [],
    human_override_signal: null,
    team_output_refs: [],
    role_result_refs: [],
    evidence_refs: ["docs/review-evidence.md"],
    follow_up_task_ids: [],
    escalation_required: false,
    source_task_id: taskId,
    source_parent_session_id: sourceParentSessionId,
    source_decision_record_id: null
  }, null, 2)}\n`, "utf8");
}

test("reviewProvenanceAuditCommand passes when done work has Council review provenance", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeReviewProvenanceFixture(projectRoot);

  const result = await reviewProvenanceAuditCommand({
    project: projectRoot,
    cutoffTaskId: "TASK-071"
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.summary.scoped_task_count, 1);
  assert.equal(result.summary.errors.length, 0);
});

test("reviewProvenanceAuditCommand fails when Council review is missing", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeReviewProvenanceFixture(projectRoot, { writeReviewRecord: false });

  const result = await reviewProvenanceAuditCommand({
    project: projectRoot,
    cutoffTaskId: "TASK-071"
  });

  assert.equal(result.ok, false);
  assert.ok(result.summary.errors.some((entry) => entry.includes("council review presence")));
});

test("reviewProvenanceAuditCommand fails when review parent session provenance is missing", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeReviewProvenanceFixture(projectRoot, { sourceParentSessionId: "" });

  const result = await reviewProvenanceAuditCommand({
    project: projectRoot,
    cutoffTaskId: "TASK-071"
  });

  assert.equal(result.ok, false);
  assert.ok(result.summary.errors.some((entry) => entry.includes("parent session provenance")));
});

async function writeEvidenceIndependenceFixture(projectRoot, {
  taskId = "TASK-071",
  evidenceRefs = ["test/runtime-core-2.test.js", "src/commands/example.js"]
} = {}) {
  await writeReviewProvenanceFixture(projectRoot, { taskId });
  const reviewPath = path.join(projectRoot, ".aof", "artifacts", "execution", "council-reviews", `CRP-${taskId}.json`);
  const review = JSON.parse(await fs.readFile(reviewPath, "utf8"));
  review.evidence_refs = evidenceRefs;
  await fs.writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`, "utf8");
  await fs.mkdir(path.join(projectRoot, "src", "commands"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "test"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "src", "commands", "example.js"), "export {};\n", "utf8");
  await fs.writeFile(path.join(projectRoot, "test", "runtime-core-2.test.js"), "export {};\n", "utf8");
}

test("evidenceIndependenceAuditCommand passes when review evidence includes independent categories", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeEvidenceIndependenceFixture(projectRoot);

  const result = await evidenceIndependenceAuditCommand({
    project: projectRoot,
    cutoffTaskId: "TASK-071"
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.summary.low_independence_task_count, 0);
});

test("evidenceIndependenceAuditCommand fails when evidence is only maker-authored or self-attested", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await writeEvidenceIndependenceFixture(projectRoot, {
    evidenceRefs: ["src/commands/example.js", ".aof/tasks/done/TASK-071.json"]
  });

  const result = await evidenceIndependenceAuditCommand({
    project: projectRoot,
    cutoffTaskId: "TASK-071"
  });

  assert.equal(result.ok, false);
  assert.equal(result.summary.summary.low_independence_task_count, 1);
  assert.ok(result.summary.errors.some((entry) => entry.includes("independent evidence presence")));
});

test("organizationStatusCommand exposes active release manifest when present", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await ensureReleaseContractFixture(projectRoot);

  await releaseStateRefreshCommand({
    project: projectRoot,
    releaseVersion: "3.4.0",
    releaseTag: "v3.4.0",
    releaseDefinitionRef: "docs/v3.4-release-definition.md",
    releaseNotesRef: "docs/v3.4.0-release-notes.md",
    releaseChecklistRef: "docs/v3.4-release-checklist.md"
  });

  const result = await organizationStatusCommand({
    project: projectRoot
  });

  assert.equal(result.active_release.release_version, "3.4.0");
  assert.equal(result.active_release.release_definition_ref, "docs/v3.4-release-definition.md");
});

test("contractRegisterCommand lists declared contracts with artifact presence", async (t) => {
  const projectRoot = await createInitializedProject(t);

  const result = await contractRegisterCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(Array.isArray(result.contracts), true);
  assert.equal(result.contract_count, result.contracts.length);
  assert.equal(result.contracts.every((entry) => typeof entry.artifact_present === "boolean"), true);
});

test("dependencyGraphCommand returns declared dependency edges and adjacency", async (t) => {
  const projectRoot = await createInitializedProject(t);

  const result = await dependencyGraphCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(Array.isArray(result.dependencies), true);
  assert.equal(result.dependency_count, result.dependencies.length);
  assert.equal(typeof result.adjacency, "object");
});

test("decisionRegisterCommand lists decision artifacts and pair alignment", async (t) => {
  const projectRoot = await createTempProjectWithDecisions(t);

  const result = await decisionRegisterCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(result.decision_count > 0, true);
  assert.equal(result.decisions.some((entry) => entry.pair_alignment_state === "aligned"), true);
});

test("decisionRegisterCommand respects declared canonical markdown when no template manifest exists", async (t) => {
  const projectRoot = await createInitializedProjectWithDocsDecision(t);

  const result = await decisionRegisterCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(result.decision_count, 1);
  assert.equal(result.decisions[0].canonical_markdown_path, "docs/ADR-001.md");
  assert.equal(result.decisions[0].pair_alignment_state, "aligned");
});

test("roadmapStatusCommand groups tasks by roadmap track", async (t) => {
  const projectRoot = await createTempProject(t);

  await taskOpenCommand({
    project: projectRoot,
    title: "Define v2.3 operator-facing organization surfaces",
    triageNotes: "organization-status and roadmap-status"
  });

  const result = await roadmapStatusCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(Array.isArray(result.release_tracks["v2.3"]), true);
  assert.equal(result.release_tracks["v2.3"].length > 0, true);
});

test("roadmapStatusCommand resolves current release definition through the active release manifest when present", async (t) => {
  const projectRoot = await createInitializedProject(t);
  await ensureReleaseContractFixture(projectRoot);

  await releaseStateRefreshCommand({
    project: projectRoot,
    releaseVersion: "3.4.0",
    releaseTag: "v3.4.0",
    releaseDefinitionRef: "docs/v3.4-release-definition.md",
    releaseNotesRef: "docs/v3.4.0-release-notes.md",
    releaseChecklistRef: "docs/v3.4-release-checklist.md"
  });

  const result = await roadmapStatusCommand({
    project: projectRoot
  });

  assert.equal(result.roadmap_refs.current_release_definition, "docs/v3.4-release-definition.md");
  assert.equal(result.active_release.release_version, "3.4.0");
});

test("roadmapStatusCommand maps discovery-layer research work into the v3.0 track", async (t) => {
  const projectRoot = await createTempProject(t);

  await taskOpenCommand({
    project: projectRoot,
    title: "Design Discovery Layer and Discovery-to-Delivery handoff contract",
    description: "Evaluate Discovery Layer through discovery question-set, breakthrough-pattern, assumption map, anomaly log, and handoff artifacts."
  });

  const result = await roadmapStatusCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(Array.isArray(result.release_tracks["v3.0"]), true);
  assert.equal(
    result.release_tracks["v3.0"].some((task) => task.title === "Design Discovery Layer and Discovery-to-Delivery handoff contract"),
    true
  );
});

test("roadmapStatusCommand keeps v3.0 runtime-loop tasks in the v3.0 track even when allocation terms appear in the description", async (t) => {
  const projectRoot = await createTempProject(t);

  await taskOpenCommand({
    project: projectRoot,
    title: "Prove v3.0 backend-neutral organization runtime loop",
    description: "Demonstrate one auditable end-to-end organization loop from framing through allocation, execution, review, outcome, and next-step recommendation across a backend-neutral orchestration contract."
  });

  const result = await roadmapStatusCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(
    result.release_tracks["v3.0"].some((task) => task.title === "Prove v3.0 backend-neutral organization runtime loop"),
    true
  );
  assert.equal(
    result.release_tracks["v2.5"].some((task) => task.title === "Prove v3.0 backend-neutral organization runtime loop"),
    false
  );
});

test("roadmapStatusCommand maps visibility projection work into the v2.6 track", async (t) => {
  const projectRoot = await createTempProject(t);

  await taskOpenCommand({
    project: projectRoot,
    title: "Project active .aof operating state into visibility outputs automatically",
    description: "Export status_card, timeline_feed, and flow_snapshot JSON from live runtime state."
  });

  const result = await roadmapStatusCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(Array.isArray(result.release_tracks["v2.6"]), true);
  assert.equal(
    result.release_tracks["v2.6"].some((task) => task.title === "Project active .aof operating state into visibility outputs automatically"),
    true
  );
});

test("roadmapStatusCommand does not classify historical visibility mentions as v2.6 release work", async (t) => {
  const projectRoot = await createTempProject(t);

  await taskOpenCommand({
    project: projectRoot,
    title: "Ship v2.0 bootstrap installer and canonical docs set",
    description: "AOF needs a managed-project bootstrap path that installs the canonical .aof file set and AI-readable operating packet.",
    triageNotes: "Renumbered after a historical visibility-output task collision."
  });

  const result = await roadmapStatusCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(
    result.release_tracks["v2.6"].some((task) => task.title === "Ship v2.0 bootstrap installer and canonical docs set"),
    false
  );
  assert.equal(
    result.release_tracks["v2.0"].some((task) => task.title === "Ship v2.0 bootstrap installer and canonical docs set"),
    true
  );
});

test("roadmapStatusCommand maps Mission Control visibility work into the v3.6 track", async (t) => {
  const projectRoot = await createTempProject(t);

  await taskOpenCommand({
    project: projectRoot,
    title: "Implement v3.6 bounded Mission Control visibility layer",
    description: "Add mission overview, artifact graph, blocker visibility, and recommended next action derived from canonical runtime artifacts."
  });

  const result = await roadmapStatusCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(Array.isArray(result.release_tracks["v3.6"]), true);
  assert.equal(
    result.release_tracks["v3.6"].some((task) => task.title === "Implement v3.6 bounded Mission Control visibility layer"),
    true
  );
});

test("visibilityExportCommand writes runtime-backed visibility views consumable by the viewer", async (t) => {
  const projectRoot = await createInitializedProject(t);

  await taskOpenCommand({
    project: projectRoot,
    title: "Project active .aof operating state into visibility outputs automatically",
    description: "Export status_card, timeline_feed, and flow_snapshot JSON from live runtime state."
  });

  await taskOpenCommand({
    project: projectRoot,
    title: "Define v2.6 runtime-backed visibility projection layer",
    description: "Add a first-class runtime command that exports status_card, timeline_feed, and flow_snapshot JSON from live .aof artifacts."
  });

  const result = await visibilityExportCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  const views = await loadVisibilityViews({
    statusInput: result.statusPath,
    timelineInput: result.timelinePath,
    flowInput: result.flowPath,
    missionInput: result.missionPath,
    progressInput: result.operatorProgressPath,
    treeInput: result.treePositionPath,
    evidenceInput: result.evidenceDrillDownPath
  });

  assert.equal(views.status_card.view_type, "status_card");
  assert.equal(views.status_card.usage_level, "runtime-backed");
  assert.equal(views.timeline_feed.view_type, "timeline_feed");
  assert.equal(views.timeline_feed.entries.length > 0, true);
  assert.equal(views.flow_snapshot.view_type, "flow_snapshot");
  assert.equal(views.flow_snapshot.current_node, "evidence_drill_down");
  assert.equal(views.mission_control.view_type, "mission_control");
  assert.equal(views.operator_progress.view_type, "operator_progress");
  assert.equal(views.tree_position.view_type, "tree_position");
  assert.equal(views.evidence_drill_down.view_type, "evidence_drill_down");
  assert.equal(typeof views.mission_control.next_action.recommended_action, "string");
  assert.equal(
    views.flow_snapshot.ordered_nodes.some((node) => node.id === "runtime_loop_proof"),
    true
  );
  assert.equal(
    views.flow_snapshot.ordered_nodes.some((node) => node.id === "operator_progress"),
    true
  );
});

test("visibilitySessionCommand exports the current packet and starts one viewer session path", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const opened = [];
  const result = await visibilitySessionCommand({
    project: projectRoot,
    port: 4174,
    openBrowser: true
  }, {
    installSignalHandlers: false,
    serveCommand: async (options) => ({
      ok: true,
      host: options.host || "127.0.0.1",
      port: options.port || 4174,
      title: options.title || "AOF Human Recognition Interface",
      url: `http://${options.host || "127.0.0.1"}:${options.port || 4174}`,
      close: async () => {}
    }),
    openBrowserFn: (url) => {
      opened.push(url);
    }
  });

  assert.equal(result.ok, true);
  assert.match(result.url, /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.equal(result.opened_browser, true);
  assert.deepEqual(opened, [result.url]);
  assert.match(result.artifacts.status, /status-card\.json$/);
  assert.match(result.artifacts.evidence_drill_down, /evidence-drill-down\.json$/);

  await result.close();
});

test("missionControlCommand auto-refreshes the packet and starts Mission Control", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const opened = [];
  const result = await missionControlCommand({
    project: projectRoot,
    port: 4174,
    openBrowser: true
  }, {
    installSignalHandlers: false,
    serveCommand: async (options) => ({
      ok: true,
      host: options.host || "127.0.0.1",
      port: options.port || 4174,
      title: options.title || "AOF Mission Control",
      url: `http://${options.host || "127.0.0.1"}:${options.port || 4174}`,
      close: async () => {}
    }),
    openBrowserFn: (url) => {
      opened.push(url);
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.title, "AOF Mission Control");
  assert.equal(result.opened_browser, true);
  assert.deepEqual(opened, [result.url]);
  assert.match(result.artifacts.mission, /mission-control\.json$/);
  assert.match(result.artifacts.runtime_execution, /runtime-execution\.json$/);

  await result.close();
});

test("missionControlBenchmarkCommand proves Mission Control stage transitions from baseline through implementation-ready", async () => {
  const result = await missionControlBenchmarkCommand({
    project: repoRoot
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.benchmarks["MC-001"].status, "pass");
  assert.equal(result.summary.benchmarks["MC-002"].status, "pass");
  assert.equal(result.summary.benchmarks["MC-003"].status, "pass");
  assert.equal(result.summary.benchmarks["MC-004"].status, "pass");
  assert.equal(result.summary.benchmarks["MC-005"].status, "pass");
  assert.deepEqual(
    result.summary.snapshots.map((entry) => entry.stage),
    ["visibility-baseline", "discovery-handoff", "planning-ready", "implementation-ready"]
  );
});

test("organizationAuditCommand reports duplicate task lifecycle state as a failure", async (t) => {
  const projectRoot = await createTempProject(t);

  await taskOpenCommand({
    project: projectRoot,
    title: "Detect duplicate task lifecycle state"
  });

  const duplicatePath = path.join(projectRoot, ".aof", "tasks", "done", "TASK-001.json");
  const openPath = path.join(projectRoot, ".aof", "tasks", "open", "TASK-001.json");
  await fs.copyFile(openPath, duplicatePath);

  const result = await organizationAuditCommand({
    project: projectRoot
  });

  assert.equal(result.ok, false);
  assert.equal(result.payload.task_integrity.ok, false);
  assert.equal(result.payload.task_integrity.duplicate_task_count, 1);
});

test("learningLoopSnapshotCommand writes a seeded loop artifact when no outcome exists", async (t) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aof-learning-seeded-"));
  const projectRoot = path.join(tempRoot, "target-project");
  await fs.mkdir(projectRoot, { recursive: true });
  t.after(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  await initProjectCommand({
    project: projectRoot,
    topology: "managed-project",
    projectType: "web-app",
    domainSummary: "Internal operations dashboard",
    installMode: "runtime-on"
  });

  const result = await learningLoopSnapshotCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(result.payload.snapshot_type, "aof-learning-loop");
  assert.equal(result.payload.learning_state.has_outcome_evidence, false);
  assert.equal(result.payload.learning_state.has_next_value_slice, true);
});

test("learningLoopSnapshotCommand connects outcome, self-audit, and improvement focus", async (t) => {
  const projectRoot = await createTempProject(t);

  const runResult = await runCommand({
    project: projectRoot,
    request: "初回離脱率を下げたい",
    routingMode: "fast-track"
  });

  await answerCommand({
    session: runResult.sessionPath,
    responses: [
      "新規登録導線全体",
      "登録完了率を 5% 改善する",
      "認証基盤は変更しない"
    ]
  });
  await advanceSessionToPlanning(projectRoot, runResult.sessionPath);

  await outcomeReportCommand({
    session: runResult.sessionPath,
    result: "success",
    note: "登録導線の KPI が改善した",
    signalRef: "SIG-001"
  });

  await selfAuditRecordCommand({
    project: projectRoot,
    auditId: "FSA-LOOP-001",
    scope: "post-outcome review",
    summary: "An outcome was captured and should be folded into the next improvement slice.",
    detectedGap: "The improvement loop still needs an explicit artifact connecting outcome and follow-up action.",
    nextAction: "formalize the next improvement focus from the latest outcome evidence",
    relatedTaskIds: ["TASK-004"],
    maxEntries: 3
  });

  const result = await learningLoopSnapshotCommand({
    project: projectRoot
  });

  assert.equal(result.ok, true);
  assert.equal(result.payload.learning_state.has_outcome_evidence, true);
  assert.equal(result.payload.learning_state.has_self_audit, true);
  assert.equal(result.payload.learning_state.loop_state, "improving");
  assert.equal(result.payload.improvement_proposal.proposal_basis, "framework-self-audit");
});

test("learningLoopSnapshotCommand skips unreadable session artifacts and still returns the latest valid outcome", async (t) => {
  const projectRoot = await createTempProject(t);

  const validSessionPath = path.join(projectRoot, ".aof", "sessions", "SESS-VALID-001.json");
  const brokenSessionPath = path.join(projectRoot, ".aof", "sessions", "SESS-BROKEN-001.json");

  await fs.writeFile(validSessionPath, JSON.stringify({
    session_id: "SESS-VALID-001",
    outcome_reports: [
      {
        report_id: "OUT-VALID-001",
        result: "failure",
        observed_at: "2026-06-15T10:00:00.000Z",
        note: "Operator rejected the result.",
        signal_ref: "SIG-REJECT-001"
      }
    ]
  }, null, 2));

  const result = await learningLoopSnapshotCommand({
    project: projectRoot
  }, {
    listJsonFiles: async () => [brokenSessionPath, validSessionPath],
    readJson: async (filePath, label) => {
      if (filePath === brokenSessionPath) {
        throw new Error(`${label} is unreadable`);
      }
      return JSON.parse(await fs.readFile(filePath, "utf8"));
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.payload.latest_outcome.report_id, "OUT-VALID-001");
  assert.equal(result.skippedUnreadableSessions.length, 1);
  assert.match(result.payload.observations.at(-1), /Skipped unreadable session artifacts: 1/);
});

test("taskUpdateCommand moves a task across lifecycle directories", async (t) => {
  const projectRoot = await createTempProject(t);

  await taskOpenCommand({
    project: projectRoot,
    title: "Ship runtime write path",
    origin: "orchestrator",
    orchestratorSessionId: "SESS-ORCH-001",
    operatingGoalRef: "self-hosting-gap"
  });

  const result = await taskUpdateCommand({
    project: projectRoot,
    taskId: "TASK-001",
    status: "done",
    relatedDecisionRecordId: "DEC-003",
    triageNotes: "Completed in self-hosting slice"
  });

  assert.equal(result.ok, true);
  assert.equal(result.taskPath.endsWith(path.join(".aof", "tasks", "done", "TASK-001.json")), true);

  await assert.rejects(
    fs.access(path.join(projectRoot, ".aof", "tasks", "open", "TASK-001.json"))
  );

  const payload = JSON.parse(await fs.readFile(result.taskPath, "utf8"));
  assert.equal(payload.status, "done");
  assert.equal(payload.related_decision_record_id, "DEC-003");
  assert.equal(typeof payload.done_at, "string");
});

test("taskUpdateCommand consolidates duplicate lifecycle files for the same task id", async (t) => {
  const projectRoot = await createTempProject(t);

  await taskOpenCommand({
    project: projectRoot,
    title: "Consolidate duplicate lifecycle state"
  });

  const openPath = path.join(projectRoot, ".aof", "tasks", "open", "TASK-001.json");
  const duplicateDonePath = path.join(projectRoot, ".aof", "tasks", "done", "TASK-001.json");
  const duplicatePayload = JSON.parse(await fs.readFile(openPath, "utf8"));
  duplicatePayload.status = "done";
  duplicatePayload.updated_at = "2026-06-01T00:00:00.000Z";
  duplicatePayload.done_at = "2026-06-01T00:00:00.000Z";
  await fs.mkdir(path.dirname(duplicateDonePath), { recursive: true });
  await fs.writeFile(duplicateDonePath, `${JSON.stringify(duplicatePayload, null, 2)}\n`, "utf8");

  const result = await taskUpdateCommand({
    project: projectRoot,
    taskId: "TASK-001",
    status: "done",
    triageNotes: "Canonical done state after duplicate cleanup"
  });

  assert.equal(result.ok, true);
  await assert.rejects(fs.access(openPath));
  await fs.access(duplicateDonePath);

  const finalPayload = JSON.parse(await fs.readFile(duplicateDonePath, "utf8"));
  assert.equal(finalPayload.status, "done");
  assert.equal(finalPayload.triage_notes, "Canonical done state after duplicate cleanup");
});

test("confirmationWindowRecordCommand persists only the latest confirmation entries", async (t) => {
  const projectRoot = await createTempProject(t);

  await confirmationWindowRecordCommand({
    project: projectRoot,
    question: "まだ解くべき問題は同じか",
    answer: "はい",
    expectationState: "problem unchanged",
    maxEntries: 2
  });

  await confirmationWindowRecordCommand({
    project: projectRoot,
    question: "次の value slice は妥当か",
    answer: "はい、まず write path",
    scaleDirection: "implement runtime write path",
    maxEntries: 2
  });

  await confirmationWindowRecordCommand({
    project: projectRoot,
    question: "期待に近づいているか",
    answer: "一部。confirmation memory はまだ無い",
    mismatchState: "recent confirmation window missing",
    maxEntries: 2
  });

  const windowPath = path.join(projectRoot, ".aof", "context", "active", "recent-confirmation-window.json");
  const payload = JSON.parse(await fs.readFile(windowPath, "utf8"));
  assert.equal(payload.window_type, "recent-confirmation-window");
  assert.equal(payload.entries.length, 2);
  assert.equal(payload.entries[0].question, "次の value slice は妥当か");
  assert.equal(payload.entries[1].question, "期待に近づいているか");
});

test("loadTemplate fails when a required actor role is missing", async (t) => {
  const projectRoot = await createTempProject(t);
  const actorPath = path.join(projectRoot, ".aof", "actors", "visionary.yaml");
  const brokenActor = [
    "actor_id: visionary-worker-01",
    "display_name: Visionary Worker",
    "kind: ai",
    "capabilities:",
    "  - product-framing",
    "  - requirements-review",
    "policy_profile: default-product-policy",
    ""
  ].join("\n");
  await fs.writeFile(actorPath, brokenActor, "utf8");

  await assert.rejects(
    loadTemplate(projectRoot),
    /actor\.roles must be an array|actor\.roles must be a non-empty array/
  );
});

test("loadTemplate accepts optional clarification term overrides in organization config", async (t) => {
  const projectRoot = await createTempProject(t);
  const organizationPath = path.join(projectRoot, ".aof", "organization.yaml");
  await fs.writeFile(
    organizationPath,
    [
      "organization_id: product-team",
      "name: Product Team",
      "language: en",
      "mission: Deliver architecture outcomes",
      "governance_scopes:",
      "  - requirements-approval",
      "clarification:",
      "  use_default_high_stakes_patterns: false",
      "  use_default_brownfield_patterns: false",
      "  high_stakes_terms:",
      "    - structural",
      "  brownfield_terms:",
      "    - retrofit",
      ""
    ].join("\n"),
    "utf8"
  );

  const template = await loadTemplate(projectRoot);

  assert.equal(template.organization.clarification.use_default_high_stakes_patterns, false);
  assert.equal(template.organization.clarification.use_default_brownfield_patterns, false);
  assert.deepEqual(template.organization.clarification.high_stakes_terms, ["structural"]);
  assert.deepEqual(template.organization.clarification.brownfield_terms, ["retrofit"]);
});

test("loadTemplate accepts partial clarification copy overrides and rejects malformed copy blocks", async (t) => {
  const projectRoot = await createTempProject(t);
  const organizationPath = path.join(projectRoot, ".aof", "organization.yaml");
  await fs.writeFile(
    organizationPath,
    [
      "organization_id: product-team",
      "name: Product Team",
      "language: en",
      "mission: Deliver architecture outcomes",
      "governance_scopes:",
      "  - requirements-approval",
      "clarification:",
      "  copy:",
      "    en:",
      "      questions:",
      "        scope: Which physical area should this redesign cover first?",
      "      summary_initial_questions: runtime generated architecture-specific clarification questions",
      ""
    ].join("\n"),
    "utf8"
  );

  const template = await loadTemplate(projectRoot);
  assert.equal(
    template.organization.clarification.copy.en.questions.scope,
    "Which physical area should this redesign cover first?"
  );

  await fs.writeFile(
    organizationPath,
    [
      "organization_id: product-team",
      "name: Product Team",
      "language: en",
      "mission: Deliver architecture outcomes",
      "governance_scopes:",
      "  - requirements-approval",
      "clarification:",
      "  copy:",
      "    en:",
      "      questions:",
      "        scope:",
      "          label: bad-shape",
      ""
    ].join("\n"),
    "utf8"
  );

  await assert.rejects(
    loadTemplate(projectRoot),
    /organization\.clarification\.copy\.en\.questions\.scope must be a non-empty string/
  );
});

test("loadTemplate accepts clarification question policy and rejects malformed priority keys", async (t) => {
  const projectRoot = await createTempProject(t);
  const organizationPath = path.join(projectRoot, ".aof", "organization.yaml");
  await fs.writeFile(
    organizationPath,
    [
      "organization_id: product-team",
      "name: Product Team",
      "language: en",
      "mission: Deliver architecture outcomes",
      "governance_scopes:",
      "  - requirements-approval",
      "clarification:",
      "  question_policy:",
      "    initial_question_budget: 2",
      "    followup_budget: 1",
      "    max_rounds: 2",
      "    priority_order:",
      "      - high-stakes-risk",
      "      - missing-constraint",
      ""
    ].join("\n"),
    "utf8"
  );

  const template = await loadTemplate(projectRoot);
  assert.equal(template.organization.clarification.question_policy.initial_question_budget, 2);
  assert.deepEqual(template.organization.clarification.question_policy.priority_order, [
    "high-stakes-risk",
    "missing-constraint"
  ]);

  await fs.writeFile(
    organizationPath,
    [
      "organization_id: product-team",
      "name: Product Team",
      "language: en",
      "mission: Deliver architecture outcomes",
      "governance_scopes:",
      "  - requirements-approval",
      "clarification:",
      "  question_policy:",
      "    priority_order:",
      "      - scope",
      ""
    ].join("\n"),
    "utf8"
  );

  await assert.rejects(
    loadTemplate(projectRoot),
    /organization\.clarification\.question_policy\.priority_order contains an unsupported key/
  );
});

test("generic example template loads successfully", async (t) => {
  const projectRoot = await createTempProjectFrom(t, genericExampleProjectRoot);
  const template = await loadTemplate(projectRoot);

  assert.equal(template.organization.organization_id, "civic-studio");
  assert.equal(template.workflowId, "service-design");
  assert.equal(template.workflow.name, "Service Design");
  assert.deepEqual(template.workflow.decision_points, ["concept-approval", "launch-approval"]);
  assert.equal(template.organization.clarification.use_default_high_stakes_patterns, false);
  assert.equal(
    template.organization.clarification.copy.en.questions.scope,
    "Which service touchpoint or environment should this redesign cover, and what should stay out of scope?"
  );
});

test("loadTemplate accepts empty decision_points and actor capabilities arrays", async (t) => {
  const projectRoot = await createTempProject(t);
  const workflowPath = path.join(projectRoot, ".aof", "workflows", "aidlc.yaml");
  const actorPath = path.join(projectRoot, ".aof", "actors", "builder.yaml");

  const relaxedWorkflow = [
    "workflow_id: aidlc",
    "name: AI-Driven Lifecycle",
    "entry_conditions: []",
    "stages:",
    "  - clarification",
    "  - planning",
    "  - proposal",
    "  - review",
    "  - approval",
    "decision_points: []",
    "default_governance_scope: requirements-approval",
    "default_routing_mode: deep-path",
    ""
  ].join("\n");

  const relaxedActor = [
    "actor_id: implementation-worker-01",
    "display_name: Builder Worker",
    "kind: ai",
    "roles:",
    "  - Builder",
    "capabilities: []",
    "policy_profile: default-product-policy",
    ""
  ].join("\n");

  await fs.writeFile(workflowPath, relaxedWorkflow, "utf8");
  await fs.writeFile(actorPath, relaxedActor, "utf8");

  const template = await loadTemplate(projectRoot);
  assert.deepEqual(template.workflow.decision_points, []);
  assert.deepEqual(template.actors.find((actor) => actor.actor_id === "implementation-worker-01")?.capabilities, []);
});

test("loadTemplate still rejects empty workflow stages", async (t) => {
  const projectRoot = await createTempProject(t);
  const workflowPath = path.join(projectRoot, ".aof", "workflows", "aidlc.yaml");
  const invalidWorkflow = [
    "workflow_id: aidlc",
    "name: AI-Driven Lifecycle",
    "entry_conditions: []",
    "stages: []",
    "decision_points:",
    "  - requirements-approval",
    "default_governance_scope: requirements-approval",
    "default_routing_mode: deep-path",
    ""
  ].join("\n");

  await fs.writeFile(workflowPath, invalidWorkflow, "utf8");

  await assert.rejects(
    loadTemplate(projectRoot),
    /workflow\.stages must be a non-empty array/
  );
});

test("runCommand uses English clarification questions when organization.language is en", async (t) => {
  const projectRoot = await createTempProject(t);
  const organizationPath = path.join(projectRoot, ".aof", "organization.yaml");
  const englishOrg = [
    "organization_id: product-team",
    "name: Product Team",
    "language: en",
    "mission: Deliver software outcomes through AIDLC",
    "governance_scopes:",
    "  - requirements-approval",
    "  - design-approval",
    "  - release-approval",
    ""
  ].join("\n");
  await fs.writeFile(organizationPath, englishOrg, "utf8");

  const result = await runCommand({
    project: projectRoot,
    request: "Improve the onboarding flow for new users"
  });

  assert.equal(result.pendingQuestions[0], "What exactly should be improved, and what scope should this effort cover?");
  const session = await loadSession(result.sessionPath);
  assert.equal(session.organization.language, "en");
  assert.equal(
    session.clarification.clarification_summary,
    "runtime identified initial clarification gaps and generated first-round user questions"
  );
});

test("deriveInitialClarification respects domain-specific clarification term overrides", async (t) => {
  const projectRoot = await createTempProject(t);
  const organizationPath = path.join(projectRoot, ".aof", "organization.yaml");
  await fs.writeFile(
    organizationPath,
    [
      "organization_id: product-team",
      "name: Product Team",
      "language: en",
      "mission: Deliver architecture outcomes",
      "governance_scopes:",
      "  - requirements-approval",
      "clarification:",
      "  use_default_high_stakes_patterns: false",
      "  use_default_brownfield_patterns: false",
      "  high_stakes_terms:",
      "    - structural",
      "  brownfield_terms:",
      "    - retrofit",
      ""
    ].join("\n"),
    "utf8"
  );

  const template = await loadTemplate(projectRoot);
  const clarification = deriveInitialClarification(
    "Need a structural retrofit for the west wing",
    template
  );

  assert.equal(clarification.dimensions.risk_exposure, "conflicting");
  assert.equal(clarification.dimensions.brownfield_orientation_completeness, "partial");
  assert.ok(clarification.trigger_classes.includes("high-stakes-risk"));
  assert.ok(
    clarification.gaps.some((gap) => gap.trigger_class === "brownfield-gap")
  );

  const noBrownfieldFromDefault = deriveInitialClarification(
    "Improve the visitor flow",
    template
  );
  assert.equal(noBrownfieldFromDefault.dimensions.brownfield_orientation_completeness, "clear");
  assert.equal(noBrownfieldFromDefault.trigger_classes.includes("brownfield-gap"), false);
});

test("deriveInitialClarification applies partial clarification copy overrides", async (t) => {
  const projectRoot = await createTempProject(t);
  const organizationPath = path.join(projectRoot, ".aof", "organization.yaml");
  await fs.writeFile(
    organizationPath,
    [
      "organization_id: product-team",
      "name: Product Team",
      "language: en",
      "mission: Deliver service outcomes",
      "governance_scopes:",
      "  - requirements-approval",
      "clarification:",
      "  copy:",
      "    en:",
      "      questions:",
      "        scope: Which service environment should be redesigned first?",
      "      rationales:",
      "        scope: This keeps the service redesign bounded before planning.",
      "      summary_initial_questions: runtime generated service-specific clarification questions",
      ""
    ].join("\n"),
    "utf8"
  );

  const template = await loadTemplate(projectRoot);
  const clarification = deriveInitialClarification(
    "Improve the visitor check-in experience",
    template
  );

  assert.equal(
    clarification.pending_questions[0].question,
    "Which service environment should be redesigned first?"
  );
  assert.equal(
    clarification.pending_questions[0].rationale,
    "This keeps the service redesign bounded before planning."
  );
  assert.equal(
    clarification.clarification_summary,
    "runtime generated service-specific clarification questions"
  );
  assert.equal(
    clarification.pending_questions[1].question,
    "How should improvement success be judged: which metric or end state matters most?"
  );
});

test("visibility view loader and HTML shell align with the v1.4 visibility contract", async (t) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aof-visibility-"));
  t.after(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  const fixture = await writeVisibilityFixture(tempRoot);
  const views = await loadVisibilityViews({
    statusInput: fixture.statusPath,
    timelineInput: fixture.timelinePath,
    flowInput: fixture.flowPath,
    missionInput: fixture.missionPath,
    progressInput: fixture.progressPath,
    treeInput: fixture.treePath,
    evidenceInput: fixture.evidencePath
  });

  assert.equal(views.status_card.view_type, "status_card");
  assert.equal(views.timeline_feed.entries[0].event_type, "candidate_selected");
  assert.equal(views.flow_snapshot.current_node, "selected");
  assert.equal(views.flow_snapshot.ordered_nodes.length, 3);
  assert.equal(views.derived.flow_metrics.total_steps, 3);
  assert.equal(views.derived.flow_metrics.current_step_index, 2);
  assert.equal(views.derived.narrative.current_position.step_progress, "2 / 3");
  assert.equal(views.derived.narrative.next_action.immediate_next_step, "candidate_published");
  assert.equal(views.derived.narrative.remaining_work.remaining_steps_after_current, 1);
  assert.equal(views.derived.current_node_detail.node_label, "candidate_selected");
  assert.equal(views.derived.current_node_detail.substep_progress, "1 / 3");
  assert.equal(views.derived.current_node_detail.current_substep_label, "Final Review");
  assert.equal(views.derived.current_node_detail.next_substep_label, "Ready To Publish");
  assert.equal(views.derived.current_node_detail.branches[0].label, "approve and publish");
  assert.equal(views.derived.current_node_detail.loopbacks[0].to, "generated");
  assert.equal(views.mission_control.view_type, "mission_control");
  assert.equal(views.mission_control.runtime_position.current_phase, "planning-ready");
  assert.equal(views.mission_control.next_action.recommended_action, "verify publish artifact before 10:00 JST");
  assert.equal(views.operator_progress.view_type, "operator_progress");
  assert.equal(views.operator_progress.current_checkpoint.frontier_task_id, "TASK-200");
  assert.equal(views.tree_position.view_type, "tree_position");
  assert.equal(views.tree_position.branch.frontier_track, "v1.1");
  assert.equal(views.evidence_drill_down.view_type, "evidence_drill_down");
  assert.equal(views.evidence_drill_down.answer_to_proof.next_action.claim, "verify publish artifact before 10:00 JST");
  assert.equal(
    views.runtime_loop.current_frontier.task_description,
    "Package the reviewed observation, verify the publish artifact, and submit it as the next shipped candidate."
  );
  assert.equal(views.runtime_loop.current_frontier.task_description_source, "live-artifact");
  assert.equal(views.derived.task_board.counts.open, 1);
  assert.equal(views.derived.task_board.open_tasks[0].task_id, "TASK-200");

  await fs.mkdir(path.join(tempRoot, "docs"), { recursive: true });
  await fs.writeFile(
    path.join(tempRoot, "docs", "v6.0-release-definition.md"),
    "# v6.0 release definition\n\nThis file content should be visible from the Mission Control detail popup.\n",
    "utf8"
  );
  const refContent = await readProjectTextRef(tempRoot, "docs/v6.0-release-definition.md");
  assert.equal(refContent.path, "docs/v6.0-release-definition.md");
  assert.match(refContent.content, /file content should be visible/);
  await assert.rejects(
    readProjectTextRef(tempRoot, "../outside.md"),
    /escapes project root/
  );

  const html = buildVisibilityPageHtml("Test Visibility");
  assert.match(html, /Test Visibility/);
  assert.match(html, /AOF Mission Control Dashboard/);
  assert.match(html, /Current Mission/);
  assert.match(html, /Current Release \/ Frontier/);
  assert.match(html, /Runtime-backed status/);
  assert.match(html, /Risk \/ Blocker count/);
  assert.match(html, /Next recommended action/);
  assert.match(html, /AOF Kanban Board/);
  assert.match(html, /Backlog/);
  assert.match(html, /Discovery/);
  assert.match(html, /Need Validation/);
  assert.match(html, /Planning/);
  assert.match(html, /Role Work/);
  assert.match(html, /Council Review/);
  assert.match(html, /Approved \/ Done/);
  assert.match(html, /Overall Summary/);
  assert.match(html, /Ticket \/ Task Flow/);
  assert.match(html, /Top Blocked Tasks/);
  assert.match(html, /Role Workload/);
  assert.match(html, /Work Governance Chain/);
  assert.match(html, /Evidence \/ Proof Coverage/);
  assert.match(html, /dashboard-root/);
  assert.match(html, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(html, /grid-template-columns: repeat\(7, minmax\(230px, 1fr\)\)/);
  assert.match(html, /lastMissionDashboardHtml/);
  assert.match(html, /html === lastMissionDashboardHtml/);
  assert.match(html, /renderCount/);
  assert.match(html, /__aofRefreshForTest/);
  assert.match(html, /detail-modal/);
  assert.match(html, /detail-tooltip/);
  assert.match(html, /data-detail/);
  assert.match(html, /max-height: clamp\(140px, 32vh, 420px\)/);
  assert.match(html, /overscroll-behavior: contain/);
  assert.match(html, /<pre tabindex="0">/);
  assert.ok(html.includes("/api/ref-content"));
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
  assert.ok(scriptMatch);
  assert.doesNotThrow(() => new Function(scriptMatch[1]));
});
