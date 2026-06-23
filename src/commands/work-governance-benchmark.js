import fs from "node:fs/promises";
import path from "node:path";

import { resolveAofRoot } from "../runtime/project-paths.js";
import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

const SCHEMA_BY_TYPE = {
  "work-item-goal": "aof-work-item-goal.schema.json",
  "actor-composition": "aof-actor-composition.schema.json",
  "council-ready-output": "aof-council-ready-output.schema.json",
  "go-no-go-visualization": "aof-go-no-go-visualization.schema.json",
  "operational-map-change-log": "aof-operational-map-change-log.schema.json",
  "context-pack": "aof-context-pack.schema.json",
  "external-ref": "aof-external-ref.schema.json"
};

async function listJsonFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...await listJsonFiles(entryPath));
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(entryPath);
      }
    }
    return files;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function loadJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function toRef(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).replaceAll("\\", "/");
}

function pass(detail, evidence = []) {
  return { status: "pass", detail, evidence };
}

function fail(detail, evidence = []) {
  return { status: "fail", detail, evidence };
}

function groupBy(entries, keyFn) {
  const map = new Map();
  for (const entry of entries) {
    const key = keyFn(entry);
    if (!key) {
      continue;
    }
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(entry);
  }
  return map;
}

function hasTextArray(value) {
  return Array.isArray(value) && value.some((item) => typeof item === "string" && item.trim());
}

function hasEntry(map, key) {
  return Array.isArray(map.get(key)) && map.get(key).length > 0;
}

export async function workGovernanceBenchmarkCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const root = path.join(resolveAofRoot(projectRoot), "artifacts", "work-governance");
  const filePaths = await listJsonFiles(root);

  const entries = [];
  for (const filePath of filePaths) {
    const payload = await loadJson(filePath);
    const schemaName = SCHEMA_BY_TYPE[payload.artifact_type];
    if (!schemaName) {
      continue;
    }
    await validateWithBundledSchema(payload, schemaName, payload.artifact_type);
    entries.push({
      ref: toRef(projectRoot, filePath),
      path: filePath,
      payload
    });
  }

  const byType = groupBy(entries, (entry) => entry.payload.artifact_type);
  const goals = byType.get("work-item-goal") ?? [];
  const actorCompositionsByWorkItem = groupBy(byType.get("actor-composition") ?? [], (entry) => entry.payload.work_item_id);
  const councilOutputsByWorkItem = groupBy(byType.get("council-ready-output") ?? [], (entry) => entry.payload.work_item_id);
  const goNoGoByWorkItem = groupBy(byType.get("go-no-go-visualization") ?? [], (entry) => entry.payload.work_item_id);
  const operationalMapsByWorkItem = groupBy(byType.get("operational-map-change-log") ?? [], (entry) => entry.payload.work_item_ref);
  const contextPacks = byType.get("context-pack") ?? [];
  const externalRefsByRef = new Map((byType.get("external-ref") ?? []).map((entry) => [entry.ref, entry]));

  const goalFailures = goals
    .filter(({ payload }) =>
      !hasTextArray(payload.expected_output) ||
      !hasTextArray(payload.success_criteria) ||
      !hasTextArray(payload.required_skills) ||
      !hasTextArray(payload.required_actor_roles) ||
      !hasTextArray(payload.go_no_go_criteria?.go) ||
      !hasTextArray(payload.go_no_go_criteria?.no_go)
    )
    .map((entry) => entry.ref);

  const actorFailures = [];
  for (const goal of goals) {
    const compositions = actorCompositionsByWorkItem.get(goal.payload.work_item_id) ?? [];
    if (compositions.length === 0) {
      actorFailures.push(`${goal.payload.work_item_id}: missing actor composition`);
      continue;
    }
    for (const composition of compositions) {
      const selectedRefs = new Set(composition.payload.selected_actors.map((actor) => actor.actor_ref));
      const boundaryRefs = new Set(composition.payload.authority_boundaries.map((boundary) => boundary.actor_ref));
      const missingBoundary = [...selectedRefs].filter((actorRef) => !boundaryRefs.has(actorRef));
      const unsafeExecutors = composition.payload.authority_boundaries
        .filter((boundary) => ["execute", "review"].includes(boundary.authority_level) && !hasTextArray(boundary.must_not_decide))
        .map((boundary) => boundary.actor_ref);
      if (missingBoundary.length > 0 || unsafeExecutors.length > 0) {
        actorFailures.push(`${composition.ref}: missing_boundary=${missingBoundary.join(",") || "-"} unsafe_executor=${unsafeExecutors.join(",") || "-"}`);
      }
    }
  }

  const councilFailures = goals
    .filter(({ payload }) =>
      ["required", "human-approval-required"].includes(payload.council_review_need) &&
      !hasEntry(councilOutputsByWorkItem, payload.work_item_id)
    )
    .map((entry) => `${entry.payload.work_item_id}: missing council-ready output`);

  for (const output of byType.get("council-ready-output") ?? []) {
    if (!hasTextArray(output.payload.evidence_refs) || !output.payload.go_no_go_recommendation) {
      councilFailures.push(`${output.ref}: incomplete council-ready output`);
    }
  }

  const goNoGoFailures = [];
  for (const goal of goals) {
    const visualizations = goNoGoByWorkItem.get(goal.payload.work_item_id) ?? [];
    if (visualizations.length === 0) {
      goNoGoFailures.push(`${goal.payload.work_item_id}: missing go/no-go visualization`);
      continue;
    }
    for (const visualization of visualizations) {
      if (!hasTextArray(visualization.payload.decision_basis) || !visualization.payload.viewer_summary) {
        goNoGoFailures.push(`${visualization.ref}: incomplete decision basis`);
      }
    }
  }

  const operationalMapFailures = goals
    .filter(({ payload }) => !hasEntry(operationalMapsByWorkItem, payload.work_item_id))
    .map((entry) => `${entry.payload.work_item_id}: missing operational map change log`);

  for (const mapEntry of byType.get("operational-map-change-log") ?? []) {
    const invalidUpdates = mapEntry.payload.operational_map_updates.filter((update) =>
      update.change_type !== "no_change" && !update.artifact_ref
    );
    if (invalidUpdates.length > 0 || !mapEntry.payload.human_readable_summary) {
      operationalMapFailures.push(`${mapEntry.ref}: incomplete map update provenance`);
    }
  }

  const contextPackFailures = contextPacks
    .filter(({ payload }) =>
      payload.raw_artifact_bodies_included !== false ||
      !hasTextArray(payload.evidence_refs) ||
      !hasTextArray(payload.operational_map_refs) ||
      !payload.next_recommended_action ||
      !payload.priority_summary
    )
    .map((entry) => entry.ref);

  const externalRefFailures = [];
  for (const goal of goals) {
    for (const ref of goal.payload.external_refs ?? []) {
      if (!externalRefsByRef.has(ref)) {
        externalRefFailures.push(`${goal.payload.work_item_id}: missing external ref ${ref}`);
      }
    }
  }
  for (const contextPack of contextPacks) {
    for (const ref of contextPack.payload.external_refs ?? []) {
      if (!externalRefsByRef.has(ref)) {
        externalRefFailures.push(`${contextPack.ref}: missing external ref ${ref}`);
      }
    }
  }
  for (const externalRef of byType.get("external-ref") ?? []) {
    if (!externalRef.payload.source_of_truth || !externalRef.payload.sync_policy) {
      externalRefFailures.push(`${externalRef.ref}: missing source-of-truth or sync policy`);
    }
  }

  const summary = {
    artifact_type: "work-governance-benchmark",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    work_items_evaluated: goals.length,
    artifacts_evaluated: entries.length,
    benchmarks: {
      "WG-001": goals.length > 0 && goalFailures.length === 0
        ? pass("Work item goals define objective, consumer, success, skills, actors, and Go/No-Go criteria.", goals.map((entry) => entry.ref))
        : fail("Some work item goals are incomplete or no goals exist.", goalFailures),
      "WG-002": goals.length > 0 && actorFailures.length === 0
        ? pass("Actor compositions exist and authority boundaries cover selected actors.", goals.map((entry) => entry.payload.work_item_id))
        : fail("Actor composition or authority boundary coverage is incomplete.", actorFailures),
      "WG-003": councilFailures.length === 0 && goals.length > 0
        ? pass("Council-required work items have council-ready output with evidence and decisions.", goals.map((entry) => entry.payload.work_item_id))
        : fail("Council-ready output is missing or incomplete.", councilFailures),
      "WG-004": goNoGoFailures.length === 0 && goals.length > 0
        ? pass("Go/No-Go visualizations exist with decision basis and viewer summary.", goals.map((entry) => entry.payload.work_item_id))
        : fail("Go/No-Go visualization coverage is incomplete.", goNoGoFailures),
      "WG-005": operationalMapFailures.length === 0 && goals.length > 0
        ? pass("Operational map changes are recorded with provenance and human-readable summaries.", goals.map((entry) => entry.payload.work_item_id))
        : fail("Operational map coverage is incomplete.", operationalMapFailures),
      "WG-006": contextPacks.length > 0 && contextPackFailures.length === 0
        ? pass("Context packs summarize state through refs without embedding raw artifact bodies.", contextPacks.map((entry) => entry.ref))
        : fail("Context pack compression or linkage is incomplete.", contextPackFailures),
      "WG-007": externalRefFailures.length === 0
        ? pass("External refs are declared with source-of-truth and sync policy, and referenced refs resolve.", [...externalRefsByRef.keys()])
        : fail("External source-of-truth or sync-policy linkage is incomplete.", externalRefFailures)
    }
  };

  await validateWithBundledSchema(summary, "aof-work-governance-benchmark.schema.json", "work governance benchmark");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, summary)
    : null;

  return {
    ok: Object.values(summary.benchmarks).every((entry) => entry.status === "pass"),
    artifactPath,
    summary
  };
}
