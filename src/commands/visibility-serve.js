import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const MAX_REF_CONTENT_BYTES = 160_000;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

async function readJsonView(filePath, expectedType) {
  const resolvedPath = path.resolve(filePath);
  const raw = await fs.readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed.view_type !== expectedType) {
    throw new Error(
      `Expected ${expectedType} at ${resolvedPath}, but found ${parsed.view_type ?? "unknown"}.`
    );
  }
  return {
    path: resolvedPath,
    payload: parsed
  };
}

async function readJsonFile(filePath, label) {
  const raw = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} at ${filePath} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function maybeReadJsonByRef(projectRoot, ref, label) {
  if (!projectRoot || !ref) {
    return null;
  }
  try {
    return await readJsonFile(path.resolve(projectRoot, ref), label);
  } catch {
    return null;
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

function deriveProjectRootFromAofPath(filePath) {
  const resolved = path.resolve(filePath);
  const parts = resolved.split(path.sep);
  const aofIndex = parts.lastIndexOf(".aof");
  if (aofIndex <= 0) {
    return path.dirname(resolved);
  }
  const prefix = parts.slice(0, aofIndex).join(path.sep);
  return prefix || path.sep;
}

export async function readProjectTextRef(projectRoot, ref) {
  if (!projectRoot) {
    throw new Error("Missing project root.");
  }
  if (!ref || typeof ref !== "string") {
    throw new Error("Missing ref.");
  }

  const cleanRef = ref.trim().replace(/^file:\/\//, "").split("#")[0];
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedPath = path.isAbsolute(cleanRef)
    ? path.resolve(cleanRef)
    : path.resolve(resolvedProjectRoot, cleanRef);
  const relative = path.relative(resolvedProjectRoot, resolvedPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Ref escapes project root: ${ref}`);
  }

  const stat = await fs.stat(resolvedPath);
  if (!stat.isFile()) {
    throw new Error(`Ref is not a file: ${ref}`);
  }

  const raw = await fs.readFile(resolvedPath, "utf8");
  const truncated = Buffer.byteLength(raw, "utf8") > MAX_REF_CONTENT_BYTES;
  const content = truncated
    ? raw.slice(0, MAX_REF_CONTENT_BYTES) + "\n\n[truncated]"
    : raw;
  return {
    ok: true,
    ref,
    path: relative.replaceAll("\\", "/"),
    bytes: stat.size,
    truncated,
    content
  };
}

function toArtifactRef(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).replaceAll("\\", "/");
}

function formatList(value) {
  return Array.isArray(value) && value.length > 0 ? value.join(", ") : "none";
}

function summarizeSeatDecision(step = {}) {
  return {
    role: step.role ?? null,
    actor_id: step.packet?.actor?.actor_id ?? null,
    purpose: step.call_purpose ?? null,
    recommendation: step.result?.decision_signal?.recommendation ?? null,
    veto: Boolean(step.result?.decision_signal?.veto),
    summary: step.result?.output_summary ?? step.summary ?? null
  };
}

async function loadExecutionArtifactsForSession(projectRoot, sessionId) {
  const aofRoot = path.join(projectRoot, ".aof");
  const buckets = [
    { key: "role_results", dir: path.join(aofRoot, "artifacts", "execution", "role-results") },
    { key: "role_joins", dir: path.join(aofRoot, "artifacts", "execution", "role-joins") },
    { key: "team_outputs", dir: path.join(aofRoot, "artifacts", "execution", "team-outputs") },
    { key: "council_reviews", dir: path.join(aofRoot, "artifacts", "execution", "council-reviews") }
  ];

  const result = {
    role_results: [],
    role_joins: [],
    team_outputs: [],
    council_reviews: []
  };

  await Promise.all(buckets.map(async ({ key, dir }) => {
    const filePaths = await listJsonFiles(dir);
    const payloads = await Promise.all(filePaths.map(async (filePath) => ({
      filePath,
      payload: await readJsonFile(filePath, `${key} ${path.basename(filePath)}`)
    })));
    result[key] = payloads
      .filter((entry) => entry.payload.source_parent_session_id === sessionId)
      .map((entry) => ({
        ...entry,
        artifact_ref: toArtifactRef(projectRoot, entry.filePath)
      }))
      .sort((left, right) => String(left.payload.recorded_at ?? "").localeCompare(String(right.payload.recorded_at ?? "")));
  }));

  return result;
}

async function loadRuntimeLoopContext(projectRoot, treePosition, operatorBrief) {
  const frontierTaskRef = treePosition?.branch?.artifact_ref
    ?? operatorBrief?.current_state?.primary_frontier_task?.artifact_ref
    ?? null;
  const frontierTask = await maybeReadJsonByRef(projectRoot, frontierTaskRef, "frontier task");
  const sessionDir = path.join(projectRoot, ".aof", "sessions");
  const sessionFiles = await listJsonFiles(sessionDir);
  const allSessions = await Promise.all(sessionFiles.map(async (filePath) => ({
    filePath,
    payload: await readJsonFile(filePath, `session ${path.basename(filePath)}`)
  })));
  const scoreSession = (entry) => {
    const latestRun = entry.payload.council_execution_runs?.at(-1) ?? null;
    const seatCount = Array.isArray(latestRun?.steps) ? latestRun.steps.length : 0;
    const hasApproval = latestRun?.approval_outcome ? 1 : 0;
    const updated = String(entry.payload.updated_at ?? entry.payload.created_at ?? "");
    return { seatCount, hasApproval, updated };
  };
  const runnableSessions = allSessions
    .filter((entry) => Array.isArray(entry.payload.council_execution_runs) && entry.payload.council_execution_runs.length > 0)
    .sort((left, right) => {
      const a = scoreSession(left);
      const b = scoreSession(right);
      if (b.hasApproval !== a.hasApproval) {
        return b.hasApproval - a.hasApproval;
      }
      if (b.seatCount !== a.seatCount) {
        return b.seatCount - a.seatCount;
      }
      return b.updated.localeCompare(a.updated);
    });

  const candidateSessionIds = [
    ...(Array.isArray(frontierTask?.assigned_session_ids) ? frontierTask.assigned_session_ids : []),
    frontierTask?.orchestrator_session_id ?? null
  ].filter(Boolean);
  const frontierSession = allSessions.find((entry) => candidateSessionIds.includes(entry.payload.session_id)) ?? null;
  const latestSession = runnableSessions[0] ?? frontierSession ?? null;
  const activeSession = frontierSession && Array.isArray(frontierSession.payload.council_execution_runs) && frontierSession.payload.council_execution_runs.length > 0
    ? frontierSession
    : latestSession;

  const latestRun = activeSession?.payload?.council_execution_runs?.at(-1) ?? null;
  const executionArtifacts = activeSession
    ? await loadExecutionArtifactsForSession(projectRoot, activeSession.payload.session_id)
    : {
        role_results: [],
        role_joins: [],
        team_outputs: [],
        council_reviews: []
      };

  const latestJoin = executionArtifacts.role_joins.at(-1)?.payload ?? null;
  const latestTeamOutput = executionArtifacts.team_outputs.at(-1)?.payload ?? null;
  const latestCouncilReview = executionArtifacts.council_reviews.at(-1)?.payload ?? null;
  const latestRoleResults = executionArtifacts.role_results.map((entry) => entry.payload);
  const seatDecisions = Array.isArray(latestRun?.steps) ? latestRun.steps.map(summarizeSeatDecision) : [];
  const currentFrontierHasLiveLoop = Boolean(frontierSession && latestRun && frontierSession.payload.session_id === activeSession?.payload?.session_id);
  const councilRuns = Array.isArray(activeSession?.payload?.council_execution_runs)
    ? activeSession.payload.council_execution_runs
    : [];
  const summarizedRuns = councilRuns.map((run) => ({
    execution_id: run.execution_id ?? null,
    stage: run.stage ?? null,
    status: run.status ?? null,
    routing_mode: run.routing_mode ?? null,
    approval_mode: run.approval_mode ?? null,
    started_at: run.started_at ?? null,
    completed_at: run.completed_at ?? null,
    summary: run.summary ?? null,
    seat_roles: Array.isArray(run.steps) ? run.steps.map((step) => step.role ?? null).filter(Boolean) : [],
    seat_decisions: Array.isArray(run.steps) ? run.steps.map(summarizeSeatDecision) : [],
    approval_outcome: run.approval_outcome ?? null
  }));
  const loopEvents = [];
  const pushEvent = (at, kind, title, detail, state = "done") => {
    if (!at && !title && !detail) {
      return;
    }
    loopEvents.push({ at: at ?? null, kind, title, detail, state });
  };

  for (const transition of activeSession?.payload?.stage_transitions ?? []) {
    pushEvent(
      transition.at,
      "stage-transition",
      `${transition.to_stage ?? "stage"}: ${transition.reason ?? "transition"}`,
      `${transition.from_stage ?? "start"} -> ${transition.to_stage ?? "-"} / ${transition.to_status ?? "-"}`
    );
  }

  for (const run of summarizedRuns) {
    pushEvent(
      run.completed_at ?? run.started_at,
      "council-run",
      `${run.stage ?? "council"} council ran`,
      `${formatList(run.seat_roles)} / ${run.approval_outcome?.status ?? run.status ?? "-"}`
    );
  }

  if (latestJoin) {
    pushEvent(
      latestJoin.recorded_at ?? null,
      "role-join",
      "Assigned actors returned outputs",
      `${formatList(latestJoin.received_roles ?? [])} joined / ${latestJoin.aggregate_state ?? "-"}`
    );
  }

  if (latestTeamOutput) {
    pushEvent(
      latestTeamOutput.recorded_at ?? null,
      "team-output",
      "Workforce packet assembled",
      `${latestTeamOutput.team_id ?? "team"} / ${latestTeamOutput.aggregate_state ?? "-"}`
    );
  }

  if (latestCouncilReview) {
    pushEvent(
      latestCouncilReview.recorded_at ?? null,
      "council-review",
      "Council reviewed the assembled workforce output",
      `${latestCouncilReview.council_id ?? "council"} / ${latestCouncilReview.review_status ?? "-"}`
    );
  }

  for (const report of activeSession?.payload?.outcome_reports ?? []) {
    pushEvent(
      report.observed_at ?? null,
      "outcome",
      "Orchestrator recorded outcome",
      `${report.result ?? "-"} / ${report.note ?? "-"}`
    );
  }

  loopEvents.sort((left, right) => String(left.at ?? "").localeCompare(String(right.at ?? "")));

  return {
    current_frontier: {
      task_id: frontierTask?.task_id ?? treePosition?.branch?.frontier_task_id ?? null,
      task_title: frontierTask?.title ?? treePosition?.branch?.frontier_task_title ?? null,
      task_description: frontierTask?.description ?? treePosition?.branch?.branch_summary ?? null,
      task_description_source: frontierTask?.description
        ? "live-artifact"
        : (treePosition?.branch?.branch_summary ? "tree-summary" : "unavailable"),
      artifact_ref: frontierTaskRef,
      branch: operatorBrief?.current_state?.primary_frontier_task?.track ?? treePosition?.branch?.frontier_track ?? null,
      has_live_loop: currentFrontierHasLiveLoop,
      orchestrator_session_id: frontierTask?.orchestrator_session_id ?? null,
      assigned_session_ids: Array.isArray(frontierTask?.assigned_session_ids) ? frontierTask.assigned_session_ids : [],
      loop_state: currentFrontierHasLiveLoop
        ? "live-loop-available"
        : "frontier-not-yet-run-through-council-loop"
    },
    active_session: activeSession ? {
      session_id: activeSession.payload.session_id,
      request: activeSession.payload.trigger?.request_payload ?? null,
      current_stage: activeSession.payload.current_stage ?? null,
      status: activeSession.payload.status ?? null,
      routing_mode: activeSession.payload.routing_mode ?? null,
      open_decision_ids: activeSession.payload.open_decision_ids ?? [],
      outcome_reports: activeSession.payload.outcome_reports ?? []
    } : null,
    council_run: latestRun ? {
      execution_id: latestRun.execution_id ?? null,
      stage: latestRun.stage ?? null,
      status: latestRun.status ?? null,
      execution_model: latestRun.execution_model ?? null,
      summary: latestRun.summary ?? null,
      started_at: latestRun.started_at ?? null,
      completed_at: latestRun.completed_at ?? null,
      approval_outcome: latestRun.approval_outcome ?? null,
      seat_decisions: seatDecisions
    } : null,
    council_runs: summarizedRuns,
    organization_assembly: {
      role_results: executionArtifacts.role_results.map((entry) => ({
        role: entry.payload.role ?? null,
        actor_session_id: entry.payload.session_id ?? null,
        status: entry.payload.status ?? null,
        recommendation: entry.payload.recommendation ?? null,
        rationale: entry.payload.rationale ?? null,
        artifact_ref: entry.artifact_ref ?? null
      })),
      role_join: latestJoin ? {
        aggregate_state: latestJoin.aggregate_state ?? null,
        expected_roles: latestJoin.expected_roles ?? [],
        received_roles: latestJoin.received_roles ?? [],
        missing_roles: latestJoin.missing_roles ?? [],
        artifact_ref: executionArtifacts.role_joins.at(-1)?.artifact_ref ?? null
      } : null,
      team_output: latestTeamOutput ? {
        team_id: latestTeamOutput.team_id ?? null,
        aggregate_state: latestTeamOutput.aggregate_state ?? null,
        recommended_next_step: latestTeamOutput.recommended_next_step ?? null,
        artifact_ref: executionArtifacts.team_outputs.at(-1)?.artifact_ref ?? null
      } : null
    },
    council_review: latestCouncilReview ? {
      council_id: latestCouncilReview.council_id ?? null,
      review_status: latestCouncilReview.review_status ?? null,
      decision_summary: latestCouncilReview.decision_summary ?? null,
      recommendation: latestCouncilReview.recommendation ?? null,
      artifact_ref: executionArtifacts.council_reviews.at(-1)?.artifact_ref ?? null
    } : null,
    loop_events: loopEvents,
    operator_gap: currentFrontierHasLiveLoop
      ? null
      : `The ${operatorBrief?.current_state?.primary_frontier_task?.track ?? treePosition?.branch?.frontier_track ?? "current"} frontier is defined, but this frontier has not yet been run through a live council -> role -> join -> review loop. The last visible loop is historical evidence, not current frontier evidence.`
  };
}

async function listTaskArtifacts(projectRoot) {
  const taskRoot = path.join(projectRoot, ".aof", "tasks");
  const lifecycleStates = ["open", "assigned", "done", "retired", "archived"];
  const entries = [];

  await Promise.all(lifecycleStates.map(async (state) => {
    const filePaths = await listJsonFiles(path.join(taskRoot, state));
    const tasks = await Promise.all(filePaths.map(async (filePath) => ({
      filePath,
      payload: await readJsonFile(filePath, `task ${path.basename(filePath)}`)
    })));
    for (const task of tasks) {
      entries.push({
        ...task.payload,
        lifecycle_state: state,
        artifact_ref: toArtifactRef(projectRoot, task.filePath)
      });
    }
  }));

  return entries.sort((left, right) => String(right.updated_at ?? right.created_at ?? "").localeCompare(String(left.updated_at ?? left.created_at ?? "")));
}

async function loadRoleWorkload(projectRoot) {
  const filePaths = await listJsonFiles(path.join(projectRoot, ".aof", "artifacts", "execution", "role-results"));
  const entries = await Promise.all(filePaths.map(async (filePath) => ({
    filePath,
    payload: await readJsonFile(filePath, `role result ${path.basename(filePath)}`)
  })));
  const byRole = new Map();

  for (const entry of entries) {
    const role = entry.payload.role ?? "unknown";
    const current = byRole.get(role) ?? {
      role,
      total_results: 0,
      latest_status: null,
      latest_recommendation: null,
      latest_artifact_ref: null,
      latest_recorded_at: null
    };
    current.total_results += 1;
    const recordedAt = String(entry.payload.recorded_at ?? "");
    if (!current.latest_recorded_at || recordedAt >= String(current.latest_recorded_at)) {
      current.latest_status = entry.payload.status ?? null;
      current.latest_recommendation = entry.payload.recommendation ?? entry.payload.rationale ?? null;
      current.latest_artifact_ref = toArtifactRef(projectRoot, entry.filePath);
      current.latest_recorded_at = entry.payload.recorded_at ?? null;
    }
    byRole.set(role, current);
  }

  return Array.from(byRole.values()).sort((left, right) => right.total_results - left.total_results);
}

function isTaskBlocked(task = {}) {
  const text = [
    task.title,
    task.description,
    task.triage_notes,
    task.status,
    task.lifecycle_state
  ].filter(Boolean).join(" ").toLowerCase();
  return Boolean(task.stale_candidate_at || task.retire_candidate_at || /block|blocked|ブロック|停止|保留/.test(text));
}

async function loadTaskBoard(projectRoot, runtimeLoop = {}) {
  const tasks = await listTaskArtifacts(projectRoot);
  const byState = {
    backlog: [],
    open: [],
    assigned: [],
    done: [],
    retired: [],
    archived: []
  };

  for (const task of tasks) {
    const state = task.lifecycle_state ?? task.status ?? "backlog";
    if (!byState[state]) {
      byState[state] = [];
    }
    byState[state].push(task);
  }

  const roleWorkload = await loadRoleWorkload(projectRoot);
  const openTasks = [...(byState.open ?? []), ...(byState.assigned ?? [])];
  const blockedTasks = tasks.filter(isTaskBlocked).slice(0, 8);
  const doneTasks = (byState.done ?? []).slice(0, 8);

  return {
    generated_at: new Date().toISOString(),
    counts: {
      all: tasks.length,
      open: byState.open.length,
      assigned: byState.assigned.length,
      done: byState.done.length,
      retired: byState.retired.length,
      archived: byState.archived.length,
      blocked: blockedTasks.length,
      role_workload_roles: roleWorkload.length,
      active_loops: Array.isArray(runtimeLoop.council_runs) ? runtimeLoop.council_runs.length : 0
    },
    tasks_by_state: {
      open: byState.open.slice(0, 12),
      assigned: byState.assigned.slice(0, 12),
      done: doneTasks,
      retired: byState.retired.slice(0, 6),
      archived: byState.archived.slice(0, 6)
    },
    open_tasks: openTasks.slice(0, 12),
    top_blocked_tasks: blockedTasks,
    done_tasks: doneTasks,
    role_workload: roleWorkload
  };
}

function deriveMissionControlFallback(statusCard = {}, timelineFeed = {}, flowSnapshot = {}, derived = {}) {
  const latestEntry = Array.isArray(timelineFeed.entries) ? timelineFeed.entries[0] ?? null : null;
  const blockers = Array.isArray(statusCard.open_signals)
    ? statusCard.open_signals.map((signal) => ({
        summary: signal,
        severity: "signal",
        artifact_ref: statusCard.latest_artifact_ref ?? null
      }))
    : [];

  return {
    view_type: "mission_control",
    generated_at: statusCard.as_of ?? latestEntry?.at ?? null,
    mission_overview: {
      mission: statusCard.owner ?? null,
      release_version: null,
      release_definition_ref: null,
      operating_goal: statusCard.current_goal ?? null,
      next_value_slice: statusCard.next_checkpoint ?? null,
      current_runtime_stage: statusCard.current_phase ?? null,
      chain_anchor_ref: statusCard.latest_artifact_ref ?? null
    },
    artifact_graph: {
      nodes: (Array.isArray(flowSnapshot.ordered_nodes) ? flowSnapshot.ordered_nodes : flowSnapshot.nodes ?? []).map((node) => ({
        id: node.id,
        label: node.label ?? node.id ?? "-",
        kind: "flow",
        state: node.state ?? "unknown",
        artifact_ref: null
      })),
      edges: Array.isArray(flowSnapshot.edges)
        ? flowSnapshot.edges.map((edge) => ({
            from: edge.from,
            to: edge.to,
            relation: edge.reason ?? "sequence"
          }))
        : [],
      current_node_id: flowSnapshot.current_node ?? null
    },
    runtime_position: {
      current_phase: statusCard.current_phase ?? null,
      current_step_label: derived?.current_node_detail?.node_label ?? null,
      current_step_state: derived?.current_node_detail?.node_state ?? null
    },
    blockers,
    next_action: {
      recommended_action: statusCard.next_checkpoint ?? null,
      rationale: latestEntry?.next ?? null,
      artifact_ref: statusCard.latest_artifact_ref ?? null
    }
  };
}

      function deriveEvidenceDrillDownFallback(missionControl = {}) {
  const nextAction = missionControl.next_action ?? {};
  const blockerRefs = Array.isArray(missionControl.blockers)
    ? missionControl.blockers.map((entry) => entry.artifact_ref).filter(Boolean)
    : [];
  return {
    view_type: "evidence_drill_down",
    generated_at: missionControl.generated_at ?? null,
    brief_ref: null,
    current_state: {
      release_version: missionControl.mission_overview?.release_version ?? null,
      active_release_track: null,
      release_definition_ref: missionControl.mission_overview?.release_definition_ref ?? null,
      current_runtime_stage: missionControl.mission_overview?.current_runtime_stage ?? null,
      primary_frontier_task: null
    },
    answer_to_proof: {
      headline: {
        claim: missionControl.mission_overview?.operating_goal ?? null,
        rationale: "Fallback drill-down derived from Mission Control because no explicit evidence packet was provided.",
        evidence_refs: [missionControl.mission_overview?.chain_anchor_ref].filter(Boolean),
        evidence_items: [missionControl.mission_overview?.chain_anchor_ref].filter(Boolean).map((artifactRef) => ({
          artifact_ref: artifactRef,
          why_it_matters: "Provides the fallback chain anchor for the current mission state."
        }))
      },
      blockers: {
        claim: blockerRefs.length > 0
          ? `${blockerRefs.length} blocker signal(s) are visible from Mission Control.`
          : "No blocker is currently visible from Mission Control.",
        rationale: "Fallback blocker explanation derived from Mission Control.",
        entries: Array.isArray(missionControl.blockers) ? missionControl.blockers : [],
        evidence_refs: blockerRefs,
        evidence_items: blockerRefs.map((artifactRef) => ({
          artifact_ref: artifactRef,
          why_it_matters: "Supports the current blocker summary."
        }))
      },
      next_action: {
        claim: nextAction.recommended_action ?? null,
        rationale: nextAction.rationale ?? null,
        artifact_ref: nextAction.artifact_ref ?? null,
        evidence_refs: [nextAction.artifact_ref].filter(Boolean),
        evidence_items: [nextAction.artifact_ref].filter(Boolean).map((artifactRef) => ({
          artifact_ref: artifactRef,
          why_it_matters: "Provides the fallback source for the current recommended next action."
        }))
      },
    },
    bounded_path: [],
    operator_questions: {
      why_headline_true: "Fallback drill-down is active because no explicit evidence packet was supplied.",
      what_proves_blockers: "Use Mission Control blocker refs as the current fallback proof path.",
      what_proves_next_action: "Use the next-action artifact ref as the current fallback proof path."
    }
  };
}

function deriveRuntimeExecutionFallback() {
  return {
    view_type: "runtime_execution",
    generated_at: new Date().toISOString(),
    runtime_backing_required: {
      required_for: ["direction", "review", "self-review", "retrospective"],
      minimum_runtime_commands: 1,
      require_execution_log_ref: true,
      require_refreshed_artifact_ref: true,
      rule_summary: "A runtime-backed answer is incomplete without at least one runtime command execution plus execution-log and refreshed-artifact refs."
    },
    last_execution: {
      status: "incomplete",
      executed_at: new Date().toISOString(),
      primary_command: null,
      command_runs: [],
      refreshed_artifact_refs: [],
      execution_log_ref: null,
      incomplete_reasons: [
        "No runtime execution record was provided to the viewer."
      ]
    }
  };
}

function deriveOperatorProgressFallback(statusCard = {}, timelineFeed = {}, missionControl = {}) {
  const latestEntry = Array.isArray(timelineFeed.entries) ? timelineFeed.entries[0] ?? null : null;
  return {
    view_type: "operator_progress",
    generated_at: missionControl.generated_at ?? statusCard.as_of ?? null,
    current_checkpoint: {
      stage: missionControl.mission_overview?.current_runtime_stage ?? statusCard.current_phase ?? null,
      frontier_task_id: null,
      summary: missionControl.next_action?.recommended_action ?? statusCard.next_checkpoint ?? "No current checkpoint.",
      artifact_ref: missionControl.next_action?.artifact_ref ?? statusCard.latest_artifact_ref ?? null
    },
    previous_checkpoint: {
      summary: latestEntry?.summary ?? "No previous checkpoint is currently visible.",
      artifact_ref: latestEntry?.refs?.[0] ?? null
    },
    changes_since_last_checkpoint: latestEntry
      ? [{
          kind: latestEntry.event_type ?? "timeline-event",
          summary: latestEntry.summary ?? "Recent timeline change.",
          artifact_ref: latestEntry.refs?.[0] ?? null
        }]
      : [],
    progress_answer: {
      what_changed: latestEntry?.summary ?? "No recent change is currently visible.",
      why_it_matters: latestEntry?.rationale ?? "Use the timeline as the fallback change explanation.",
      next_checkpoint: missionControl.next_action?.recommended_action ?? statusCard.next_checkpoint ?? "Define the next checkpoint."
    }
  };
}

function deriveTreePositionFallback(missionControl = {}) {
  return {
    view_type: "tree_position",
    generated_at: missionControl.generated_at ?? null,
    trunk: {
      label: "AOF release evolution",
      active_release_version: missionControl.mission_overview?.release_version ?? null,
      active_release_track: null,
      release_definition_ref: missionControl.mission_overview?.release_definition_ref ?? null
    },
    branch: {
      frontier_track: null,
      frontier_task_id: null,
      frontier_task_title: missionControl.next_action?.recommended_action ?? null,
      artifact_ref: missionControl.next_action?.artifact_ref ?? null,
      branch_summary: missionControl.mission_overview?.next_value_slice ?? null
    },
    roadmap_path: [],
    tree_answer: {
      where_are_we: missionControl.next_action?.recommended_action ?? "No current branch is visible.",
      why_this_branch: missionControl.mission_overview?.operating_goal ?? null,
      what_branch_comes_next: missionControl.next_action?.recommended_action ?? "Define the next branch."
    }
  };
}

function deriveFlowSteps(flowSnapshot = {}) {
  const nodes = Array.isArray(flowSnapshot.nodes) ? flowSnapshot.nodes : [];
  const edges = Array.isArray(flowSnapshot.edges) ? flowSnapshot.edges : [];
  const incomingCount = new Map(nodes.map((node) => [node.id, 0]));

  for (const edge of edges) {
    incomingCount.set(edge.to, (incomingCount.get(edge.to) ?? 0) + 1);
  }

  const ordered = [];
  const visited = new Set();
  const starters = nodes.filter((node) => (incomingCount.get(node.id) ?? 0) === 0);
  const queue = starters.length > 0 ? starters.map((node) => node.id) : nodes.map((node) => node.id);

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || visited.has(id)) {
      continue;
    }
    visited.add(id);
    const node = nodes.find((candidate) => candidate.id === id);
    if (node) {
      ordered.push(node);
    }
    for (const edge of edges.filter((candidate) => candidate.from === id)) {
      if (!visited.has(edge.to)) {
        queue.push(edge.to);
      }
    }
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      ordered.push(node);
    }
  }

  return ordered;
}

function formatNodeLabel(node = {}) {
  return node.label ?? node.id ?? "-";
}

function deriveFlowMetrics(flowSnapshot = {}) {
  const orderedNodes = Array.isArray(flowSnapshot.ordered_nodes)
    ? flowSnapshot.ordered_nodes
    : deriveFlowSteps(flowSnapshot);
  const currentNodeId = flowSnapshot.current_node ?? null;
  const currentIndex = orderedNodes.findIndex((node) => node.id === currentNodeId);
  const completedNodes = orderedNodes.filter((node) => node.state === "done");
  const pendingNodes = orderedNodes.filter((node) => node.state === "pending");
  const currentNode = currentIndex >= 0 ? orderedNodes[currentIndex] : null;
  const remainingAfterCurrent = currentIndex >= 0
    ? orderedNodes.slice(currentIndex + 1).filter((node) => node.state !== "done")
    : pendingNodes;

  return {
    total_steps: orderedNodes.length,
    completed_steps: completedNodes.length,
    pending_steps: pendingNodes.length,
    current_step_index: currentIndex >= 0 ? currentIndex + 1 : null,
    current_step_label: currentNode ? formatNodeLabel(currentNode) : null,
    remaining_after_current: remainingAfterCurrent.length,
    immediate_next_step: remainingAfterCurrent[0] ? formatNodeLabel(remainingAfterCurrent[0]) : null,
    next_steps: remainingAfterCurrent.map((node) => formatNodeLabel(node)),
    ordered_step_labels: orderedNodes.map((node) => formatNodeLabel(node)),
    completion_ratio: orderedNodes.length > 0
      ? Number((completedNodes.length / orderedNodes.length).toFixed(2))
      : 0
  };
}

function deriveTimelineMetrics(timelineFeed = {}) {
  const entries = Array.isArray(timelineFeed.entries) ? timelineFeed.entries : [];
  const latestEntry = entries[0] ?? null;
  return {
    entry_count: entries.length,
    latest_actor: latestEntry?.actor ?? null,
    latest_event_type: latestEntry?.event_type ?? null,
    latest_at: latestEntry?.at ?? null,
    latest_summary: latestEntry?.summary ?? null
  };
}

function deriveCurrentNodeDetail(flowSnapshot = {}, flowMetrics = {}) {
  const orderedNodes = Array.isArray(flowSnapshot.ordered_nodes) ? flowSnapshot.ordered_nodes : [];
  const currentNodeId = flowSnapshot.current_node ?? null;
  const currentNode = orderedNodes.find((node) => node.id === currentNodeId) ?? null;
  const substeps = Array.isArray(currentNode?.substeps) ? currentNode.substeps : [];
  const branches = Array.isArray(currentNode?.branches) ? currentNode.branches : [];
  const loopbacks = Array.isArray(currentNode?.loopbacks)
    ? currentNode.loopbacks
    : (Array.isArray(flowSnapshot.edges) ? flowSnapshot.edges : [])
        .filter((edge) => edge.from === currentNodeId)
        .filter((edge) => {
          const fromIndex = orderedNodes.findIndex((node) => node.id === edge.from);
          const toIndex = orderedNodes.findIndex((node) => node.id === edge.to);
          return fromIndex >= 0 && toIndex >= 0 && toIndex <= fromIndex;
        })
        .map((edge) => ({
          to: edge.to,
          label: edge.reason ?? `return to ${edge.to}`
        }));
  const doneSubsteps = substeps.filter((step) => step.state === "done").length;
  const currentSubstep = substeps.find((step) => step.state === "current") ?? null;
  const nextSubstep = substeps.find((step) => step.state === "pending") ?? null;

  return {
    node_id: currentNode?.id ?? null,
    node_label: currentNode ? formatNodeLabel(currentNode) : null,
    node_state: currentNode?.state ?? null,
    step_progress: flowMetrics.current_step_index && flowMetrics.total_steps
      ? `${flowMetrics.current_step_index} / ${flowMetrics.total_steps}`
      : null,
    substeps,
    substep_progress: substeps.length > 0 ? `${doneSubsteps} / ${substeps.length}` : null,
    current_substep_label: currentSubstep?.label ?? null,
    next_substep_label: nextSubstep?.label ?? null,
    branches,
    loopbacks
  };
}

function deriveNarrative(statusCard = {}, flowMetrics = {}, timelineMetrics = {}) {
  return {
    project_plan: flowMetrics.ordered_step_labels ?? [],
    current_position: {
      phase: statusCard.current_phase ?? null,
      step_progress: flowMetrics.current_step_index && flowMetrics.total_steps
        ? `${flowMetrics.current_step_index} / ${flowMetrics.total_steps}`
        : null,
      current_step_label: flowMetrics.current_step_label ?? null,
      completion_ratio: flowMetrics.completion_ratio ?? 0
    },
    next_action: {
      checkpoint: statusCard.next_checkpoint ?? null,
      immediate_next_step: flowMetrics.immediate_next_step ?? null,
      latest_driver: timelineMetrics.latest_summary ?? null
    },
    remaining_work: {
      remaining_steps_after_current: flowMetrics.remaining_after_current ?? 0,
      next_steps: flowMetrics.next_steps ?? []
    }
  };
}

function deriveCadenceSummary(statusCard = {}) {
  const hasCadence =
    statusCard.cadence_timing_state ||
    statusCard.cadence_scheduler_state ||
    statusCard.cadence_dispatch_state ||
    statusCard.cadence_scheduler_profile ||
    statusCard.cadence_next_check_at ||
    statusCard.cadence_reason;

  if (!hasCadence) {
    return {
      present: false,
      timing_state: null,
      scheduler_state: null,
      dispatch_state: null,
      scheduler_profile: null,
      next_check_at: null,
      reason: null
    };
  }

  return {
    present: true,
    timing_state: statusCard.cadence_timing_state ?? null,
    scheduler_state: statusCard.cadence_scheduler_state ?? null,
    dispatch_state: statusCard.cadence_dispatch_state ?? null,
    scheduler_profile: statusCard.cadence_scheduler_profile ?? null,
    next_check_at: statusCard.cadence_next_check_at ?? null,
    reason: statusCard.cadence_reason ?? null
  };
}

export function buildVisibilityPageHtml(title) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #efe9df;
        --panel: #fffdf8;
        --panel-strong: #f8efe2;
        --ink: #201811;
        --muted: #6e6055;
        --line: #d8c7b3;
        --accent: #123b4a;
        --accent-2: #29616f;
        --accent-soft: #e2eff2;
        --good: #20583d;
        --good-soft: #ecf6ef;
        --warn: #8f5f07;
        --warn-soft: #fff6df;
        --bad: #8e2f2f;
        --bad-soft: #fff0f0;
        --shadow: 0 18px 44px rgba(42, 26, 8, 0.08);
      }
      * { box-sizing: border-box; }
      html, body {
        height: 100%;
      }
      body {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        background:
          radial-gradient(circle at top left, rgba(19,59,74,0.08), transparent 28%),
          radial-gradient(circle at top right, rgba(143,95,7,0.08), transparent 24%),
          linear-gradient(180deg, #f8f3eb 0%, var(--bg) 100%);
        color: var(--ink);
        overflow: hidden;
      }
      #fit-stage {
        width: 100%;
        height: 100vh;
        padding: clamp(8px, 1vw, 14px);
        overflow: hidden;
      }
      #app-shell {
        width: 100%;
        max-width: none;
        height: 100%;
        min-height: 0;
        margin: 0 auto;
        transform-origin: top center;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        overflow: hidden;
      }
      header {
        padding: clamp(12px, 1.2vw, 18px) clamp(14px, 1.5vw, 22px) clamp(10px, 1vw, 14px);
        border-bottom: 1px solid rgba(216,199,179,0.9);
        background: rgba(255,253,247,0.88);
        backdrop-filter: blur(12px);
        z-index: 1;
      }
      header h1 {
        margin: 0 0 6px;
        font-size: clamp(24px, 2.15vw, 34px);
        letter-spacing: -0.02em;
      }
      header p {
        margin: 0;
        color: var(--muted);
        font-size: clamp(13px, 1vw, 16px);
        line-height: 1.35;
      }
      .dashboard {
        height: calc(100% - 70px);
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) minmax(220px, auto);
        gap: 14px;
        padding: 14px;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.7fr) minmax(360px, 1.05fr);
        gap: 14px;
        align-items: stretch;
      }
      .hero-focus {
        padding: 14px 16px;
        background:
          linear-gradient(135deg, rgba(18,59,74,0.98) 0%, rgba(41,97,111,0.92) 52%, rgba(248,239,226,0.92) 140%);
        border: 1px solid rgba(18,59,74,0.18);
        border-radius: 24px;
        box-shadow: var(--shadow);
        display: grid;
        gap: 8px;
        min-width: 0;
        min-height: 126px;
      }
      .hero-focus .eyebrow {
        color: rgba(255,255,255,0.72);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
      }
      .hero-focus .title {
        font-size: 26px;
        font-weight: 700;
        line-height: 1.05;
        color: #fffdf8;
      }
      .hero-focus .subtitle {
        font-size: 14px;
        line-height: 1.3;
        color: rgba(255,253,248,0.84);
      }
      .hero-focus .next-line {
        font-size: 14px;
        line-height: 1.28;
        color: #fffdf8;
      }
      .hero-flags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .hero-task-scope {
        margin-top: 4px;
        padding: 12px 14px;
        border-radius: 16px;
        background: rgba(255,253,248,0.14);
        border: 1px solid rgba(255,253,248,0.2);
      }
      .hero-task-scope .label {
        color: rgba(255,255,255,0.72);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }
      .hero-task-scope .value {
        margin-top: 8px;
        font-size: 15px;
        line-height: 1.48;
        color: #fffdf8;
      }
      .hero-task-scope .detail {
        margin-top: 8px;
        font-size: 12px;
        line-height: 1.42;
        color: rgba(255,253,248,0.76);
      }
      main {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(380px, 1fr);
        gap: 14px;
      }
      .side-stack {
        min-height: 0;
        display: grid;
        grid-template-rows: minmax(0, 0.9fr) minmax(0, 1.1fr);
        gap: 14px;
      }
      .bottom-grid {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr) minmax(0, 1fr);
        gap: 14px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 22px;
        box-shadow: var(--shadow);
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
      .panel-map {
        background: linear-gradient(180deg, #fffdf8 0%, #fbf6ee 100%);
      }
      .hero-stack {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        min-height: 126px;
      }
      .hero-mini {
        padding: 12px 14px;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 18px;
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .hero-mini .label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .hero-mini .value {
        margin-top: 6px;
        font-size: 18px;
        font-weight: 700;
        line-height: 1.2;
      }
      .hero-mini .detail {
        margin-top: 4px;
        font-size: 12px;
        color: var(--muted);
        line-height: 1.3;
      }
      .metric .label {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .metric .value {
        margin-top: 4px;
        font-size: 21px;
        font-weight: 600;
      }
      .panel h2 {
        margin: 0;
        padding: 16px 18px 0;
        font-size: 18px;
      }
      .card-body, .timeline-body, .flow-body {
        padding: 14px 18px 18px;
        min-height: 0;
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: #c7b8a8 transparent;
        position: relative;
      }
      .card-body::-webkit-scrollbar,
      .timeline-body::-webkit-scrollbar,
      .flow-body::-webkit-scrollbar {
        width: 8px;
      }
      .card-body::-webkit-scrollbar-thumb,
      .timeline-body::-webkit-scrollbar-thumb,
      .flow-body::-webkit-scrollbar-thumb {
        background: #c7b8a8;
        border-radius: 999px;
      }
      .card-body::-webkit-scrollbar-track,
      .timeline-body::-webkit-scrollbar-track,
      .flow-body::-webkit-scrollbar-track {
        background: transparent;
      }
      .timeline-body::after {
        content: "";
        position: sticky;
        left: 0;
        right: 0;
        bottom: 0;
        display: block;
        height: 22px;
        margin-top: -22px;
        background: linear-gradient(180deg, rgba(255,253,247,0) 0%, rgba(255,253,247,0.92) 70%, rgba(255,253,247,1) 100%);
        pointer-events: none;
      }
      dl {
        margin: 0;
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 10px 12px;
      }
      dt {
        color: var(--muted);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      dd {
        margin: 0;
        font-size: 14px;
        line-height: 1.35;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid var(--line);
        background: #f6efe4;
      }
      .badge.good { color: var(--good); border-color: #b7d5c4; background: #eef7f1; }
      .badge.warn { color: var(--warn); border-color: #e1cb94; background: #fff8e5; }
      .badge.bad { color: var(--bad); border-color: #dfb0b0; background: #fff0f0; }
      .timeline-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 10px;
      }
      .timeline-entry {
        padding-left: 12px;
        border-left: 3px solid var(--line);
      }
      .timeline-entry .meta {
        color: var(--muted);
        font-size: 11px;
        margin-bottom: 6px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .timeline-entry .summary {
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 5px;
      }
      .timeline-entry .detail {
        margin: 3px 0 0;
        color: var(--ink);
        font-size: 13px;
        line-height: 1.3;
      }
      .flow-steps {
        display: grid;
        gap: 8px;
      }
      .flow-step {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: #fcfaf6;
      }
      .flow-step.current {
        border-color: var(--accent);
        background: var(--accent-soft);
      }
      .flow-step.done {
        background: var(--good-soft);
        border-color: #b7d5c4;
      }
      .flow-step .name {
        font-weight: 600;
      }
      .flow-step .state-pill,
      .node-step .state-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 76px;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        border: 1px solid var(--line);
      }
      .state-pill.done {
        background: var(--good-soft);
        color: var(--good);
        border-color: #b7d5c4;
      }
      .state-pill.current {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: #b7d2dd;
      }
      .state-pill.pending {
        background: var(--warn-soft);
        color: var(--warn);
        border-color: #e3cc92;
      }
      .state-pill.unknown {
        background: #f6efe4;
        color: var(--muted);
      }
      .node-step {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: #fcfaf6;
      }
      .node-step.current {
        border-color: var(--accent);
        background: var(--accent-soft);
      }
      .node-step.done {
        background: var(--good-soft);
        border-color: #b7d5c4;
      }
      .node-step .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--line);
        flex: 0 0 auto;
      }
      .node-step.done .dot { background: var(--good); }
      .node-step.current .dot { background: var(--accent); }
      .node-step.pending .dot { background: var(--warn); }
      .branch-list, .chip-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: #f8f3ea;
        font-size: 13px;
      }
      .node-connector {
        margin: 3px 0 3px 14px;
        width: 2px;
        height: 12px;
        background: linear-gradient(180deg, #bcd0d7 0%, #d7cbbd 100%);
        border-radius: 999px;
      }
      .flow-connector {
        margin: 4px 0 4px 18px;
        width: 2px;
        height: 12px;
        background: linear-gradient(180deg, #bcd0d7 0%, #d7cbbd 100%);
        border-radius: 999px;
      }
      .empty {
        color: var(--muted);
        font-style: italic;
      }
      .packet-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .packet-card {
        padding: 12px 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, #fffdf9 0%, #f7f0e5 100%);
      }
      .packet-card .label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .packet-card .value {
        margin-top: 8px;
        font-size: 17px;
        font-weight: 700;
        line-height: 1.16;
      }
      .packet-card .detail {
        margin-top: 8px;
        font-size: 12px;
        line-height: 1.4;
        color: var(--muted);
      }
      .packet-card.primary {
        background: linear-gradient(180deg, #eef6f8 0%, #e0edf1 100%);
        border-color: #bfd5dc;
      }
      .packet-card.good {
        background: linear-gradient(180deg, #eef7f1 0%, #e8f3ec 100%);
        border-color: #b7d5c4;
      }
      .packet-card.warn {
        background: linear-gradient(180deg, #fff8e8 0%, #fff2d6 100%);
        border-color: #e3cc92;
      }
      .overview-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .overview-card {
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: #fcfaf6;
      }
      .overview-card .label {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .overview-card .value {
        margin-top: 4px;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.25;
      }
      .sources {
        margin-top: 8px;
        color: var(--muted);
        font-size: 12px;
      }
      .plan-list, .next-list {
        margin: 0;
        padding-left: 18px;
      }
      .tight-stack {
        display: grid;
        gap: 8px;
      }
      .split-lead {
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        gap: 12px;
      }
      .focus-block {
        padding: 14px 16px;
        border-radius: 18px;
        background: var(--panel-strong);
        border: 1px solid var(--line);
      }
      .focus-block .label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .focus-block .value {
        margin-top: 8px;
        font-size: 24px;
        line-height: 1.1;
        font-weight: 700;
      }
      .focus-block .detail {
        margin-top: 8px;
        font-size: 14px;
        line-height: 1.4;
      }
      .timeline-entry {
        padding: 12px 0 0 16px;
        border-left: 3px solid #d4c1ad;
      }
      .timeline-entry:first-child {
        border-left-color: var(--accent-2);
      }
      .graph-shell {
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, #fffdfa 0%, #f7f0e6 100%);
      }
      .graph-caption {
        margin-top: 10px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      .lane-list {
        display: grid;
        gap: 10px;
      }
      .lane-card {
        display: grid;
        grid-template-columns: 132px 1fr;
        gap: 10px;
        align-items: stretch;
      }
      .lane-role {
        padding: 12px 10px;
        border-radius: 14px;
        background: #143e4e;
        color: #fffdf8;
      }
      .lane-role .name {
        font-size: 15px;
        font-weight: 700;
      }
      .lane-role .state {
        margin-top: 6px;
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(255,253,248,0.72);
      }
      .lane-track {
        position: relative;
        padding: 12px 14px 12px 24px;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: #fcfaf6;
      }
      .lane-track::before {
        content: "";
        position: absolute;
        left: 10px;
        top: 14px;
        bottom: 14px;
        width: 2px;
        background: linear-gradient(180deg, #9fc1cc 0%, #d4c1ad 100%);
      }
      .lane-track::after {
        content: "";
        position: absolute;
        left: 6px;
        top: 22px;
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--accent-2);
        box-shadow: 0 0 0 4px rgba(41,97,111,0.12);
      }
      .graph-stat {
        display: inline-flex;
        align-items: center;
        padding: 5px 9px;
        border-radius: 999px;
        background: #edf5f7;
        color: var(--accent);
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        border: 1px solid #bfd5dc;
      }
      .svg-label {
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        fill: #201811;
      }
      .status-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .recognition-stack {
        display: grid;
        gap: 12px;
      }
      .recognition-headline {
        padding: 16px 18px;
        border-radius: 18px;
        border: 1px solid #bfd5dc;
        background: linear-gradient(180deg, #eef6f8 0%, #e2eff2 100%);
      }
      .recognition-headline .label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .recognition-headline .value {
        margin-top: 8px;
        font-size: 22px;
        line-height: 1.08;
        font-weight: 700;
      }
      .recognition-headline .detail {
        margin-top: 10px;
        font-size: 14px;
        line-height: 1.42;
      }
      .change-summary {
        display: grid;
        gap: 10px;
      }
      .change-summary .step {
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: #fcfaf6;
      }
      .change-summary .step.current {
        border-color: #bfd5dc;
        background: #eef6f8;
      }
      .change-summary .arrow {
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding-left: 4px;
      }
      .timeline-strip {
        display: grid;
        gap: 8px;
      }
      .timeline-strip .tick {
        display: grid;
        grid-template-columns: 112px 1fr;
        gap: 10px;
        align-items: start;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: #fcfaf6;
      }
      .timeline-strip .tick .when {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .timeline-strip .tick .kind {
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
      }
      .status-block {
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: #fcfaf6;
      }
      .status-block .label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .status-block .value {
        margin-top: 8px;
        font-size: 16px;
        font-weight: 700;
        line-height: 1.25;
      }
      .mission-map-shell {
        display: grid;
        gap: 12px;
      }
      .mission-map-head {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .mission-map-grid {
        display: grid;
        grid-template-columns: minmax(340px, 1.08fr) minmax(0, 0.92fr);
        gap: 12px;
        align-items: stretch;
      }
      .map-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: #f4ece1;
        font-size: 12px;
        font-weight: 700;
      }
      .map-badge.live {
        background: #e5f1f4;
        color: var(--accent);
        border-color: #bfd5dc;
      }
      .map-badge.done {
        background: #eef7f1;
        color: var(--good);
        border-color: #b7d5c4;
      }
      .map-panel {
        padding: 10px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, #fffdfa 0%, #f7f0e6 100%);
      }
      .branch-rail {
        display: grid;
        gap: 12px;
        align-content: start;
        min-height: 100%;
      }
      .branch-stop {
        position: relative;
        padding: 16px 18px 16px 24px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: #fffdf8;
      }
      .branch-stop::before {
        content: "";
        position: absolute;
        left: 14px;
        top: 18px;
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: #d0b89b;
      }
      .branch-stop::after {
        content: "";
        position: absolute;
        left: 19px;
        top: 33px;
        bottom: -19px;
        width: 3px;
        background: linear-gradient(180deg, #d0b89b 0%, #bfd5dc 100%);
      }
      .branch-stop:last-child::after {
        display: none;
      }
      .branch-stop.live {
        background: #eef6f8;
        border-color: #bfd5dc;
      }
      .branch-stop.live::before {
        background: #29616f;
        box-shadow: 0 0 0 4px rgba(41,97,111,0.12);
      }
      .branch-stop.current {
        background: #eef7f1;
        border-color: #b7d5c4;
      }
      .branch-stop.current::before {
        background: #20583d;
        box-shadow: 0 0 0 4px rgba(32,88,61,0.12);
      }
      .branch-stop.next::before {
        background: #8f5f07;
        box-shadow: 0 0 0 4px rgba(143,95,7,0.12);
      }
      .branch-stop .eyebrow {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .branch-stop .title {
        margin-top: 6px;
        font-size: 31px;
        font-weight: 700;
        line-height: 1.02;
      }
      .branch-stop .detail {
        margin-top: 8px;
        font-size: 15px;
        line-height: 1.38;
        color: var(--muted);
      }
      .branch-stop .micro {
        margin-top: 10px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        border-radius: 999px;
        background: #f5eee3;
        border: 1px solid var(--line);
        color: var(--ink);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      .map-notes {
        display: grid;
        gap: 10px;
      }
      .map-note {
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: #fcfaf6;
      }
      .map-note .label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .map-note .value {
        margin-top: 8px;
        font-size: 15px;
        font-weight: 700;
        line-height: 1.3;
      }
      .map-note .detail {
        margin-top: 6px;
        font-size: 13px;
        line-height: 1.35;
        color: var(--muted);
      }
      .map-path {
        display: grid;
        gap: 8px;
      }
      .map-path-step {
        display: grid;
        grid-template-columns: 140px 1fr;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: #fffdf8;
        font-size: 13px;
      }
      .map-path-step strong {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      .map-path-step.active {
        background: #eef6f8;
        border-color: #bfd5dc;
      }
      .change-rail, .proof-rail {
        display: grid;
        gap: 10px;
      }
      .change-card, .proof-card {
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: #fcfaf6;
      }
      .change-card.active {
        border-color: #bfd5dc;
        background: #eef6f8;
      }
      .change-card.done {
        border-color: #b7d5c4;
        background: #eef7f1;
      }
      .change-card .meta, .proof-card .meta {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .change-card .value, .proof-card .value {
        margin-top: 8px;
        font-size: 15px;
        font-weight: 700;
        line-height: 1.3;
      }
      .change-card .detail, .proof-card .detail {
        margin-top: 6px;
        font-size: 13px;
        line-height: 1.35;
      }
      .event-stream {
        display: grid;
        gap: 10px;
      }
      .event-card {
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: #fcfaf6;
      }
      .event-card.current {
        border-color: #bfd5dc;
        background: #eef6f8;
      }
      .event-card .title {
        margin-top: 6px;
        font-size: 15px;
        font-weight: 700;
      }
      .event-card .sub {
        margin-top: 6px;
        font-size: 13px;
        color: var(--muted);
        line-height: 1.35;
      }
      .actor-grid {
        display: grid;
        gap: 10px;
      }
      .actor-row {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 10px;
        align-items: start;
      }
      .actor-chip {
        padding: 10px 10px;
        border-radius: 14px;
        background: #143e4e;
        color: #fffdf8;
      }
      .actor-chip .name {
        font-size: 14px;
        font-weight: 700;
      }
      .actor-chip .state {
        margin-top: 5px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: rgba(255,253,248,0.74);
      }
      .actor-judgment {
        position: relative;
        padding: 12px 14px 12px 20px;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: #fcfaf6;
      }
      .actor-judgment::before {
        content: "";
        position: absolute;
        left: 8px;
        top: 14px;
        bottom: 14px;
        width: 3px;
        border-radius: 999px;
        background: linear-gradient(180deg, #2d6776 0%, #d7cbbd 100%);
      }
      .actor-judgment .headline {
        font-size: 15px;
        font-weight: 700;
        line-height: 1.25;
      }
      .actor-judgment .note {
        margin-top: 6px;
        font-size: 13px;
        color: var(--muted);
      }
      .actor-next {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #e1d4c6;
        font-size: 12px;
        color: var(--ink);
      }
      .loop-board {
        display: grid;
        gap: 10px;
      }
      .loop-stage {
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: #fffdf8;
      }
      .loop-stage.live {
        background: #eef6f8;
        border-color: #bfd5dc;
      }
      .loop-stage.good {
        background: #eef7f1;
        border-color: #b7d5c4;
      }
      .loop-stage.warn {
        background: #fff8e8;
        border-color: #e3cc92;
      }
      .loop-stage .meta {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .loop-stage .title {
        margin-top: 8px;
        font-size: 18px;
        font-weight: 700;
        line-height: 1.15;
      }
      .loop-stage .detail {
        margin-top: 8px;
        font-size: 13px;
        line-height: 1.4;
        color: var(--muted);
      }
      .loop-arrow {
        padding-left: 10px;
        color: var(--muted);
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .seat-grid, .workforce-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .seat-card, .work-card {
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: #fcfaf6;
      }
      .seat-card.good, .work-card.good {
        background: #eef7f1;
        border-color: #b7d5c4;
      }
      .seat-card.warn, .work-card.warn {
        background: #fff8e8;
        border-color: #e3cc92;
      }
      .seat-card .role, .work-card .role {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
      }
      .seat-card .decision, .work-card .decision {
        margin-top: 7px;
        font-size: 17px;
        font-weight: 700;
        line-height: 1.2;
      }
      .seat-card .detail, .work-card .detail {
        margin-top: 8px;
        font-size: 12px;
        line-height: 1.35;
        color: var(--muted);
      }
      .evidence-line {
        margin-top: 8px;
        font-size: 12px;
        color: var(--muted);
      }
      .mission-dashboard {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) minmax(150px, 0.38fr);
        gap: clamp(10px, 1vw, 14px);
        padding: clamp(10px, 1vw, 14px);
        min-height: 0;
        height: 100%;
        overflow: hidden;
      }
      .mission-top {
        display: grid;
        grid-template-columns: 1.35fr 0.9fr 0.8fr 0.75fr 1.15fr;
        gap: clamp(8px, 0.8vw, 12px);
        min-width: 0;
      }
      .mission-tile {
        min-width: 0;
        min-height: clamp(100px, 10vh, 132px);
        padding: clamp(11px, 1vw, 16px);
        border-radius: 20px;
        border: 1px solid var(--line);
        background: var(--panel);
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
      }
      .mission-tile.primary {
        background: linear-gradient(135deg, #123b4a 0%, #29616f 72%, #9ab4b2 130%);
        color: #fffdf8;
        border-color: rgba(18,59,74,0.25);
      }
      .mission-tile.attention {
        background: linear-gradient(180deg, #fff8e8 0%, #fff2d6 100%);
      }
      .mission-tile.good {
        background: linear-gradient(180deg, #eef7f1 0%, #e8f3ec 100%);
      }
      .mission-label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-weight: 700;
      }
      .mission-tile.primary .mission-label {
        color: rgba(255,253,248,0.74);
      }
      .mission-value {
        margin-top: 8px;
        font-size: clamp(16px, 1.45vw, 23px);
        line-height: 1.08;
        font-weight: 800;
        letter-spacing: -0.02em;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
      }
      .mission-detail {
        margin-top: 8px;
        color: var(--muted);
        font-size: clamp(11px, 0.85vw, 13px);
        line-height: 1.35;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
      }
      .mission-tile.primary .mission-detail {
        color: rgba(255,253,248,0.82);
      }
      .mission-main {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(280px, 0.28fr);
        gap: clamp(10px, 1vw, 14px);
      }
      .kanban-shell, .summary-shell, .lower-panel {
        min-height: 0;
        border-radius: 24px;
        border: 1px solid var(--line);
        background: rgba(255,253,248,0.94);
        box-shadow: var(--shadow);
        overflow: hidden;
      }
      .kanban-shell, .lower-panel {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
      }
      .section-head {
        padding: clamp(12px, 1vw, 16px) clamp(14px, 1.2vw, 18px) 10px;
        border-bottom: 1px solid rgba(216,199,179,0.72);
      }
      .section-head h2 {
        margin: 0;
        padding: 0;
        font-size: clamp(17px, 1.25vw, 22px);
      }
      .section-head p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: clamp(11px, 0.85vw, 13px);
        line-height: 1.35;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
      .kanban-board {
        min-height: 0;
        height: 100%;
        padding: clamp(10px, 1vw, 14px);
        display: grid;
        grid-template-columns: repeat(7, minmax(150px, 1fr));
        gap: 10px;
        overflow: auto;
        scrollbar-width: thin;
      }
      .kanban-column {
        min-height: 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: #f8f2e9;
      }
      .kanban-column.active {
        background: #eaf5f7;
        border-color: #b9d4dd;
      }
      .kanban-column.done {
        background: #eef7f1;
        border-color: #b7d5c4;
      }
      .kanban-title {
        padding: 12px 12px 8px;
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: center;
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 800;
      }
      .kanban-count {
        min-width: 24px;
        height: 24px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #fffdf8;
        border: 1px solid var(--line);
        color: var(--ink);
        letter-spacing: 0;
      }
      .kanban-cards {
        padding: 0 10px 12px;
        display: grid;
        gap: 9px;
        align-content: start;
        min-height: 0;
        overflow: auto;
        scrollbar-width: thin;
      }
      .task-card {
        padding: 11px 12px;
        border-radius: 15px;
        border: 1px solid rgba(216,199,179,0.9);
        background: #fffdf8;
        min-width: 0;
      }
      .detail-trigger {
        cursor: zoom-in;
        transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
      }
      .detail-trigger:hover,
      .detail-trigger:focus-visible {
        border-color: var(--accent-2);
        box-shadow: 0 0 0 3px rgba(41,97,111,0.12);
        outline: none;
      }
      .detail-trigger:active {
        transform: translateY(1px);
      }
      .detail-hint {
        margin-top: 8px;
        color: var(--accent-2);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .task-card.current {
        border-color: var(--accent-2);
        box-shadow: 0 0 0 3px rgba(41,97,111,0.1);
      }
      .task-id {
        color: var(--muted);
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 800;
      }
      .task-title {
        margin-top: 6px;
        font-size: clamp(12px, 0.95vw, 15px);
        font-weight: 800;
        line-height: 1.18;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
      }
      .task-detail {
        margin-top: 7px;
        color: var(--muted);
        font-size: clamp(11px, 0.78vw, 12px);
        line-height: 1.32;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
      }
      .summary-shell {
        display: grid;
        grid-template-rows: auto 1fr;
      }
      .summary-body {
        padding: clamp(10px, 1vw, 14px);
        overflow: auto;
        display: grid;
        gap: 10px;
        align-content: start;
        min-height: 0;
        scrollbar-width: thin;
      }
      .summary-card {
        padding: 13px 14px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: #fcfaf6;
        min-width: 0;
      }
      .summary-card.warn {
        background: #fff8e8;
        border-color: #e3cc92;
      }
      .summary-card.good {
        background: #eef7f1;
        border-color: #b7d5c4;
      }
      .summary-card .value {
        margin-top: 6px;
        font-size: clamp(13px, 1vw, 16px);
        font-weight: 800;
        line-height: 1.25;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
      }
      .summary-card .detail {
        margin-top: 6px;
        color: var(--muted);
        font-size: clamp(11px, 0.78vw, 12px);
        line-height: 1.36;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
      }
      .mission-lower {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr) minmax(0, 0.95fr) minmax(0, 1fr);
        gap: clamp(10px, 1vw, 14px);
        min-height: 0;
      }
      .lower-panel {
        min-height: 0;
      }
      .lower-body {
        padding: clamp(10px, 1vw, 14px);
        min-height: 0;
        overflow: auto;
        display: grid;
        gap: 9px;
        align-content: start;
        scrollbar-width: thin;
      }
      .mini-row {
        padding: 10px 11px;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: #fcfaf6;
        min-width: 0;
      }
      .mini-row strong {
        display: block;
        font-size: 13px;
        line-height: 1.2;
      }
      .mini-row span {
        display: block;
        margin-top: 5px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.32;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
      }
      .detail-tooltip {
        position: fixed;
        z-index: 30;
        width: min(420px, calc(100vw - 28px));
        max-height: 260px;
        overflow: hidden;
        padding: 12px 14px;
        border: 1px solid rgba(18,59,74,0.24);
        border-radius: 16px;
        background: rgba(255,253,248,0.97);
        box-shadow: 0 18px 44px rgba(42, 26, 8, 0.2);
        pointer-events: none;
        opacity: 0;
        transform: translate(10px, 10px);
        transition: opacity 0.12s ease;
      }
      .detail-tooltip.visible {
        opacity: 1;
      }
      .detail-tooltip .tooltip-title {
        font-size: 14px;
        font-weight: 800;
        line-height: 1.22;
      }
      .detail-tooltip .tooltip-body {
        margin-top: 7px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
        white-space: pre-wrap;
      }
      .detail-modal[hidden] {
        display: none;
      }
      .detail-modal {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: grid;
        place-items: center;
        padding: clamp(8px, 2vw, 28px);
        background: rgba(32,24,17,0.38);
      }
      .detail-modal-panel {
        width: min(980px, 100%);
        max-height: min(90vh, 860px);
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        border-radius: 24px;
        border: 1px solid rgba(216,199,179,0.9);
        background: #fffdf8;
        box-shadow: 0 26px 72px rgba(32,24,17,0.28);
        overflow: hidden;
      }
      .detail-modal-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: start;
        padding: 18px 20px 14px;
        border-bottom: 1px solid rgba(216,199,179,0.85);
      }
      .detail-modal-title {
        margin: 0;
        font-size: clamp(20px, 2vw, 28px);
        line-height: 1.1;
      }
      .detail-modal-meta {
        margin-top: 7px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      .detail-modal-close {
        width: 38px;
        height: 38px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: #f8f2e9;
        color: var(--ink);
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
      }
      .detail-modal-body {
        min-height: 0;
        overflow: auto;
        padding: 18px 20px 22px;
        display: grid;
        gap: 14px;
      }
      .detail-section {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fcfaf6;
        overflow: hidden;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        max-height: min(54vh, 520px);
      }
      .detail-section h3 {
        margin: 0;
        padding: 12px 14px 8px;
        color: var(--muted);
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .detail-section pre {
        margin: 0;
        padding: 0 14px 14px;
        color: var(--ink);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 12px;
        line-height: 1.5;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        max-height: clamp(140px, 32vh, 420px);
        overflow: auto;
        overscroll-behavior: contain;
        scrollbar-width: thin;
      }
      .detail-section pre:focus-visible {
        outline: 3px solid rgba(41,97,111,0.18);
        outline-offset: -3px;
      }
      @media (max-width: 1280px) {
        .mission-top {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .mission-main {
          grid-template-columns: minmax(0, 1fr);
        }
        .summary-body {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .mission-lower {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 820px) {
        body {
          overflow: auto;
        }
        #fit-stage,
        #app-shell,
        .mission-dashboard {
          height: auto;
          min-height: 100vh;
          overflow: visible;
        }
        .mission-dashboard {
          grid-template-rows: auto auto auto;
        }
        .mission-top,
        .mission-lower {
          grid-template-columns: 1fr;
        }
        .summary-body {
          grid-template-columns: 1fr;
        }
        .kanban-board {
          grid-template-columns: repeat(7, minmax(230px, 1fr));
          max-height: 68vh;
        }
        .detail-modal {
          align-items: start;
        }
        .detail-modal-panel {
          max-height: calc(100vh - 16px);
        }
        .detail-modal-head {
          padding: 14px 14px 10px;
        }
        .detail-modal-title {
          font-size: clamp(18px, 6vw, 30px);
          max-height: 30vh;
          overflow: auto;
        }
        .detail-modal-body {
          padding: 12px 14px 14px;
        }
        .detail-section {
          max-height: 58vh;
        }
        .detail-section pre {
          max-height: 42vh;
        }
      }
      .pulse-dot {
        animation: pulse 1.8s ease-in-out infinite;
        transform-origin: center;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.45; transform: scale(1.18); }
      }
    </style>
  </head>
  <body>
    <div id="fit-stage">
    <div id="app-shell">
    <header>
      <h1>AOF Mission Control Dashboard</h1>
      <p>Runtime-backed command center for mission, release/frontier, kanban flow, blockers, workload, and proof coverage.</p>
    </header>
    <div id="dashboard-root" class="mission-dashboard"></div>
    </div>
    </div>
    <div id="detail-tooltip" class="detail-tooltip" hidden></div>
    <div id="detail-modal" class="detail-modal" hidden>
      <div class="detail-modal-panel" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
        <div class="detail-modal-head">
          <div>
            <h2 id="detail-modal-title" class="detail-modal-title">Detail</h2>
            <div id="detail-modal-meta" class="detail-modal-meta"></div>
          </div>
          <button id="detail-modal-close" class="detail-modal-close" type="button" aria-label="Close detail">×</button>
        </div>
        <div id="detail-modal-body" class="detail-modal-body"></div>
      </div>
    </div>
    <script>
      function escapeHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }

      function formatArray(value) {
        return Array.isArray(value) && value.length > 0 ? value.join(", ") : "none";
      }

      function badgeClass(state) {
        if (state === "present") return "badge good";
        if (state === "partial") return "badge warn";
        return "badge bad";
      }

      function stateClass(state) {
        if (state === "done" || state === "completed") return "done";
        if (state === "current" || state === "active" || state === "in_progress") return "current";
        if (state === "pending" || state === "queued") return "pending";
        return "unknown";
      }

      function firstText() {
        for (const value of arguments) {
          if (value !== undefined && value !== null && String(value).trim() !== "") {
            return value;
          }
        }
        return "-";
      }

      function stripRefToken(token) {
        let cleaned = String(token ?? "").trim();
        const leading = '"\\'(<[';
        const trailing = '"\\')]>.,;:';
        while (cleaned.length > 0 && leading.includes(cleaned[0])) {
          cleaned = cleaned.slice(1);
        }
        while (cleaned.length > 0 && trailing.includes(cleaned[cleaned.length - 1])) {
          cleaned = cleaned.slice(0, -1);
        }
        return cleaned;
      }

      function hasFileExtension(ref) {
        return [".md", ".json", ".yaml", ".yml", ".txt"].some((extension) => ref.endsWith(extension));
      }

      function extractFileRef(value) {
        const text = String(value ?? "").replaceAll("\\n", " ").replaceAll("\\t", " ");
        for (const token of text.split(" ")) {
          const cleaned = stripRefToken(token);
          if ((cleaned.startsWith("docs/") || cleaned.startsWith(".aof/")) && hasFileExtension(cleaned)) {
            return cleaned;
          }
        }
        return null;
      }

      function isLikelyFileRef(value) {
        return extractFileRef(value) !== null;
      }

      function detailPayloadAttributes(payload) {
        const preview = firstText(payload.body, payload.ref, payload.title).slice(0, 520);
        return ' role="button" tabindex="0" data-detail="' + escapeHtml(JSON.stringify(payload)) + '" data-preview="' + escapeHtml(preview) + '"';
      }

      function taskCard(card, currentId) {
        const isCurrent = card.id && currentId && card.id === currentId;
        const ref = card.artifact_ref ?? extractFileRef(card.detail);
        const payload = {
          title: firstText(card.title, card.id, "Task detail"),
          subtitle: firstText(card.id, card.kind, "task"),
          body: firstText(card.detail, card.description, card.artifact_ref),
          ref,
          metadata: card
        };
        return '<div class="task-card detail-trigger ' + (isCurrent ? "current" : "") + '"' + detailPayloadAttributes(payload) + '>' +
          '<div class="task-id">' + escapeHtml(card.id ?? card.kind ?? "runtime") + '</div>' +
          '<div class="task-title">' + escapeHtml(card.title ?? "-") + '</div>' +
          '<div class="task-detail">' + escapeHtml(card.detail ?? card.description ?? card.artifact_ref ?? "-") + '</div>' +
          '<div class="detail-hint">Click for full detail</div>' +
        '</div>';
      }

      function detailRow(title, body, ref, metadata) {
        const payload = {
          title: firstText(title, "Detail"),
          subtitle: ref ? "Ref: " + ref : "Runtime item",
          body: firstText(body, ref, "-"),
          ref: ref ?? extractFileRef(body),
          metadata: metadata ?? null
        };
        return '<div class="mini-row detail-trigger"' + detailPayloadAttributes(payload) + '><strong>' +
          escapeHtml(payload.title) + '</strong><span>' + escapeHtml(payload.body) + '</span><div class="detail-hint">Click for full detail</div></div>';
      }

      function summarizeTask(task) {
        return {
          id: task.task_id ?? task.id ?? task.status ?? "task",
          title: task.title ?? task.summary ?? "-",
          detail: task.description ?? task.triage_notes ?? task.artifact_ref ?? "-",
          artifact_ref: task.artifact_ref ?? null
        };
      }

      function buildKanbanColumns(payload) {
        const derived = payload.derived ?? {};
        const taskBoard = derived.task_board ?? payload.task_board ?? {};
        const mission = derived.mission_control ?? {};
        const workGovernance = mission.work_governance ?? {};
        const workGovernanceItems = Array.isArray(workGovernance.work_items) ? workGovernance.work_items : [];
        const tree = derived.tree_position ?? {};
        const evidence = derived.evidence_drill_down ?? {};
        const loop = derived.runtime_loop ?? {};
        const progress = derived.operator_progress ?? {};
        const currentId = tree.branch?.frontier_task_id ?? progress.current_checkpoint?.frontier_task_id ?? null;
        const openTasks = Array.isArray(taskBoard.open_tasks) ? taskBoard.open_tasks.map(summarizeTask) : [];
        const doneTasks = Array.isArray(taskBoard.done_tasks) ? taskBoard.done_tasks.slice(0, 4).map(summarizeTask) : [];
        const roleCards = Array.isArray(loop.organization_assembly?.role_results)
          ? loop.organization_assembly.role_results.map((role) => ({
              id: role.role ?? "role",
              title: firstText(role.status, role.recommendation, "Role result"),
              detail: firstText(role.recommendation, role.rationale, role.artifact_ref)
            }))
          : [];
        const councilCards = [];
        if (loop.council_run) {
          councilCards.push({
            id: loop.council_run.execution_id ?? "council-run",
            title: firstText(loop.council_run.stage, "Council run"),
            detail: firstText(loop.council_run.approval_outcome?.status, loop.council_run.summary)
          });
        }
        if (loop.council_review) {
          councilCards.push({
            id: loop.council_review.council_id ?? "council-review",
            title: firstText(loop.council_review.review_status, "Council review"),
            detail: firstText(loop.council_review.decision_summary, loop.council_review.recommendation, loop.council_review.artifact_ref)
          });
        }
        const frontierCard = {
          id: currentId ?? "frontier",
          title: firstText(tree.branch?.frontier_task_title, mission.next_action?.recommended_action, "Next frontier"),
          detail: firstText(tree.branch?.branch_summary, mission.next_action?.rationale, progress.current_checkpoint?.artifact_ref)
        };
        const backlogCards = openTasks.filter((task) => task.id !== currentId);
        if (backlogCards.length === 0) {
          backlogCards.push({
            id: "next-frontier",
            title: firstText(mission.next_action?.recommended_action, "Select next frontier"),
            detail: "No open task is currently queued; the runtime is asking for frontier selection."
          });
        }
        return [
          { id: "backlog", title: "Backlog", cards: backlogCards },
          { id: "discovery", title: "Discovery", cards: evidence.current_state?.discovery_handoff_ref ? [{ id: "discovery", title: "Discovery handoff available", detail: evidence.current_state.discovery_handoff_ref }] : [] },
          { id: "need-validation", title: "Need Validation", cards: evidence.current_state?.release_definition_ref ? [{ id: "need-validation", title: firstText(evidence.current_state.current_runtime_stage, "Need validation context"), detail: firstText(evidence.answer_to_proof?.headline?.claim, evidence.current_state.release_definition_ref) }] : [] },
          { id: "planning", title: "Planning", cards: [frontierCard] },
          { id: "role-work", title: "Role Work", cards: roleCards },
          { id: "council-review", title: "Council Review", cards: councilCards },
          { id: "done", title: "Approved / Done", cards: doneTasks }
        ].map((column) => ({
          ...column,
          state: column.id === "planning" ? "active" : (column.id === "done" ? "done" : "")
        }));
      }

      let lastMissionDashboardHtml = "";

      function renderMissionControlDashboard(payload) {
        const root = document.getElementById("dashboard-root");
        const html = buildMissionControlDashboardHtml(payload);
        if (root.dataset.rendered === "true" && html === lastMissionDashboardHtml) {
          return false;
        }
        root.innerHTML = html;
        root.dataset.rendered = "true";
        root.dataset.renderCount = String((Number(root.dataset.renderCount ?? "0") || 0) + 1);
        lastMissionDashboardHtml = html;
        return true;
      }

      function buildMissionControlDashboardHtml(payload) {
        const status = payload.status_card ?? {};
        const timeline = payload.timeline_feed ?? {};
        const derived = payload.derived ?? {};
        const mission = derived.mission_control ?? {};
        const tree = derived.tree_position ?? {};
        const evidence = derived.evidence_drill_down ?? {};
        const runtimeExecution = derived.runtime_execution ?? {};
        const taskBoard = derived.task_board ?? payload.task_board ?? {};
        const loop = derived.runtime_loop ?? {};
        const progress = derived.operator_progress ?? {};
        const lastExecution = runtimeExecution.last_execution ?? {};
        const blockers = Array.isArray(mission.blockers)
          ? mission.blockers
          : (Array.isArray(evidence.answer_to_proof?.blockers?.entries) ? evidence.answer_to_proof.blockers.entries : []);
        const riskCount = (taskBoard.counts?.blocked ?? 0) + blockers.length + (Array.isArray(status.open_signals) ? status.open_signals.length : 0);
        const kanbanColumns = buildKanbanColumns(payload);
        const timelineEntries = Array.isArray(timeline.entries) ? timeline.entries.slice(0, 6) : [];
        const blockedTasks = Array.isArray(taskBoard.top_blocked_tasks) ? taskBoard.top_blocked_tasks : [];
        const workload = Array.isArray(taskBoard.role_workload) ? taskBoard.role_workload : [];
        const evidenceRefs = [
          ...(Array.isArray(evidence.answer_to_proof?.headline?.evidence_refs) ? evidence.answer_to_proof.headline.evidence_refs : []),
          ...(Array.isArray(evidence.answer_to_proof?.next_action?.evidence_refs) ? evidence.answer_to_proof.next_action.evidence_refs : []),
          ...(Array.isArray(lastExecution.refreshed_artifact_refs) ? lastExecution.refreshed_artifact_refs : [])
        ];
        const activeLoops = taskBoard.counts?.active_loops ?? (Array.isArray(loop.council_runs) ? loop.council_runs.length : 0);

        return (
          '<section class="mission-top">' +
            '<div class="mission-tile primary"><div><div class="mission-label">Current Mission</div><div class="mission-value">' + escapeHtml(firstText(mission.mission_overview?.mission, status.current_goal)) + '</div></div><div class="mission-detail">' + escapeHtml(firstText(mission.mission_overview?.operating_goal, mission.mission_overview?.next_value_slice)) + '</div></div>' +
            '<div class="mission-tile"><div><div class="mission-label">Current Release / Frontier</div><div class="mission-value">' + escapeHtml(firstText(tree.trunk?.active_release_track, tree.trunk?.active_release_version, mission.mission_overview?.release_version)) + ' → ' + escapeHtml(firstText(tree.branch?.frontier_track, "next")) + '</div></div><div class="mission-detail">Frontier: ' + escapeHtml(firstText(tree.branch?.frontier_task_id, "not selected")) + '</div></div>' +
            '<div class="mission-tile good"><div><div class="mission-label">Runtime-backed status</div><div class="mission-value">' + escapeHtml(lastExecution.status === "pass" ? "Backed" : "Incomplete") + '</div></div><div class="mission-detail">' + escapeHtml(firstText(lastExecution.primary_command, status.usage_level, "no command")) + '</div></div>' +
            '<div class="mission-tile ' + (riskCount > 0 ? "attention" : "good") + '"><div><div class="mission-label">Risk / Blocker count</div><div class="mission-value">' + escapeHtml(String(riskCount)) + '</div></div><div class="mission-detail">' + escapeHtml(firstText(evidence.answer_to_proof?.blockers?.claim, "No active blocker claim")) + '</div></div>' +
            '<div class="mission-tile attention"><div><div class="mission-label">Next recommended action</div><div class="mission-value">' + escapeHtml(firstText(mission.next_action?.recommended_action, status.next_checkpoint)) + '</div></div><div class="mission-detail">' + escapeHtml(firstText(mission.next_action?.rationale, progress.progress_answer?.next_checkpoint)) + '</div></div>' +
          '</section>' +
          '<section class="mission-main">' +
            '<div class="kanban-shell"><div class="section-head"><h2>AOF Kanban Board</h2><p>Backlog → Discovery → Need Validation → Planning → Role Work → Council Review → Approved / Done. Cards are derived from runtime tasks, evidence, loop, and council artifacts.</p></div><div class="kanban-board">' +
              kanbanColumns.map((column) =>
                '<div class="kanban-column ' + escapeHtml(column.state) + '"><div class="kanban-title"><span>' + escapeHtml(column.title) + '</span><span class="kanban-count">' + escapeHtml(String(column.cards.length)) + '</span></div><div class="kanban-cards">' +
                  (column.cards.length > 0 ? column.cards.map((card) => taskCard(card, tree.branch?.frontier_task_id)).join("") : '<div class="task-card"><div class="task-id">empty</div><div class="task-title">No artifact here</div><div class="task-detail">The runtime currently has no card for this lane.</div></div>') +
                '</div></div>'
              ).join("") +
            '</div></div>' +
            '<aside class="summary-shell"><div class="section-head"><h2>Overall Summary</h2><p>Compact operator state from the same artifacts that power the board.</p></div><div class="summary-body">' +
              '<div class="summary-card"><div class="mission-label">Active loops</div><div class="value">' + escapeHtml(String(activeLoops)) + '</div><div class="detail">Council execution runs visible for the selected runtime context.</div></div>' +
              '<div class="summary-card"><div class="mission-label">Open tasks</div><div class="value">' + escapeHtml(String(taskBoard.counts?.open ?? 0)) + '</div><div class="detail">Assigned: ' + escapeHtml(String(taskBoard.counts?.assigned ?? 0)) + ' / Done: ' + escapeHtml(String(taskBoard.counts?.done ?? 0)) + '</div></div>' +
              '<div class="summary-card ' + (riskCount > 0 ? "warn" : "good") + '"><div class="mission-label">Top blockers</div><div class="value">' + escapeHtml(riskCount > 0 ? firstText(blockers[0]?.summary, blockedTasks[0]?.title, "Review blocker list") : "No blocker") + '</div><div class="detail">' + escapeHtml(firstText(blockers[0]?.artifact_ref, blockedTasks[0]?.artifact_ref, "No blocking artifact surfaced")) + '</div></div>' +
              '<div class="summary-card"><div class="mission-label">Current frontier branch</div><div class="value">' + escapeHtml(firstText(tree.branch?.frontier_track, "not selected")) + '</div><div class="detail">' + escapeHtml(firstText(tree.branch?.branch_summary, mission.mission_overview?.next_value_slice)) + '</div></div>' +
              '<div class="summary-card"><div class="mission-label">Key risks</div><div class="value">' + escapeHtml(firstText(evidence.answer_to_proof?.blockers?.claim, "No key risk claim")) + '</div><div class="detail">' + escapeHtml(firstText(evidence.answer_to_proof?.blockers?.rationale, "Risk summary comes from evidence drill-down.")) + '</div></div>' +
            '</div></aside>' +
          '</section>' +
          '<section class="mission-lower">' +
            '<div class="lower-panel"><div class="section-head"><h2>Ticket / Task Flow</h2><p>Recent runtime and task changes.</p></div><div class="lower-body">' +
              (timelineEntries.length > 0 ? timelineEntries.map((entry, index) => detailRow(
                String(index + 1) + ". " + firstText(entry.summary, entry.event_type),
                firstText(entry.actor, "-") + " / " + firstText(entry.at, "-") + " / " + firstText(entry.next, entry.rationale),
                Array.isArray(entry.artifact_refs) ? entry.artifact_refs[0] : entry.artifact_ref,
                entry
              )).join("") : '<div class="mini-row"><strong>No timeline</strong><span>No timeline entries are currently available.</span></div>') +
            '</div></div>' +
            '<div class="lower-panel"><div class="section-head"><h2>Top Blocked Tasks</h2><p>Blocked or stale task signals.</p></div><div class="lower-body">' +
              (blockedTasks.length > 0 ? blockedTasks.map((task) => detailRow(
                firstText(task.task_id, "task") + " " + firstText(task.title, ""),
                firstText(task.triage_notes, task.description, task.artifact_ref),
                task.artifact_ref,
                task
              )).join("") : '<div class="mini-row"><strong>No blocked tasks</strong><span>No blocked/stale task artifact was detected.</span></div>') +
            '</div></div>' +
            '<div class="lower-panel"><div class="section-head"><h2>Role Workload</h2><p>Role-result count and latest recommendation.</p></div><div class="lower-body">' +
              (workload.length > 0 ? workload.map((role) => detailRow(
                role.role + " / " + role.total_results + " result(s)",
                firstText(role.latest_status, "-") + " / " + firstText(role.latest_recommendation, role.latest_artifact_ref),
                role.latest_artifact_ref,
                role
              )).join("") : '<div class="mini-row"><strong>No role workload</strong><span>No execution role-result artifacts are visible.</span></div>') +
            '</div></div>' +
            '<div class="lower-panel"><div class="section-head"><h2>Work Governance Chain</h2><p>Work item goal → actors → council output → Go/No-Go → Operational Map → Context Pack.</p></div><div class="lower-body">' +
              (workGovernanceItems.length > 0 ? workGovernanceItems.map((item) => detailRow(
                firstText(item.work_item_id, "work item") + " / " + firstText(item.go_no_go_state, item.council_status, "pending"),
                firstText(item.objective, "-") + " / Actors: " + String((item.selected_actors ?? []).length) + " / Next: " + firstText(item.next_recommended_action, "-"),
                item.refs?.work_item_goal,
                item
              )).join("") : '<div class="mini-row"><strong>No Work Governance chain</strong><span>No work-governance artifacts are visible.</span></div>') +
            '</div></div>' +
            '<div class="lower-panel"><div class="section-head"><h2>Evidence / Proof Coverage</h2><p>Refs behind headline, next action, and runtime-backed claim.</p></div><div class="lower-body">' +
              (evidenceRefs.length > 0 ? Array.from(new Set(evidenceRefs)).slice(0, 8).map((ref, index) => detailRow(
                String(index + 1) + ". evidence",
                ref,
                ref,
                { evidence_ref: ref }
              )).join("") : '<div class="mini-row"><strong>No evidence refs</strong><span>The current packet did not expose evidence references.</span></div>') +
            '</div></div>' +
          '</section>'
        );
      }

      function renderPacket(status, derived) {
        const root = document.getElementById("packet-root");
        const mission = derived?.mission_control ?? {};
        const tree = derived?.tree_position ?? {};
        const brief = derived?.operator_brief ?? {};
        const runtimeExecution = derived?.runtime_execution ?? {};
        const progress = derived?.operator_progress ?? {};
        const evidence = derived?.evidence_drill_down ?? {};
        const lastExecution = runtimeExecution.last_execution ?? {};
        const loop = derived?.runtime_loop ?? {};
        const frontier = tree.branch ?? {};
        const executionDetail = lastExecution.status === "pass"
          ? ((loop.current_frontier?.has_live_loop
              ? "Frontier runtime session " + (loop.active_session?.session_id ?? "-") + " is attached; visibility was refreshed at " + (lastExecution.executed_at ?? "-")
              : "Ran " + (lastExecution.command_runs ?? []).length + " commands at " + (lastExecution.executed_at ?? "-")))
          : (lastExecution.incomplete_reasons?.[0] ?? "No runtime execution recorded.");
        const branchStory = tree.trunk?.active_release_track && frontier.frontier_track
          ? ("Shipped " + tree.trunk.active_release_track + ", now shaping " + frontier.frontier_track + ".")
          : (tree.tree_answer?.where_are_we ?? "-");
        root.innerHTML =
          '<div class="recognition-stack">' +
            '<div class="recognition-headline">' +
              '<div class="label">What the human should recognize immediately</div>' +
              '<div class="value">' + escapeHtml(brief.headline ?? frontier.frontier_task_title ?? mission.next_action?.recommended_action ?? "-") + '</div>' +
              '<div class="detail">' + escapeHtml(brief.why_now?.summary ?? mission.next_action?.rationale ?? "-") + '</div>' +
            '</div>' +
            '<div class="packet-grid">' +
              '<div class="packet-card primary"><div class="label">What the AI org is doing now</div><div class="value">' + escapeHtml(mission.next_action?.recommended_action ?? "-") + '</div><div class="detail">This is the current frontier task the runtime wants us to execute next.</div></div>' +
              '<div class="packet-card"><div class="label">Where we are in the larger tree</div><div class="value">' + escapeHtml((tree.trunk?.active_release_track ?? "-") + " → " + (frontier.frontier_track ?? "-")) + '</div><div class="detail">' + escapeHtml(branchStory) + '</div></div>' +
              '<div class="packet-card good"><div class="label">Why this is the right move</div><div class="value">' + escapeHtml(evidence.answer_to_proof?.next_action?.rationale ?? mission.next_action?.rationale ?? "-") + '</div><div class="detail">Grounded in the operating goal, next value slice, and current frontier task.</div></div>' +
              '<div class="packet-card ' + (lastExecution.status === "pass" ? "good" : "warn") + '"><div class="label">Is this actually runtime-backed?</div><div class="value">' + escapeHtml(lastExecution.status === "pass" ? "Yes" : "No") + '</div><div class="detail">' + escapeHtml(executionDetail) + '</div></div>' +
            '</div>' +
            '<div class="change-summary">' +
              '<div class="step"><div class="label">Previous checkpoint</div><div class="value">' + escapeHtml(progress.previous_checkpoint?.summary ?? "No previous checkpoint recorded") + '</div><div class="detail">' + escapeHtml(progress.previous_checkpoint?.artifact_ref ?? "-") + '</div></div>' +
              '<div class="arrow">What changed</div>' +
              '<div class="step current"><div class="label">Current checkpoint</div><div class="value">' + escapeHtml(progress.current_checkpoint?.summary ?? "No current checkpoint recorded") + '</div><div class="detail">' + escapeHtml(progress.progress_answer?.why_it_matters ?? "-") + '</div></div>' +
            '</div>' +
          '</div>';
      }

      function renderHero(status, derived) {
        const root = document.getElementById("hero-root");
        const narrative = derived?.narrative ?? {};
        const mission = derived?.mission_control ?? {};
        const brief = derived?.operator_brief ?? {};
        const tree = derived?.tree_position ?? {};
        const loop = derived?.runtime_loop ?? {};
        const cadence = derived?.cadence_summary ?? {};
        const signalList = Array.isArray(status.open_signals) ? status.open_signals : [];
        const frontier = brief.current_state?.primary_frontier_task ?? null;
        const currentFrontier = loop.current_frontier ?? {};
        const shortHeadline = brief.headline ?? "Human Recognition Interface";
        const taskScope = currentFrontier.task_description
          ?? tree.branch?.branch_summary
          ?? mission.next_action?.rationale
          ?? "No task scope is currently available from runtime artifacts.";
        const taskScopeDetail = currentFrontier.task_description_source === "live-artifact"
          ? "Taken from the current frontier task artifact."
          : (currentFrontier.task_description_source === "tree-summary"
              ? "Fallback from the current branch summary because the task artifact description is unavailable."
              : "The current frontier task does not expose a readable description yet.");
        const flags = [];
        flags.push('<span class="' + badgeClass(status.runtime_evidence_state) + '">' + escapeHtml(status.runtime_evidence_state ?? "unknown") + '</span>');
        flags.push('<span class="chip">' + escapeHtml(status.usage_level ?? "-") + '</span>');
        if (cadence.present) {
          flags.push('<span class="chip">Cadence: ' + escapeHtml(cadence.scheduler_state ?? cadence.timing_state ?? "-") + '</span>');
          if (cadence.scheduler_profile) {
            flags.push('<span class="chip">Scheduler: ' + escapeHtml(cadence.scheduler_profile) + '</span>');
          }
        }
        if (signalList.length > 0) {
          flags.push('<span class="chip">Signals: ' + escapeHtml(signalList.join(", ")) + '</span>');
        } else {
          flags.push('<span class="chip">Signals: none</span>');
        }
        root.innerHTML =
          '<div class="eyebrow">Current Mission</div>' +
          '<div class="title">' + escapeHtml(shortHeadline) + '</div>' +
          '<div class="subtitle">' + escapeHtml(brief.why_now?.summary ?? mission.next_action?.rationale ?? "The runtime has selected the highest-leverage next move from the current artifact truth.") + '</div>' +
          '<div class="next-line"><strong>Now:</strong> ' + escapeHtml((brief.current_state?.active_release_track ?? "shipped") + " → " + (frontier?.track ?? "next")) + ' / <strong>Frontier:</strong> ' + escapeHtml(frontier?.task_id ?? "-") + '</div>' +
          '<div class="next-line"><strong>Do next:</strong> ' + escapeHtml(mission.next_action?.recommended_action ?? narrative.next_action?.checkpoint ?? status.next_checkpoint ?? "-") + '</div>' +
          '<div class="hero-task-scope"><div class="label">Task scope</div><div class="value">' + escapeHtml(taskScope) + '</div><div class="detail">' + escapeHtml(taskScopeDetail) + '</div></div>' +
          '<div class="hero-flags">' + flags.join("") + '</div>';
      }

      function renderProgress(derived) {
        const progress = derived?.operator_progress ?? {};
        const mission = derived?.mission_control ?? {};
        const tree = derived?.tree_position ?? {};
        const evidence = derived?.evidence_drill_down ?? {};
        const runtimeExecution = derived?.runtime_execution ?? {};
        const loop = derived?.runtime_loop ?? {};
        const lastExecution = runtimeExecution.last_execution ?? {};
        const blockerClaim = evidence.answer_to_proof?.blockers?.claim ?? "No blocker proof available.";
        document.getElementById("metric-branch").textContent = tree.branch?.frontier_track ?? "-";
        document.getElementById("metric-branch-detail").textContent = tree.trunk?.active_release_track
          ? "After " + tree.trunk.active_release_track
          : (tree.branch?.branch_summary ?? "-");
        document.getElementById("metric-stage").textContent = mission.mission_overview?.current_runtime_stage ?? "-";
        document.getElementById("metric-stage-detail").textContent = progress.current_checkpoint?.summary ?? "-";
        document.getElementById("metric-frontier").textContent = tree.branch?.frontier_task_id ?? "-";
        document.getElementById("metric-frontier-detail").textContent = tree.branch?.frontier_task_title ?? "-";
        document.getElementById("metric-pressure").textContent = lastExecution.status === "pass" ? "Runtime-backed" : "Incomplete";
        document.getElementById("metric-pressure-detail").textContent = lastExecution.status === "pass"
          ? (loop.current_frontier?.has_live_loop
              ? ("Frontier session: " + (loop.active_session?.session_id ?? "-"))
              : ("Last refresh: " + (lastExecution.executed_at ?? "-")))
          : (lastExecution.incomplete_reasons?.[0] ?? blockerClaim);
      }

      function renderDelta(derived) {
        const root = document.getElementById("delta-root");
        const progress = derived?.operator_progress ?? {};
        const brief = derived?.operator_brief ?? {};
        const blockerAnswer = brief.operator_answers?.what_is_blocked ?? "No blocker summary available.";
        const changes = Array.isArray(progress.changes_since_last_checkpoint)
          ? progress.changes_since_last_checkpoint
          : [];
        root.innerHTML =
          '<div class="change-rail">' +
            changes.map((change, index) =>
              '<div class="change-card ' + (index === changes.length - 1 ? "active" : "done") + '">' +
                '<div class="meta">' + escapeHtml(change.kind ?? "change") + '</div>' +
                '<div class="value">' + escapeHtml(change.summary ?? "-") + '</div>' +
                '<div class="detail">This changed the current operator-facing frontier.</div>' +
              '</div>'
            ).join('') +
            '<div class="change-card active">' +
              '<div class="meta">Current checkpoint</div>' +
              '<div class="value">' + escapeHtml(progress.current_checkpoint?.summary ?? "-") + '</div>' +
              '<div class="detail">' + escapeHtml(progress.progress_answer?.why_it_matters ?? "-") + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="map-note" style="margin-top:12px;">' +
            '<div class="label">Blockers right now</div>' +
            '<div class="value">' + escapeHtml(blockerAnswer) + '</div>' +
            '<div class="detail">' + escapeHtml(progress.progress_answer?.next_checkpoint ?? "-") + '</div>' +
          '</div>';
      }

      function renderTree(derived) {
        const root = document.getElementById("tree-root");
        const tree = derived?.tree_position ?? {};
        const mission = derived?.mission_control ?? {};
        const evidence = derived?.evidence_drill_down ?? {};
        const brief = derived?.operator_brief ?? {};
        const path = Array.isArray(evidence.bounded_path) ? evidence.bounded_path : [];
        const pathLabels = {
          operator_brief: "Operator brief",
          frontier_task: "Frontier task",
          goal_surface: "Operating goal",
          slice_surface: "Next value slice",
          release_basis: "Release baseline"
        };
        root.innerHTML =
          '<div class="mission-map-shell">' +
            '<div class="mission-map-head">' +
              '<span class="map-badge done">Shipped trunk: ' + escapeHtml(tree.trunk?.active_release_track ?? tree.trunk?.active_release_version ?? "-") + '</span>' +
              '<span class="map-badge live">Live branch: ' + escapeHtml(tree.branch?.frontier_track ?? "-") + '</span>' +
              '<span class="map-badge">Stage: ' + escapeHtml(mission.mission_overview?.current_runtime_stage ?? "-") + '</span>' +
              '<span class="map-badge">Frontier: ' + escapeHtml(tree.branch?.frontier_task_id ?? "-") + '</span>' +
            '</div>' +
            '<div class="mission-map-grid">' +
              '<div class="map-panel">' +
                '<div class="branch-rail">' +
                  '<div class="branch-stop">' +
                    '<div class="eyebrow">Already shipped</div>' +
                    '<div class="title">' + escapeHtml(tree.trunk?.active_release_track ?? tree.trunk?.active_release_version ?? "-") + '</div>' +
                    '<div class="detail">This is the stable trunk already shipped. Everything below is the next move on top of it.</div>' +
                    '<div class="micro">Base release</div>' +
                  '</div>' +
                  '<div class="branch-stop live">' +
                    '<div class="eyebrow">Working on now</div>' +
                    '<div class="title">' + escapeHtml(tree.branch?.frontier_track ?? "-") + '</div>' +
                    '<div class="detail">This is the active branch currently being shaped above the shipped release.</div>' +
                    '<div class="micro">Next release branch</div>' +
                  '</div>' +
                  '<div class="branch-stop current">' +
                    '<div class="eyebrow">Current frontier</div>' +
                    '<div class="title">' + escapeHtml(tree.branch?.frontier_task_id ?? "-") + '</div>' +
                    '<div class="detail">' + escapeHtml(tree.branch?.frontier_task_title ?? "No frontier task recorded.") + '</div>' +
                    '<div class="micro">The task we should push now</div>' +
                  '</div>' +
                  '<div class="branch-stop next">' +
                    '<div class="eyebrow">Immediate next move</div>' +
                    '<div class="title">' + escapeHtml("Start now") + '</div>' +
                    '<div class="detail">' + escapeHtml(mission.next_action?.recommended_action ?? "-") + '</div>' +
                    '<div class="micro">Operator action</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="map-notes">' +
                '<div class="map-note"><div class="label">What this means</div><div class="value">' + escapeHtml((tree.trunk?.active_release_track ?? tree.trunk?.active_release_version ?? "the shipped release") + ' is done. ' + (tree.branch?.frontier_track ?? "the current branch") + ' is the live branch. ' + (tree.branch?.frontier_task_id ?? "No frontier task") + ' is the active frontier.') + '</div><div class="detail">' + escapeHtml(tree.branch?.branch_summary ?? "-") + '</div></div>' +
                '<div class="map-note"><div class="label">Why this branch exists</div><div class="value">' + escapeHtml(brief.why_now?.summary ?? tree.tree_answer?.why_this_branch ?? "-") + '</div><div class="detail">We are not exploring randomly. This branch is the bounded next release path after the shipped trunk.</div></div>' +
                '<div class="map-note"><div class="label">What the operator should do</div><div class="value">' + escapeHtml(mission.next_action?.recommended_action ?? "-") + '</div><div class="detail">This is the concrete runtime-selected move, not a generic suggestion.</div></div>' +
              '</div>' +
            '</div>' +
            '<div class="map-path">' +
              path.map((entry, index) =>
                '<div class="map-path-step ' + (index === path.length - 1 ? "active" : "") + '"><strong>' + escapeHtml(pathLabels[entry.step] ?? String(entry.step ?? "-").replaceAll("_", " ")) + '</strong><span>' + escapeHtml(entry.label ?? "-") + '</span></div>'
              ).join('') +
            '</div>' +
          '</div>';
      }

      function renderProof(derived) {
        const root = document.getElementById("proof-root");
        const evidence = derived?.evidence_drill_down ?? {};
        const headlineProof = evidence.answer_to_proof?.headline ?? {};
        const blockerProof = evidence.answer_to_proof?.blockers ?? {};
        const nextActionProof = evidence.answer_to_proof?.next_action ?? {};
        root.innerHTML =
          '<div class="proof-rail">' +
            '<div class="proof-card"><div class="meta">Headline proof</div><div class="value">' + escapeHtml(headlineProof.claim ?? "-") + '</div><div class="detail">' + escapeHtml(headlineProof.rationale ?? "-") + '</div><div class="sources">Evidence: release baseline, operating goal, next value slice, frontier task.</div></div>' +
            '<div class="proof-card"><div class="meta">Blocker proof</div><div class="value">' + escapeHtml(blockerProof.claim ?? "-") + '</div><div class="detail">' + escapeHtml(blockerProof.rationale ?? "-") + '</div><div class="sources">Evidence: organization analytics, alignment pulse, current frontier task.</div></div>' +
            '<div class="proof-card"><div class="meta">Next action proof</div><div class="value">' + escapeHtml(nextActionProof.claim ?? "-") + '</div><div class="detail">' + escapeHtml(nextActionProof.rationale ?? "-") + '</div><div class="sources">Evidence: frontier task, operating goal, next value slice, release baseline.</div></div>' +
          '</div>';
      }

      function renderActors(derived) {
        const root = document.getElementById("actor-root");
        const loop = derived?.runtime_loop ?? {};
        const mission = derived?.mission_control ?? {};
        const brief = derived?.operator_brief ?? {};
        const skillfulActor = mission.skillful_actor_projection ?? brief.current_state?.skillful_actor_projection ?? null;
        const frontier = loop.current_frontier ?? {};
        const session = loop.active_session ?? {};
        const run = loop.council_run ?? {};
        const runs = Array.isArray(loop.council_runs) ? loop.council_runs : [];
        const assembly = loop.organization_assembly ?? {};
        const review = loop.council_review ?? {};
        const seatDecisions = Array.isArray(run.seat_decisions) ? run.seat_decisions : [];
        const roleResults = Array.isArray(assembly.role_results) ? assembly.role_results : [];
        const latestPlanningRun = runs.find((entry) => entry.stage === "planning") ?? runs[0] ?? {};
        const latestApprovalRun = runs.find((entry) => entry.stage === "approval") ?? run;
        const planningSeats = Array.isArray(latestPlanningRun.seat_decisions) ? latestPlanningRun.seat_decisions : [];
        const approvalSeats = Array.isArray(latestApprovalRun.seat_decisions) ? latestApprovalRun.seat_decisions : seatDecisions;
        const skillfulActorCard = skillfulActor
          ? '<div class="loop-stage live">' +
              '<div class="meta">Skillful actor now</div>' +
              '<div class="title">' + escapeHtml(skillfulActor.actor?.character_label ?? "-") + ' / ' + escapeHtml(skillfulActor.visible_state?.execution_gate_state ?? "-") + '</div>' +
              '<div class="detail">"' + escapeHtml(skillfulActor.visible_state?.speech_bubble ?? "-") + '"</div>' +
              '<div class="evidence-line">Current action: ' + escapeHtml(skillfulActor.visible_state?.current_action ?? "-") + '</div>' +
              '<div class="evidence-line">Council review needed: ' + escapeHtml(String(skillfulActor.visible_state?.council_review_needed ?? false)) + ' / benchmark: ' + escapeHtml(skillfulActor.visible_state?.benchmark_status ?? "-") + '</div>' +
              '<div class="evidence-line">Blockers: ' + escapeHtml((skillfulActor.visible_state?.visible_blockers ?? []).join(" / ") || "none") + '</div>' +
              '<div class="evidence-line">Proof: ' + escapeHtml((skillfulActor.proof_chain ?? []).map((entry) => entry.step + "=" + entry.state).join(" -> ") || "-") + '</div>' +
              '<div class="evidence-line">Artifact: ' + escapeHtml(skillfulActor.projection_ref ?? "-") + '</div>' +
            '</div>'
          : '';

        const seatCards = approvalSeats.map((seat) =>
          '<div class="seat-card ' + (seat.veto ? "warn" : "good") + '">' +
            '<div class="role">' + escapeHtml(seat.role ?? "-") + '</div>' +
            '<div class="decision">' + escapeHtml(seat.recommendation ?? "no-decision") + '</div>' +
            '<div class="detail">' + escapeHtml(seat.summary ?? "-") + '</div>' +
            '<div class="evidence-line">Actor: ' + escapeHtml(seat.actor_id ?? "-") + ' / ' + escapeHtml(seat.purpose ?? "-") + '</div>' +
          '</div>'
        ).join("");

        const workCards = roleResults.map((role) =>
          '<div class="work-card good">' +
            '<div class="role">' + escapeHtml(role.role ?? "-") + '</div>' +
            '<div class="decision">' + escapeHtml(role.status ?? "-") + '</div>' +
            '<div class="detail">' + escapeHtml(role.recommendation ?? role.rationale ?? "-") + '</div>' +
            '<div class="evidence-line">Returned to join/team packet' + (role.artifact_ref ? " / " + escapeHtml(role.artifact_ref) : "") + '</div>' +
          '</div>'
        ).join("");

        root.innerHTML =
          '<div class="loop-board">' +
            '<div class="loop-stage ' + (frontier.has_live_loop ? "live" : "warn") + '">' +
              '<div class="meta">Loop truth</div>' +
              '<div class="title">' + escapeHtml(frontier.has_live_loop ? "This frontier is backed by a live runtime loop" : "This frontier is not yet backed by a live runtime loop") + '</div>' +
              '<div class="detail">' + escapeHtml(frontier.has_live_loop ? ((frontier.task_id ?? "-") + " is tied to session " + (session.session_id ?? "-") + ".") : (loop.operator_gap ?? "No current frontier loop evidence is attached.")) + '</div>' +
            '</div>' +
            skillfulActorCard +
            '<div class="loop-arrow">1. Council is invoked</div>' +
            '<div class="loop-stage">' +
              '<div class="meta">Planning council</div>' +
              '<div class="title">' + escapeHtml((latestPlanningRun.stage ?? "planning") + " / " + (latestPlanningRun.routing_mode ?? session.routing_mode ?? "-")) + '</div>' +
              '<div class="detail">' + escapeHtml(latestPlanningRun.summary ?? "No planning council run is visible.") + '</div>' +
              '<div class="evidence-line">Seats: ' + escapeHtml((latestPlanningRun.seat_roles ?? []).join(" -> ") || "none") + '</div>' +
            '</div>' +
            '<div class="loop-arrow">2. Council seats judge and decide</div>' +
            '<div class="seat-grid">' + (seatCards || '<p class="empty">No seat-by-seat approval judgments are visible yet.</p>') + '</div>' +
            '<div class="loop-arrow">3. The organization is assembled and assigned actors return outputs</div>' +
            '<div class="loop-stage good">' +
              '<div class="meta">Workforce assembly</div>' +
              '<div class="title">' + escapeHtml(assembly.role_join?.aggregate_state ?? "No role join recorded") + '</div>' +
              '<div class="detail">' + escapeHtml(assembly.team_output?.recommended_next_step ?? "No team output recommendation recorded.") + '</div>' +
              '<div class="evidence-line">Join: ' + escapeHtml(assembly.role_join?.artifact_ref ?? "-") + ' / Team: ' + escapeHtml(assembly.team_output?.artifact_ref ?? "-") + '</div>' +
            '</div>' +
            '<div class="workforce-grid">' + (workCards || '<p class="empty">No assigned actor outputs are visible for this frontier yet.</p>') + '</div>' +
            '<div class="loop-arrow">4. Council reviews the assembled result and returns judgment</div>' +
            '<div class="loop-stage live">' +
              '<div class="meta">Council review back to orchestrator</div>' +
              '<div class="title">' + escapeHtml((review.council_id ?? "No council review") + (review.review_status ? " / " + review.review_status : "")) + '</div>' +
              '<div class="detail">' + escapeHtml(review.decision_summary ?? review.recommendation ?? "No review packet is visible yet.") + '</div>' +
              '<div class="evidence-line">Review artifact: ' + escapeHtml(review.artifact_ref ?? "-") + '</div>' +
            '</div>' +
            '<div class="loop-arrow">5. Orchestrator sees the result and decides the next loop</div>' +
            '<div class="loop-stage">' +
              '<div class="meta">What the orchestrator can now say</div>' +
              '<div class="title">' + escapeHtml(review.recommendation ?? mission.next_action?.recommended_action ?? "-") + '</div>' +
              '<div class="detail">' + escapeHtml(frontier.has_live_loop ? "This recommendation is grounded in the active frontier loop, not only in goal/task truth." : "This is still a goal/task level recommendation because current frontier loop truth is missing.") + '</div>' +
            '</div>' +
          '</div>';
      }

      function renderTimeline(timeline, derived) {
        const root = document.getElementById("timeline-root");
        const loopEvents = Array.isArray(derived?.runtime_loop?.loop_events) ? derived.runtime_loop.loop_events : [];
        if (loopEvents.length > 0) {
          root.innerHTML = '<div class="timeline-strip">' + loopEvents.map((entry) => \`
            <div class="tick">
              <div class="when">\${escapeHtml(entry.at ?? "-")}</div>
              <div>
                <div class="title">\${escapeHtml(entry.title ?? "-")}</div>
                <div class="kind">\${escapeHtml(entry.kind ?? "-")}</div>
                <div class="kind">\${escapeHtml(entry.detail ?? "-")}</div>
              </div>
            </div>
          \`).join("") + '</div>';
          return;
        }
        if (!Array.isArray(timeline.entries) || timeline.entries.length === 0) {
          root.innerHTML = '<p class="empty">No timeline entries available.</p>';
          return;
        }
        const entries = timeline.entries.slice(0, 4);
        root.innerHTML = '<div class="timeline-strip">' + entries.map((entry) => \`
          <div class="tick">
            <div class="when">\${escapeHtml(entry.at ?? "-")}</div>
            <div>
              <div class="title">\${escapeHtml(entry.summary ?? "-")}</div>
              <div class="kind">\${escapeHtml(entry.actor ?? "-")} decided \${escapeHtml(String(entry.event_type ?? "-").replaceAll("_", " "))}</div>
            </div>
          </div>
        \`).join("") + '</div>';
      }

      function detailSection(title, content) {
        return '<section class="detail-section"><h3>' + escapeHtml(title) + '</h3><pre tabindex="0">' + escapeHtml(content ?? "-") + '</pre></section>';
      }

      function parseDetailPayload(trigger) {
        try {
          return JSON.parse(trigger.dataset.detail || "{}");
        } catch {
          return {
            title: "Unreadable detail",
            body: trigger.textContent || "-"
          };
        }
      }

      async function loadRefContent(ref) {
        if (!ref) {
          return null;
        }
        const response = await fetch("/api/ref-content?ref=" + encodeURIComponent(ref), { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || payload.ok === false) {
          throw new Error(payload.error || "Failed to load ref content.");
        }
        return payload;
      }

      async function openDetailModal(payload) {
        const modal = document.getElementById("detail-modal");
        const title = document.getElementById("detail-modal-title");
        const meta = document.getElementById("detail-modal-meta");
        const body = document.getElementById("detail-modal-body");
        title.textContent = payload.title || "Detail";
        meta.textContent = payload.ref ? (payload.subtitle || "Ref") + " / " + payload.ref : (payload.subtitle || "Runtime detail");
        body.innerHTML =
          detailSection("Full item text", payload.body || "-") +
          (payload.metadata ? detailSection("Runtime metadata", JSON.stringify(payload.metadata, null, 2)) : "") +
          (payload.ref ? detailSection("File content", "Loading " + payload.ref + " ...") : "");
        modal.hidden = false;
        document.getElementById("detail-modal-close").focus();

        if (payload.ref) {
          try {
            const refContent = await loadRefContent(payload.ref);
            const sections = [
              detailSection("Full item text", payload.body || "-"),
              payload.metadata ? detailSection("Runtime metadata", JSON.stringify(payload.metadata, null, 2)) : "",
              detailSection("File content: " + refContent.path, refContent.content + (refContent.truncated ? "\\n\\n[content truncated]" : ""))
            ];
            body.innerHTML = sections.join("");
          } catch (error) {
            const sections = [
              detailSection("Full item text", payload.body || "-"),
              payload.metadata ? detailSection("Runtime metadata", JSON.stringify(payload.metadata, null, 2)) : "",
              detailSection("File content unavailable", error instanceof Error ? error.message : String(error))
            ];
            body.innerHTML = sections.join("");
          }
        }
      }

      function closeDetailModal() {
        document.getElementById("detail-modal").hidden = true;
      }

      function showDetailTooltip(trigger, event) {
        const tooltip = document.getElementById("detail-tooltip");
        const payload = parseDetailPayload(trigger);
        tooltip.innerHTML = '<div class="tooltip-title">' + escapeHtml(payload.title || "Detail") + '</div><div class="tooltip-body">' + escapeHtml(firstText(payload.body, payload.ref, "-")) + '</div>';
        tooltip.hidden = false;
        tooltip.classList.add("visible");
        moveDetailTooltip(event);
      }

      function moveDetailTooltip(event) {
        const tooltip = document.getElementById("detail-tooltip");
        if (tooltip.hidden) {
          return;
        }
        const x = Math.min(event.clientX + 16, window.innerWidth - tooltip.offsetWidth - 12);
        const y = Math.min(event.clientY + 16, window.innerHeight - tooltip.offsetHeight - 12);
        tooltip.style.left = Math.max(12, x) + "px";
        tooltip.style.top = Math.max(12, y) + "px";
      }

      function hideDetailTooltip() {
        const tooltip = document.getElementById("detail-tooltip");
        tooltip.classList.remove("visible");
        tooltip.hidden = true;
      }

      document.addEventListener("click", (event) => {
        const closeTarget = event.target.closest("#detail-modal-close");
        if (closeTarget || event.target.id === "detail-modal") {
          closeDetailModal();
          return;
        }
        const trigger = event.target.closest(".detail-trigger");
        if (!trigger) {
          return;
        }
        openDetailModal(parseDetailPayload(trigger)).catch((error) => {
          openDetailModal({ title: "Detail error", body: error instanceof Error ? error.message : String(error) });
        });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeDetailModal();
          hideDetailTooltip();
          return;
        }
        if ((event.key === "Enter" || event.key === " ") && event.target?.classList?.contains("detail-trigger")) {
          event.preventDefault();
          openDetailModal(parseDetailPayload(event.target)).catch((error) => {
            openDetailModal({ title: "Detail error", body: error instanceof Error ? error.message : String(error) });
          });
        }
      });

      document.addEventListener("pointerover", (event) => {
        const trigger = event.target.closest(".detail-trigger");
        if (trigger) {
          showDetailTooltip(trigger, event);
        }
      });
      document.addEventListener("pointermove", (event) => moveDetailTooltip(event));
      document.addEventListener("pointerout", (event) => {
        if (event.target.closest(".detail-trigger")) {
          hideDetailTooltip();
        }
      });

      function fitDashboardToViewport() {
        return;
      }

      let refreshInFlight = false;
      async function refresh() {
        if (refreshInFlight) {
          return false;
        }
        refreshInFlight = true;
        try {
          const response = await fetch("/api/views", { cache: "no-store" });
          const payload = await response.json();
          const changed = renderMissionControlDashboard(payload);
          if (changed) {
            fitDashboardToViewport();
          }
          return changed;
        } finally {
          refreshInFlight = false;
        }
      }

      refresh().catch((error) => {
        const text = '<p class="empty">Failed to load visibility payload: ' + escapeHtml(error.message) + '</p>';
        document.getElementById("dashboard-root").innerHTML = text;
        fitDashboardToViewport();
      });
      window.addEventListener("resize", fitDashboardToViewport);
      window.__aofRefreshForTest = refresh;
      if (typeof globalThis !== "undefined") {
        globalThis.__aofRefreshForTest = refresh;
      }
      setInterval(() => {
        if (!document.hidden) {
          refresh().catch(() => {});
        }
      }, 30000);
    </script>
  </body>
</html>`;
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

export async function loadVisibilityViews(options) {
  const status = await readJsonView(options.statusInput, "status_card");
  const projectRoot = deriveProjectRootFromAofPath(status.path);
  const timeline = await readJsonView(options.timelineInput, "timeline_feed");
  const flow = await readJsonView(options.flowInput, "flow_snapshot");
  const flowSnapshot = {
    ...flow.payload,
    ordered_nodes: deriveFlowSteps(flow.payload)
  };
  const flowMetrics = deriveFlowMetrics(flowSnapshot);
  const timelineMetrics = deriveTimelineMetrics(timeline.payload);
  const currentNodeDetail = deriveCurrentNodeDetail(flowSnapshot, flowMetrics);
  const narrative = deriveNarrative(status.payload, flowMetrics, timelineMetrics);
  const cadenceSummary = deriveCadenceSummary(status.payload);
  const mission = options.missionInput
    ? await readJsonView(options.missionInput, "mission_control")
    : {
        path: null,
        payload: deriveMissionControlFallback(status.payload, timeline.payload, flowSnapshot, {
          current_node_detail: currentNodeDetail,
          narrative
        })
      };
  const progress = options.progressInput
    ? await readJsonView(options.progressInput, "operator_progress")
    : {
        path: null,
        payload: deriveOperatorProgressFallback(status.payload, timeline.payload, mission.payload)
      };
  const tree = options.treeInput
    ? await readJsonView(options.treeInput, "tree_position")
    : {
        path: null,
        payload: deriveTreePositionFallback(mission.payload)
      };
  const evidence = options.evidenceInput
    ? await readJsonView(options.evidenceInput, "evidence_drill_down")
    : {
        path: null,
        payload: deriveEvidenceDrillDownFallback(mission.payload)
      };
  const runtimeExecution = options.runtimeExecutionInput
    ? await readJsonView(options.runtimeExecutionInput, "runtime_execution")
    : {
        path: null,
        payload: deriveRuntimeExecutionFallback()
      };
  const brief = options.briefInput
    ? await readJsonView(options.briefInput, "operator_brief")
    : {
        path: null,
      payload: null
      };
  const runtimeLoop = await loadRuntimeLoopContext(projectRoot, tree.payload, brief.payload);
  const taskBoard = await loadTaskBoard(projectRoot, runtimeLoop);

  return {
    status_card: status.payload,
    timeline_feed: timeline.payload,
    flow_snapshot: flowSnapshot,
    mission_control: mission.payload,
    operator_brief: brief.payload,
    operator_progress: progress.payload,
    tree_position: tree.payload,
    evidence_drill_down: evidence.payload,
    runtime_execution: runtimeExecution.payload,
    runtime_loop: runtimeLoop,
    task_board: taskBoard,
    derived: {
      flow_metrics: flowMetrics,
      timeline_metrics: timelineMetrics,
      current_node_detail: currentNodeDetail,
      narrative,
      cadence_summary: cadenceSummary,
      mission_control: mission.payload,
      operator_brief: brief.payload,
      operator_progress: progress.payload,
      tree_position: tree.payload,
      evidence_drill_down: evidence.payload,
      runtime_execution: runtimeExecution.payload,
      runtime_loop: runtimeLoop,
      task_board: taskBoard
    },
    sources: {
      project_root: projectRoot,
      status_input: status.path,
      timeline_input: timeline.path,
      flow_input: flow.path,
      mission_input: mission.path,
      brief_input: brief.path,
      progress_input: progress.path,
      tree_input: tree.path,
      evidence_input: evidence.path,
      runtime_execution_input: runtimeExecution.path
    }
  };
}

export async function visibilityServeCommand(options, runtimeOptions = {}) {
  if (!options.statusInput || !options.timelineInput || !options.flowInput) {
    throw new Error("Missing --status-input, --timeline-input, or --flow-input for `visibility-serve`.");
  }

  const host = options.host || "127.0.0.1";
  const requestedPort = options.port ?? 4174;
  const title = options.title || "AOF Human Recognition Interface";
  const projectRoot = deriveProjectRootFromAofPath(options.statusInput);
  await loadVisibilityViews(options);

  const html = buildVisibilityPageHtml(title);
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${host}:${requestedPort}`);
      if (url.pathname === "/") {
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        });
        res.end(html);
        return;
      }

      if (url.pathname === "/api/views") {
        const views = await loadVisibilityViews(options);
        writeJson(res, 200, views);
        return;
      }

      if (url.pathname === "/api/ref-content") {
        try {
          const ref = url.searchParams.get("ref");
          const content = await readProjectTextRef(projectRoot, ref);
          writeJson(res, 200, content);
        } catch (error) {
          writeJson(res, 404, {
            ok: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
        return;
      }

      if (url.pathname === "/api/health") {
        writeJson(res, 200, { ok: true });
        return;
      }

      writeJson(res, 404, { error: "Not Found" });
    } catch (error) {
      writeJson(res, 500, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(requestedPort, host, () => resolve());
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : requestedPort;
  const close = () => new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  if (runtimeOptions.installSignalHandlers !== false) {
    const shutdown = async () => {
      server.removeAllListeners("error");
      await close().catch(() => {});
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }

  return {
    ok: true,
    host,
    port,
    title,
    url: `http://${host}:${port}`,
    sources: {
      statusInput: path.resolve(options.statusInput),
      timelineInput: path.resolve(options.timelineInput),
      flowInput: path.resolve(options.flowInput),
      missionInput: options.missionInput ? path.resolve(options.missionInput) : null,
      briefInput: options.briefInput ? path.resolve(options.briefInput) : null,
      progressInput: options.progressInput ? path.resolve(options.progressInput) : null,
      treeInput: options.treeInput ? path.resolve(options.treeInput) : null,
      evidenceInput: options.evidenceInput ? path.resolve(options.evidenceInput) : null,
      runtimeExecutionInput: options.runtimeExecutionInput ? path.resolve(options.runtimeExecutionInput) : null
    },
    close
  };
}
