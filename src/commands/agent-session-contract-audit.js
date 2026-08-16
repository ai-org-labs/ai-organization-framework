import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema, validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveAgentSessionRoot } from "./agent-session-record.js";

const DEFAULT_CUTOFF_TASK_ID = "TASK-135";
const REQUIRED_EVENT_TYPES = [
  "prompt",
  "response",
  "tool_call",
  "verification_result",
  "risk_candidate",
  "decision_candidate",
  "stop_condition"
];
const LOW_RISK_APPROVALS = new Set(["preapproved", "approved_run_contract"]);
const PROJECT_WRITE_APPROVALS = new Set(["approved_run_contract", "human_approved", "explicit_human_approval"]);
const HIGH_RISK_APPROVALS = new Set(["human_approved", "explicit_human_approval"]);

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
  checks.push({ name, status, detail: String(detail ?? "") });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function isExternalRef(ref) {
  return /^https?:\/\//i.test(String(ref ?? ""));
}

async function refResolves(projectRoot, ref) {
  return Boolean(ref) && (isExternalRef(ref) || await pathExists(path.resolve(projectRoot, ref)));
}

async function validatePayload(payload, schemaFileName, label) {
  const schema = await loadBundledSchema(schemaFileName);
  validateAgainstSchema(payload, schema, label);
}

async function loadStreams(projectRoot, cutoffTaskId) {
  const streams = [];
  for (const filePath of await listJsonFiles(resolveAgentSessionRoot(projectRoot))) {
    const payload = await readJson(filePath, `agent session ${path.basename(filePath)}`);
    if (isAtOrAfterCutoff(payload.source_task_id, cutoffTaskId)) {
      streams.push({
        artifact_ref: path.relative(projectRoot, filePath),
        payload
      });
    }
  }
  return streams.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

function toolCallIsGoverned(event) {
  if (!event.tool_name || !event.safety_level || !event.approval_policy) {
    return false;
  }
  if (["safe_read", "safe_local_write"].includes(event.safety_level)) {
    return LOW_RISK_APPROVALS.has(event.approval_policy);
  }
  if (event.safety_level === "project_write") {
    return PROJECT_WRITE_APPROVALS.has(event.approval_policy);
  }
  if (["external_write", "dangerous"].includes(event.safety_level)) {
    return HIGH_RISK_APPROVALS.has(event.approval_policy);
  }
  return false;
}

export async function agentSessionContractAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const cutoffTaskId = options.cutoffTaskId || DEFAULT_CUTOFF_TASK_ID;
  const checks = [];
  const errors = [];
  const sessions = [];
  const streams = await loadStreams(projectRoot, cutoffTaskId);

  pushCheck(checks, errors, "scoped agent session presence", streams.length > 0, `${streams.length} session(s) at or after ${cutoffTaskId}`);

  let toolCallCount = 0;
  let governedToolCallCount = 0;

  for (const stream of streams) {
    const payload = stream.payload;
    try {
      await validateWithBundledSchema(payload, "aof-agent-session-record.schema.json", "agent session record");
      pushCheck(checks, errors, `${payload.session_id} schema`, true, stream.artifact_ref);
    } catch (error) {
      pushCheck(checks, errors, `${payload.session_id || stream.artifact_ref} schema`, false, error.message);
      continue;
    }

    const eventTypes = new Set(payload.events.map((event) => event.event_type));
    const toolCalls = payload.events.filter((event) => event.event_type === "tool_call");
    toolCallCount += toolCalls.length;
    governedToolCallCount += toolCalls.filter(toolCallIsGoverned).length;
    sessions.push({
      session_id: payload.session_id,
      session_ref: stream.artifact_ref,
      source_task_id: payload.source_task_id,
      event_count: payload.events.length,
      tool_call_count: toolCalls.length,
      release_verdict: payload.release_ready_evidence.verdict
    });

    for (const eventType of REQUIRED_EVENT_TYPES) {
      pushCheck(checks, errors, `${payload.session_id} event type ${eventType}`, eventTypes.has(eventType), eventTypes.has(eventType) ? "present" : "missing");
    }

    pushCheck(checks, errors, `${payload.session_id} task linkage`, hasItems(payload.links.task_refs), `${payload.links.task_refs.length} task ref(s)`);
    pushCheck(checks, errors, `${payload.session_id} requirement linkage`, hasItems(payload.links.requirement_refs), `${payload.links.requirement_refs.length} requirement ref(s)`);
    pushCheck(checks, errors, `${payload.session_id} test evidence linkage`, hasItems(payload.links.test_evidence_refs), `${payload.links.test_evidence_refs.length} test evidence ref(s)`);
    pushCheck(checks, errors, `${payload.session_id} release-ready evidence`, hasItems(payload.release_ready_evidence.evidence_refs) && payload.release_ready_evidence.verdict !== "not_ready", `${payload.release_ready_evidence.verdict}, ${payload.release_ready_evidence.evidence_refs.length} evidence ref(s)`);
    pushCheck(checks, errors, `${payload.session_id} risk candidates`, hasItems(payload.risk_candidates) && eventTypes.has("risk_candidate"), `${payload.risk_candidates.length} risk candidate(s)`);
    pushCheck(checks, errors, `${payload.session_id} decision candidates`, hasItems(payload.decision_candidates) && eventTypes.has("decision_candidate"), `${payload.decision_candidates.length} decision candidate(s)`);

    for (const event of toolCalls) {
      pushCheck(checks, errors, `${payload.session_id} governed tool call ${event.event_id}`, toolCallIsGoverned(event), `tool=${event.tool_name || "missing"}, safety=${event.safety_level || "missing"}, approval=${event.approval_policy || "missing"}`);
    }

    const refs = [
      ...payload.links.task_refs,
      ...payload.links.requirement_refs,
      ...payload.links.test_evidence_refs,
      ...payload.links.artifact_refs,
      ...payload.release_ready_evidence.evidence_refs,
      ...payload.events.flatMap((event) => event.artifact_refs ?? [])
    ];
    for (const ref of refs) {
      pushCheck(checks, errors, `${payload.session_id} ref resolves`, await refResolves(projectRoot, ref), ref);
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "agent-session-contract-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      scoped_task_count: streams.length,
      session_count: streams.length,
      runtime_ready_session_count: sessions.filter((session) => session.release_verdict !== "not_ready").length,
      tool_call_count: toolCallCount,
      governed_tool_call_count: governedToolCallCount,
      failing_check_count: errors.length
    },
    sessions,
    checks,
    errors
  };

  await validatePayload(payload, "aof-agent-session-contract-audit.schema.json", "agent session contract audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
