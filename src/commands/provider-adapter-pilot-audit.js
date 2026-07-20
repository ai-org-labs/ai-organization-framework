import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveProviderAdapterRoot } from "./provider-adapter-record.js";
import { resolveProviderAdapterPilotRoot } from "./provider-adapter-pilot-record.js";

const READY_EXECUTION_STATUSES = new Set(["planned", "simulated", "executed"]);
const WRITE_PILOT_MODES = new Set(["approved_write_simulation", "approved_external_write"]);

function normalizeRef(ref) {
  return String(ref ?? "").replaceAll("\\", "/");
}

function hasBoundary(value) {
  return Boolean(String(value ?? "").trim());
}

function pushCheck(checks, errors, name, condition, detail, evidenceRefs = []) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail, evidence_refs: evidenceRefs.filter(Boolean) });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

async function loadRecords(projectRoot, root, schemaFileName, label, expectedArtifactType) {
  const records = [];
  for (const filePath of await listJsonFiles(root)) {
    const payload = await readJson(filePath, `${label} ${path.basename(filePath)}`);
    if (expectedArtifactType && payload.artifact_type !== expectedArtifactType) {
      continue;
    }
    await validateWithBundledSchema(payload, schemaFileName, label);
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

async function checkRef(projectRoot, checks, errors, name, ref, evidenceRefs) {
  pushCheck(checks, errors, name, hasBoundary(ref) && await pathExists(path.resolve(projectRoot, ref)), ref || "missing ref", evidenceRefs);
}

function publicPilot(record) {
  const pilot = record.payload;
  return {
    pilot_id: pilot.pilot_id,
    adapter_ref: pilot.adapter_ref,
    work_item_id: pilot.work_item_id,
    pilot_mode: pilot.pilot_mode,
    approval_status: pilot.approval_status,
    execution_status: pilot.execution_status,
    artifact_ref: record.artifact_ref
  };
}

function actionListHasSafeShape(actions) {
  return Array.isArray(actions) && actions.every((action) => hasBoundary(action));
}

export async function providerAdapterPilotAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const pilots = await loadRecords(projectRoot, resolveProviderAdapterPilotRoot(projectRoot), "aof-provider-adapter-pilot-record.schema.json", "provider adapter pilot record", "provider-adapter-pilot-record");
  const adapters = await loadRecords(projectRoot, resolveProviderAdapterRoot(projectRoot), "aof-provider-adapter-record.schema.json", "provider adapter record", "provider-adapter-record");
  const adapterByRef = new Map(adapters.map((record) => [record.artifact_ref, record.payload]));

  pushCheck(checks, errors, "provider adapter pilot presence", pilots.length > 0, `${pilots.length} pilot(s) found`, pilots.map((record) => record.artifact_ref));

  for (const record of pilots) {
    const pilot = record.payload;
    const refs = [record.artifact_ref, pilot.adapter_ref, pilot.work_item_ref, pilot.session_ref, pilot.approval_ref, ...pilot.provenance_refs, ...pilot.verification_refs].filter(Boolean);
    await checkRef(projectRoot, checks, errors, `${pilot.pilot_id} adapter ref resolves`, pilot.adapter_ref, refs);
    await checkRef(projectRoot, checks, errors, `${pilot.pilot_id} work item ref resolves`, pilot.work_item_ref, refs);
    await checkRef(projectRoot, checks, errors, `${pilot.pilot_id} session ref resolves`, pilot.session_ref, refs);
    for (const ref of pilot.provenance_refs) {
      await checkRef(projectRoot, checks, errors, `${pilot.pilot_id} provenance ref resolves`, ref, refs);
    }
    for (const ref of pilot.verification_refs) {
      await checkRef(projectRoot, checks, errors, `${pilot.pilot_id} verification ref resolves`, ref, refs);
    }
    const adapter = adapterByRef.get(normalizeRef(pilot.adapter_ref));
    pushCheck(checks, errors, `${pilot.pilot_id} adapter is audited`, Boolean(adapter), pilot.adapter_ref || "missing adapter_ref", refs);
    pushCheck(checks, errors, `${pilot.pilot_id} expected external effect`, hasBoundary(pilot.expected_external_effect), pilot.expected_external_effect || "missing expected_external_effect", refs);
    pushCheck(checks, errors, `${pilot.pilot_id} allowed actions`, actionListHasSafeShape(pilot.allowed_actions), pilot.allowed_actions.join(", "), refs);
    pushCheck(checks, errors, `${pilot.pilot_id} denied actions`, actionListHasSafeShape(pilot.denied_actions), pilot.denied_actions.join(", "), refs);
    pushCheck(checks, errors, `${pilot.pilot_id} redaction boundary`, hasBoundary(pilot.redaction_boundary), pilot.redaction_boundary || "missing redaction_boundary", refs);
    pushCheck(checks, errors, `${pilot.pilot_id} rollback plan`, hasBoundary(pilot.rollback_plan), pilot.rollback_plan || "missing rollback_plan", refs);
    pushCheck(checks, errors, `${pilot.pilot_id} stop conditions`, pilot.stop_conditions.length > 0, pilot.stop_conditions.join(", "), refs);
    pushCheck(checks, errors, `${pilot.pilot_id} not-proven boundary`, hasBoundary(pilot.not_proven), pilot.not_proven || "missing not_proven", refs);
    pushCheck(checks, errors, `${pilot.pilot_id} runtime provenance`, hasBoundary(pilot.source_task_id) && hasBoundary(pilot.source_parent_session_id), `source_task_id=${pilot.source_task_id || "missing"}, source_parent_session_id=${pilot.source_parent_session_id || "missing"}`, refs);
    pushCheck(checks, errors, `${pilot.pilot_id} execution status`, READY_EXECUTION_STATUSES.has(pilot.execution_status), `execution_status=${pilot.execution_status}`, refs);

    const isWritePilot = WRITE_PILOT_MODES.has(pilot.pilot_mode);
    pushCheck(
      checks,
      errors,
      `${pilot.pilot_id} write pilot approval`,
      !isWritePilot || (pilot.approval_status === "approved" && hasBoundary(pilot.approval_ref) && await pathExists(path.resolve(projectRoot, pilot.approval_ref))),
      isWritePilot ? `approval_status=${pilot.approval_status}, approval_ref=${pilot.approval_ref || "missing"}` : "non-write pilot",
      refs
    );
    pushCheck(
      checks,
      errors,
      `${pilot.pilot_id} production write remains denied`,
      pilot.denied_actions.some((action) => /production|billing|secret|deploy|irreversible|external write/i.test(action)),
      pilot.denied_actions.join(", "),
      refs
    );
    if (pilot.pilot_mode === "approved_external_write") {
      pushCheck(checks, errors, `${pilot.pilot_id} external write not executed by default`, pilot.execution_status !== "executed", `execution_status=${pilot.execution_status}`, refs);
    }
  }

  const publicPilots = pilots.map(publicPilot);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "provider-adapter-pilot-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      pilot_count: publicPilots.length,
      ready_pilot_count: publicPilots.filter((pilot) => READY_EXECUTION_STATUSES.has(pilot.execution_status)).length,
      blocked_pilot_count: publicPilots.filter((pilot) => pilot.execution_status === "blocked").length,
      external_write_pilot_count: publicPilots.filter((pilot) => WRITE_PILOT_MODES.has(pilot.pilot_mode)).length,
      missing_boundary_count: checks.filter((check) => check.status === "fail" && /boundary|ref resolves|approval|provenance|presence|rollback|redaction|stop/i.test(check.name)).length,
      failing_check_count: errors.length
    },
    pilots: publicPilots,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-provider-adapter-pilot-audit.schema.json", "provider adapter pilot audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
