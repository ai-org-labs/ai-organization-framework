import fs from "node:fs/promises";
import path from "node:path";

import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";
import { listJsonFiles, pathExists, readJson } from "./operator-surface-helpers.js";
import { resolveCapabilityReleaseDeltaRoot } from "./capability-release-delta-record.js";
import { loadActiveReleaseManifest } from "./release-state-helpers.js";

const REQUIRED_RELEASE_NOTE_SECTIONS = [
  "## What You Can Do Now",
  "## Capability Delta",
  "## Capability Matrix",
  "## Value Evidence"
];

function normalizeRef(ref) {
  return String(ref ?? "").replaceAll("\\", "/");
}

function hasText(value) {
  return Boolean(String(value ?? "").trim());
}

function pushCheck(checks, errors, name, condition, detail, evidenceRefs = []) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail, evidence_refs: evidenceRefs.filter(Boolean) });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

async function maybeReadText(projectRoot, ref) {
  if (!hasText(ref)) {
    return "";
  }
  try {
    return await fs.readFile(path.resolve(projectRoot, ref), "utf8");
  } catch {
    return "";
  }
}

async function refExists(projectRoot, ref) {
  return hasText(ref) && await pathExists(path.resolve(projectRoot, ref));
}

async function loadCapabilityRegister(projectRoot) {
  const registerRef = ".aof/product-capabilities.json";
  const registerPath = path.join(projectRoot, registerRef);
  const payload = await readJson(registerPath, "product capability register");
  await validateWithBundledSchema(payload, "aof-product-capability-register.schema.json", "product capability register");
  return { artifact_ref: registerRef, payload };
}

async function loadDeltas(projectRoot) {
  const records = [];
  for (const filePath of await listJsonFiles(resolveCapabilityReleaseDeltaRoot(projectRoot))) {
    const payload = await readJson(filePath, `capability release delta ${path.basename(filePath)}`);
    if (payload.artifact_type !== "capability-release-delta") {
      continue;
    }
    await validateWithBundledSchema(payload, "aof-capability-release-delta.schema.json", "capability release delta");
    records.push({ artifact_ref: normalizeRef(path.relative(projectRoot, filePath)), payload });
  }
  return records.sort((left, right) => left.artifact_ref.localeCompare(right.artifact_ref));
}

function publicCapability(capability) {
  return {
    capability_id: capability.capability_id,
    name: capability.name,
    user_value: capability.user_value,
    first_version: capability.first_version,
    status: capability.status
  };
}

function publicDelta(record) {
  const payload = record.payload;
  return {
    delta_id: payload.delta_id,
    release_version: payload.release_version,
    one_minute_value_explanation: payload.one_minute_value_explanation,
    thirty_second_version_delta: payload.thirty_second_version_delta,
    new_capability_ids: payload.new_capability_ids,
    updated_capability_ids: payload.updated_capability_ids,
    removed_capability_ids: payload.removed_capability_ids,
    artifact_ref: record.artifact_ref
  };
}

export async function capabilityFirstReleaseAuditCommand(options = {}) {
  const projectRoot = path.resolve(options.project || ".");
  const checks = [];
  const errors = [];
  const manifestRecord = await loadActiveReleaseManifest(projectRoot);
  const manifest = manifestRecord?.manifest ?? null;
  const register = await loadCapabilityRegister(projectRoot);
  const deltas = await loadDeltas(projectRoot);
  const capabilities = register.payload.capabilities ?? [];
  const capabilityIds = new Set(capabilities.map((entry) => entry.capability_id));
  const activeDeltas = manifest
    ? deltas.filter((record) => record.payload.release_version === manifest.release_version)
    : [];
  const activeCapabilityChangeCount = activeDeltas.reduce(
    (total, record) => total + record.payload.new_capability_ids.length + record.payload.updated_capability_ids.length + record.payload.removed_capability_ids.length,
    0
  );

  pushCheck(checks, errors, "active release manifest presence", Boolean(manifest), manifest?.release_version || "missing active release");
  pushCheck(checks, errors, "product capability register presence", capabilities.length > 0, `${capabilities.length} capability row(s)`, [register.artifact_ref]);

  for (const capability of capabilities) {
    const refs = [register.artifact_ref, ...(capability.evidence_refs ?? [])];
    pushCheck(checks, errors, `${capability.capability_id} description`, hasText(capability.description), capability.description || "missing description", refs);
    pushCheck(checks, errors, `${capability.capability_id} user value`, hasText(capability.user_value), capability.user_value || "missing user_value", refs);
    pushCheck(checks, errors, `${capability.capability_id} first version`, hasText(capability.first_version), capability.first_version || "missing first_version", refs);
    for (const evidenceRef of capability.evidence_refs ?? []) {
      pushCheck(checks, errors, `${capability.capability_id} evidence ref resolves`, await refExists(projectRoot, evidenceRef), evidenceRef, refs);
    }
  }

  pushCheck(checks, errors, "active release capability delta presence", activeDeltas.length > 0, `${activeDeltas.length} delta record(s)`, activeDeltas.map((record) => record.artifact_ref));
  pushCheck(checks, errors, "active release capability change", activeCapabilityChangeCount > 0, `${activeCapabilityChangeCount} changed capability reference(s)`, activeDeltas.map((record) => record.artifact_ref));

  for (const record of activeDeltas) {
    const payload = record.payload;
    const refs = [record.artifact_ref, payload.release_ref, payload.work_item_ref, ...payload.value_evidence_refs];
    pushCheck(checks, errors, `${payload.delta_id} release ref resolves`, await refExists(projectRoot, payload.release_ref), payload.release_ref, refs);
    pushCheck(checks, errors, `${payload.delta_id} work item ref resolves`, await refExists(projectRoot, payload.work_item_ref), payload.work_item_ref, refs);
    for (const capabilityId of [...payload.new_capability_ids, ...payload.updated_capability_ids, ...payload.removed_capability_ids]) {
      pushCheck(checks, errors, `${payload.delta_id} capability ref ${capabilityId}`, capabilityIds.has(capabilityId), capabilityId, refs);
    }
    for (const evidenceRef of payload.value_evidence_refs) {
      pushCheck(checks, errors, `${payload.delta_id} value evidence ref resolves`, await refExists(projectRoot, evidenceRef), evidenceRef, refs);
    }
    pushCheck(checks, errors, `${payload.delta_id} one minute value explanation`, hasText(payload.one_minute_value_explanation), payload.one_minute_value_explanation || "missing", refs);
    pushCheck(checks, errors, `${payload.delta_id} thirty second version delta`, hasText(payload.thirty_second_version_delta), payload.thirty_second_version_delta || "missing", refs);
    pushCheck(checks, errors, `${payload.delta_id} product review trigger`, hasText(payload.product_review_trigger), payload.product_review_trigger || "missing", refs);
    pushCheck(checks, errors, `${payload.delta_id} not-proven boundary`, hasText(payload.not_proven), payload.not_proven || "missing", refs);
  }

  const releaseNotesText = await maybeReadText(projectRoot, manifest?.release_notes_ref);
  for (const section of REQUIRED_RELEASE_NOTE_SECTIONS) {
    pushCheck(
      checks,
      errors,
      `release notes ${section}`,
      releaseNotesText.includes(section),
      manifest?.release_notes_ref || "missing release notes",
      [manifest?.release_notes_ref]
    );
  }
  pushCheck(checks, errors, "README capability matrix link", (await maybeReadText(projectRoot, "README.md")).includes("Capability Matrix"), "README.md must expose Capability Matrix", ["README.md"]);

  const publicCapabilities = capabilities.map(publicCapability);
  const publicDeltas = activeDeltas.map(publicDelta);
  const payload = {
    ok: errors.length === 0,
    artifact_type: "capability-first-release-audit",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    summary: {
      capability_count: publicCapabilities.length,
      delta_count: publicDeltas.length,
      new_capability_count: activeDeltas.reduce((total, record) => total + record.payload.new_capability_ids.length, 0),
      updated_capability_count: activeDeltas.reduce((total, record) => total + record.payload.updated_capability_ids.length, 0),
      removed_capability_count: activeDeltas.reduce((total, record) => total + record.payload.removed_capability_ids.length, 0),
      failing_check_count: errors.length
    },
    capabilities: publicCapabilities,
    deltas: publicDeltas,
    checks,
    errors
  };

  await validateWithBundledSchema(payload, "aof-capability-first-release-audit.schema.json", "capability-first release audit");
  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, payload)
    : null;

  return { ok: payload.ok, artifactPath, summary: payload };
}
