import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema, validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveParallelLaneRoot } from "./parallel-lane-record.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-093";
const TASK_STATUS_DIRS = ["open", "assigned", "done"];
const ACCEPTED_STATUSES = new Set(["ready", "completed"]);
const ACCEPTED_JOIN_DECISIONS = new Set(["merge", "stop", "defer", "reopen"]);

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

async function maybeReadPilot(projectRoot, taskId) {
  const pilotPath = path.join(resolveParallelLaneRoot(projectRoot), `${taskId}.json`);
  try {
    return {
      artifact_ref: path.relative(projectRoot, pilotPath),
      payload: await readJson(pilotPath, `parallel lane pilot ${taskId}`)
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function checkRef(projectRoot, checks, errors, taskId, label, ref) {
  pushCheck(
    checks,
    errors,
    `${taskId} ${label} resolves`,
    Boolean(ref) && await pathExists(path.resolve(projectRoot, ref)),
    ref || `missing ${label}`
  );
}

function laneIds(lanes) {
  return new Set((lanes ?? []).map((lane) => lane.lane_id));
}

function joinCoversEveryLane(lanes, joinPacket) {
  const ids = laneIds(lanes);
  return (joinPacket.joined_lane_ids ?? []).every((laneId) => ids.has(laneId)) &&
    ids.size === new Set(joinPacket.joined_lane_ids ?? []).size;
}

export async function parallelLaneAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const auditedTasks = await loadScopedTasks(projectRoot, cutoffTaskId);
  const pilots = [];

  pushCheck(
    checks,
    errors,
    "scoped task discovery",
    auditedTasks.length > 0,
    `${auditedTasks.length} task(s) at or after ${cutoffTaskId} in ${TASK_STATUS_DIRS.join(", ")}`
  );

  for (const task of auditedTasks) {
    const record = await maybeReadPilot(projectRoot, task.task_id);
    pushCheck(
      checks,
      errors,
      `${task.task_id} parallel lane pilot presence`,
      Boolean(record),
      record ? record.artifact_ref : `missing .aof/artifacts/parallel-lanes/${task.task_id}.json`
    );
    if (!record) {
      continue;
    }

    const payload = record.payload;
    try {
      await validateWithBundledSchema(payload, "aof-parallel-lane-pilot.schema.json", "parallel lane pilot");
      pushCheck(checks, errors, `${task.task_id} parallel lane schema`, true, record.artifact_ref);
    } catch (error) {
      pushCheck(checks, errors, `${task.task_id} parallel lane schema`, false, error.message);
      continue;
    }

    pilots.push({
      task_id: task.task_id,
      task_ref: task.artifact_ref,
      pilot_ref: record.artifact_ref,
      pilot_status: payload.pilot_status,
      lane_count: payload.lanes.length,
      join_decision: payload.join_packet.join_decision
    });

    pushCheck(
      checks,
      errors,
      `${task.task_id} pilot links to task`,
      payload.work_item_id === task.task_id,
      `work_item_id=${payload.work_item_id ?? "missing"}, expected=${task.task_id}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} pilot accepted status`,
      ACCEPTED_STATUSES.has(payload.pilot_status),
      `pilot_status=${payload.pilot_status}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} has multiple lanes`,
      payload.lanes.length >= 2,
      `${payload.lanes.length} lane(s)`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} join decision valid`,
      ACCEPTED_JOIN_DECISIONS.has(payload.join_packet.join_decision),
      `join_decision=${payload.join_packet.join_decision}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} join covers lanes`,
      joinCoversEveryLane(payload.lanes, payload.join_packet),
      `joined_lane_ids=${payload.join_packet.joined_lane_ids.join(", ")}`
    );
    pushCheck(
      checks,
      errors,
      `${task.task_id} not-proven boundary present`,
      Boolean(payload.not_proven),
      payload.not_proven || "missing not_proven"
    );

    await checkRef(projectRoot, checks, errors, task.task_id, "work item ref", payload.work_item_ref);
    await checkRef(projectRoot, checks, errors, task.task_id, "parent multi-actor pilot ref", payload.parent_multi_actor_pilot_ref);
    await checkRef(projectRoot, checks, errors, task.task_id, "work execution packet ref", payload.work_execution_packet_ref);
    await checkRef(projectRoot, checks, errors, task.task_id, "Council decision ref", payload.council_decision_ref);
    for (const lane of payload.lanes) {
      for (const ref of [...lane.input_refs, ...lane.output_refs, ...lane.verification_refs, ...(lane.blocker_refs ?? [])]) {
        await checkRef(projectRoot, checks, errors, task.task_id, `lane ${lane.lane_id} ref`, ref);
      }
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "parallel-lane-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    cutoff_task_id: cutoffTaskId,
    audited_status_dirs: TASK_STATUS_DIRS,
    summary: {
      scoped_task_count: auditedTasks.length,
      pilot_count: pilots.length,
      accepted_pilot_count: pilots.filter((pilot) => ACCEPTED_STATUSES.has(pilot.pilot_status)).length,
      missing_pilot_count: auditedTasks.length - pilots.length,
      failing_check_count: errors.length
    },
    tasks: auditedTasks,
    pilots,
    checks,
    errors
  };

  await validatePayload(payload, "aof-parallel-lane-audit.schema.json", "parallel lane audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
