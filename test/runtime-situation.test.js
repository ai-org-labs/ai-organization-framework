import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { organizationStatusCommand } from "../src/commands/organization-status.js";
import { operatorBriefCommand } from "../src/commands/operator-brief.js";
import { operatorProgressCommand } from "../src/commands/operator-progress.js";
import { releaseStateAuditCommand } from "../src/commands/release-state-audit.js";
import { roadmapStatusCommand } from "../src/commands/roadmap-status.js";
import { situationAssessCommand } from "../src/commands/situation-assess.js";
import { treePositionCommand } from "../src/commands/tree-position.js";
import { visibilityExportCommand } from "../src/commands/visibility-export.js";
import { createInitializedProject } from "./runtime-test-helpers.js";

test("situationAssessCommand diagnoses the current frontier from self-hosting runtime state", async () => {
  const projectRoot = process.cwd();
  const result = await situationAssessCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.summary.artifact_type, "situation-assessment");
  assert.equal(result.summary.active_release_version, "8.2.0");
  assert.equal(result.summary.primary_frontier_task, null);
  assert.equal(result.summary.current_runtime_stage, "frontier-definition-needed");
  assert.match(result.summary.recommended_action.recommended_action, /v8\.3|Mission Control Operator Acceptance|frontier/i);
  assert.deepEqual(result.summary.operator_alignment.prioritized_task_ids, []);
  assert.equal(result.summary.current_truth_conflicts.some((conflict) => conflict.code === "stale-alignment-pulse"), false);
  assert.equal(result.summary.current_truth_conflicts.some((conflict) => conflict.code === "frontier-task-mismatch"), false);
});

test("roadmapStatusCommand keeps committed release evidence on the correct tracks", async () => {
  const projectRoot = process.cwd();
  const result = await roadmapStatusCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.deepEqual(result.alignment.prioritized_task_ids, []);
  assert.match(result.alignment.answer, /v8\.3|Mission Control Operator Acceptance|frontier/i);
  assert.ok(Array.isArray(result.release_tracks["v5.0"]));
  assert.ok(result.release_tracks["v5.0"].some((task) => task.task_id === "TASK-048"));
  assert.ok(Array.isArray(result.release_tracks["v6.0"]));
  assert.ok(result.release_tracks["v6.0"].some((task) => task.task_id === "TASK-056"));
  assert.ok(Array.isArray(result.release_tracks["v6.1"]));
  assert.ok(result.release_tracks["v6.1"].some((task) => task.task_id === "TASK-062"));
  assert.ok(result.release_tracks["v6.1"].some((task) => task.task_id === "TASK-063"));
  assert.ok(Array.isArray(result.release_tracks["v6.2"]));
  assert.ok(result.release_tracks["v6.2"].some((task) => task.task_id === "TASK-064"));
  assert.ok(Array.isArray(result.release_tracks["v6.3"]));
  assert.ok(result.release_tracks["v6.3"].some((task) => task.task_id === "TASK-066"));
  assert.ok(Array.isArray(result.release_tracks["v6.4"]));
  assert.ok(result.release_tracks["v6.4"].some((task) => task.task_id === "TASK-069"));
  assert.ok(Array.isArray(result.release_tracks["v6.5"]));
  assert.ok(result.release_tracks["v6.5"].some((task) => task.task_id === "TASK-070"));
  assert.ok(Array.isArray(result.release_tracks["v6.6"]));
  assert.ok(result.release_tracks["v6.6"].some((task) => task.task_id === "TASK-071"));
  assert.ok(Array.isArray(result.release_tracks["v6.7"]));
  assert.ok(result.release_tracks["v6.7"].some((task) => task.task_id === "TASK-072"));
  assert.ok(result.release_tracks["v6.7"].some((task) => task.task_id === "TASK-073"));
  assert.ok(result.release_tracks["v6.7"].some((task) => task.task_id === "TASK-074"));
  assert.ok(result.release_tracks["v6.7"].some((task) => task.task_id === "TASK-075"));
  assert.ok(result.release_tracks["v6.7"].some((task) => task.task_id === "TASK-076"));
  assert.ok(Array.isArray(result.release_tracks["v6.8"]));
  assert.ok(result.release_tracks["v6.8"].some((task) => task.task_id === "TASK-077"));
  assert.ok(result.release_tracks["v6.8"].some((task) => task.task_id === "TASK-078"));
  assert.ok(result.release_tracks["v6.8"].some((task) => task.task_id === "TASK-079"));
  assert.ok(Array.isArray(result.release_tracks["v6.9"]));
  assert.ok(result.release_tracks["v6.9"].some((task) => task.task_id === "TASK-081"));
  assert.ok(result.release_tracks["v6.9"].some((task) => task.task_id === "TASK-082"));
  assert.ok(result.release_tracks["v6.9"].some((task) => task.task_id === "TASK-083"));
  assert.ok(Array.isArray(result.release_tracks["v7.0"]));
  assert.ok(result.release_tracks["v7.0"].some((task) => task.task_id === "TASK-086"));
  assert.ok(result.release_tracks["v7.0"].some((task) => task.task_id === "TASK-088"));
  assert.ok(Array.isArray(result.release_tracks["v7.1"]));
  assert.ok(result.release_tracks["v7.1"].some((task) => task.task_id === "TASK-089"));
  assert.ok(Array.isArray(result.release_tracks["v7.5"]));
  assert.ok(result.release_tracks["v7.5"].some((task) => task.task_id === "TASK-094"));
  assert.ok(Array.isArray(result.release_tracks["v7.6"]));
  assert.ok(result.release_tracks["v7.6"].some((task) => task.task_id === "TASK-095"));
  assert.ok(Array.isArray(result.release_tracks["v7.7"]));
  assert.ok(result.release_tracks["v7.7"].some((task) => task.task_id === "TASK-096"));
  assert.ok(Array.isArray(result.release_tracks["v7.8"]));
  assert.ok(result.release_tracks["v7.8"].some((task) => task.task_id === "TASK-097"));
  assert.ok(Array.isArray(result.release_tracks["v7.9"]));
  assert.ok(result.release_tracks["v7.9"].some((task) => task.task_id === "TASK-098"));
  assert.ok(Array.isArray(result.release_tracks["v8.0"]));
  assert.ok(result.release_tracks["v8.0"].some((task) => task.task_id === "TASK-099"));
  assert.ok(result.release_tracks["v8.0"].some((task) => task.task_id === "TASK-100"));
  assert.ok(Array.isArray(result.release_tracks["v8.1"]));
  assert.ok(result.release_tracks["v8.1"].some((task) => task.task_id === "TASK-101"));
  assert.ok(Array.isArray(result.release_tracks["v8.2"]));
  assert.ok(result.release_tracks["v8.2"].some((task) => task.task_id === "TASK-102"));
});

test("visibilityExportCommand surfaces situation judgment rather than stale release work", async () => {
  const projectRoot = process.cwd();
  const result = await visibilityExportCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.payloads.mission_control.mission_overview.release_version, "8.2.0");
  assert.equal(result.payloads.mission_control.mission_overview.current_runtime_stage, "frontier-definition-needed");
  assert.match(result.payloads.mission_control.next_action.recommended_action, /v8\.3|Mission Control Operator Acceptance|frontier/i);
  assert.doesNotMatch(result.payloads.mission_control.next_action.recommended_action, /Mission Control visibility slice/i);
  assert.equal(result.payloads.mission_control.blockers.some((blocker) => /alignment pulse/i.test(blocker.summary)), false);
  assert.equal(result.payloads.mission_control.blockers.some((blocker) => /frontier task/i.test(blocker.summary)), false);
  assert.match(result.payloads.operator_brief.headline, /frontier|implementation task|v8\.3|Mission Control Operator Acceptance/i);
  assert.match(result.payloads.operator_brief.next_action.recommended_action, /v8\.3|Mission Control Operator Acceptance|frontier/i);
  assert.equal(result.payloads.mission_control.work_governance.present, true);
  assert.ok(result.payloads.mission_control.work_governance.work_items.length >= 2);
  assert.equal(result.payloads.mission_control.archmap.present, true);
  assert.equal(result.payloads.mission_control.archmap.current_source_ref, "docs/archmaps/aof-runtime-current.archmap");
  assert.equal(result.payloads.mission_control.archmap.latest_work_item_id, "TASK-102");
  assert.ok(result.payloads.mission_control.archmap.pending_impact_count >= 0);
  assert.equal(result.payloads.mission_control.organization_state.present, true);
  assert.equal(result.payloads.mission_control.organization_state.council_count, 3);
  assert.ok(result.payloads.mission_control.organization_state.roles.some((role) => role.role_id === "builder"));
  assert.equal(result.payloads.mission_control.agent_session_observability.present, true);
  assert.equal(result.payloads.mission_control.agent_session_observability.latest_session_id, "SESS-V82-OPERATOR-VALIDATION");
  assert.equal(result.payloads.mission_control.agent_session_observability.audit_ok, true);
  assert.ok(result.payloads.mission_control.agent_session_observability.linked_task_refs.some((ref) => /TASK-102/.test(ref)));
  assert.ok(result.payloads.mission_control.agent_session_observability.risk_candidates.length >= 1);
  assert.ok(result.payloads.mission_control.agent_session_observability.decision_candidates.length >= 1);
  assert.equal(result.payloads.mission_control.context_reference_integrity.present, true);
  assert.equal(result.payloads.mission_control.context_reference_integrity.audit_ok, true);
  assert.equal(result.payloads.mission_control.context_reference_integrity.blocked_context_count, 0);
  assert.equal(result.payloads.mission_control.context_reference_integrity.stale_external_reference_count, 0);
  assert.equal(result.payloads.mission_control.externalization_readiness_projection.present, true);
  assert.equal(result.payloads.mission_control.externalization_readiness_projection.audit_ok, true);
  assert.ok(result.payloads.mission_control.externalization_readiness_projection.externalization_claim_count >= 1);
  assert.equal(result.payloads.mission_control.external_resource_projection.present, true);
  assert.equal(result.payloads.mission_control.external_resource_projection.audit_ok, true);
  assert.equal(result.payloads.mission_control.external_resource_projection.resource_count, 2);
  assert.equal(result.payloads.mission_control.external_resource_projection.use_count, 1);
  assert.equal(result.payloads.mission_control.provider_adapter_projection.present, true);
  assert.equal(result.payloads.mission_control.provider_adapter_projection.audit_ok, true);
  assert.equal(result.payloads.mission_control.provider_adapter_projection.adapter_count, 1);
  assert.equal(result.payloads.mission_control.operator_validation_projection.present, true);
  assert.equal(result.payloads.mission_control.operator_validation_projection.audit_ok, true);
  assert.equal(result.payloads.mission_control.operator_validation_projection.record_count, 1);
  assert.equal(result.payloads.mission_control.operator_validation_projection.accepted_count, 1);
  assert.equal(result.payloads.operator_progress.view_type, "operator_progress");
  assert.equal(result.payloads.tree_position.view_type, "tree_position");
  assert.equal(result.payloads.evidence_drill_down.view_type, "evidence_drill_down");
});

test("operatorBriefCommand compresses runtime situation judgment into one operator-facing packet", async () => {
  const projectRoot = process.cwd();
  const result = await operatorBriefCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.brief.view_type, "operator_brief");
  assert.equal(result.brief.current_state.release_version, "8.2.0");
  assert.equal(result.brief.current_state.current_runtime_stage, "frontier-definition-needed");
  assert.equal(result.brief.current_state.primary_frontier_task, null);
  assert.equal(result.brief.current_state.skillful_actor_projection?.projection_id, "SAHRI-TASK-054-PROOF");
  assert.match(result.brief.operator_answers.what_should_happen_next, /v8\.3|Mission Control Operator Acceptance|frontier/i);
});

test("organizationStatusCommand exposes the post-v8.1 direction goal and next value slice", async () => {
  const projectRoot = process.cwd();
  const result = await organizationStatusCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.match(result.goals.operating_goal, /v8\.3|Mission Control Operator Acceptance/i);
  assert.match(result.goals.next_value_slice, /v8\.3|runtime-backed direction review|operator acceptance evidence/i);
});

test("operatorProgressCommand explains what changed since the last checkpoint", async () => {
  const projectRoot = process.cwd();
  const result = await operatorProgressCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.progress.view_type, "operator_progress");
  assert.match(result.progress.progress_answer.what_changed, /TASK-102|v8\.2|Operator Validation|v8\.3/i);
});

test("treePositionCommand explains the current release trunk and frontier branch", async () => {
  const projectRoot = process.cwd();
  const result = await treePositionCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.tree.view_type, "tree_position");
  assert.equal(result.tree.trunk.active_release_version, "8.2.0");
  assert.equal(result.tree.branch.frontier_task_id, null);
  assert.equal(result.tree.branch.frontier_track, null);
  assert.match(result.tree.tree_answer.where_are_we, /between v8\.2 and the next concrete branch|v8\.3/i);
});

test("releaseStateAuditCommand includes the v8.2 operator validation release gate", async () => {
  const projectRoot = process.cwd();
  const result = await releaseStateAuditCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.summary.active_release.release_version, "8.2.0");
  const externalResourceAudit = result.summary.governance_audits.find((audit) => audit.name === "external-resource-audit");
  assert.equal(externalResourceAudit.ok, true);
  const providerAdapterAudit = result.summary.governance_audits.find((audit) => audit.name === "provider-adapter-audit");
  assert.equal(providerAdapterAudit.ok, true);
  const operatorValidationAudit = result.summary.governance_audits.find((audit) => audit.name === "operator-validation-audit");
  assert.equal(operatorValidationAudit.ok, true);
  assert.equal(result.summary.errors.length, 0);
});

test("situationAssessCommand targets the future track when a slice mentions the shipped release first", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const goalsRoot = path.join(projectRoot, ".aof", "goals");
  const tasksOpenRoot = path.join(projectRoot, ".aof", "tasks", "open");
  await fs.mkdir(goalsRoot, { recursive: true });
  await fs.mkdir(tasksOpenRoot, { recursive: true });
  await fs.writeFile(
    path.join(goalsRoot, "next-value-slice.json"),
    `${JSON.stringify({
      artifact_type: "next-value-slice",
      content: "After v6.4.0, advance v6.5 as Execution Hygiene."
    }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(tasksOpenRoot, "TASK-070.json"),
    `${JSON.stringify({
      task_id: "TASK-070",
      title: "v6.5 bridge: Codify CLI help boundary and runtime-backed evidence rule",
      status: "open",
      created_at: "2026-06-27T18:00:00.000Z",
      updated_at: "2026-06-27T18:00:00.000Z",
      description: "Execution Hygiene v6.5 bridge."
    }, null, 2)}\n`,
    "utf8"
  );

  const result = await situationAssessCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.summary.primary_frontier_task?.track, "v6.5");
  assert.equal(result.summary.current_truth_conflicts.some((conflict) => conflict.code === "frontier-task-mismatch"), false);
});

test("situationAssessCommand detects a stale alignment pulse in a lightweight initialized project", async (t) => {
  const projectRoot = await createInitializedProject(t);
  const activeRoot = path.join(projectRoot, ".aof", "context", "active");
  const goalsRoot = path.join(projectRoot, ".aof", "goals");
  const tasksOpenRoot = path.join(projectRoot, ".aof", "tasks", "open");
  await fs.mkdir(activeRoot, { recursive: true });
  await fs.mkdir(goalsRoot, { recursive: true });
  await fs.mkdir(tasksOpenRoot, { recursive: true });
  await fs.writeFile(
    path.join(goalsRoot, "next-value-slice.json"),
    `${JSON.stringify({
      artifact_type: "next-value-slice",
      content: "Define v3.7 runtime situation assessment layer"
    }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(goalsRoot, "operating-goal.json"),
    `${JSON.stringify({
      artifact_type: "operating-goal",
      content: "Advance the runtime situation assessment layer for v3.7"
    }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(tasksOpenRoot, "TASK-043.json"),
    `${JSON.stringify({
      task_id: "TASK-043",
      title: "Implement v3.7 runtime situation assessment and roadmap truthfulness layer",
      status: "open",
      created_at: "2026-06-18T08:00:00.000Z",
      updated_at: "2026-06-18T08:30:00.000Z",
      description: "Replace stale viewer-centric guidance with runtime-native situation judgment."
    }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(activeRoot, "alignment-pulse.json"),
    `${JSON.stringify({
      pulse_type: "alignment-pulse",
      triggered_at: "2026-06-13T16:46:50.899Z",
      question: "What is the highest-leverage next operating move after roadmap decomposition?",
      answer: "Start TASK-009 and define the v2.3 operator-facing organization surfaces before expanding execution or allocation layers.",
      scale_direction: "Prioritize TASK-009, then carry its outputs into TASK-012 and TASK-010 in dependency order.",
      prioritized_task_ids: ["TASK-009"]
    }, null, 2)}\n`,
    "utf8"
  );

  const result = await situationAssessCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.ok(result.summary.current_truth_conflicts.some((conflict) => conflict.code === "stale-alignment-pulse"));
  assert.match(result.summary.recommended_action.recommended_action, /Refresh roadmap guidance/);
});
