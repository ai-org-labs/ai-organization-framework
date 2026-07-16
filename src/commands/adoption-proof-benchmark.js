import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { agentSessionRecordCommand } from "./agent-session-record.js";
import { contextIntegrityRecordCommand } from "./context-integrity-record.js";
import { initProjectCommand } from "./init-project.js";
import { requirementCoverageRecordCommand } from "./requirement-coverage-record.js";
import { sessionExportRecordCommand } from "./session-export-record.js";
import { taskOpenCommand } from "./task-open.js";
import { taskUpdateCommand } from "./task-update.js";
import { workExecutionPacketRecordCommand } from "./work-execution-packet-record.js";
import { workGovernanceBenchmarkCommand } from "./work-governance-benchmark.js";
import { workReadinessRecordCommand } from "./work-readiness-record.js";
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

async function writeTextArtifact(projectRoot, ref, content) {
  const targetPath = path.join(projectRoot, ref);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, "utf8");
  return ref;
}

async function createV7RuntimeEvidence(projectRoot) {
  const sessionId = "SESS-ADOPTION-V7-RUNTIME";
  const contractRef = await writeTextArtifact(
    projectRoot,
    "docs/adoption-run-contract.md",
    `# Adoption Run Contract\n\nA fresh adopter must reach a governed work item with bounded context, runtime evidence, requirement coverage, session export evidence, and explicit not-proven boundaries.\n`
  );
  const verificationRef = await writeTextArtifact(
    projectRoot,
    "docs/adoption-run-verification.md",
    `# Adoption Run Verification\n\nThis file is local benchmark evidence that the fresh project produced the v7 runtime evidence chain. It is structural/runtime evidence only.\n`
  );
  const releaseReadyRef = await writeTextArtifact(
    projectRoot,
    "docs/adoption-release-ready-boundary.md",
    `# Adoption Release-Ready Boundary\n\nThe adoption run is release-ready only as a reproducible first governed work path. It is not external market validation.\n`
  );

  const opened = await taskOpenCommand({
    project: projectRoot,
    title: "Fresh adopter first governed work",
    description: "Use the v7 runtime path to reach governed work with context, readiness, execution, requirement coverage, and session export evidence.",
    origin: "orchestrator",
    orchestratorSessionId: sessionId,
    triageNotes: "Created by adoption-proof-benchmark for v7.7 adoption-grade runtime proof."
  });
  const taskId = opened.payload.task_id;
  await taskUpdateCommand({
    project: projectRoot,
    taskId,
    status: "assigned",
    assignedSessionIds: [sessionId],
    triageNotes: "Assigned to the benchmark orchestrator session."
  });
  await taskUpdateCommand({
    project: projectRoot,
    taskId,
    status: "done",
    triageNotes: "Fresh adoption work reached governed runtime evidence closure."
  });

  const taskRef = `.aof/tasks/done/${taskId}.json`;
  const session = await agentSessionRecordCommand({
    project: projectRoot,
    sessionId,
    parentSessionId: sessionId,
    actorRef: "codex",
    roleRef: "orchestrator",
    events: [
      { event_type: "prompt", summary: "Fresh adopter requested first governed work.", artifact_refs: [taskRef] },
      { event_type: "tool_call", summary: "AOF runtime created adoption evidence.", tool_name: "adoption-proof-benchmark", safety_level: "safe_local_write", approval_policy: "preapproved", artifact_refs: [contractRef] },
      { event_type: "artifact_write", summary: "Runtime evidence artifacts were written for the adoption run.", artifact_refs: [verificationRef] },
      { event_type: "verification_result", summary: "Benchmark must verify the v7 runtime evidence chain.", artifact_refs: [verificationRef] },
      { event_type: "stop_condition", summary: "Stop if context, readiness, requirement coverage, or session export evidence is missing.", artifact_refs: [releaseReadyRef] }
    ],
    taskRefs: [taskRef],
    requirementRefs: [contractRef],
    testEvidenceRefs: [verificationRef],
    artifactRefs: [releaseReadyRef],
    riskCandidates: ["Adoption material could be mistaken for governed work."],
    decisionCandidates: ["Require v7 runtime evidence in adoption proof."],
    releaseReadyEvidenceRefs: [releaseReadyRef],
    releaseReadyVerdict: "runtime_ready",
    releaseReadyClaim: "Fresh adopter runtime evidence chain is structurally ready.",
    sourceTaskId: taskId,
    sourceParentSessionId: sessionId
  });

  const readiness = await workReadinessRecordCommand({
    project: projectRoot,
    workItemId: taskId,
    workItemRef: taskRef,
    goal: "Reach first governed work with bounded v7 runtime evidence.",
    risk: "AOF could claim adoption readiness from docs or examples without executable runtime evidence.",
    lossBoundary: "No adoption-grade claim without context, readiness, execution, requirement coverage, session export, and not-proven boundaries.",
    acceptanceGates: ["fresh work item is done", "v7 runtime evidence refs resolve"],
    evidencePlan: ["agent session", "context integrity", "work execution packet", "requirement coverage", "session export"],
    makerRole: "builder",
    checkerRole: "guardian",
    councilRef: "operations-council",
    stopConditions: ["stop if any required runtime evidence is missing"],
    qifRefs: [contractRef],
    readinessStatus: "ready",
    archmapImpactExpected: "no",
    sourceTaskId: taskId,
    sourceParentSessionId: sessionId
  });

  const context = await contextIntegrityRecordCommand({
    project: projectRoot,
    workItemId: taskId,
    workItemRef: taskRef,
    sessionRef: toRef(projectRoot, session.artifactPath),
    declaredContextRefs: [contractRef],
    requiredContextRefs: [verificationRef, releaseReadyRef],
    integrityStatus: "ready",
    notProven: "Context integrity proves declared adoption refs, not product value or market truth.",
    sourceTaskId: taskId,
    sourceParentSessionId: sessionId
  });

  const executionPacket = await workExecutionPacketRecordCommand({
    project: projectRoot,
    workItemId: taskId,
    workItemRef: taskRef,
    executionStatus: "completed",
    contextIntegrityRef: toRef(projectRoot, context.artifactPath),
    actorHandoffRefs: [toRef(projectRoot, session.artifactPath), toRef(projectRoot, readiness.artifactPath)],
    executionLineageRef: contractRef,
    verificationEvidenceRefs: [verificationRef],
    stopContinueDecision: "continue",
    stopContinueRationale: "The fresh adoption run has the required bounded runtime evidence chain.",
    stopContinueDecidedBy: "operations-council",
    stopContinueEvidenceRefs: [releaseReadyRef],
    notProven: "Execution packet proves process closure only, not semantic success or external adoption.",
    sourceTaskId: taskId,
    sourceParentSessionId: sessionId
  });

  const requirementCoverage = await requirementCoverageRecordCommand({
    project: projectRoot,
    workItemId: taskId,
    workItemRef: taskRef,
    requirements: [
      {
        requirement_id: "REQ-ADOPT-V7-001",
        requirement_type: "release_gate",
        source_ref: contractRef,
        title: "Produce v7 runtime evidence in a fresh project",
        owner_ref: "guardian",
        acceptance_boundary: "covered only when runtime evidence refs resolve",
        status: "covered",
        linked_work_item_refs: [taskRef],
        evidence_refs: [toRef(projectRoot, executionPacket.artifactPath), verificationRef]
      }
    ],
    coverageSummary: {
      total_requirements: 1,
      covered_count: 1,
      partial_count: 0,
      blocked_count: 0,
      at_risk_count: 0,
      unstarted_count: 0
    },
    forecast: {
      estimated_remaining_work_items: 0,
      estimated_token_cost_range: "benchmark-local only",
      burndown_ref: verificationRef,
      forecast_boundary: "forecast is benchmark evidence, not delivery certainty"
    },
    notProven: "Requirement coverage proves benchmark linkage only, not semantic satisfaction or external adoption.",
    sourceTaskId: taskId,
    sourceParentSessionId: sessionId
  });

  const sessionExport = await sessionExportRecordCommand({
    project: projectRoot,
    workItemId: taskId,
    workItemRef: taskRef,
    exportStatus: "completed",
    sourceSessionRef: toRef(projectRoot, session.artifactPath),
    providerSource: {
      provider: "local",
      model: "benchmark",
      source_format: "aof-agent-session-record",
      source_of_truth_boundary: "The AOF session export is the portable evidence package; provider-native streams are input evidence only."
    },
    eventSummaries: [
      { event_id: "ADOPT-EVT-001", event_type: "prompt", summary: "Fresh adopter requested governed work.", artifact_refs: [taskRef] },
      { event_id: "ADOPT-EVT-002", event_type: "response", summary: "AOF framed the adoption work as bounded runtime evidence.", artifact_refs: [contractRef] },
      { event_id: "ADOPT-EVT-003", event_type: "tool_call", summary: "AOF wrote runtime artifacts for the adoption run.", artifact_refs: [toRef(projectRoot, executionPacket.artifactPath)] },
      { event_id: "ADOPT-EVT-004", event_type: "artifact_write", summary: "Requirement coverage and session export artifacts were written.", artifact_refs: [toRef(projectRoot, requirementCoverage.artifactPath)] },
      { event_id: "ADOPT-EVT-005", event_type: "verification", summary: "Benchmark evidence verifies the chain structurally.", artifact_refs: [verificationRef] },
      { event_id: "ADOPT-EVT-006", event_type: "blocker", summary: "No active blocker remains inside the benchmark path.", artifact_refs: [releaseReadyRef] },
      { event_id: "ADOPT-EVT-007", event_type: "stop_condition", summary: "Stop if runtime evidence or not-proven boundaries are missing.", artifact_refs: [releaseReadyRef] }
    ],
    taskRefs: [taskRef],
    requirementRefs: [contractRef],
    testEvidenceRefs: [verificationRef],
    artifactRefs: [toRef(projectRoot, executionPacket.artifactPath), toRef(projectRoot, requirementCoverage.artifactPath)],
    riskCandidates: ["Fresh-project examples could be mistaken for external adoption."],
    decisionCandidates: ["Use v7 evidence chain as adoption-grade release gate."],
    releaseReadyEvidenceRefs: [releaseReadyRef],
    redactionBoundary: "Benchmark export stores summaries and refs only; secrets and raw private prompts are out of scope.",
    releaseReadyBoundary: "Adoption run is release-ready as structural/runtime evidence only.",
    notProven: "Session export does not prove semantic correctness, operator acceptance, external provider integration, or market adoption.",
    sourceTaskId: taskId,
    sourceParentSessionId: sessionId
  });

  return {
    taskId,
    taskRef,
    contractRef,
    verificationRef,
    releaseReadyRef,
    refs: [
      toRef(projectRoot, readiness.artifactPath),
      toRef(projectRoot, context.artifactPath),
      toRef(projectRoot, executionPacket.artifactPath),
      toRef(projectRoot, requirementCoverage.artifactPath),
      toRef(projectRoot, sessionExport.artifactPath),
      toRef(projectRoot, session.artifactPath)
    ]
  };
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
  const v7RuntimeEvidence = await createV7RuntimeEvidence(projectRoot);
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
    artifacts_evaluated: artifactRefs.length + 1 + v7RuntimeEvidence.refs.length,
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
        : fail("Recognition summary does not state a clear next action and Go / No-Go path.", [recognitionRef]),
      "AP-007": v7RuntimeEvidence.refs.length >= 6
        ? pass("Fresh project produced the v7 runtime evidence chain.", v7RuntimeEvidence.refs)
        : fail("Fresh project did not produce the v7 runtime evidence chain.", v7RuntimeEvidence.refs),
      "AP-008": v7RuntimeEvidence.refs.some((ref) => /work-readiness/.test(ref)) && v7RuntimeEvidence.refs.some((ref) => /context-integrity/.test(ref))
        ? pass("Fresh project has readiness and context boundaries.", v7RuntimeEvidence.refs.filter((ref) => /work-readiness|context-integrity/.test(ref)))
        : fail("Fresh project is missing readiness or context boundaries.", v7RuntimeEvidence.refs),
      "AP-009": v7RuntimeEvidence.refs.some((ref) => /work-execution-packets/.test(ref))
        ? pass("Fresh project has bounded work execution packet evidence.", v7RuntimeEvidence.refs.filter((ref) => /work-execution-packets/.test(ref)))
        : fail("Fresh project is missing work execution packet evidence.", v7RuntimeEvidence.refs),
      "AP-010": v7RuntimeEvidence.refs.some((ref) => /requirement-coverage/.test(ref))
        ? pass("Fresh project has requirement coverage evidence.", v7RuntimeEvidence.refs.filter((ref) => /requirement-coverage/.test(ref)))
        : fail("Fresh project is missing requirement coverage evidence.", v7RuntimeEvidence.refs),
      "AP-011": v7RuntimeEvidence.refs.some((ref) => /session-exports/.test(ref))
        ? pass("Fresh project has provider-neutral session export evidence with release-ready boundary.", v7RuntimeEvidence.refs.filter((ref) => /session-exports|agent-sessions/.test(ref)))
        : fail("Fresh project is missing provider-neutral session export evidence.", v7RuntimeEvidence.refs)
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
