import path from "node:path";

import { getCommandCatalog } from "../runtime/command-catalog.js";
import { buildCommandHelp, buildCommandHelpIndex } from "../runtime/command-help.js";
import { writeJsonArtifact } from "../runtime/utils.js";

function pushCheck(checks, errors, name, condition, detail) {
  const status = condition ? "pass" : "fail";
  checks.push({ name, status, detail });
  if (!condition) {
    errors.push(`${name}: ${detail}`);
  }
}

export async function cliHelpBenchmarkCommand(options) {
  const projectRoot = path.resolve(options.project || ".");
  const catalog = getCommandCatalog();
  const index = buildCommandHelpIndex();
  const checks = [];
  const errors = [];

  pushCheck(
    checks,
    errors,
    "help index command coverage",
    index.command_count === catalog.length,
    `${index.command_count} help commands for ${catalog.length} catalog commands`
  );

  pushCheck(
    checks,
    errors,
    "help index top commands",
    Array.isArray(index.top_commands) && index.top_commands.length > 0,
    `${index.top_commands.length} top commands`
  );

  for (const entry of catalog) {
    const help = buildCommandHelp(entry.command);
    pushCheck(checks, errors, `${entry.command} help exists`, Boolean(help), help ? "present" : "missing");
    if (!help) {
      continue;
    }
    pushCheck(checks, errors, `${entry.command} category`, Boolean(help.category), help.category || "missing");
    pushCheck(checks, errors, `${entry.command} purpose`, Boolean(help.purpose), help.purpose || "missing");
    pushCheck(
      checks,
      errors,
      `${entry.command} failure meaning`,
      Boolean(help.failure_meaning),
      help.failure_meaning || "missing"
    );
    pushCheck(
      checks,
      errors,
      `${entry.command} qif mapping`,
      Boolean(help.qif_mapping?.quality_intent && help.qif_mapping?.risk && help.qif_mapping?.loss_boundary),
      help.qif_mapping?.quality_intent || "missing"
    );
  }

  const requiredQifCommands = [
    "adoption-proof-benchmark",
    "cli-help-benchmark",
    "command-routing-audit",
    "need-validation-benchmark",
    "organization-verify",
    "release-state-audit"
  ];

  for (const command of requiredQifCommands) {
    const help = buildCommandHelp(command);
    pushCheck(
      checks,
      errors,
      `${command} acceptance gate`,
      Boolean(help?.qif_mapping?.acceptance_gate),
      help?.qif_mapping?.acceptance_gate || "missing"
    );
    pushCheck(
      checks,
      errors,
      `${command} verdict boundary`,
      Boolean(help?.qif_mapping?.verdict_boundary),
      help?.qif_mapping?.verdict_boundary || "missing"
    );
  }

  const payload = {
    ok: errors.length === 0,
    artifact_type: "cli-help-benchmark",
    benchmark_family: "CH",
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    qif_provider_profile_ref: ".aof/quality/qif-provider-profile.json",
    checks,
    errors
  };

  const artifactPath = options.artifactPath ? await writeJsonArtifact(options.artifactPath, payload) : null;
  return {
    ok: payload.ok,
    artifactPath,
    summary: payload
  };
}
