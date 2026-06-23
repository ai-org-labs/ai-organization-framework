import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { adoptionProofBenchmarkCommand } from "../src/commands/adoption-proof-benchmark.js";
import { workGovernanceBenchmarkCommand } from "../src/commands/work-governance-benchmark.js";
import { contextPackCommand, workItemGoalCommand } from "../src/commands/work-governance-records.js";
import { validateWithBundledSchema } from "../src/runtime/validation.js";
import { repoRoot } from "./runtime-test-helpers.js";

const fixtureRoot = path.join(repoRoot, ".aof", "artifacts", "work-governance", "fixtures");

const fixtureSchemaPairs = [
  ["work-item-goal.json", "aof-work-item-goal.schema.json"],
  ["actor-composition.json", "aof-actor-composition.schema.json"],
  ["council-ready-output.json", "aof-council-ready-output.schema.json"],
  ["go-no-go-visualization.json", "aof-go-no-go-visualization.schema.json"],
  ["operational-map-change-log.json", "aof-operational-map-change-log.schema.json"],
  ["context-pack.json", "aof-context-pack.schema.json"],
  ["external-ref.json", "aof-external-ref.schema.json"]
];

async function readFixture(domain, fixtureName) {
  return JSON.parse(await fs.readFile(path.join(fixtureRoot, domain, fixtureName), "utf8"));
}

test("Work Governance fixtures validate for software and non-software domains", async () => {
  for (const domain of ["software", "manufacturing"]) {
    for (const [fixtureName, schemaName] of fixtureSchemaPairs) {
      const payload = await readFixture(domain, fixtureName);
      await validateWithBundledSchema(payload, schemaName, `${domain} ${fixtureName}`);
      assert.equal(payload.source_task_id, "TASK-058");
    }
  }
});

test("QIF provider profile pins an external replaceable quality framework source", async () => {
  const profilePath = path.join(repoRoot, ".aof", "quality", "qif-provider-profile.json");
  const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));
  await validateWithBundledSchema(profile, "aof-qif-provider-profile.schema.json", "qif provider profile");
  assert.equal(profile.compatibility.mode, "external-versioned-profile");
  assert.equal(profile.qif_version, "0.2.1");
  assert.equal(profile.source.repository, "ai-org-labs/quality-intent-framework");
  assert.equal(profile.source.tag, "v0.2.1");
  assert.match(profile.compatibility.semantic_truth_boundary, /do not prove semantic truth/i);
  assert.match(profile.adapter_contract.not_allowed.join(" "), /Do not vendor QIF/);
});

test("context pack rejects raw artifact bodies", async () => {
  const payload = await readFixture("software", "context-pack.json");
  await assert.rejects(
    validateWithBundledSchema(
      { ...payload, raw_artifact_bodies_included: true },
      "aof-context-pack.schema.json",
      "context pack with raw bodies"
    ),
    /raw_artifact_bodies_included must be one of/
  );
});

test("external refs require source-of-truth and sync policy", async () => {
  const payload = await readFixture("manufacturing", "external-ref.json");
  const missingSourceOfTruth = { ...payload };
  delete missingSourceOfTruth.source_of_truth;
  await assert.rejects(
    validateWithBundledSchema(missingSourceOfTruth, "aof-external-ref.schema.json", "external ref without source truth"),
    /missing required key 'source_of_truth'/
  );

  const missingSyncPolicy = { ...payload };
  delete missingSyncPolicy.sync_policy;
  await assert.rejects(
    validateWithBundledSchema(missingSyncPolicy, "aof-external-ref.schema.json", "external ref without sync policy"),
    /missing required key 'sync_policy'/
  );
});

test("actor composition keeps authority boundaries explicit", async () => {
  const payload = await readFixture("software", "actor-composition.json");
  const codexBoundary = payload.authority_boundaries.find((boundary) => boundary.actor_ref === "codex");
  assert.equal(codexBoundary.authority_level, "execute");
  assert.match(codexBoundary.must_not_decide.join(" "), /publication approval/);
});

test("Work Governance writer commands persist schema-valid artifacts", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aof-work-governance-writer-"));
  try {
    const goalPayload = await readFixture("software", "work-item-goal.json");
    const goalResult = await workItemGoalCommand({
      project: repoRoot,
      payload: goalPayload,
      artifactPath: path.join(tempRoot, "goal.json")
    });
    assert.equal(goalResult.ok, true);
    const writtenGoal = JSON.parse(await fs.readFile(goalResult.artifactPath, "utf8"));
    await validateWithBundledSchema(writtenGoal, "aof-work-item-goal.schema.json", "written work item goal");

    const contextPayload = await readFixture("manufacturing", "context-pack.json");
    const contextResult = await contextPackCommand({
      project: repoRoot,
      payload: contextPayload,
      artifactPath: path.join(tempRoot, "context-pack.json")
    });
    assert.equal(contextResult.ok, true);
    const writtenContext = JSON.parse(await fs.readFile(contextResult.artifactPath, "utf8"));
    await validateWithBundledSchema(writtenContext, "aof-context-pack.schema.json", "written context pack");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("CLI Work Governance writer accepts payload-json and rejects missing payload", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aof-work-governance-cli-"));
  try {
    const payload = await readFixture("software", "work-item-goal.json");
    const artifactPath = path.join(tempRoot, "cli-goal.json");
    const ok = spawnSync(process.execPath, [
      "./src/cli.js",
      "work-item-goal",
      "--project", repoRoot,
      "--payload-json", JSON.stringify(payload),
      "--write-artifact", artifactPath
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, AOF_SUPPRESS_NODE_WARNING: "1" }
    });
    assert.equal(ok.status, 0, ok.stderr);
    const written = JSON.parse(await fs.readFile(artifactPath, "utf8"));
    assert.equal(written.work_item_id, "SW-WORK-001");

    const missing = spawnSync(process.execPath, [
      "./src/cli.js",
      "work-item-goal",
      "--project", repoRoot
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, AOF_SUPPRESS_NODE_WARNING: "1" }
    });
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /Missing --payload-json/);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("Work Governance benchmark verifies the committed fixture chains", async () => {
  const result = await workGovernanceBenchmarkCommand({ project: repoRoot });

  assert.equal(result.ok, true);
  assert.equal(result.summary.artifact_type, "work-governance-benchmark");
  assert.equal(result.summary.work_items_evaluated, 2);
  assert.equal(result.summary.benchmarks["WG-001"].status, "pass");
  assert.equal(result.summary.benchmarks["WG-007"].status, "pass");
  await validateWithBundledSchema(
    result.summary,
    "aof-work-governance-benchmark.schema.json",
    "work governance benchmark"
  );
});

test("Work Governance example guide references both domain artifact chains", async () => {
  const guide = await fs.readFile(path.join(repoRoot, "docs", "v6.1-work-governance-examples.md"), "utf8");

  for (const domain of ["software", "manufacturing"]) {
    for (const [fixtureName] of fixtureSchemaPairs) {
      assert.match(
        guide,
        new RegExp(`\\.aof/artifacts/work-governance/fixtures/${domain}/${fixtureName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
        `${domain}/${fixtureName} should be documented`
      );
    }
  }

  assert.match(guide, /source of truth/i);
  assert.match(guide, /sync policy/i);
  assert.match(guide, /conditional_go/);
  assert.match(guide, /needs_more_evidence/);
});

test("Work Governance benchmark fails when actor authority coverage is incomplete", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aof-work-governance-benchmark-"));
  try {
    const tempFixtureRoot = path.join(tempRoot, ".aof", "artifacts", "work-governance", "fixtures");
    await fs.mkdir(tempFixtureRoot, { recursive: true });
    await fs.cp(fixtureRoot, tempFixtureRoot, { recursive: true });

    const actorCompositionPath = path.join(tempFixtureRoot, "software", "actor-composition.json");
    const actorComposition = JSON.parse(await fs.readFile(actorCompositionPath, "utf8"));
    actorComposition.selected_actors.push({
      actor_ref: "unbounded-reviewer",
      actor_type: "ai-agent",
      assigned_role: "reviewer",
      output_required: "Review output without an authority boundary."
    });
    await fs.writeFile(actorCompositionPath, `${JSON.stringify(actorComposition, null, 2)}\n`, "utf8");

    const result = await workGovernanceBenchmarkCommand({ project: tempRoot });

    assert.equal(result.ok, false);
    assert.equal(result.summary.benchmarks["WG-002"].status, "fail");
    assert.match(result.summary.benchmarks["WG-002"].evidence.join("\n"), /unbounded-reviewer/);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("CLI Work Governance benchmark writes a benchmark artifact", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aof-work-governance-benchmark-cli-"));
  try {
    const artifactPath = path.join(tempRoot, "work-governance-benchmark.json");
    const ok = spawnSync(process.execPath, [
      "./src/cli.js",
      "work-governance-benchmark",
      "--project", repoRoot,
      "--write-artifact", artifactPath
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, AOF_SUPPRESS_NODE_WARNING: "1" }
    });
    assert.equal(ok.status, 0, ok.stderr);
    const written = JSON.parse(await fs.readFile(artifactPath, "utf8"));
    assert.equal(written.artifact_type, "work-governance-benchmark");
    assert.equal(written.benchmarks["WG-006"].status, "pass");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("Adoption proof benchmark creates a fresh managed project and human-readable first work summary", async () => {
  const result = await adoptionProofBenchmarkCommand({ project: repoRoot });

  assert.equal(result.ok, true);
  assert.equal(result.summary.artifact_type, "adoption-proof-benchmark");
  assert.equal(result.summary.first_work_item_id, "SW-WORK-001");
  assert.equal(result.summary.work_governance_benchmark_status, "pass");
  assert.equal(result.summary.benchmarks["AP-001"].status, "pass");
  assert.equal(result.summary.benchmarks["AP-004"].status, "pass");
  assert.match(result.summary.recognition_summary_ref, /first-governed-work\.md$/);
  await validateWithBundledSchema(
    result.summary,
    "aof-adoption-proof-benchmark.schema.json",
    "adoption proof benchmark"
  );

  const recognitionPath = path.join(result.summary.benchmark_project_root, result.summary.recognition_summary_ref);
  const recognitionText = await fs.readFile(recognitionPath, "utf8");
  assert.match(recognitionText, /What The Work Is/);
  assert.match(recognitionText, /Why It Matters/);
  assert.match(recognitionText, /Who Judges It/);
  assert.match(recognitionText, /What Should Happen Next/);
});

test("CLI adoption proof benchmark writes a benchmark artifact", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aof-adoption-proof-cli-"));
  try {
    const artifactPath = path.join(tempRoot, "adoption-proof-benchmark.json");
    const ok = spawnSync(process.execPath, [
      "./src/cli.js",
      "adoption-proof-benchmark",
      "--project", repoRoot,
      "--write-artifact", artifactPath
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, AOF_SUPPRESS_NODE_WARNING: "1" }
    });
    assert.equal(ok.status, 0, ok.stderr);
    const written = JSON.parse(await fs.readFile(artifactPath, "utf8"));
    assert.equal(written.artifact_type, "adoption-proof-benchmark");
    assert.equal(written.benchmarks["AP-003"].status, "pass");
    assert.equal(written.benchmarks["AP-006"].status, "pass");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
