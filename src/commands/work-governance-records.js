import path from "node:path";

import { validateWithBundledSchema } from "../runtime/validation.js";
import { makeId, writeJsonArtifact } from "../runtime/utils.js";

const WRITER_CONFIGS = {
  "work-item-goal": {
    schema: "aof-work-item-goal.schema.json",
    label: "work item goal",
    root: ["artifacts", "work-items", "goals"],
    idPrefix: "WIG",
    idField: "work_item_id"
  },
  "actor-compose": {
    schema: "aof-actor-composition.schema.json",
    label: "actor composition",
    root: ["artifacts", "work-items", "actor-compositions"],
    idPrefix: "ACO",
    idField: "work_item_id"
  },
  "council-ready-output": {
    schema: "aof-council-ready-output.schema.json",
    label: "council-ready output",
    root: ["artifacts", "work-items", "council-ready-outputs"],
    idPrefix: "CRO",
    idField: "work_item_id"
  },
  "go-no-go-visualization": {
    schema: "aof-go-no-go-visualization.schema.json",
    label: "go/no-go visualization",
    root: ["artifacts", "work-items", "go-no-go-visualizations"],
    idPrefix: "GNG",
    idField: "work_item_id"
  },
  "operational-map-change-log": {
    schema: "aof-operational-map-change-log.schema.json",
    label: "operational map change log",
    root: ["artifacts", "operational-maps", "change-logs"],
    idPrefix: "OMC",
    idField: "work_item_ref"
  },
  "context-pack": {
    schema: "aof-context-pack.schema.json",
    label: "context pack",
    root: ["artifacts", "context", "context-packs"],
    idPrefix: "CTX",
    idField: "pack_id"
  }
};

function resolveAofRoot(projectRoot) {
  return path.join(projectRoot, ".aof");
}

async function writeWorkGovernanceRecord(commandName, options) {
  const projectRoot = path.resolve(options.project || ".");
  const config = WRITER_CONFIGS[commandName];
  if (!config) {
    throw new Error(`Unsupported Work Governance writer: ${commandName}`);
  }
  const payload = options.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`Missing --payload-json for \`${commandName}\`.`);
  }

  await validateWithBundledSchema(payload, config.schema, config.label);

  const fallbackId = payload[config.idField] || makeId(config.idPrefix);
  const artifactPath = await writeJsonArtifact(
    options.artifactPath || path.join(resolveAofRoot(projectRoot), ...config.root, `${fallbackId}.json`),
    payload
  );

  return {
    ok: true,
    projectRoot,
    artifactPath,
    payload
  };
}

export async function workItemGoalCommand(options) {
  return writeWorkGovernanceRecord("work-item-goal", options);
}

export async function actorComposeCommand(options) {
  return writeWorkGovernanceRecord("actor-compose", options);
}

export async function councilReadyOutputCommand(options) {
  return writeWorkGovernanceRecord("council-ready-output", options);
}

export async function goNoGoVisualizationCommand(options) {
  return writeWorkGovernanceRecord("go-no-go-visualization", options);
}

export async function operationalMapChangeLogCommand(options) {
  return writeWorkGovernanceRecord("operational-map-change-log", options);
}

export async function contextPackCommand(options) {
  return writeWorkGovernanceRecord("context-pack", options);
}
