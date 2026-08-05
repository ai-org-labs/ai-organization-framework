import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema, validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-127";
const TASK_STATUS_DIRS = ["open", "assigned", "done"];
const BLOCKING_ASSIGNMENT_STATES = new Set(["blocked", "escalated"]);
const ACCEPTED_ASSIGNMENT_STATES = new Set(["selected"]);
const ACCEPTED_EXECUTION_GATE_STATES = new Set(["allowed"]);
const RISK_TERMS_REQUIRING_FOLLOW_UP = [
  /missing role/i,
  /missing skill/i,
  /player comprehension/i,
  /required validation/i,
  /recommended next step/i
];

function taskNumber(taskId) {
  const match = String(taskId ?? "").match(/TASK-(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

function isAtOrAfterCutoff(taskId, cutoffTaskId) {
  const current = taskNumber(taskId);
  const cutoff = taskNumber(cutoffTaskId);
  return Number.isFinite(current) && Number.isFinite(cutoff) && current >= cutoff;
}

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

function unique(values) {
  return [...new Set((values ?? []).filter(Boolean))];
}

async function loadScopedTasks(projectRoot, cutoffTaskId) {
  const tasks = [];
  for (const statusDir of TASK_STATUS_DIRS) {
    const dirPath = path.join(projectRoot, ".aof", "tasks", statusDir);
    for (const filePath of await listJsonFiles(dirPath)) {
      const payload = await readJson(filePath, `task ${path.basename(filePath)}`);
      const taskId = payload.task_id ?? path.basename(filePath, ".json");
      if (isAtOrAfterCutoff(taskId, cutoffTaskId)) {
        tasks.push({
          task_id: taskId,
          title: payload.title ?? "",
          status: payload.status ?? statusDir,
          status_dir: statusDir,
          artifact_ref: path.relative(projectRoot, filePath)
        });
      }
    }
  }
  return tasks.sort((left, right) => taskNumber(left.task_id) - taskNumber(right.task_id));
}

async function maybeRead(projectRoot, artifactRef, label) {
  try {
    return await readJson(path.resolve(projectRoot, artifactRef), label);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function loadArtifactsBySourceTask(projectRoot, rootParts, schemaName, label) {
  const root = path.join(projectRoot, ".aof", "artifacts", ...rootParts);
  const artifacts = [];
  for (const filePath of await listJsonFiles(root)) {
    const payload = await readJson(filePath, `${label} ${path.basename(filePath)}`);
    if (schemaName) {
      await validateWithBundledSchema(payload, schemaName, label);
    }
    artifacts.push({
      artifact_ref: path.relative(projectRoot, filePath),
      payload,
      source_task_id: payload.source_task_id ?? null
    });
  }
  return artifacts;
}

function buildCouncilReviewSourceTask(review) {
  return review.source_task_id ?? review.payload?.source_task_id ?? null;
}

function textSignalsFollowUp(review) {
  const payload = review.payload ?? review;
  const text = [
    payload.decision_summary,
    payload.rationale,
    payload.recommendation,
    payload.summary,
    ...(payload.blocking_reasons ?? []),
    ...(payload.artifact_change_recommendations ?? []),
    ...(payload.organization_change_recommendations ?? [])
  ].filter(Boolean).join("\n");
  return RISK_TERMS_REQUIRING_FOLLOW_UP.some((pattern) => pattern.test(text));
}

function extractFollowUpTaskIds(review) {
  const payload = review.payload ?? review;
  return payload.follow_up_task_ids ?? payload.follow_up_task_ids ?? [];
}

function summarizeTaskCoverage(task, goal, packets, evaluations, gates, councilReviews) {
  const requiredRoles = unique(goal?.required_actor_roles ?? []);
  const requiredSkills = unique(goal?.required_skills ?? []);
  const assignedRoleRefs = unique(packets.map((packet) => packet.payload.assignment?.role_ref));
  const assignedActorRefs = unique(packets.map((packet) => packet.payload.assignment?.actor_ref));
  const packetSkillRefs = unique(packets.flatMap((packet) => packet.payload.required_skill_refs ?? []));
  const evaluationStates = unique(evaluations.map((evaluation) => evaluation.payload.assignment_decision?.assignment_state));
  const executionGateStates = unique(gates.map((gate) => gate.payload.gate_decision?.execution_gate_state));
  const missingRoles = requiredRoles.filter((role) => !assignedRoleRefs.includes(role));
  const missingSkills = requiredSkills.filter((skill) => !packetSkillRefs.includes(skill));
  const blockedAssignments = evaluations.filter((evaluation) => BLOCKING_ASSIGNMENT_STATES.has(evaluation.payload.assignment_decision?.assignment_state));
  const nonSelectedAssignments = evaluations.filter((evaluation) => !ACCEPTED_ASSIGNMENT_STATES.has(evaluation.payload.assignment_decision?.assignment_state));
  const nonAllowedGates = gates.filter((gate) => !ACCEPTED_EXECUTION_GATE_STATES.has(gate.payload.gate_decision?.execution_gate_state));
  const followUpRequiredReviews = councilReviews.filter(textSignalsFollowUp);
  const followUpMissingReviews = followUpRequiredReviews.filter((review) => extractFollowUpTaskIds(review).length === 0);
  return {
    task_id: task.task_id,
    task_ref: task.artifact_ref,
    goal_ref: `.aof/artifacts/work-items/goals/${task.task_id}.json`,
    required_roles: requiredRoles,
    required_skills: requiredSkills,
    assigned_roles: assignedRoleRefs,
    assigned_actors: assignedActorRefs,
    covered_skills: packetSkillRefs,
    missing_roles: missingRoles,
    missing_skills: missingSkills,
    actor_skill_packet_refs: packets.map((packet) => packet.artifact_ref),
    assignment_evaluation_refs: evaluations.map((evaluation) => evaluation.artifact_ref),
    actor_execution_gate_refs: gates.map((gate) => gate.artifact_ref),
    council_review_refs: councilReviews.map((review) => review.artifact_ref),
    assignment_states: evaluationStates,
    execution_gate_states: executionGateStates,
    blocked_assignment_count: blockedAssignments.length,
    non_selected_assignment_count: nonSelectedAssignments.length,
    non_allowed_gate_count: nonAllowedGates.length,
    follow_up_required_review_count: followUpRequiredReviews.length,
    follow_up_missing_review_count: followUpMissingReviews.length
  };
}

export async function capabilityCoverageAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const tasks = await loadScopedTasks(projectRoot, cutoffTaskId);
  const organization = await readJson(path.join(projectRoot, ".aof", "organization.json"), "organization");
  const skills = await readJson(path.join(projectRoot, ".aof", "skills.json"), "skills");
  const roleIds = new Set((organization.roles ?? []).map((role) => role.role_id));
  const agentIds = new Set((organization.agents ?? []).map((agent) => agent.agent_id));
  const skillIds = new Set((skills.skills ?? []).map((skill) => skill.skill_id));

  const packets = await loadArtifactsBySourceTask(
    projectRoot,
    ["actor-skill-packets"],
    "aof-actor-skill-packet.schema.json",
    "actor skill packet"
  );
  const evaluations = await loadArtifactsBySourceTask(
    projectRoot,
    ["actor-assignment-evaluations"],
    "aof-actor-assignment-evaluation.schema.json",
    "actor assignment evaluation"
  );
  const gates = await loadArtifactsBySourceTask(
    projectRoot,
    ["actor-execution-gates"],
    "aof-actor-execution-gate.schema.json",
    "actor execution gate"
  );
  const councilReviews = (await loadArtifactsBySourceTask(
    projectRoot,
    ["execution", "council-reviews"],
    null,
    "council review"
  )).filter((review) => buildCouncilReviewSourceTask(review) !== null);

  pushCheck(
    checks,
    errors,
    "scoped task discovery",
    tasks.length > 0,
    `${tasks.length} task(s) at or after ${cutoffTaskId} in ${TASK_STATUS_DIRS.join(", ")}`
  );

  const coverageRecords = [];
  for (const task of tasks) {
    const goalRef = `.aof/artifacts/work-items/goals/${task.task_id}.json`;
    const goal = await maybeRead(projectRoot, goalRef, `work item goal ${task.task_id}`);
    pushCheck(checks, errors, `${task.task_id} work item goal presence`, Boolean(goal), goalRef);
    if (!goal) {
      continue;
    }

    try {
      await validateWithBundledSchema(goal, "aof-work-item-goal.schema.json", "work item goal");
      pushCheck(checks, errors, `${task.task_id} work item goal schema`, true, goalRef);
    } catch (error) {
      pushCheck(checks, errors, `${task.task_id} work item goal schema`, false, error.message);
      continue;
    }

    const taskPackets = packets.filter((packet) => packet.source_task_id === task.task_id);
    const taskEvaluations = evaluations.filter((evaluation) => evaluation.source_task_id === task.task_id);
    const taskGates = gates.filter((gate) => gate.source_task_id === task.task_id);
    const taskReviews = councilReviews.filter((review) => buildCouncilReviewSourceTask(review) === task.task_id);
    const coverage = summarizeTaskCoverage(task, goal, taskPackets, taskEvaluations, taskGates, taskReviews);
    coverageRecords.push(coverage);

    pushCheck(checks, errors, `${task.task_id} required roles declared`, coverage.required_roles.length > 0, `${coverage.required_roles.length} role(s)`);
    pushCheck(checks, errors, `${task.task_id} required skills declared`, coverage.required_skills.length > 0, `${coverage.required_skills.length} skill(s)`);
    pushCheck(checks, errors, `${task.task_id} expected outputs declared`, (goal.expected_output ?? []).length > 0, `${goal.expected_output?.length ?? 0} output(s)`);
    pushCheck(checks, errors, `${task.task_id} acceptance gates declared`, (goal.success_criteria ?? []).length > 0 && (goal.go_no_go_criteria?.go ?? []).length > 0 && (goal.go_no_go_criteria?.no_go ?? []).length > 0, "success_criteria and go/no-go criteria must be explicit");

    for (const role of coverage.required_roles) {
      pushCheck(checks, errors, `${task.task_id} required role exists: ${role}`, roleIds.has(role), role);
      pushCheck(checks, errors, `${task.task_id} required role assigned: ${role}`, coverage.assigned_roles.includes(role), `assigned=${coverage.assigned_roles.join(", ") || "none"}`);
    }

    for (const skill of coverage.required_skills) {
      pushCheck(checks, errors, `${task.task_id} required skill exists: ${skill}`, skillIds.has(skill), skill);
      pushCheck(checks, errors, `${task.task_id} required skill packet-covered: ${skill}`, coverage.covered_skills.includes(skill), `covered=${coverage.covered_skills.join(", ") || "none"}`);
    }

    pushCheck(checks, errors, `${task.task_id} actor skill packet presence`, taskPackets.length > 0, `${taskPackets.length} packet(s)`);
    for (const packet of taskPackets) {
      pushCheck(checks, errors, `${task.task_id} packet has concrete actor: ${packet.artifact_ref}`, Boolean(packet.payload.assignment?.actor_ref), `actor_ref=${packet.payload.assignment?.actor_ref ?? "missing"}`);
      pushCheck(checks, errors, `${task.task_id} packet actor exists: ${packet.artifact_ref}`, agentIds.has(packet.payload.assignment?.actor_ref), `actor_ref=${packet.payload.assignment?.actor_ref ?? "missing"}`);
      pushCheck(checks, errors, `${task.task_id} packet role exists: ${packet.artifact_ref}`, roleIds.has(packet.payload.assignment?.role_ref), `role_ref=${packet.payload.assignment?.role_ref ?? "missing"}`);
      pushCheck(checks, errors, `${task.task_id} packet output contract present: ${packet.artifact_ref}`, (packet.payload.expected_output_contract?.required_sections ?? []).length > 0 && (packet.payload.expected_output_contract?.acceptance_criteria ?? []).length > 0, "required sections and acceptance criteria must be present");
      for (const fit of packet.payload.capability_fit ?? []) {
        const nonBlockingFit = !["missing", "blocked"].includes(fit.fit_state);
        pushCheck(checks, errors, `${task.task_id} capability fit has non-blocking evidence: ${fit.capability_ref}`, nonBlockingFit && (fit.evidence_refs ?? []).length > 0, `fit_state=${fit.fit_state}, evidence_refs=${fit.evidence_refs?.length ?? 0}`);
      }
    }

    pushCheck(checks, errors, `${task.task_id} actor assignment evaluation presence`, taskEvaluations.length >= taskPackets.length && taskEvaluations.length > 0, `${taskEvaluations.length} evaluation(s) for ${taskPackets.length} packet(s)`);
    pushCheck(checks, errors, `${task.task_id} assignments selected before execution`, coverage.non_selected_assignment_count === 0 && taskEvaluations.length > 0, `states=${coverage.assignment_states.join(", ") || "none"}`);
    pushCheck(checks, errors, `${task.task_id} actor execution gate presence`, taskGates.length >= taskEvaluations.length && taskGates.length > 0, `${taskGates.length} gate(s) for ${taskEvaluations.length} evaluation(s)`);
    pushCheck(checks, errors, `${task.task_id} execution gates allowed`, coverage.non_allowed_gate_count === 0 && taskGates.length > 0, `states=${coverage.execution_gate_states.join(", ") || "none"}`);
    pushCheck(checks, errors, `${task.task_id} council review presence`, taskReviews.length > 0, `${taskReviews.length} review(s)`);
    pushCheck(checks, errors, `${task.task_id} council follow-up preservation`, coverage.follow_up_missing_review_count === 0, `${coverage.follow_up_missing_review_count} review(s) mention missing role/skill/risk/validation without follow_up_task_ids`);

    for (const ref of [
      task.artifact_ref,
      goalRef,
      ...coverage.actor_skill_packet_refs,
      ...coverage.assignment_evaluation_refs,
      ...coverage.actor_execution_gate_refs,
      ...coverage.council_review_refs
    ]) {
      pushCheck(checks, errors, `${task.task_id} coverage ref resolves`, await pathExists(path.resolve(projectRoot, ref)), ref);
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "capability-coverage-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: TASK_STATUS_DIRS,
    summary: {
      scoped_task_count: tasks.length,
      coverage_record_count: coverageRecords.length,
      missing_role_count: coverageRecords.reduce((total, record) => total + record.missing_roles.length, 0),
      missing_skill_count: coverageRecords.reduce((total, record) => total + record.missing_skills.length, 0),
      blocked_assignment_count: coverageRecords.reduce((total, record) => total + record.blocked_assignment_count, 0),
      non_allowed_gate_count: coverageRecords.reduce((total, record) => total + record.non_allowed_gate_count, 0),
      follow_up_missing_review_count: coverageRecords.reduce((total, record) => total + record.follow_up_missing_review_count, 0),
      failing_check_count: errors.length
    },
    tasks,
    coverage_records: coverageRecords,
    checks,
    errors
  };

  await validatePayload(payload, "aof-capability-coverage-audit.schema.json", "capability coverage audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
