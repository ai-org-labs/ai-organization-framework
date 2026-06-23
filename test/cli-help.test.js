import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

import { repoRoot } from "./runtime-test-helpers.js";

function runCli(args) {
  const result = spawnSync(process.execPath, [path.join(repoRoot, "src", "cli.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

test("global AI help returns compact JSON command index", () => {
  const output = runCli(["--help", "--json"]);
  const payload = JSON.parse(output);
  assert.equal(payload.artifact_type, "aof-command-help-index");
  assert.ok(payload.command_count > 0);
  assert.ok(payload.top_commands.some((entry) => entry.command === "organization-verify"));
  assert.ok(payload.ai_usage.some((entry) => entry.includes("aof <command> --help --json")));
});

test("command AI help returns failure meaning and QIF boundary", () => {
  const output = runCli(["adoption-proof-benchmark", "--help", "--json"]);
  const payload = JSON.parse(output);
  assert.equal(payload.artifact_type, "aof-command-help");
  assert.equal(payload.command, "adoption-proof-benchmark");
  assert.equal(payload.category, "verify");
  assert.match(payload.failure_meaning, /fail result|failure/i);
  assert.match(payload.qif_mapping.quality_intent, /fresh project/i);
  assert.match(payload.qif_mapping.verdict_boundary, /Structural\/runtime adoption proof/i);
});

test("cli-help-benchmark verifies command help coverage", () => {
  const output = runCli(["cli-help-benchmark", "--project", "."]);
  const payload = JSON.parse(output);
  assert.equal(payload.ok, true);
  assert.equal(payload.summary.artifact_type, "cli-help-benchmark");
  assert.ok(payload.summary.checks.length > 0);
  assert.equal(payload.summary.errors.length, 0);
});
