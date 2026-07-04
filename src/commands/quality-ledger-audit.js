import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveQualityLedgerRoot } from "./quality-ledger-record.js";

const ESCALATION_REQUIRED_EVENT_TYPES = new Set([
  "claim_contradicted",
  "runtime_evidence_missing",
  "assumption_corrected",
  "governance_escalation"
]);

function pushCheck(checks, errors, name, condition, detail) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

async function loadEvents(projectRoot) {
  const eventRoot = resolveQualityLedgerRoot(projectRoot);
  const events = [];
  for (const filePath of await listJsonFiles(eventRoot)) {
    const payload = await readJson(filePath, `quality ledger event ${path.basename(filePath)}`);
    events.push({
      artifact_ref: path.relative(projectRoot, filePath),
      payload
    });
  }
  return events.sort((left, right) => left.payload.event_id.localeCompare(right.payload.event_id));
}

export async function qualityLedgerAuditCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const loadedEvents = await loadEvents(projectRoot);

  pushCheck(
    checks,
    errors,
    "quality ledger event discovery",
    loadedEvents.length > 0,
    `${loadedEvents.length} event(s) found`
  );

  const events = [];
  for (const entry of loadedEvents) {
    const event = entry.payload;
    try {
      await validateWithBundledSchema(event, "aof-quality-ledger-event.schema.json", "quality ledger event");
      pushCheck(checks, errors, `${event.event_id} schema`, true, entry.artifact_ref);
    } catch (error) {
      pushCheck(checks, errors, `${event.event_id ?? entry.artifact_ref} schema`, false, error.message);
      continue;
    }

    pushCheck(
      checks,
      errors,
      `${event.event_id} does not claim semantic truth by default`,
      event.semantic_truth_claimed === false,
      `semantic_truth_claimed=${event.semantic_truth_claimed}`
    );
    pushCheck(
      checks,
      errors,
      `${event.event_id} evidence refs present`,
      event.evidence_refs.length > 0 || event.event_type === "runtime_evidence_missing",
      `${event.evidence_refs.length} evidence ref(s), event_type=${event.event_type}`
    );
    for (const ref of event.evidence_refs) {
      pushCheck(
        checks,
        errors,
        `${event.event_id} evidence ref resolves`,
        await pathExists(path.resolve(projectRoot, ref)),
        ref
      );
    }
    pushCheck(
      checks,
      errors,
      `${event.event_id} QIF refs present`,
      event.qif_refs.length > 0,
      `${event.qif_refs.length} QIF ref(s)`
    );
    for (const ref of event.qif_refs) {
      pushCheck(
        checks,
        errors,
        `${event.event_id} QIF ref resolves`,
        await pathExists(path.resolve(projectRoot, ref)),
        ref
      );
    }
    if (ESCALATION_REQUIRED_EVENT_TYPES.has(event.event_type)) {
      pushCheck(
        checks,
        errors,
        `${event.event_id} escalates non-green quality signal`,
        event.governance_action !== "none",
        `event_type=${event.event_type}, governance_action=${event.governance_action}`
      );
    }
    if (event.event_type === "claim_contradicted" || event.event_type === "assumption_corrected") {
      pushCheck(
        checks,
        errors,
        `${event.event_id} records state transition`,
        Boolean(event.prior_state && event.new_state),
        `prior_state=${event.prior_state ?? ""}, new_state=${event.new_state ?? ""}`
      );
    }

    events.push({
      event_id: event.event_id,
      event_type: event.event_type,
      quality_intent_ref: event.quality_intent_ref,
      work_item_ref: event.work_item_ref,
      artifact_ref: entry.artifact_ref,
      governance_action: event.governance_action
    });
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "quality-ledger-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    ledger_root_ref: ".aof/quality/ledger/events",
    summary: {
      event_count: loadedEvents.length,
      blocking_event_count: loadedEvents.filter((entry) => entry.payload.governance_action !== "none").length,
      semantic_truth_claim_count: loadedEvents.filter((entry) => entry.payload.semantic_truth_claimed === true).length,
      operator_validated_count: loadedEvents.filter((entry) => entry.payload.operator_validated === true).length,
      failing_check_count: errors.length
    },
    events,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-quality-ledger-audit.schema.json", "quality ledger audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
