import fs from "node:fs/promises";
import path from "node:path";

import { organizationStatusCommand } from "./organization-status.js";
import { organizationAnalyticsSnapshotCommand } from "./organization-analytics-snapshot.js";
import { learningLoopSnapshotCommand } from "./learning-loop-snapshot.js";
import { metricsSnapshotCommand } from "./metrics-snapshot.js";
import { buildOperatorBriefView } from "./operator-brief.js";
import { buildOperatorProgressView } from "./operator-progress.js";
import { buildTreePositionView } from "./tree-position.js";
import { buildEvidenceDrillDownView } from "./evidence-drill-down.js";
import { roadmapStatusCommand } from "./roadmap-status.js";
import { isDirectionSelectionSlice, loadSituationAssessmentSummary, normalizeTrackLabel } from "./situation-assess.js";
import { loadLatestSkillfulActorHriProjection } from "./skillful-actor-hri-projection.js";
import { resolveAofRoot } from "../runtime/project-paths.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { writeJsonArtifact } from "../runtime/utils.js";

function taskNumber(taskId) {
  const match = String(taskId ?? "").match(/TASK-(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

function releaseAtLeast(releaseVersion, requiredMajor, requiredMinor) {
  const match = String(releaseVersion ?? "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }
  const [, major, minor] = match.map(Number);
  return major > requiredMajor || (major === requiredMajor && minor >= requiredMinor);
}

async function readJson(filePath, label) {
  const text = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function listJsonFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.join(dirPath, entry.name))
      .sort();
  } catch {
    return [];
  }
}

async function listJsonFilesRecursive(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...await listJsonFilesRecursive(entryPath));
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(entryPath);
      }
    }
    return files.sort();
  } catch {
    return [];
  }
}

async function listLatestDoneTasks(aofRoot, limit = 3) {
  const taskPaths = await listJsonFiles(path.join(aofRoot, "tasks", "done"));
  const tasks = await Promise.all(taskPaths.map((taskPath) => readJson(taskPath, `task ${path.basename(taskPath)}`)));
  return tasks
    .sort((left, right) => String(right.updated_at ?? "").localeCompare(String(left.updated_at ?? "")))
    .slice(0, limit);
}

async function listOpenTasks(aofRoot) {
  const taskPaths = await listJsonFiles(path.join(aofRoot, "tasks", "open"));
  const tasks = await Promise.all(taskPaths.map((taskPath) => readJson(taskPath, `task ${path.basename(taskPath)}`)));
  return tasks.sort((left, right) => String(right.updated_at ?? "").localeCompare(String(left.updated_at ?? "")));
}

async function maybeReadJsonByRef(projectRoot, ref, label) {
  if (!ref) {
    return null;
  }
  const targetPath = path.resolve(projectRoot, ref);
  try {
    return await readJson(targetPath, label);
  } catch {
    return null;
  }
}

async function loadDiscoveryContext(projectRoot, discoveryHandoffRef, discoveryHandoffPayload = null) {
  const discoveryHandoff = discoveryHandoffPayload ?? await maybeReadJsonByRef(projectRoot, discoveryHandoffRef, "discovery handoff");
  const discoveryRefs = {
    discovery_handoff: discoveryHandoffRef ?? null,
    discovery_judgment: null,
    discovery_question_set: null,
    assumption_map: null,
    anomaly_log: null
  };
  let discoveryJudgment = null;

  if (discoveryHandoff?.evidence_refs?.length) {
    const judgmentRef = discoveryHandoff.evidence_refs.find((entry) => /\/judgments\/|DJP-/.test(String(entry)));
    if (judgmentRef) {
      discoveryRefs.discovery_judgment = judgmentRef;
      discoveryJudgment = await maybeReadJsonByRef(projectRoot, judgmentRef, "discovery judgment");
    }
  }

  let questionSet = null;
  let assumptionMap = null;
  let anomalyLog = null;
  if (discoveryJudgment) {
    discoveryRefs.discovery_question_set = discoveryJudgment.question_set_refs?.[0] ?? null;
    discoveryRefs.assumption_map = discoveryJudgment.artifact_refs?.find((entry) => /\/assumption-maps\/|ASM-/.test(String(entry))) ?? null;
    discoveryRefs.anomaly_log = discoveryJudgment.artifact_refs?.find((entry) => /\/anomaly-logs\/|ANL-/.test(String(entry))) ?? null;
    [questionSet, assumptionMap, anomalyLog] = await Promise.all([
      maybeReadJsonByRef(projectRoot, discoveryRefs.discovery_question_set, "discovery question set"),
      maybeReadJsonByRef(projectRoot, discoveryRefs.assumption_map, "assumption map"),
      maybeReadJsonByRef(projectRoot, discoveryRefs.anomaly_log, "anomaly log")
    ]);
  }

  return {
    refs: discoveryRefs,
    discoveryHandoff,
    discoveryJudgment,
    questionSet,
    assumptionMap,
    anomalyLog
  };
}

async function loadLatestNeedValidationChain(projectRoot, aofRoot) {
  const recordPaths = await listJsonFiles(path.join(aofRoot, "artifacts", "need-validation", "records"));
  if (recordPaths.length === 0) {
    const handoffPaths = await listJsonFiles(path.join(aofRoot, "artifacts", "discovery", "handoffs"));
    if (handoffPaths.length === 0) {
      return null;
    }
    const handoffs = await Promise.all(
      handoffPaths.map(async (handoffPath) => ({
        path: handoffPath,
        payload: await readJson(handoffPath, `discovery handoff ${path.basename(handoffPath)}`)
      }))
    );
    const latestHandoff = handoffs.sort((left, right) => String(right.payload.recorded_at ?? "").localeCompare(String(left.payload.recorded_at ?? "")))[0];
    const discoveryContext = await loadDiscoveryContext(
      projectRoot,
      path.relative(projectRoot, latestHandoff.path),
      latestHandoff.payload
    );
    return {
      refs: {
        need_validation: null,
        problem_statement: null,
        value_hypothesis: null,
        alternative_analysis: null,
        project_charter: null,
        ...discoveryContext.refs
      },
      needValidation: null,
      problemStatement: null,
      valueHypothesis: null,
      alternativeAnalysis: null,
      projectCharter: null,
      ...discoveryContext
    };
  }

  const records = await Promise.all(
    recordPaths.map(async (recordPath) => ({
      path: recordPath,
      payload: await readJson(recordPath, `need validation record ${path.basename(recordPath)}`)
    }))
  );
  const latest = records.sort((left, right) => String(right.payload.recorded_at ?? "").localeCompare(String(left.payload.recorded_at ?? "")))[0];
  const needValidation = latest.payload;
  const refs = {
    need_validation: path.relative(projectRoot, latest.path),
    problem_statement: needValidation.problem_statement_ref,
    value_hypothesis: needValidation.value_hypothesis_ref,
    alternative_analysis: needValidation.alternative_analysis_ref,
    project_charter: needValidation.project_charter_ref,
    discovery_handoff: needValidation.discovery_handoff_ref
  };

  const [problemStatement, valueHypothesis, alternativeAnalysis, projectCharter, discoveryHandoff] = await Promise.all([
    maybeReadJsonByRef(projectRoot, refs.problem_statement, "problem statement"),
    maybeReadJsonByRef(projectRoot, refs.value_hypothesis, "value hypothesis"),
    maybeReadJsonByRef(projectRoot, refs.alternative_analysis, "alternative analysis"),
    maybeReadJsonByRef(projectRoot, refs.project_charter, "project charter"),
    maybeReadJsonByRef(projectRoot, refs.discovery_handoff, "discovery handoff")
  ]);
  const discoveryContext = await loadDiscoveryContext(projectRoot, refs.discovery_handoff, discoveryHandoff);

  return {
    refs: {
      ...refs,
      ...discoveryContext.refs
    },
    needValidation,
    problemStatement,
    valueHypothesis,
    alternativeAnalysis,
    projectCharter,
    ...discoveryContext
  };
}

function pickCurrentVisibilityTask(situation, roadmapStatus) {
  if (situation?.primary_frontier_task) {
    return situation.primary_frontier_task;
  }

  const orderedTracks = Object.keys(roadmapStatus.release_tracks ?? {}).sort((left, right) => right.localeCompare(left));
  for (const track of orderedTracks) {
    const tasks = Array.isArray(roadmapStatus.release_tracks?.[track]) ? roadmapStatus.release_tracks[track] : [];
    const liveTask = tasks.find((task) => task.status === "open" || task.status === "assigned");
    if (liveTask) {
      return liveTask;
    }
  }
  return null;
}

function buildStatusCard({
  currentTask,
  nextValueSlice,
  metricsArtifactRef,
  analytics
}) {
  return {
    view_type: "status_card",
    as_of: analytics.generated_at,
    usage_level: "runtime-backed",
    current_phase: currentTask?.title ?? "organization_operating",
    current_goal: nextValueSlice ?? "No next value slice is currently projected.",
    owner: "AOF Runtime",
    open_signals: analytics.observations.filter((entry) => entry !== "No immediate organization bottleneck was detected from the current local artifact set."),
    next_checkpoint: currentTask?.title ?? nextValueSlice ?? "Review the next open organization task.",
    latest_artifact_ref: metricsArtifactRef,
    runtime_evidence_state: "present"
  };
}

function buildRuntimeExecutionView({
  generatedAt,
  executionLogRef,
  commandRuns,
  refreshedArtifactRefs
}) {
  const commands = Array.isArray(commandRuns) ? commandRuns : [];
  const artifacts = Array.isArray(refreshedArtifactRefs) ? refreshedArtifactRefs.filter(Boolean) : [];
  const incompleteReasons = [];

  if (commands.length < 1) {
    incompleteReasons.push("No runtime command execution was recorded for the current answer surface.");
  }
  if (!executionLogRef) {
    incompleteReasons.push("No execution log ref was recorded for the current answer surface.");
  }
  if (artifacts.length < 1) {
    incompleteReasons.push("No refreshed artifact refs were recorded for the current answer surface.");
  }

  return {
    view_type: "runtime_execution",
    generated_at: generatedAt,
    runtime_backing_required: {
      required_for: ["direction", "review", "self-review", "retrospective"],
      minimum_runtime_commands: 1,
      require_execution_log_ref: true,
      require_refreshed_artifact_ref: true,
      rule_summary: "Direction, review, self-review, and retrospective claims are incomplete unless at least one runtime command executed and both execution-log and refreshed-artifact refs are present."
    },
    last_execution: {
      status: incompleteReasons.length === 0 ? "pass" : "incomplete",
      executed_at: generatedAt,
      primary_command: commands[0]?.command ?? null,
      command_runs: commands,
      refreshed_artifact_refs: artifacts,
      execution_log_ref: executionLogRef,
      incomplete_reasons: incompleteReasons
    }
  };
}

function buildTimelineEntries({
  nextValueSlice,
  nextValueUpdatedAt,
  metrics,
  analytics,
  doneTasks
}) {
  const entries = [];

  if (nextValueSlice && nextValueUpdatedAt) {
    entries.push({
      at: nextValueUpdatedAt,
      actor: "AOF Runtime",
      event_type: "next_value_slice_updated",
      summary: nextValueSlice,
      rationale: "Project memory was updated to reflect the current operating focus.",
      next: "Project the current slice into operator visibility outputs.",
      refs: [".aof/goals/next-value-slice.json"]
    });
  }

  entries.push({
    at: metrics.generated_at,
    actor: "Verification Team",
    event_type: "metrics_snapshot",
    summary: `Allocation review load is ${metrics.observed_metrics.find((entry) => entry.metric_key === "allocation-review-load")?.value ?? 0}.`,
    rationale: "The current runtime metrics summarize review pressure and task inventory from live artifacts.",
    next: "Use the visibility packet to inspect operator-facing runtime health.",
    refs: [".aof/context/active/metrics-snapshot.json"]
  });

  entries.push({
    at: analytics.generated_at,
    actor: "Operations Council",
    event_type: "organization_analytics",
    summary: analytics.observations[0] ?? "No immediate organization bottleneck was detected.",
    rationale: "Organization analytics compress current task, dependency, contract, and escalation health.",
    next: "Review the highest-leverage open release task.",
    refs: [".aof/context/active/organization-analytics.json"]
  });

  for (const task of doneTasks) {
    entries.push({
      at: task.updated_at ?? task.done_at ?? task.created_at ?? metrics.generated_at,
      actor: "AOF Runtime",
      event_type: "task_completed",
      summary: task.title,
      rationale: "Completed tasks show the latest closed release work in the runtime task archive.",
      next: "Continue with the next open bridge-release task.",
      refs: [`.aof/tasks/done/${task.task_id}.json`]
    });
  }

  return entries
    .sort((left, right) => String(right.at).localeCompare(String(left.at)))
    .slice(0, 6);
}

function buildFlowSnapshot(hasFrontierTask) {
  const nodes = [
    { id: "operator_surfaces", label: "operator_surfaces", state: "done" },
    { id: "execution_contracts", label: "execution_contracts", state: "done" },
    { id: "governed_allocation", label: "governed_allocation", state: "done" },
    { id: "visibility_projection", label: "visibility_projection", state: "done" },
    { id: "runtime_loop_proof", label: "runtime_loop_proof", state: hasFrontierTask ? "done" : "current" },
    { id: "operator_progress", label: "operator_progress", state: hasFrontierTask ? "done" : "pending" },
    { id: "evidence_drill_down", label: "evidence_drill_down", state: hasFrontierTask ? "current" : "pending" }
  ];

  const edges = [
    { from: "operator_surfaces", to: "execution_contracts", reason: "operator model became execution-aware" },
    { from: "execution_contracts", to: "governed_allocation", reason: "execution artifacts enabled governed assignment planning" },
    { from: "governed_allocation", to: "visibility_projection", reason: "allocation state should become operator-visible automatically" },
    { from: "visibility_projection", to: "runtime_loop_proof", reason: "runtime proof should consume the same inspectable visibility layer" },
    { from: "runtime_loop_proof", to: "operator_progress", reason: "truthful runtime judgment should explain visible progress over time" },
    { from: "operator_progress", to: "evidence_drill_down", reason: "operator answers should drill down into the proof path" }
  ];

  return {
    view_type: "flow_snapshot",
    nodes,
    edges,
    current_node: hasFrontierTask ? "evidence_drill_down" : "runtime_loop_proof",
    ordered_nodes: nodes
  };
}

function deriveChainStage(chain) {
  if (chain?.projectCharter) {
    return "planning-ready";
  }
  if (chain?.needValidation) {
    return "need-validated";
  }
  if (chain?.discoveryHandoff) {
    return "discovery-handoff";
  }
  return "visibility-baseline";
}

function buildArtifactGraph(chain) {
  if (!chain) {
    return {
      nodes: [],
      edges: [],
      current_node_id: null
    };
  }

  const nodes = [];
  const edges = [];
  const pushNode = (id, label, kind, state, artifactRef) => {
    if (!artifactRef) {
      return;
    }
    nodes.push({ id, label, kind, state, artifact_ref: artifactRef });
  };
  const pushEdge = (from, to, relation, condition = true) => {
    if (condition) {
      edges.push({ from, to, relation });
    }
  };

  pushNode("discovery-question-set", "Discovery Question Set", "discovery", chain.questionSet ? "done" : "pending", chain.refs.discovery_question_set);
  pushNode("assumption-map", "Assumption Map", "discovery", chain.assumptionMap ? "done" : "pending", chain.refs.assumption_map);
  pushNode("anomaly-log", "Anomaly Log", "discovery", chain.anomalyLog ? "done" : "pending", chain.refs.anomaly_log);
  pushNode("discovery-judgment", "Discovery Judgment", "discovery", chain.discoveryJudgment ? "done" : "pending", chain.refs.discovery_judgment);
  pushNode("discovery-handoff", "Discovery Handoff", "discovery", chain.discoveryHandoff ? "done" : "pending", chain.refs.discovery_handoff);
  pushNode("problem-statement", "Problem Statement", "need-validation", chain.problemStatement ? "done" : "pending", chain.refs.problem_statement);
  pushNode("value-hypothesis", "Value Hypothesis", "need-validation", chain.valueHypothesis ? "done" : "pending", chain.refs.value_hypothesis);
  pushNode("alternative-analysis", "Alternative Analysis", "need-validation", chain.alternativeAnalysis ? "done" : "pending", chain.refs.alternative_analysis);
  pushNode("need-validation", "Need Validation Record", "need-validation", chain.needValidation ? "done" : "pending", chain.refs.need_validation);
  pushNode("project-charter", "Project Charter", "planning", chain.projectCharter ? "current" : "pending", chain.refs.project_charter);

  pushEdge("discovery-question-set", "discovery-judgment", "questions shape judgment", Boolean(chain.refs.discovery_question_set && chain.refs.discovery_judgment));
  pushEdge("assumption-map", "discovery-judgment", "assumptions inform judgment", Boolean(chain.refs.assumption_map && chain.refs.discovery_judgment));
  pushEdge("anomaly-log", "discovery-judgment", "anomalies inform judgment", Boolean(chain.refs.anomaly_log && chain.refs.discovery_judgment));
  pushEdge("discovery-judgment", "discovery-handoff", "judgment promotes handoff", Boolean(chain.refs.discovery_judgment && chain.refs.discovery_handoff));
  pushEdge("discovery-handoff", "need-validation", "handoff strengthens validation", Boolean(chain.refs.discovery_handoff));
  pushEdge("problem-statement", "need-validation", "problem definition supports validation", Boolean(chain.refs.problem_statement));
  pushEdge("value-hypothesis", "need-validation", "value hypothesis supports validation", Boolean(chain.refs.value_hypothesis));
  pushEdge("alternative-analysis", "need-validation", "alternatives constrain validation", Boolean(chain.refs.alternative_analysis));
  pushEdge("need-validation", "project-charter", "validated need authorizes planning", Boolean(chain.refs.project_charter));

  const currentNodeId = chain.projectCharter
    ? "project-charter"
    : chain.needValidation
      ? "need-validation"
      : chain.discoveryHandoff
        ? "discovery-handoff"
        : chain.discoveryJudgment
          ? "discovery-judgment"
          : null;

  const currentNodeExists = nodes.some((node) => node.id === currentNodeId);

  return {
    nodes,
    edges,
    current_node_id: currentNodeExists ? currentNodeId : null
  };
}

function summarizeSkillfulActorProjection(projection) {
  if (!projection) {
    return null;
  }
  return {
    projection_ref: projection.artifactRef,
    projection_id: projection.payload.projection_id,
    actor: projection.payload.actor,
    visible_state: projection.payload.visible_state,
    proof_chain: projection.payload.self_hosting_proof_chain.map((entry) => ({
      step: entry.step,
      artifact_ref: entry.artifact_ref,
      state: entry.state
    }))
  };
}

function trackNumber(track) {
  const normalized = normalizeTrackLabel(track);
  if (!normalized) {
    return -1;
  }
  const match = normalized.match(/^v(\d+)\.(\d+)$/i);
  if (!match) {
    return -1;
  }
  return Number.parseInt(match[1], 10) * 1000 + Number.parseInt(match[2], 10);
}

function extractTargetTrackFromText(text, activeTrack) {
  const tracks = [...String(text ?? "").matchAll(/\bv(\d+)\.(\d+)\b/gi)]
    .map((match) => `v${match[1]}.${match[2]}`);
  if (tracks.length === 0) {
    return null;
  }
  const activeNumber = trackNumber(activeTrack);
  const futureTracks = tracks.filter((track) => trackNumber(track) > activeNumber);
  if (futureTracks.length > 0) {
    return futureTracks.sort((left, right) => trackNumber(right) - trackNumber(left))[0];
  }
  return tracks[0];
}

async function loadWorkGovernanceProjection(projectRoot, aofRoot) {
  const root = path.join(aofRoot, "artifacts", "work-governance");
  const files = await listJsonFilesRecursive(root);
  const entries = [];
  for (const filePath of files) {
    const payload = await readJson(filePath, `work governance artifact ${path.basename(filePath)}`);
    if (!payload.artifact_type) {
      continue;
    }
    entries.push({
      ref: path.relative(projectRoot, filePath).replaceAll("\\", "/"),
      payload
    });
  }

  const byType = new Map();
  for (const entry of entries) {
    if (!byType.has(entry.payload.artifact_type)) {
      byType.set(entry.payload.artifact_type, []);
    }
    byType.get(entry.payload.artifact_type).push(entry);
  }

  const byWorkItem = (artifactType, field = "work_item_id") => {
    const map = new Map();
    for (const entry of byType.get(artifactType) ?? []) {
      const key = entry.payload[field];
      if (!key) {
        continue;
      }
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(entry);
    }
    return map;
  };

  const actorsByWorkItem = byWorkItem("actor-composition");
  const councilByWorkItem = byWorkItem("council-ready-output");
  const goNoGoByWorkItem = byWorkItem("go-no-go-visualization");
  const mapsByWorkItem = byWorkItem("operational-map-change-log", "work_item_ref");
  const contextPacks = byType.get("context-pack") ?? [];
  const externalRefs = byType.get("external-ref") ?? [];

  const workItems = (byType.get("work-item-goal") ?? []).map((goalEntry) => {
    const workItemId = goalEntry.payload.work_item_id;
    const actorEntry = actorsByWorkItem.get(workItemId)?.[0] ?? null;
    const councilEntry = councilByWorkItem.get(workItemId)?.[0] ?? null;
    const goNoGoEntry = goNoGoByWorkItem.get(workItemId)?.[0] ?? null;
    const mapEntry = mapsByWorkItem.get(workItemId)?.[0] ?? null;
    const contextEntry = contextPacks.find((entry) =>
      Array.isArray(entry.payload.active_work_items) &&
      entry.payload.active_work_items.some((item) => item.work_item_id === workItemId)
    ) ?? null;
    const linkedExternalRefs = externalRefs.filter((entry) =>
      (goalEntry.payload.external_refs ?? []).includes(entry.ref) ||
      (contextEntry?.payload.external_refs ?? []).includes(entry.ref)
    );

    return {
      work_item_id: workItemId,
      work_item_type: goalEntry.payload.work_item_type,
      objective: goalEntry.payload.objective,
      reason_for_work: goalEntry.payload.reason_for_work,
      council_review_need: goalEntry.payload.council_review_need,
      required_actor_roles: goalEntry.payload.required_actor_roles ?? [],
      required_skills: goalEntry.payload.required_skills ?? [],
      selected_actors: actorEntry?.payload.selected_actors ?? [],
      authority_boundaries: actorEntry?.payload.authority_boundaries ?? [],
      council_status: councilEntry?.payload.go_no_go_recommendation ?? null,
      council_summary: councilEntry?.payload.summary ?? null,
      go_no_go_state: goNoGoEntry?.payload.decision_state ?? null,
      go_no_go_summary: goNoGoEntry?.payload.viewer_summary ?? null,
      operational_map_summary: mapEntry?.payload.human_readable_summary ?? null,
      context_summary: contextEntry?.payload.priority_summary ?? null,
      next_recommended_action: contextEntry?.payload.next_recommended_action ?? null,
      refs: {
        work_item_goal: goalEntry.ref,
        actor_composition: actorEntry?.ref ?? null,
        council_ready_output: councilEntry?.ref ?? null,
        go_no_go_visualization: goNoGoEntry?.ref ?? null,
        operational_map_change_log: mapEntry?.ref ?? null,
        context_pack: contextEntry?.ref ?? null,
        external_refs: linkedExternalRefs.map((entry) => entry.ref)
      }
    };
  });

  const benchmarkRef = ".aof/artifacts/work-governance/benchmarks/work-governance-benchmark.json";
  return {
    present: workItems.length > 0,
    artifact_root_ref: ".aof/artifacts/work-governance",
    benchmark_ref: benchmarkRef,
    work_item_count: workItems.length,
    work_items: workItems.sort((left, right) => left.work_item_id.localeCompare(right.work_item_id))
  };
}

async function listArchmapFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...await listArchmapFiles(entryPath));
      } else if (entry.isFile() && entry.name.endsWith(".archmap")) {
        files.push(entryPath);
      }
    }
    return files.sort();
  } catch {
    return [];
  }
}

async function loadArchmapProjection(projectRoot, aofRoot) {
  const sourceFiles = await listArchmapFiles(path.join(projectRoot, "docs", "archmaps"));
  const impactFiles = await listJsonFiles(path.join(aofRoot, "artifacts", "archmap", "impact"));
  const impactRecords = [];
  for (const impactFile of impactFiles) {
    impactRecords.push({
      ref: path.relative(projectRoot, impactFile).replaceAll("\\", "/"),
      payload: await readJson(impactFile, `archmap impact ${path.basename(impactFile)}`)
    });
  }
  impactRecords.sort((left, right) => {
    const leftTask = taskNumber(left.payload.work_item_id);
    const rightTask = taskNumber(right.payload.work_item_id);
    if (Number.isFinite(leftTask) && Number.isFinite(rightTask) && leftTask !== rightTask) {
      return rightTask - leftTask;
    }
    return String(right.payload.recorded_at ?? "").localeCompare(String(left.payload.recorded_at ?? ""));
  });

  const currentSourceRef = sourceFiles[0]
    ? path.relative(projectRoot, sourceFiles[0]).replaceAll("\\", "/")
    : null;
  const latestImpact = impactRecords[0] ?? null;
  const pendingImpacts = impactRecords.filter((entry) =>
    /pending|deferred|required/i.test(String(entry.payload.council_review_status ?? entry.payload.status ?? ""))
  );

  return {
    present: Boolean(currentSourceRef || impactRecords.length > 0),
    current_source_ref: currentSourceRef,
    impact_record_count: impactRecords.length,
    latest_impact_ref: latestImpact?.ref ?? null,
    latest_impact_status: latestImpact?.payload.status ?? null,
    latest_work_item_id: latestImpact?.payload.work_item_id ?? null,
    pending_impact_count: pendingImpacts.length,
    pending_impacts: pendingImpacts.map((entry) => ({
      work_item_id: entry.payload.work_item_id ?? null,
      status: entry.payload.status ?? null,
      council_review_status: entry.payload.council_review_status ?? null,
      artifact_ref: entry.ref
    })),
    source_of_truth: [
      currentSourceRef,
      latestImpact?.ref ?? null
    ].filter(Boolean),
    external_refs: latestImpact?.payload.external_refs ?? []
  };
}

async function loadOrganizationStateProjection(projectRoot, aofRoot) {
  const organizationPath = path.join(aofRoot, "organization.json");
  const organization = await maybeReadJsonByRef(projectRoot, ".aof/organization.json", "organization");
  if (!organization) {
    return {
      present: false,
      organization_ref: path.relative(projectRoot, organizationPath).replaceAll("\\", "/"),
      topology: null,
      council_count: 0,
      team_count: 0,
      role_count: 0,
      agent_count: 0,
      councils: [],
      teams: [],
      roles: [],
      agents: []
    };
  }

  const teams = Array.isArray(organization.teams) ? organization.teams : [];
  return {
    present: true,
    organization_ref: ".aof/organization.json",
    topology: organization.topology ?? null,
    council_count: Array.isArray(organization.councils) ? organization.councils.length : 0,
    team_count: teams.length,
    role_count: Array.isArray(organization.roles) ? organization.roles.length : 0,
    agent_count: Array.isArray(organization.agents) ? organization.agents.length : 0,
    councils: (organization.councils ?? []).map((council) => ({
      council_id: council.council_id ?? null,
      name: council.name ?? council.council_id ?? "Council",
      approval_policy: council.approval_policy ?? null,
      mission: council.mission ?? null,
      responsibilities: council.responsibilities ?? []
    })),
    teams: teams.map((team) => ({
      team_id: team.team_id ?? null,
      name: team.name ?? team.team_id ?? "Team",
      mission: team.mission ?? null,
      dependencies: team.dependencies ?? [],
      responsibilities: team.responsibilities ?? []
    })),
    roles: (organization.roles ?? []).map((role) => {
      const team = teams.find((entry) => entry.team_id === role.team_ref);
      return {
        role_id: role.role_id ?? null,
        name: role.name ?? role.role_id ?? "Role",
        team_ref: role.team_ref ?? null,
        team_name: team?.name ?? null,
        mission: role.mission ?? null,
        authority: role.authority ?? [],
        assignment_count: Array.isArray(role.assignments) ? role.assignments.length : 0
      };
    }),
    agents: (organization.agents ?? []).map((agent) => ({
      agent_id: agent.agent_id ?? null,
      agent_type: agent.agent_type ?? null,
      provider: agent.provider ?? null,
      capabilities: agent.capabilities ?? []
    }))
  };
}

async function loadAgentSessionObservabilityProjection(projectRoot, aofRoot) {
  const sessionFiles = await listJsonFiles(path.join(aofRoot, "artifacts", "agent-sessions"));
  const sessions = [];
  for (const sessionFile of sessionFiles) {
    sessions.push({
      ref: path.relative(projectRoot, sessionFile).replaceAll("\\", "/"),
      payload: await readJson(sessionFile, `agent session ${path.basename(sessionFile)}`)
    });
  }
  sessions.sort((left, right) => String(right.payload.recorded_at ?? "").localeCompare(String(left.payload.recorded_at ?? "")));

  const latest = sessions[0] ?? null;
  const audit = await maybeReadJsonByRef(
    projectRoot,
    ".aof/artifacts/session-observability/session-observability-audit.json",
    "session observability audit"
  );
  const latestAuditStream = latest && Array.isArray(audit?.streams)
    ? audit.streams.find((stream) => stream.session_id === latest.payload.session_id)
    : null;
  const latestEvents = latest?.payload.events ?? [];
  const latestLinks = latest?.payload.links ?? {};
  const latestToolEvents = latestEvents.filter((event) => event.event_type === "tool_call");

  return {
    present: sessions.length > 0,
    artifact_root_ref: ".aof/artifacts/agent-sessions",
    audit_ref: audit ? ".aof/artifacts/session-observability/session-observability-audit.json" : null,
    stream_count: sessions.length,
    latest_session_id: latest?.payload.session_id ?? null,
    latest_session_ref: latest?.ref ?? null,
    latest_actor_ref: latest?.payload.actor_ref ?? null,
    latest_role_ref: latest?.payload.role_ref ?? null,
    latest_recorded_at: latest?.payload.recorded_at ?? null,
    latest_event_count: latestEvents.length,
    latest_release_verdict: latest?.payload.release_ready_evidence?.verdict ?? null,
    audit_ok: audit?.ok ?? null,
    audit_failing_check_count: audit?.summary?.failing_check_count ?? null,
    latest_audit_stream_ref: latestAuditStream?.stream_ref ?? null,
    linked_task_refs: latestLinks.task_refs ?? [],
    linked_requirement_refs: latestLinks.requirement_refs ?? [],
    linked_test_evidence_refs: latestLinks.test_evidence_refs ?? [],
    linked_artifact_refs: latestLinks.artifact_refs ?? [],
    risk_candidates: latest?.payload.risk_candidates ?? [],
    decision_candidates: latest?.payload.decision_candidates ?? [],
    latest_events: latestEvents.slice(-8).map((event) => ({
      event_type: event.event_type,
      summary: event.summary,
      occurred_at: event.occurred_at,
      tool_name: event.tool_name ?? null,
      safety_level: event.safety_level ?? null,
      approval_policy: event.approval_policy ?? null,
      artifact_refs: event.artifact_refs ?? []
    })),
    latest_tool_calls: latestToolEvents.map((event) => ({
      summary: event.summary,
      tool_name: event.tool_name ?? null,
      safety_level: event.safety_level ?? null,
      approval_policy: event.approval_policy ?? null
    }))
  };
}

async function loadContextReferenceIntegrityProjection(projectRoot, aofRoot) {
  const contextFiles = await listJsonFiles(path.join(aofRoot, "artifacts", "context-integrity"));
  const externalFiles = await listJsonFiles(path.join(aofRoot, "artifacts", "external-reference-integrity"));
  const contextRecords = [];
  const externalRecords = [];

  for (const filePath of contextFiles) {
    const payload = await readJson(filePath, `context integrity ${path.basename(filePath)}`);
    contextRecords.push({
      ref: path.relative(projectRoot, filePath).replaceAll("\\", "/"),
      work_item_id: payload.work_item_id ?? null,
      integrity_status: payload.integrity_status ?? null,
      missing_context_count: Array.isArray(payload.missing_context_refs) ? payload.missing_context_refs.length : 0,
      hidden_signal_count: Array.isArray(payload.hidden_context_signals) ? payload.hidden_context_signals.length : 0,
      not_proven: payload.not_proven ?? null
    });
  }

  for (const filePath of externalFiles) {
    const payload = await readJson(filePath, `external reference integrity ${path.basename(filePath)}`);
    externalRecords.push({
      ref: path.relative(projectRoot, filePath).replaceAll("\\", "/"),
      external_ref: payload.external_ref ?? null,
      external_ref_artifact_ref: payload.external_ref_artifact_ref ?? null,
      freshness_status: payload.freshness_status ?? null,
      availability_status: payload.availability_status ?? null,
      integrity_status: payload.integrity_status ?? null
    });
  }

  contextRecords.sort((left, right) => String(right.work_item_id ?? "").localeCompare(String(left.work_item_id ?? "")));
  externalRecords.sort((left, right) => String(right.external_ref ?? "").localeCompare(String(left.external_ref ?? "")));

  const audit = await maybeReadJsonByRef(
    projectRoot,
    ".aof/artifacts/context-reference/context-reference-integrity-audit.json",
    "context reference integrity audit"
  );

  return {
    present: contextRecords.length > 0 || externalRecords.length > 0 || Boolean(audit),
    artifact_root_ref: ".aof/artifacts/context-integrity",
    external_artifact_root_ref: ".aof/artifacts/external-reference-integrity",
    audit_ref: audit ? ".aof/artifacts/context-reference/context-reference-integrity-audit.json" : null,
    audit_ok: audit?.ok ?? null,
    audit_failing_check_count: audit?.summary?.failing_check_count ?? null,
    context_record_count: contextRecords.length,
    external_reference_record_count: externalRecords.length,
    blocked_context_count: contextRecords.filter((record) => record.integrity_status === "blocked").length,
    stale_external_reference_count: externalRecords.filter((record) => record.freshness_status === "stale").length,
    latest_context_records: contextRecords.slice(0, 8),
    latest_external_reference_records: externalRecords.slice(0, 8)
  };
}

async function loadRequirementCoverageProjection(projectRoot, aofRoot) {
  const recordFiles = await listJsonFiles(path.join(aofRoot, "artifacts", "requirement-coverage"));
  const records = [];
  for (const recordFile of recordFiles) {
    const payload = await readJson(recordFile, `requirement coverage ${path.basename(recordFile)}`);
    records.push({
      ref: path.relative(projectRoot, recordFile).replaceAll("\\", "/"),
      payload
    });
  }

  records.sort((left, right) => {
    const leftTask = taskNumber(left.payload.work_item_id);
    const rightTask = taskNumber(right.payload.work_item_id);
    if (Number.isFinite(leftTask) && Number.isFinite(rightTask) && leftTask !== rightTask) {
      return rightTask - leftTask;
    }
    return String(right.payload.recorded_at ?? "").localeCompare(String(left.payload.recorded_at ?? ""));
  });

  const latest = records[0] ?? null;
  const requirements = latest?.payload.requirements ?? [];
  const coverageSummary = latest?.payload.coverage_summary ?? {};

  return {
    present: records.length > 0,
    artifact_root_ref: ".aof/artifacts/requirement-coverage",
    latest_record_ref: latest?.ref ?? null,
    latest_work_item_id: latest?.payload.work_item_id ?? null,
    latest_recorded_at: latest?.payload.recorded_at ?? null,
    coverage_status: latest?.payload.coverage_status ?? null,
    total_requirements: coverageSummary.total_requirements ?? requirements.length,
    covered_count: coverageSummary.covered_count ?? requirements.filter((entry) => entry.status === "covered").length,
    partial_count: coverageSummary.partial_count ?? requirements.filter((entry) => entry.status === "partial").length,
    blocked_count: coverageSummary.blocked_count ?? requirements.filter((entry) => entry.status === "blocked").length,
    at_risk_count: coverageSummary.at_risk_count ?? requirements.filter((entry) => entry.status === "at_risk").length,
    unstarted_count: coverageSummary.unstarted_count ?? requirements.filter((entry) => entry.status === "unstarted").length,
    coverage_ratio: latest?.payload.coverage_summary?.coverage_ratio ?? null,
    forecast: latest?.payload.forecast ?? null,
    forecast_boundary: latest?.payload.forecast?.forecast_boundary ?? null,
    requirements: requirements.map((entry) => ({
      requirement_id: entry.requirement_id ?? null,
      title: entry.title ?? null,
      status: entry.status ?? null,
      source_ref: entry.source_ref ?? null,
      owner_ref: entry.owner_ref ?? null,
      evidence_refs: entry.evidence_refs ?? [],
      blocker_refs: entry.blocker_refs ?? []
    })),
    not_proven: latest?.payload.not_proven ?? null,
    source_of_truth: [latest?.ref ?? null].filter(Boolean)
  };
}

async function loadAdoptionProofProjection(projectRoot) {
  const benchmarkRef = ".aof/artifacts/work-governance/benchmarks/adoption-proof-benchmark.json";
  const benchmark = await maybeReadJsonByRef(projectRoot, benchmarkRef, "adoption proof benchmark");
  if (!benchmark) {
    return {
      present: false,
      benchmark_ref: benchmarkRef,
      generated_at: null,
      benchmark_status: "missing",
      benchmark_count: 0,
      pass_count: 0,
      fail_count: 0,
      failing_benchmarks: [],
      artifacts_evaluated: [],
      latest_evidence_refs: [],
      not_proven: "No adoption proof benchmark artifact is present."
    };
  }

  const rawChecks = benchmark.checks ?? benchmark.benchmarks ?? [];
  const checks = Array.isArray(rawChecks)
    ? rawChecks
    : Object.entries(rawChecks).map(([id, entry]) => ({ id, ...entry }));
  const failing = checks.filter((entry) => entry.status !== "pass");
  const evidenceRefs = new Set();
  for (const check of checks) {
    for (const ref of check.evidence_refs ?? check.evidence ?? []) {
      evidenceRefs.add(ref);
    }
  }
  const artifactsEvaluated = Array.isArray(benchmark.artifacts_evaluated)
    ? benchmark.artifacts_evaluated
    : Number.isFinite(benchmark.artifacts_evaluated)
      ? [`${benchmark.artifacts_evaluated} artifact(s) evaluated`]
      : benchmark.summary?.artifact_refs ?? [];

  return {
    present: true,
    benchmark_ref: benchmarkRef,
    generated_at: benchmark.generated_at ?? null,
    benchmark_status: (benchmark.ok === true || benchmark.ok == null) && failing.length === 0 ? "pass" : "fail",
    benchmark_count: checks.length,
    pass_count: checks.filter((entry) => entry.status === "pass").length,
    fail_count: failing.length,
    failing_benchmarks: failing.map((entry) => ({
      id: entry.id ?? entry.name ?? null,
      summary: entry.summary ?? entry.detail ?? null,
      evidence_refs: entry.evidence_refs ?? entry.evidence ?? []
    })),
    artifacts_evaluated: artifactsEvaluated,
    latest_evidence_refs: [...evidenceRefs].sort(),
    not_proven: "Adoption proof is structural/runtime evidence; market value and semantic truth still require operator or external validation."
  };
}

async function loadExternalizationReadinessProjection(projectRoot) {
  const auditRef = ".aof/artifacts/externalization/externalization-readiness-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "externalization readiness audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      externalization_claim_count: 0,
      ready_claim_count: 0,
      blocked_claim_count: 0,
      missing_boundary_count: null,
      claims: [],
      not_proven: "No externalization readiness audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    externalization_claim_count: audit.summary?.externalization_claim_count ?? 0,
    ready_claim_count: audit.summary?.ready_claim_count ?? 0,
    blocked_claim_count: audit.summary?.blocked_claim_count ?? 0,
    missing_boundary_count: audit.summary?.missing_boundary_count ?? null,
    claims: audit.externalization_claims ?? [],
    not_proven: "Externalization readiness is structural/runtime boundary evidence; it does not prove external provider correctness or semantic truth."
  };
}

async function loadExternalResourceProjection(projectRoot) {
  const auditRef = ".aof/artifacts/external-resources/external-resource-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "external resource audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      resource_count: 0,
      ready_resource_count: 0,
      use_count: 0,
      approved_or_not_required_use_count: 0,
      blocked_use_count: 0,
      missing_boundary_count: null,
      resources: [],
      uses: [],
      not_proven: "No external resource audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    resource_count: audit.summary?.resource_count ?? 0,
    ready_resource_count: audit.summary?.ready_resource_count ?? 0,
    use_count: audit.summary?.use_count ?? 0,
    approved_or_not_required_use_count: audit.summary?.approved_or_not_required_use_count ?? 0,
    blocked_use_count: audit.summary?.blocked_use_count ?? 0,
    missing_boundary_count: audit.summary?.missing_boundary_count ?? null,
    resources: audit.resources ?? [],
    uses: audit.uses ?? [],
    not_proven: "External resource projection is structural/runtime evidence; it does not prove semantic correctness of external output or operator acceptance."
  };
}

async function loadProviderAdapterProjection(projectRoot) {
  const auditRef = ".aof/artifacts/provider-adapters/provider-adapter-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "provider adapter audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      adapter_count: 0,
      ready_adapter_count: 0,
      write_capable_adapter_count: 0,
      blocked_adapter_count: 0,
      missing_boundary_count: null,
      adapters: [],
      not_proven: "No provider adapter audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    adapter_count: audit.summary?.adapter_count ?? 0,
    ready_adapter_count: audit.summary?.ready_adapter_count ?? 0,
    write_capable_adapter_count: audit.summary?.write_capable_adapter_count ?? 0,
    blocked_adapter_count: audit.summary?.blocked_adapter_count ?? 0,
    missing_boundary_count: audit.summary?.missing_boundary_count ?? null,
    adapters: audit.adapters ?? [],
    not_proven: "Provider adapter projection is structural/runtime evidence; it does not prove provider output correctness or external-write safety."
  };
}

async function loadProviderAdapterPilotProjection(projectRoot) {
  const auditRef = ".aof/artifacts/provider-adapter-pilots/provider-adapter-pilot-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "provider adapter pilot audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      pilot_count: 0,
      ready_pilot_count: 0,
      blocked_pilot_count: 0,
      external_write_pilot_count: 0,
      missing_boundary_count: null,
      pilots: [],
      not_proven: "No provider adapter pilot audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    pilot_count: audit.summary?.pilot_count ?? 0,
    ready_pilot_count: audit.summary?.ready_pilot_count ?? 0,
    blocked_pilot_count: audit.summary?.blocked_pilot_count ?? 0,
    external_write_pilot_count: audit.summary?.external_write_pilot_count ?? 0,
    missing_boundary_count: audit.summary?.missing_boundary_count ?? null,
    pilots: audit.pilots ?? [],
    not_proven: "Provider adapter pilot projection is dry-run/default-deny governance evidence; it does not prove production execution safety, credential safety, billing safety, or semantic provider correctness."
  };
}

async function loadProviderExecutionApprovalProjection(projectRoot) {
  const auditRef = ".aof/artifacts/provider-execution-approvals/provider-execution-approval-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "provider execution approval audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      approval_count: 0,
      approved_count: 0,
      pending_count: 0,
      blocked_count: 0,
      external_write_authorized_count: 0,
      production_executed_count: 0,
      missing_boundary_count: null,
      approvals: [],
      not_proven: "No provider execution approval audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    approval_count: audit.summary?.approval_count ?? 0,
    approved_count: audit.summary?.approved_count ?? 0,
    pending_count: audit.summary?.pending_count ?? 0,
    blocked_count: audit.summary?.blocked_count ?? 0,
    external_write_authorized_count: audit.summary?.external_write_authorized_count ?? 0,
    production_executed_count: audit.summary?.production_executed_count ?? 0,
    missing_boundary_count: audit.summary?.missing_boundary_count ?? null,
    approvals: audit.approvals ?? [],
    not_proven: "Provider execution approval projection is preflight governance evidence; it does not prove production execution happened, provider correctness, billing safety, or credential safety."
  };
}

async function loadProviderExecutionReproductionProjection(projectRoot) {
  const auditRef = ".aof/artifacts/provider-execution-reproductions/provider-execution-reproduction-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "provider execution reproduction audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      reproduction_count: 0,
      reproduced_count: 0,
      blocked_count: 0,
      mismatch_count: 0,
      missing_boundary_count: null,
      reproductions: [],
      not_proven: "No provider execution reproduction audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    reproduction_count: audit.summary?.reproduction_count ?? 0,
    reproduced_count: audit.summary?.reproduced_count ?? 0,
    blocked_count: audit.summary?.blocked_count ?? 0,
    mismatch_count: audit.summary?.mismatch_count ?? 0,
    missing_boundary_count: audit.summary?.missing_boundary_count ?? null,
    reproductions: audit.reproductions ?? [],
    not_proven: "Provider execution reproduction projection proves local reconstruction only; it does not prove production execution, provider truth, credential safety, billing safety, or rollback execution."
  };
}

async function loadProviderRollbackProofProjection(projectRoot) {
  const auditRef = ".aof/artifacts/provider-rollback-proofs/provider-rollback-proof-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "provider rollback proof audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      rollback_count: 0,
      ready_count: 0,
      blocked_count: 0,
      mismatch_count: 0,
      missing_boundary_count: null,
      rollback_proofs: [],
      not_proven: "No provider rollback proof audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    rollback_count: audit.summary?.rollback_count ?? 0,
    ready_count: audit.summary?.ready_count ?? 0,
    blocked_count: audit.summary?.blocked_count ?? 0,
    mismatch_count: audit.summary?.mismatch_count ?? 0,
    missing_boundary_count: audit.summary?.missing_boundary_count ?? null,
    rollback_proofs: audit.rollback_proofs ?? [],
    not_proven: "Provider rollback proof projection proves simulated rollback readiness only; it does not prove production rollback has executed or provider state changed safely."
  };
}

async function loadProviderOutcomeEvidenceProjection(projectRoot) {
  const auditRef = ".aof/artifacts/provider-outcome-evidence/provider-outcome-evidence-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "provider outcome evidence audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      outcome_count: 0,
      accepted_count: 0,
      corrected_count: 0,
      rollback_recommended_count: 0,
      blocked_count: 0,
      missing_boundary_count: null,
      outcomes: [],
      not_proven: "No provider outcome evidence audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    outcome_count: audit.summary?.outcome_count ?? 0,
    accepted_count: audit.summary?.accepted_count ?? 0,
    corrected_count: audit.summary?.corrected_count ?? 0,
    rollback_recommended_count: audit.summary?.rollback_recommended_count ?? 0,
    blocked_count: audit.summary?.blocked_count ?? 0,
    missing_boundary_count: audit.summary?.missing_boundary_count ?? null,
    outcomes: audit.outcomes ?? [],
    not_proven: "Provider outcome evidence projection proves bounded outcome traceability only; it does not prove semantic truth, market truth, production safety, or provider correctness."
  };
}

async function loadProviderLearningLoopProjection(projectRoot) {
  const auditRef = ".aof/artifacts/provider-learning-loop/provider-learning-loop-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "provider learning loop audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      learning_count: 0,
      updated_count: 0,
      escalated_count: 0,
      blocked_count: 0,
      missing_boundary_count: null,
      learning_updates: [],
      not_proven: "No provider learning-loop audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    learning_count: audit.summary?.learning_count ?? 0,
    updated_count: audit.summary?.updated_count ?? 0,
    escalated_count: audit.summary?.escalated_count ?? 0,
    blocked_count: audit.summary?.blocked_count ?? 0,
    missing_boundary_count: audit.summary?.missing_boundary_count ?? null,
    learning_updates: audit.learning_updates ?? [],
    not_proven: "Provider learning-loop projection proves that learning was recorded from outcome evidence only; it does not prove the lesson is semantically or commercially correct."
  };
}

async function loadOperatorAcceptanceDrillProjection(projectRoot) {
  const auditRef = ".aof/artifacts/operator-acceptance-drills/operator-acceptance-drill-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "operator acceptance drill audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      drill_count: 0,
      accept_count: 0,
      stop_count: 0,
      rollback_count: 0,
      escalate_count: 0,
      defer_count: 0,
      missing_boundary_count: null,
      drills: [],
      not_proven: "No operator acceptance drill audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    drill_count: audit.summary?.drill_count ?? 0,
    accept_count: audit.summary?.accept_count ?? 0,
    stop_count: audit.summary?.stop_count ?? 0,
    rollback_count: audit.summary?.rollback_count ?? 0,
    escalate_count: audit.summary?.escalate_count ?? 0,
    defer_count: audit.summary?.defer_count ?? 0,
    missing_boundary_count: audit.summary?.missing_boundary_count ?? null,
    drills: audit.drills ?? [],
    not_proven: "Operator acceptance drill projection proves a bounded operator decision was recorded only; it does not prove production safety, semantic truth, market truth, or actual provider execution."
  };
}

function buildProviderAdapterPilotReadinessProjection({
  providerAdapterProjection,
  providerAdapterPilotProjection,
  providerExecutionApprovalProjection,
  roadmapStatus
}) {
  const missingEvidence = [
    !providerAdapterProjection?.present ? "provider-adapter-contract" : null,
    !providerAdapterPilotProjection?.present ? "provider-adapter-pilot-audit" : null
  ].filter(Boolean);
  const blockedPilotCount = providerAdapterPilotProjection?.blocked_pilot_count ?? 0;
  const missingBoundaryCount = providerAdapterPilotProjection?.missing_boundary_count ?? 0;
  const externalWritePilotCount = providerAdapterPilotProjection?.external_write_pilot_count ?? 0;
  const externalWriteAuthorizedCount = providerExecutionApprovalProjection?.external_write_authorized_count ?? 0;
  const auditOk = Boolean(providerAdapterProjection?.audit_ok && providerAdapterPilotProjection?.audit_ok);
  let readinessStatus = "ready";
  let governanceAction = "allow-dry-run-pilot-claim";
  let readinessSummary = "Provider adapter pilot evidence is present, bounded, and default-deny.";
  if (missingEvidence.length > 0) {
    readinessStatus = "not_proven";
    governanceAction = "collect-provider-pilot-evidence";
    readinessSummary = `Missing provider pilot evidence: ${missingEvidence.join(", ")}.`;
  } else if (!auditOk || blockedPilotCount > 0 || missingBoundaryCount > 0) {
    readinessStatus = "blocked";
    governanceAction = "block-provider-pilot-readiness-claim";
    readinessSummary = "Provider adapter pilot readiness is blocked by failed audits, blocked pilots, or missing boundaries.";
  } else if (externalWritePilotCount > 0 && externalWriteAuthorizedCount < externalWritePilotCount) {
    readinessStatus = "needs_approval";
    governanceAction = "require-explicit-operator-approval-before-any-external-write-pilot";
    readinessSummary = `${externalWritePilotCount} write-mode pilot(s) require explicit approval evidence; ${externalWriteAuthorizedCount} have bounded preflight authorization.`;
  } else if (externalWritePilotCount > 0) {
    readinessSummary = `${externalWritePilotCount} write-mode pilot(s) have bounded preflight authorization evidence; production execution remains not proven.`;
  }

  return {
    present: missingEvidence.length === 0,
    readiness_status: readinessStatus,
    readiness_summary: readinessSummary,
    release_ref: roadmapStatus?.roadmap_refs?.current_release_definition ?? null,
    pilot_refs: (providerAdapterPilotProjection?.pilots ?? []).map((pilot) => pilot.artifact_ref).filter(Boolean),
    evidence_refs: [
      providerAdapterProjection?.audit_ref,
      providerAdapterPilotProjection?.audit_ref,
      providerExecutionApprovalProjection?.audit_ref,
      ...(providerAdapterPilotProjection?.pilots ?? []).map((pilot) => pilot.artifact_ref)
    ].filter(Boolean),
    governance_action: governanceAction,
    default_mode_boundary: "Provider adapter execution pilots are dry-run/default-deny unless an explicit approval artifact authorizes a narrower mode.",
    approval_boundary: "Write-mode provider pilots require approval evidence and remain non-production by default.",
    risk_boundary: "This projection governs pilot readiness only; it is not permission for production external writes.",
    not_proven: "Provider adapter pilot readiness does not prove provider output correctness, credential safety, billing safety, production safety, or autonomous external execution readiness."
  };
}

function buildExternalRuntimeSafetyProjection({
  externalizationReadinessProjection,
  externalResourceProjection,
  providerAdapterProjection,
  providerAdapterPilotProjection,
  providerExecutionApprovalProjection,
  contextReferenceIntegrityProjection,
  roadmapStatus
}) {
  const requiresProviderPilot = releaseAtLeast(roadmapStatus?.active_release?.release_version, 8, 5);
  const requiresProviderApproval = releaseAtLeast(roadmapStatus?.active_release?.release_version, 8, 6);
  const firstExternalUseWorkItemId = externalResourceProjection?.uses?.[0]?.work_item_id ?? null;
  const evidenceRefs = [
    externalizationReadinessProjection?.audit_ref,
    externalResourceProjection?.audit_ref,
    providerAdapterProjection?.audit_ref,
    requiresProviderPilot ? providerAdapterPilotProjection?.audit_ref : null,
    requiresProviderApproval ? providerExecutionApprovalProjection?.audit_ref : null,
    contextReferenceIntegrityProjection?.audit_ref,
    roadmapStatus?.roadmap_refs?.current_release_definition
  ].filter(Boolean);
  const providerRefs = (providerAdapterProjection?.adapters ?? []).map((adapter) => adapter.artifact_ref).filter(Boolean);
  const resourceRefs = [
    ...(externalResourceProjection?.resources ?? []).map((resource) => resource.artifact_ref),
    ...(externalResourceProjection?.uses ?? []).map((use) => use.artifact_ref)
  ].filter(Boolean);
  const missingEvidence = [
    !externalizationReadinessProjection?.present ? "externalization-readiness" : null,
    !externalResourceProjection?.present ? "external-resource" : null,
    !providerAdapterProjection?.present ? "provider-adapter" : null,
    requiresProviderPilot && !providerAdapterPilotProjection?.present ? "provider-adapter-pilot" : null,
    requiresProviderApproval && !providerExecutionApprovalProjection?.present ? "provider-execution-approval" : null
  ].filter(Boolean);
  const blockedCount = (externalizationReadinessProjection?.blocked_claim_count ?? 0)
    + (externalResourceProjection?.blocked_use_count ?? 0)
    + (providerAdapterProjection?.blocked_adapter_count ?? 0)
    + (requiresProviderPilot ? (providerAdapterPilotProjection?.blocked_pilot_count ?? 0) : 0)
    + (requiresProviderApproval ? (providerExecutionApprovalProjection?.blocked_count ?? 0) : 0);
  const missingBoundaryCount = (externalizationReadinessProjection?.missing_boundary_count ?? 0)
    + (externalResourceProjection?.missing_boundary_count ?? 0)
    + (providerAdapterProjection?.missing_boundary_count ?? 0)
    + (requiresProviderPilot ? (providerAdapterPilotProjection?.missing_boundary_count ?? 0) : 0)
    + (requiresProviderApproval ? (providerExecutionApprovalProjection?.missing_boundary_count ?? 0) : 0);
  const useCount = externalResourceProjection?.use_count ?? 0;
  const approvedUseCount = externalResourceProjection?.approved_or_not_required_use_count ?? 0;
  const approvalGapCount = Math.max(0, useCount - approvedUseCount);
  const staleCount = contextReferenceIntegrityProjection?.stale_external_reference_count ?? 0;
  const auditOk = Boolean(
    externalizationReadinessProjection?.audit_ok
    && externalResourceProjection?.audit_ok
    && providerAdapterProjection?.audit_ok
    && (!requiresProviderPilot || providerAdapterPilotProjection?.audit_ok === true)
    && (!requiresProviderApproval || providerExecutionApprovalProjection?.audit_ok === true)
    && contextReferenceIntegrityProjection?.audit_ok !== false
  );

  let safetyStatus = "governance_boundary_ready";
  let governanceBoundaryStatus = "governance_boundary_ready";
  let productionExecutionSafetyStatus = "not_proven";
  let governanceAction = "operator-review-allowed";
  let safetySummary = "Externalized runtime governance boundary evidence is present and no blocking boundary is active. Production external execution safety is not proven.";
  if (missingEvidence.length > 0) {
    safetyStatus = "not_proven";
    governanceBoundaryStatus = "not_proven";
    governanceAction = "collect-missing-safety-evidence";
    safetySummary = `Missing safety evidence: ${missingEvidence.join(", ")}.`;
  } else if (staleCount > 0) {
    safetyStatus = "stale";
    governanceBoundaryStatus = "stale";
    governanceAction = "refresh-external-reference-evidence";
    safetySummary = `${staleCount} external reference integrity record(s) are stale.`;
  } else if (!auditOk || missingBoundaryCount > 0) {
    safetyStatus = "blocked";
    governanceBoundaryStatus = "blocked";
    governanceAction = "block-externalized-execution-claim";
    safetySummary = "Externalized runtime safety is blocked by failed audits, blocked states, or missing boundaries.";
  } else if (approvalGapCount > 0) {
    safetyStatus = "needs_approval";
    governanceBoundaryStatus = "needs_approval";
    governanceAction = "request-operator-approval-before-advance";
    safetySummary = `${approvalGapCount} external resource use(s) require approval before externalized execution can advance.`;
  } else if (blockedCount > 0) {
    safetyStatus = "blocked";
    safetySummary = `${blockedCount} contained blocked state(s) remain visible in governance history; governance boundary evidence is ready, but production external execution safety is not proven.`;
  }

  return {
    present: missingEvidence.length === 0,
    safety_status: safetyStatus,
    governance_boundary_status: governanceBoundaryStatus,
    production_execution_safety_status: productionExecutionSafetyStatus,
    safety_summary: safetySummary,
    release_ref: roadmapStatus?.roadmap_refs?.current_release_definition ?? null,
    work_item_ref: firstExternalUseWorkItemId ? `.aof/tasks/done/${firstExternalUseWorkItemId}.json` : null,
    provider_refs: providerRefs,
    resource_refs: resourceRefs,
    evidence_refs: [...new Set([...evidenceRefs, ...providerRefs, ...resourceRefs])],
    governance_action: governanceAction,
    permission_boundary: "Externalized execution cannot advance unless resource, provider, approval, provenance, freshness, and not-proven boundaries are visible and pass governance checks.",
    approval_boundary: "Approved or approval-not-required resource use is required before externalized execution claims can advance.",
    risk_boundary: "This projection blocks unsafe externalization governance claims; it does not prove semantic correctness, production execution safety, billing safety, or secret safety.",
    not_proven: "External runtime safety projection is structural/runtime evidence. It is not permission for autonomous external writes and does not prove external provider output correctness.",
    checks: [
      {
        check_id: "externalization-readiness",
        status: externalizationReadinessProjection?.audit_ok ? "pass" : "fail",
        summary: `${externalizationReadinessProjection?.ready_claim_count ?? 0} ready claim(s), ${externalizationReadinessProjection?.blocked_claim_count ?? 0} blocked claim(s).`,
        evidence_ref: externalizationReadinessProjection?.audit_ref ?? null
      },
      {
        check_id: "external-resource-use",
        status: externalResourceProjection?.audit_ok && approvalGapCount === 0 ? "pass" : "needs_approval",
        summary: `${approvedUseCount}/${useCount} external resource use(s) approved or not required.`,
        evidence_ref: externalResourceProjection?.audit_ref ?? null
      },
      {
        check_id: "provider-adapter-boundary",
        status: providerAdapterProjection?.audit_ok ? "pass" : "fail",
        summary: `${providerAdapterProjection?.ready_adapter_count ?? 0} ready adapter(s), ${providerAdapterProjection?.write_capable_adapter_count ?? 0} write-capable adapter(s).`,
        evidence_ref: providerAdapterProjection?.audit_ref ?? null
      },
      {
        check_id: "provider-adapter-pilot-boundary",
        status: providerAdapterPilotProjection?.audit_ok ? "pass" : "fail",
        summary: `${providerAdapterPilotProjection?.ready_pilot_count ?? 0} ready pilot(s), ${providerAdapterPilotProjection?.external_write_pilot_count ?? 0} write-mode pilot(s).`,
        evidence_ref: providerAdapterPilotProjection?.audit_ref ?? null
      },
      {
        check_id: "provider-execution-approval-bridge",
        status: !requiresProviderApproval || providerExecutionApprovalProjection?.audit_ok ? "pass" : "fail",
        summary: `${providerExecutionApprovalProjection?.approved_count ?? 0} approved bridge(s), ${providerExecutionApprovalProjection?.external_write_authorized_count ?? 0} external-write preflight authorization(s), ${providerExecutionApprovalProjection?.production_executed_count ?? 0} production execution(s).`,
        evidence_ref: providerExecutionApprovalProjection?.audit_ref ?? null
      },
      {
        check_id: "external-reference-freshness",
        status: staleCount === 0 ? "pass" : "stale",
        summary: `${staleCount} stale external reference record(s).`,
        evidence_ref: contextReferenceIntegrityProjection?.audit_ref ?? null
      }
    ]
  };
}

async function loadOperatorValidationProjection(projectRoot) {
  const auditRef = ".aof/artifacts/operator-validation/operator-validation-audit.json";
  const audit = await maybeReadJsonByRef(projectRoot, auditRef, "operator validation audit");
  if (!audit) {
    return {
      present: false,
      audit_ref: auditRef,
      audit_ok: null,
      record_count: 0,
      accepted_count: 0,
      rejected_count: 0,
      needs_clarification_count: 0,
      not_reproduced_count: 0,
      blocking_record_count: 0,
      records: [],
      not_proven: "No operator validation audit artifact is present."
    };
  }
  return {
    present: true,
    audit_ref: auditRef,
    audit_ok: Boolean(audit.ok),
    record_count: audit.summary?.record_count ?? 0,
    accepted_count: audit.summary?.accepted_count ?? 0,
    rejected_count: audit.summary?.rejected_count ?? 0,
    needs_clarification_count: audit.summary?.needs_clarification_count ?? 0,
    not_reproduced_count: audit.summary?.not_reproduced_count ?? 0,
    blocking_record_count: audit.summary?.blocking_record_count ?? 0,
    records: audit.records ?? [],
    not_proven: "Operator validation projection is adoption feedback evidence; it does not prove market truth, product value, or semantic correctness."
  };
}

function buildEvidenceCompletenessProjection({
  requirementCoverageProjection,
  adoptionProofProjection,
  agentSessionObservabilityProjection,
  contextReferenceIntegrityProjection,
  archmapProjection,
  roadmapStatus
}) {
  const requiredSources = [
    {
      source_id: "requirement-coverage",
      present: Boolean(requirementCoverageProjection?.present && requirementCoverageProjection.latest_record_ref),
      artifact_ref: requirementCoverageProjection?.latest_record_ref ?? null
    },
    {
      source_id: "adoption-proof",
      present: Boolean(adoptionProofProjection?.present && adoptionProofProjection.benchmark_ref),
      artifact_ref: adoptionProofProjection?.benchmark_ref ?? null
    },
    {
      source_id: "agent-session",
      present: Boolean(agentSessionObservabilityProjection?.present && agentSessionObservabilityProjection.latest_session_ref),
      artifact_ref: agentSessionObservabilityProjection?.latest_session_ref ?? null
    },
    {
      source_id: "context-integrity",
      present: Boolean(contextReferenceIntegrityProjection?.present && contextReferenceIntegrityProjection.latest_context_records?.[0]?.ref),
      artifact_ref: contextReferenceIntegrityProjection?.latest_context_records?.[0]?.ref ?? null
    },
    {
      source_id: "release-definition",
      present: Boolean(roadmapStatus?.roadmap_refs?.current_release_definition),
      artifact_ref: roadmapStatus?.roadmap_refs?.current_release_definition ?? null
    },
    {
      source_id: "archmap-impact",
      present: Boolean(archmapProjection?.present && archmapProjection.latest_impact_ref),
      artifact_ref: archmapProjection?.latest_impact_ref ?? null
    }
  ];
  const missingSources = requiredSources.filter((entry) => !entry.present);
  return {
    completeness_status: missingSources.length === 0 ? "ready" : "incomplete",
    source_of_truth_boundary: "Mission Control is a read-only projection of canonical AOF artifacts; it must not invent coverage, forecast, adoption proof, session, context, or Archmap evidence.",
    required_sources: requiredSources,
    missing_sources: missingSources.map((entry) => entry.source_id),
    latest_requirement_coverage_ref: requirementCoverageProjection?.latest_record_ref ?? null,
    latest_adoption_proof_ref: adoptionProofProjection?.benchmark_ref ?? null,
    latest_session_ref: agentSessionObservabilityProjection?.latest_session_ref ?? null
  };
}

function buildMissionControl({
  organizationStatus,
  roadmapStatus,
  analytics,
  chain,
  situation,
  skillfulActorProjection = null,
  workGovernanceProjection = null,
  archmapProjection = null,
  organizationStateProjection = null,
  agentSessionObservabilityProjection = null,
  contextReferenceIntegrityProjection = null,
  requirementCoverageProjection = null,
  adoptionProofProjection = null,
  externalizationReadinessProjection = null,
  externalResourceProjection = null,
  providerAdapterProjection = null,
  providerAdapterPilotProjection = null,
  providerExecutionApprovalProjection = null,
  providerExecutionReproductionProjection = null,
  providerRollbackProofProjection = null,
  providerOutcomeEvidenceProjection = null,
  providerLearningLoopProjection = null,
  operatorAcceptanceDrillProjection = null,
  providerAdapterPilotReadinessProjection = null,
  externalRuntimeSafetyProjection = null,
  operatorValidationProjection = null,
  evidenceCompletenessProjection = null
}) {
  const graph = buildArtifactGraph(chain);
  const skillfulActorSummary = summarizeSkillfulActorProjection(skillfulActorProjection);
  const activeTrack = normalizeTrackLabel(organizationStatus.active_release?.release_version ?? "");
  const goalTrack = extractTargetTrackFromText(
    organizationStatus.goals.next_value_slice ?? organizationStatus.goals.operating_goal ?? "",
    activeTrack
  );
  const directionSelection = isDirectionSelectionSlice(organizationStatus.goals.next_value_slice);
  const frontierSelectionPending = situation.current_runtime_stage === "frontier-definition-needed"
    && !situation.primary_frontier_task
    && /frontier review|frontier selection|next frontier/i.test(String(situation.recommended_action?.recommended_action ?? ""));
  const includeChainGaps = !frontierSelectionPending && !directionSelection && (!goalTrack || !activeTrack || goalTrack === activeTrack);
  const useChainStageFallback = situation.current_runtime_stage === "frontier-definition-needed"
    && !situation.primary_frontier_task
    && (situation.current_truth_conflicts?.length ?? 0) === 0
    && includeChainGaps;
  const currentStage = useChainStageFallback ? deriveChainStage(chain) : situation.current_runtime_stage;
  const blockers = [];

  if (includeChainGaps) {
    for (const gap of chain?.needValidation?.evidence_gaps ?? []) {
      blockers.push({
        summary: gap,
        severity: "attention",
        artifact_ref: chain?.refs?.need_validation ?? null
      });
    }
  }

  for (const observation of analytics.observations ?? []) {
    if (observation !== "No immediate organization bottleneck was detected from the current local artifact set.") {
      blockers.push({
        summary: observation,
        severity: "runtime",
        artifact_ref: ".aof/context/active/organization-analytics.json"
      });
    }
  }

  for (const conflict of situation.current_truth_conflicts ?? []) {
    blockers.push({
      summary: conflict.summary,
      severity: conflict.severity,
      artifact_ref: conflict.artifact_ref
    });
  }

  const nextAction = useChainStageFallback
    ? {
        recommended_action: chain?.projectCharter
          ? "Open an implementation task for the bounded Mission Control visibility slice."
          : chain?.discoveryHandoff
            ? "Run Need Validation on the current discovery handoff."
            : "Complete the current visibility direction-setting chain before implementation.",
        rationale: chain?.projectCharter
          ? "Need Validation and project charter are already present, so the next move is execution planning."
          : chain?.discoveryHandoff
            ? "Discovery is complete enough to promote into Need Validation, but project authorization is not yet recorded."
            : "The runtime chain is not yet complete enough to justify implementation claims.",
        artifact_ref: chain?.refs?.project_charter ?? chain?.refs?.need_validation ?? chain?.refs?.discovery_handoff ?? null
      }
    : situation.recommended_action;

  return {
    view_type: "mission_control",
    generated_at: analytics.generated_at,
    mission_overview: {
      mission: organizationStatus.mission,
      release_version: organizationStatus.active_release?.release_version ?? null,
      release_definition_ref: roadmapStatus.roadmap_refs?.current_release_definition ?? null,
      operating_goal: organizationStatus.goals.operating_goal,
      next_value_slice: organizationStatus.goals.next_value_slice,
      current_runtime_stage: currentStage,
      chain_anchor_ref: chain?.refs.need_validation ?? null
    },
    artifact_graph: graph,
    runtime_position: {
      current_phase: currentStage,
      current_step_label: graph.current_node_id
        ? graph.nodes.find((node) => node.id === graph.current_node_id)?.label ?? null
        : null,
      current_step_state: graph.current_node_id
        ? graph.nodes.find((node) => node.id === graph.current_node_id)?.state ?? null
        : null
    },
    blockers,
    next_action: nextAction,
    skillful_actor_projection: skillfulActorSummary,
    work_governance: workGovernanceProjection ?? {
      present: false,
      artifact_root_ref: ".aof/artifacts/work-governance",
      benchmark_ref: null,
      work_item_count: 0,
      work_items: []
    },
    archmap: archmapProjection ?? {
      present: false,
      current_source_ref: null,
      impact_record_count: 0,
      latest_impact_ref: null,
      latest_impact_status: null,
      latest_work_item_id: null,
      pending_impact_count: 0,
      pending_impacts: [],
      source_of_truth: [],
      external_refs: []
    },
    organization_state: organizationStateProjection ?? {
      present: false,
      organization_ref: ".aof/organization.json",
      topology: null,
      council_count: 0,
      team_count: 0,
      role_count: 0,
      agent_count: 0,
      councils: [],
      teams: [],
      roles: [],
      agents: []
    },
    agent_session_observability: agentSessionObservabilityProjection ?? {
      present: false,
      artifact_root_ref: ".aof/artifacts/agent-sessions",
      audit_ref: null,
      stream_count: 0,
      latest_session_id: null,
      latest_session_ref: null,
      latest_actor_ref: null,
      latest_role_ref: null,
      latest_recorded_at: null,
      latest_event_count: 0,
      latest_release_verdict: null,
      audit_ok: null,
      audit_failing_check_count: null,
      latest_audit_stream_ref: null,
      linked_task_refs: [],
      linked_requirement_refs: [],
      linked_test_evidence_refs: [],
      linked_artifact_refs: [],
      risk_candidates: [],
      decision_candidates: [],
      latest_events: [],
      latest_tool_calls: []
    },
    context_reference_integrity: contextReferenceIntegrityProjection ?? {
      present: false,
      artifact_root_ref: ".aof/artifacts/context-integrity",
      external_artifact_root_ref: ".aof/artifacts/external-reference-integrity",
      audit_ref: null,
      audit_ok: null,
      audit_failing_check_count: null,
      context_record_count: 0,
      external_reference_record_count: 0,
      blocked_context_count: 0,
      stale_external_reference_count: 0,
      latest_context_records: [],
      latest_external_reference_records: []
    },
    requirement_coverage_projection: requirementCoverageProjection ?? {
      present: false,
      artifact_root_ref: ".aof/artifacts/requirement-coverage",
      latest_record_ref: null,
      latest_work_item_id: null,
      latest_recorded_at: null,
      coverage_status: null,
      total_requirements: 0,
      covered_count: 0,
      partial_count: 0,
      blocked_count: 0,
      at_risk_count: 0,
      unstarted_count: 0,
      coverage_ratio: null,
      forecast: null,
      forecast_boundary: null,
      requirements: [],
      not_proven: null,
      source_of_truth: []
    },
    adoption_proof_projection: adoptionProofProjection ?? {
      present: false,
      benchmark_ref: ".aof/artifacts/work-governance/benchmarks/adoption-proof-benchmark.json",
      generated_at: null,
      benchmark_status: "missing",
      benchmark_count: 0,
      pass_count: 0,
      fail_count: 0,
      failing_benchmarks: [],
      artifacts_evaluated: [],
      latest_evidence_refs: [],
      not_proven: "No adoption proof benchmark artifact is present."
    },
    externalization_readiness_projection: externalizationReadinessProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/externalization/externalization-readiness-audit.json",
      audit_ok: null,
      externalization_claim_count: 0,
      ready_claim_count: 0,
      blocked_claim_count: 0,
      missing_boundary_count: null,
      claims: [],
      not_proven: "No externalization readiness audit artifact is present."
    },
    external_resource_projection: externalResourceProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/external-resources/external-resource-audit.json",
      audit_ok: null,
      resource_count: 0,
      ready_resource_count: 0,
      use_count: 0,
      approved_or_not_required_use_count: 0,
      blocked_use_count: 0,
      missing_boundary_count: null,
      resources: [],
      uses: [],
      not_proven: "No external resource audit artifact is present."
    },
    provider_adapter_projection: providerAdapterProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/provider-adapters/provider-adapter-audit.json",
      audit_ok: null,
      adapter_count: 0,
      ready_adapter_count: 0,
      write_capable_adapter_count: 0,
      blocked_adapter_count: 0,
      missing_boundary_count: null,
      adapters: [],
      not_proven: "No provider adapter audit artifact is present."
    },
    provider_adapter_pilot_projection: providerAdapterPilotProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/provider-adapter-pilots/provider-adapter-pilot-audit.json",
      audit_ok: null,
      pilot_count: 0,
      ready_pilot_count: 0,
      blocked_pilot_count: 0,
      external_write_pilot_count: 0,
      missing_boundary_count: null,
      pilots: [],
      not_proven: "No provider adapter pilot audit artifact is present."
    },
    provider_execution_approval_projection: providerExecutionApprovalProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/provider-execution-approvals/provider-execution-approval-audit.json",
      audit_ok: null,
      approval_count: 0,
      approved_count: 0,
      pending_count: 0,
      blocked_count: 0,
      external_write_authorized_count: 0,
      production_executed_count: 0,
      missing_boundary_count: null,
      approvals: [],
      not_proven: "No provider execution approval audit artifact is present."
    },
    provider_execution_reproduction_projection: providerExecutionReproductionProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/provider-execution-reproductions/provider-execution-reproduction-audit.json",
      audit_ok: null,
      reproduction_count: 0,
      reproduced_count: 0,
      blocked_count: 0,
      mismatch_count: 0,
      missing_boundary_count: null,
      reproductions: [],
      not_proven: "No provider execution reproduction audit artifact is present."
    },
    provider_rollback_proof_projection: providerRollbackProofProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/provider-rollback-proofs/provider-rollback-proof-audit.json",
      audit_ok: null,
      rollback_count: 0,
      ready_count: 0,
      blocked_count: 0,
      mismatch_count: 0,
      missing_boundary_count: null,
      rollback_proofs: [],
      not_proven: "No provider rollback proof audit artifact is present."
    },
    provider_outcome_evidence_projection: providerOutcomeEvidenceProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/provider-outcome-evidence/provider-outcome-evidence-audit.json",
      audit_ok: null,
      outcome_count: 0,
      accepted_count: 0,
      corrected_count: 0,
      rollback_recommended_count: 0,
      blocked_count: 0,
      missing_boundary_count: null,
      outcomes: [],
      not_proven: "No provider outcome evidence audit artifact is present."
    },
    provider_learning_loop_projection: providerLearningLoopProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/provider-learning-loop/provider-learning-loop-audit.json",
      audit_ok: null,
      learning_count: 0,
      updated_count: 0,
      escalated_count: 0,
      blocked_count: 0,
      missing_boundary_count: null,
      learning_updates: [],
      not_proven: "No provider learning-loop audit artifact is present."
    },
    operator_acceptance_drill_projection: operatorAcceptanceDrillProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/operator-acceptance-drills/operator-acceptance-drill-audit.json",
      audit_ok: null,
      drill_count: 0,
      accept_count: 0,
      stop_count: 0,
      rollback_count: 0,
      escalate_count: 0,
      defer_count: 0,
      missing_boundary_count: null,
      drills: [],
      not_proven: "No operator acceptance drill audit artifact is present."
    },
    provider_adapter_pilot_readiness_projection: providerAdapterPilotReadinessProjection ?? {
      present: false,
      readiness_status: "not_proven",
      readiness_summary: "No provider adapter pilot readiness projection is present.",
      release_ref: null,
      pilot_refs: [],
      evidence_refs: [],
      governance_action: "collect-provider-pilot-evidence",
      default_mode_boundary: "Provider adapter execution pilots are dry-run/default-deny unless explicitly approved.",
      approval_boundary: "Write-mode provider pilots require approval evidence and remain non-production by default.",
      risk_boundary: "Provider adapter pilot readiness is not production external write permission.",
      not_proven: "No provider adapter pilot readiness projection is present."
    },
    external_runtime_safety_projection: externalRuntimeSafetyProjection ?? {
      present: false,
      safety_status: "not_proven",
      governance_boundary_status: "not_proven",
      production_execution_safety_status: "not_proven",
      safety_summary: "No external runtime safety projection is present.",
      release_ref: null,
      work_item_ref: null,
      provider_refs: [],
      resource_refs: [],
      evidence_refs: [],
      governance_action: "collect-missing-safety-evidence",
      permission_boundary: "Externalized execution cannot advance without visible safety evidence.",
      approval_boundary: "Externalized execution cannot advance without visible approval state.",
      risk_boundary: "External runtime safety is not semantic truth or production-write authority.",
      not_proven: "No external runtime safety projection is present.",
      checks: []
    },
    operator_validation_projection: operatorValidationProjection ?? {
      present: false,
      audit_ref: ".aof/artifacts/operator-validation/operator-validation-audit.json",
      audit_ok: null,
      record_count: 0,
      accepted_count: 0,
      rejected_count: 0,
      needs_clarification_count: 0,
      not_reproduced_count: 0,
      blocking_record_count: 0,
      records: [],
      not_proven: "No operator validation audit artifact is present."
    },
    evidence_completeness_projection: evidenceCompletenessProjection ?? {
      completeness_status: "incomplete",
      source_of_truth_boundary: "Mission Control is a read-only projection of canonical AOF artifacts.",
      required_sources: [],
      missing_sources: ["requirement-coverage", "adoption-proof", "agent-session", "context-integrity", "release-definition", "archmap-impact"],
      latest_requirement_coverage_ref: null,
      latest_adoption_proof_ref: null,
      latest_session_ref: null
    }
  };
}

export async function visibilityExportCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const aofRoot = resolveAofRoot(projectRoot);
  const artifactDir = path.resolve(options.artifactDir || path.join(aofRoot, "artifacts", "visibility", "current"));

  const [organizationStatus, roadmapStatus, metricsResult, analyticsResult, learningLoopResult, doneTasks, latestChain, situation, skillfulActorProjection, workGovernanceProjection, archmapProjection, organizationStateProjection, agentSessionObservabilityProjection, contextReferenceIntegrityProjection, requirementCoverageProjection, adoptionProofProjection, externalizationReadinessProjection, externalResourceProjection, providerAdapterProjection, providerAdapterPilotProjection, providerExecutionApprovalProjection, providerExecutionReproductionProjection, providerRollbackProofProjection, providerOutcomeEvidenceProjection, providerLearningLoopProjection, operatorAcceptanceDrillProjection, operatorValidationProjection] = await Promise.all([
    organizationStatusCommand({ project: projectRoot }),
    roadmapStatusCommand({ project: projectRoot }),
    metricsSnapshotCommand({ project: projectRoot }),
    organizationAnalyticsSnapshotCommand({ project: projectRoot }),
    learningLoopSnapshotCommand({ project: projectRoot }),
    listLatestDoneTasks(aofRoot),
    loadLatestNeedValidationChain(projectRoot, aofRoot),
    loadSituationAssessmentSummary(projectRoot),
    loadLatestSkillfulActorHriProjection(projectRoot),
    loadWorkGovernanceProjection(projectRoot, aofRoot),
    loadArchmapProjection(projectRoot, aofRoot),
    loadOrganizationStateProjection(projectRoot, aofRoot),
    loadAgentSessionObservabilityProjection(projectRoot, aofRoot),
    loadContextReferenceIntegrityProjection(projectRoot, aofRoot),
    loadRequirementCoverageProjection(projectRoot, aofRoot),
    loadAdoptionProofProjection(projectRoot),
    loadExternalizationReadinessProjection(projectRoot),
    loadExternalResourceProjection(projectRoot),
    loadProviderAdapterProjection(projectRoot),
    loadProviderAdapterPilotProjection(projectRoot),
    loadProviderExecutionApprovalProjection(projectRoot),
    loadProviderExecutionReproductionProjection(projectRoot),
    loadProviderRollbackProofProjection(projectRoot),
    loadProviderOutcomeEvidenceProjection(projectRoot),
    loadProviderLearningLoopProjection(projectRoot),
    loadOperatorAcceptanceDrillProjection(projectRoot),
    loadOperatorValidationProjection(projectRoot)
  ]);

  const currentTask = pickCurrentVisibilityTask(situation, roadmapStatus);
  const nextValueSlice = organizationStatus.goals.next_value_slice;
  const nextValueUpdatedAt = learningLoopResult.payload.current_next_value_slice?.updated_at ?? metricsResult.payload.generated_at;
  const metricsArtifactRef = path.relative(projectRoot, metricsResult.artifactPath);

  const statusCard = buildStatusCard({
    currentTask,
    nextValueSlice,
    metricsArtifactRef,
    analytics: analyticsResult.payload
  });
  const timelineFeed = {
    view_type: "timeline_feed",
    entries: buildTimelineEntries({
      nextValueSlice,
      nextValueUpdatedAt,
      metrics: metricsResult.payload,
      analytics: analyticsResult.payload,
      doneTasks
    })
  };
  const flowSnapshot = buildFlowSnapshot(Boolean(currentTask));
  const externalRuntimeSafetyProjection = buildExternalRuntimeSafetyProjection({
    externalizationReadinessProjection,
    externalResourceProjection,
    providerAdapterProjection,
    providerAdapterPilotProjection,
    providerExecutionApprovalProjection,
    contextReferenceIntegrityProjection,
    roadmapStatus
  });
  const providerAdapterPilotReadinessProjection = buildProviderAdapterPilotReadinessProjection({
    providerAdapterProjection,
    providerAdapterPilotProjection,
    providerExecutionApprovalProjection,
    roadmapStatus
  });
  const evidenceCompletenessProjection = buildEvidenceCompletenessProjection({
    requirementCoverageProjection,
    adoptionProofProjection,
    agentSessionObservabilityProjection,
    contextReferenceIntegrityProjection,
    archmapProjection,
    roadmapStatus
  });
  const missionControl = buildMissionControl({
    organizationStatus,
    roadmapStatus,
    analytics: analyticsResult.payload,
    chain: latestChain,
    situation,
    skillfulActorProjection,
    workGovernanceProjection,
    archmapProjection,
    organizationStateProjection,
    agentSessionObservabilityProjection,
    contextReferenceIntegrityProjection,
    requirementCoverageProjection,
    adoptionProofProjection,
    externalizationReadinessProjection,
    externalResourceProjection,
    providerAdapterProjection,
    providerAdapterPilotProjection,
    providerExecutionApprovalProjection,
    providerExecutionReproductionProjection,
    providerRollbackProofProjection,
    providerOutcomeEvidenceProjection,
    providerLearningLoopProjection,
    operatorAcceptanceDrillProjection,
    providerAdapterPilotReadinessProjection,
    externalRuntimeSafetyProjection,
    operatorValidationProjection,
    evidenceCompletenessProjection
  });
  const operatorBrief = buildOperatorBriefView({
    organizationStatus,
    roadmapStatus,
    analytics: analyticsResult.payload,
    situation,
    skillfulActorProjection
  });
  const operatorProgress = buildOperatorProgressView({
    organizationStatus,
    situation,
    latestDoneTask: doneTasks[0] ? {
      payload: doneTasks[0],
      taskPath: path.join(aofRoot, "tasks", "done", `${doneTasks[0].task_id}.json`)
    } : null
  });
  const treePosition = buildTreePositionView({
    organizationStatus,
    roadmapStatus,
    situation
  });
  const evidenceDrillDown = buildEvidenceDrillDownView({
    organizationStatus,
    roadmapStatus,
    analytics: analyticsResult.payload,
    situation,
    brief: operatorBrief
  });

  const runtimeExecutionPathRef = path.join(artifactDir, "runtime-execution.json");
  const commandRuns = [
    { command: "visibility-export", artifact_ref: path.relative(projectRoot, runtimeExecutionPathRef) },
    { command: "organization-status", artifact_ref: ".aof/context/active/active-release-manifest.json" },
    { command: "roadmap-status", artifact_ref: roadmapStatus.roadmap_refs?.current_release_definition ?? null },
    { command: "organization-analytics-snapshot", artifact_ref: ".aof/context/active/organization-analytics.json" },
    { command: "metrics-snapshot", artifact_ref: ".aof/context/active/metrics-snapshot.json" },
    { command: "situation-assess", artifact_ref: treePosition.branch?.artifact_ref ?? operatorBrief.current_state?.primary_frontier_task?.artifact_ref ?? null },
    { command: "operator-brief", artifact_ref: ".aof/artifacts/visibility/current/operator-brief.json" },
    { command: "operator-progress", artifact_ref: ".aof/artifacts/visibility/current/operator-progress.json" },
    { command: "tree-position", artifact_ref: ".aof/artifacts/visibility/current/tree-position.json" },
    { command: "evidence-drill-down", artifact_ref: ".aof/artifacts/visibility/current/evidence-drill-down.json" },
    { command: "skillful-actor-hri-projection", artifact_ref: skillfulActorProjection?.artifactRef ?? null }
  ];
  const runtimeExecution = buildRuntimeExecutionView({
    generatedAt: operatorBrief.generated_at,
    executionLogRef: path.relative(projectRoot, runtimeExecutionPathRef),
    commandRuns,
    refreshedArtifactRefs: [
      ".aof/artifacts/visibility/current/status-card.json",
      ".aof/artifacts/visibility/current/timeline-feed.json",
      ".aof/artifacts/visibility/current/flow-snapshot.json",
      ".aof/artifacts/visibility/current/mission-control.json",
      ".aof/artifacts/visibility/current/operator-brief.json",
      ".aof/artifacts/visibility/current/operator-progress.json",
      ".aof/artifacts/visibility/current/tree-position.json",
      ".aof/artifacts/visibility/current/evidence-drill-down.json"
    ]
  });

  await validateWithBundledSchema(statusCard, "aof-status-card-view.schema.json", "status card view");
  await validateWithBundledSchema(timelineFeed, "aof-timeline-feed-view.schema.json", "timeline feed view");
  await validateWithBundledSchema(flowSnapshot, "aof-flow-snapshot-view.schema.json", "flow snapshot view");
  await validateWithBundledSchema(missionControl, "aof-mission-control-view.schema.json", "mission control view");
  await validateWithBundledSchema(operatorBrief, "aof-operator-brief-view.schema.json", "operator brief view");
  await validateWithBundledSchema(operatorProgress, "aof-operator-progress-view.schema.json", "operator progress view");
  await validateWithBundledSchema(treePosition, "aof-tree-position-view.schema.json", "tree position view");
  await validateWithBundledSchema(evidenceDrillDown, "aof-evidence-drill-down-view.schema.json", "evidence drill-down view");
  await validateWithBundledSchema(runtimeExecution, "aof-runtime-execution-view.schema.json", "runtime execution view");

  const statusPath = await writeJsonArtifact(path.join(artifactDir, "status-card.json"), statusCard);
  const timelinePath = await writeJsonArtifact(path.join(artifactDir, "timeline-feed.json"), timelineFeed);
  const flowPath = await writeJsonArtifact(path.join(artifactDir, "flow-snapshot.json"), flowSnapshot);
  const missionPath = await writeJsonArtifact(path.join(artifactDir, "mission-control.json"), missionControl);
  const operatorBriefPath = await writeJsonArtifact(path.join(artifactDir, "operator-brief.json"), operatorBrief);
  const operatorProgressPath = await writeJsonArtifact(path.join(artifactDir, "operator-progress.json"), operatorProgress);
  const treePositionPath = await writeJsonArtifact(path.join(artifactDir, "tree-position.json"), treePosition);
  const evidenceDrillDownPath = await writeJsonArtifact(path.join(artifactDir, "evidence-drill-down.json"), evidenceDrillDown);
  const runtimeExecutionPath = await writeJsonArtifact(runtimeExecutionPathRef, runtimeExecution);

  return {
    ok: true,
    projectRoot,
    artifactDir,
    statusPath,
    timelinePath,
    flowPath,
    missionPath,
    operatorBriefPath,
    operatorProgressPath,
    treePositionPath,
    evidenceDrillDownPath,
    runtimeExecutionPath,
    payloads: {
      status_card: statusCard,
      timeline_feed: timelineFeed,
      flow_snapshot: flowSnapshot,
      mission_control: missionControl,
      operator_brief: operatorBrief,
      operator_progress: operatorProgress,
      tree_position: treePosition,
      evidence_drill_down: evidenceDrillDown,
      runtime_execution: runtimeExecution
    }
  };
}
