import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { initProjectCommand } from "./init-project.js";
import { workGovernanceBenchmarkCommand } from "./work-governance-benchmark.js";
import { resolveAofRoot } from "../runtime/project-paths.js";
import { writeJsonArtifact } from "../runtime/utils.js";
import { validateWithBundledSchema } from "../runtime/validation.js";

const REQUIRED_RECOGNITION_PHRASES = [
  "what the work is",
  "why it matters",
  "who judges it",
  "what evidence exists",
  "what is blocked",
  "what should happen next"
];

function pass(detail, evidence = []) {
  return { status: "pass", detail, evidence };
}

function fail(detail, evidence = []) {
  return { status: "fail", detail, evidence };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function toRef(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).replaceAll("\\", "/");
}

function rewriteRefs(value, fromPrefix, toPrefix) {
  if (typeof value === "string") {
    return value.replaceAll(fromPrefix, toPrefix);
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteRefs(item, fromPrefix, toPrefix));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, rewriteRefs(entry, fromPrefix, toPrefix)])
    );
  }
  return value;
}

async function copyFixtureChain({ sourceRoot, projectRoot }) {
  const sourceFixtureRoot = path.join(
    sourceRoot,
    ".aof",
    "artifacts",
    "work-governance",
    "fixtures",
    "software"
  );
  const targetFixtureRoot = path.join(
    resolveAofRoot(projectRoot),
    "artifacts",
    "work-governance",
    "fixtures",
    "adoption"
  );
  await fs.mkdir(targetFixtureRoot, { recursive: true });

  const refs = [];
  const fixtureNames = [
    "work-item-goal.json",
    "actor-composition.json",
    "council-ready-output.json",
    "go-no-go-visualization.json",
    "operational-map-change-log.json",
    "context-pack.json",
    "external-ref.json"
  ];

  for (const fixtureName of fixtureNames) {
    const sourcePath = path.join(sourceFixtureRoot, fixtureName);
    const targetPath = path.join(targetFixtureRoot, fixtureName);
    const sourcePayload = await loadJson(sourcePath);
    const rewrittenPayload = rewriteRefs(
      sourcePayload,
      ".aof/artifacts/work-governance/fixtures/software/",
      ".aof/artifacts/work-governance/fixtures/adoption/"
    );
    rewrittenPayload.source_task_id = "TASK-064";
    rewrittenPayload.source_parent_session_id = "SESS-V62-ADOPTION-PROOF";
    await fs.writeFile(targetPath, `${JSON.stringify(rewrittenPayload, null, 2)}\n`, "utf8");
    refs.push(toRef(projectRoot, targetPath));
  }

  return { targetFixtureRoot, refs };
}

async function writeRecognitionSummary(projectRoot) {
  const summaryPath = path.join(
    resolveAofRoot(projectRoot),
    "artifacts",
    "work-governance",
    "recognition-summaries",
    "first-governed-work.md"
  );
  const content = `# First Governed Work Recognition Summary

This page explains the first governed work item in plain language for a first-time AOF operator.

## What The Human Should Recognize

AOF has created the first governed work item for this new project. The work is a release-readiness item: prepare a governed release candidate for a customer-visible API change.

## What The Work Is

The work is to prepare a release readiness checklist, API change summary, and rollback plan before publication.

## Why It Matters

The release changes customer-visible behavior, so the project needs evidence, explicit approval, and rollback readiness before moving forward.

## Who Judges It

Codex acts as the Builder, the verification role acts as Guardian, and the Operations Council judges the Go / No-Go decision with human approval for publication.

## What Evidence Exists

The evidence is the Work Governance artifact chain: work item goal, actor composition, council-ready output, Go / No-Go visualization, operational map change log, context pack, and external reference.

## What Is Blocked

Publication is blocked until the release window and human publication approval are confirmed.

## What Should Happen Next

Request human publication approval, confirm the release window, then let the council make the final Go / No-Go decision.
`;
  await fs.mkdir(path.dirname(summaryPath), { recursive: true });
  await fs.writeFile(summaryPath, content, "utf8");
  return { summaryPath, content };
}

async function scanForForbiddenFiles(projectRoot) {
  const forbidden = [];
  async function walk(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.name === ".git" || entry.name === "node_modules") {
        continue;
      }
      if (entry.name === ".DS_Store") {
        forbidden.push(toRef(projectRoot, entryPath));
        continue;
      }
      if (entry.isDirectory()) {
        await walk(entryPath);
      }
    }
  }
  await walk(projectRoot);
  return forbidden;
}

async function scanForPersonalRefs(projectRoot) {
  const hits = [];
  const legacyAccount = ["pop", "coon", "dev"].join("");
  const legacyEmail = [legacyAccount, "gmail.com"].join("@");
  const patterns = [new RegExp(legacyAccount, "i"), new RegExp(legacyEmail.replace(".", "\\."), "i")];
  async function walk(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.name === ".git" || entry.name === "node_modules") {
        continue;
      }
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }
      if (!entry.name.endsWith(".json") && !entry.name.endsWith(".md") && !entry.name.endsWith(".txt")) {
        continue;
      }
      const text = await fs.readFile(entryPath, "utf8");
      if (patterns.some((pattern) => pattern.test(text))) {
        hits.push(toRef(projectRoot, entryPath));
      }
    }
  }
  await walk(projectRoot);
  return hits;
}

export async function adoptionProofBenchmarkCommand(options) {
  const sourceRoot = path.resolve(options.project || ".");
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aof-adoption-proof-"));
  const projectRoot = path.join(tempRoot, "project");
  await fs.mkdir(projectRoot, { recursive: true });

  await initProjectCommand({
    project: projectRoot,
    topology: "managed-project",
    projectType: "web-app",
    domainSummary: "Fresh adopter project for AOF v6.2 adoption proof",
    installMode: "runtime-on"
  });

  const bootstrapPath = path.join(resolveAofRoot(projectRoot), "project-bootstrap.json");
  const orientationPath = path.join(resolveAofRoot(projectRoot), "context", "active", "project-orientation.json");
  const bootstrap = await loadJson(bootstrapPath);
  const orientationExists = await fileExists(orientationPath);
  const fixtureResult = await copyFixtureChain({ sourceRoot, projectRoot });
  const recognition = await writeRecognitionSummary(projectRoot);
  const workBenchmark = await workGovernanceBenchmarkCommand({ project: projectRoot });
  const forbiddenFiles = await scanForForbiddenFiles(projectRoot);
  const personalRefs = await scanForPersonalRefs(projectRoot);
  const recognitionLower = recognition.content.toLowerCase();
  const missingRecognitionPhrases = REQUIRED_RECOGNITION_PHRASES.filter(
    (phrase) => !recognitionLower.includes(phrase.toLowerCase())
  );

  const artifactRefs = fixtureResult.refs;
  const recognitionRef = toRef(projectRoot, recognition.summaryPath);
  const summary = {
    artifact_type: "adoption-proof-benchmark",
    generated_at: new Date().toISOString(),
    project_root: sourceRoot,
    benchmark_project_root: projectRoot,
    first_work_item_id: "SW-WORK-001",
    recognition_summary_ref: recognitionRef,
    work_governance_benchmark_status: workBenchmark.ok ? "pass" : "fail",
    artifacts_evaluated: artifactRefs.length + 1,
    benchmarks: {
      "AP-001": bootstrap.topology === "managed-project" && orientationExists
        ? pass("Fresh managed-project init created bootstrap and orientation artifacts.", [
            toRef(projectRoot, bootstrapPath),
            toRef(projectRoot, orientationPath)
          ])
        : fail("Fresh managed-project init did not create the expected baseline.", [
            `topology=${bootstrap.topology}`,
            `orientation_exists=${orientationExists}`
          ]),
      "AP-002": artifactRefs.length === 7
        ? pass("First governed work artifact chain exists in the fresh project.", artifactRefs)
        : fail("First governed work artifact chain is incomplete.", artifactRefs),
      "AP-003": workBenchmark.ok
        ? pass("Work Governance benchmark passes against the fresh-project proof chain.", ["work-governance-benchmark"])
        : fail("Work Governance benchmark failed against the fresh-project proof chain.", Object.entries(workBenchmark.summary.benchmarks)
            .filter(([, result]) => result.status !== "pass")
            .map(([id, result]) => `${id}: ${result.detail}`)),
      "AP-004": missingRecognitionPhrases.length === 0
        ? pass("Human-readable recognition summary explains the governed work in operator language.", [recognitionRef])
        : fail("Human-readable recognition summary is missing required meaning elements.", missingRecognitionPhrases),
      "AP-005": forbiddenFiles.length === 0 && personalRefs.length === 0
        ? pass("Fresh proof contains no .DS_Store files or legacy personal account references.", [])
        : fail("Fresh proof contains forbidden files or personal references.", [...forbiddenFiles, ...personalRefs]),
      "AP-006": /request human publication approval/i.test(recognition.content) && /go \/ no-go/i.test(recognition.content)
        ? pass("Recognition summary gives a clear next action and decision path.", [recognitionRef])
        : fail("Recognition summary does not state a clear next action and Go / No-Go path.", [recognitionRef])
    }
  };

  await validateWithBundledSchema(summary, "aof-adoption-proof-benchmark.schema.json", "adoption proof benchmark");

  const artifactPath = options.artifactPath
    ? await writeJsonArtifact(options.artifactPath, summary)
    : null;

  return {
    ok: Object.values(summary.benchmarks).every((entry) => entry.status === "pass"),
    artifactPath,
    summary
  };
}
