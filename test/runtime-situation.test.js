import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { organizationStatusCommand } from "../src/commands/organization-status.js";
import { operatorBriefCommand } from "../src/commands/operator-brief.js";
import { operatorProgressCommand } from "../src/commands/operator-progress.js";
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
  assert.equal(result.summary.active_release_version, "6.3.0");
  assert.equal(result.summary.primary_frontier_task, null);
  assert.equal(result.summary.current_runtime_stage, "frontier-definition-needed");
  assert.match(result.summary.recommended_action.recommended_action, /runtime-backed direction review|frontier review|v6\.4/i);
  assert.deepEqual(result.summary.operator_alignment.prioritized_task_ids, []);
  assert.equal(result.summary.current_truth_conflicts.some((conflict) => conflict.code === "stale-alignment-pulse"), false);
});

test("roadmapStatusCommand keeps completed v5/v6 release work on the correct tracks", async () => {
  const projectRoot = process.cwd();
  const result = await roadmapStatusCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.deepEqual(result.alignment.prioritized_task_ids, []);
  assert.match(result.alignment.answer, /runtime-backed direction review|frontier review/i);
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
});

test("visibilityExportCommand surfaces situation judgment rather than stale release work", async () => {
  const projectRoot = process.cwd();
  const result = await visibilityExportCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.payloads.mission_control.mission_overview.release_version, "6.3.0");
  assert.equal(result.payloads.mission_control.mission_overview.current_runtime_stage, "frontier-definition-needed");
  assert.match(result.payloads.mission_control.next_action.recommended_action, /runtime-backed direction review|frontier review/i);
  assert.doesNotMatch(result.payloads.mission_control.next_action.recommended_action, /Mission Control visibility slice/i);
  assert.equal(result.payloads.mission_control.blockers.some((blocker) => /alignment pulse/i.test(blocker.summary)), false);
  assert.match(result.payloads.operator_brief.headline, /frontier|v6\.3|v6\.4/i);
  assert.match(result.payloads.operator_brief.next_action.recommended_action, /runtime-backed direction review|frontier review/i);
  assert.equal(result.payloads.mission_control.work_governance.present, true);
  assert.ok(result.payloads.mission_control.work_governance.work_items.length >= 2);
  assert.equal(result.payloads.operator_progress.view_type, "operator_progress");
  assert.equal(result.payloads.tree_position.view_type, "tree_position");
  assert.equal(result.payloads.evidence_drill_down.view_type, "evidence_drill_down");
});

test("operatorBriefCommand compresses runtime situation judgment into one operator-facing packet", async () => {
  const projectRoot = process.cwd();
  const result = await operatorBriefCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.brief.view_type, "operator_brief");
  assert.equal(result.brief.current_state.release_version, "6.3.0");
  assert.equal(result.brief.current_state.current_runtime_stage, "frontier-definition-needed");
  assert.equal(result.brief.current_state.primary_frontier_task, null);
  assert.equal(result.brief.current_state.skillful_actor_projection?.projection_id, "SAHRI-TASK-054-PROOF");
  assert.match(result.brief.operator_answers.what_should_happen_next, /runtime-backed direction review|frontier review/i);
});

test("organizationStatusCommand exposes the post-v6.0 direction goal and next value slice", async () => {
  const projectRoot = process.cwd();
  const result = await organizationStatusCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.match(result.goals.operating_goal, /AI Command Help Surface baseline|runtime-backed review/i);
  assert.match(result.goals.next_value_slice, /v6\.4 QIF-Governed Benchmark Explanation|runtime-backed frontier review/i);
});

test("operatorProgressCommand explains what changed since the last checkpoint", async () => {
  const projectRoot = process.cwd();
  const result = await operatorProgressCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.progress.view_type, "operator_progress");
  assert.match(result.progress.progress_answer.what_changed, /TASK-066|AI Command Help Surface|v6\.3/i);
});

test("treePositionCommand explains the current release trunk and frontier branch", async () => {
  const projectRoot = process.cwd();
  const result = await treePositionCommand({ project: projectRoot });

  assert.equal(result.ok, true);
  assert.equal(result.tree.view_type, "tree_position");
  assert.equal(result.tree.branch.frontier_task_id, null);
  assert.equal(result.tree.branch.frontier_track, null);
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
