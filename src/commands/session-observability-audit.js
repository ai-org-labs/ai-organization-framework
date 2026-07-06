import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { loadBundledSchema, validateAgainstSchema, validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveAgentSessionRoot } from "./agent-session-record.js";

const REQUIRED_EVENT_TYPES = [
  "prompt",
  "response",
  "tool_call",
  "artifact_write",
  "verification_result",
  "risk_candidate",
  "decision_candidate",
  "stop_condition"
];

function pushCheck(checks, errors, name, condition, detail) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

async function validatePayload(payload, schemaFileName, label) {
  const schema = await loadBundledSchema(schemaFileName);
  validateAgainstSchema(payload, schema, label);
}

async function loadStreams(projectRoot) {
  const streams = [];
  for (const filePath of await listJsonFiles(resolveAgentSessionRoot(projectRoot))) {
    const payload = await readJson(filePath, `agent session ${path.basename(filePath)}`);
    streams.push({
      artifact_ref: path.relative(projectRoot, filePath),
      payload
    });
  }
  return streams.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function refResolves(projectRoot, ref) {
  return Boolean(ref) && await pathExists(path.resolve(projectRoot, ref));
}

export async function sessionObservabilityAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const streamRecords = [];
  const streams = await loadStreams(projectRoot);

  pushCheck(checks, errors, "agent session stream presence", streams.length > 0, `${streams.length} stream(s)`);

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
    const linkRefs = [
      ...payload.links.task_refs,
      ...payload.links.requirement_refs,
      ...payload.links.test_evidence_refs,
      ...payload.links.artifact_refs,
      ...payload.release_ready_evidence.evidence_refs
    ];

    streamRecords.push({
      session_id: payload.session_id,
      stream_ref: stream.artifact_ref,
      source_task_id: payload.source_task_id,
      event_count: payload.events.length,
      release_verdict: payload.release_ready_evidence.verdict
    });

    pushCheck(
      checks,
      errors,
      `${payload.session_id} task linkage`,
      hasItems(payload.links.task_refs),
      `${payload.links.task_refs.length} task ref(s)`
    );
    pushCheck(
      checks,
      errors,
      `${payload.session_id} requirement linkage`,
      hasItems(payload.links.requirement_refs),
      `${payload.links.requirement_refs.length} requirement ref(s)`
    );
    pushCheck(
      checks,
      errors,
      `${payload.session_id} test evidence linkage`,
      hasItems(payload.links.test_evidence_refs),
      `${payload.links.test_evidence_refs.length} test evidence ref(s)`
    );
    pushCheck(
      checks,
      errors,
      `${payload.session_id} risk candidates`,
      hasItems(payload.risk_candidates) && eventTypes.has("risk_candidate"),
      `${payload.risk_candidates.length} risk candidate(s)`
    );
    pushCheck(
      checks,
      errors,
      `${payload.session_id} decision candidates`,
      hasItems(payload.decision_candidates) && eventTypes.has("decision_candidate"),
      `${payload.decision_candidates.length} decision candidate(s)`
    );
    pushCheck(
      checks,
      errors,
      `${payload.session_id} release-ready evidence`,
      hasItems(payload.release_ready_evidence.evidence_refs) && payload.release_ready_evidence.verdict !== "not_ready",
      `${payload.release_ready_evidence.verdict}, ${payload.release_ready_evidence.evidence_refs.length} evidence ref(s)`
    );

    for (const eventType of REQUIRED_EVENT_TYPES) {
      pushCheck(
        checks,
        errors,
        `${payload.session_id} event type ${eventType}`,
        eventTypes.has(eventType),
        eventTypes.has(eventType) ? "present" : "missing"
      );
    }

    for (const event of payload.events.filter((item) => item.event_type === "tool_call")) {
      pushCheck(
        checks,
        errors,
        `${payload.session_id} tool call safety metadata`,
        Boolean(event.tool_name && event.safety_level && event.approval_policy),
        `tool=${event.tool_name || "missing"}, safety=${event.safety_level || "missing"}, approval=${event.approval_policy || "missing"}`
      );
    }

    for (const ref of linkRefs) {
      pushCheck(checks, errors, `${payload.session_id} linked ref resolves`, await refResolves(projectRoot, ref), ref);
    }
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "session-observability-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      stream_count: streams.length,
      runtime_ready_stream_count: streamRecords.filter((record) => record.release_verdict !== "not_ready").length,
      failing_check_count: errors.length
    },
    streams: streamRecords,
    checks,
    errors
  };

  await validatePayload(payload, "aof-session-observability-audit.schema.json", "session observability audit");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
