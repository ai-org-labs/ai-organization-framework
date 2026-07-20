import {
  buildCommandRegistryPayload,
  COMMAND_CATEGORY_SUMMARIES,
  COMMAND_ROUTING_FLOW,
  COMMAND_ROUTING_TOP_COMMANDS,
  COMMAND_SAFETY_LEVELS
} from "./command-registry-payload.js";

const QIF_MAPPING_BY_COMMAND = {
  "archmap-impact-audit": {
    quality_intent: "Architecture-impact governance is traceable before release sign-off.",
    risk: "Implementation work changes architecture or map-relevant runtime behavior without an explicit Archmap impact disposition.",
    loss_boundary: "Do not claim release readiness when implementation-grade work lacks a resolvable impact record, valid impact status, or non-pending Council disposition.",
    evidence_refs: ["archmap impact records", "task records", "Archmap source refs"],
    acceptance_gate: "Audit fails missing impact records, invalid impact statuses, unresolved refs, or pending Council review at or after the cutoff task.",
    verdict_boundary: "Structural/runtime governance evidence only; not proof that the architecture map is semantically complete or visually optimal."
  },
  "review-provenance-audit": {
    quality_intent: "Review and approval claims are backed by resolvable maker/checker/council provenance.",
    risk: "AOF claims Guardian or Council review occurred when the repository only contains self-attested or unresolved evidence.",
    loss_boundary: "Do not claim release readiness when done implementation work lacks a resolvable Council review artifact with source task, parent session, and evidence refs.",
    evidence_refs: ["done task records", "council review packets", "role result refs", "evidence refs"],
    acceptance_gate: "Audit fails missing Council review records, invalid review statuses, missing parent session provenance, empty evidence, or unresolved review refs after the cutoff task.",
    verdict_boundary: "Review provenance evidence only; not proof that the reviewer judgment was semantically correct."
  },
  "evidence-independence-audit": {
    quality_intent: "Release-signoff evidence is not only maker-authored or self-attested.",
    risk: "AOF treats code, task records, or self-authored impact records as sufficient proof without independent verification evidence.",
    loss_boundary: "Do not claim release readiness when done implementation work has no independent evidence category such as tests, schemas, Council review, Guardian result, or release check.",
    evidence_refs: ["council review evidence refs", "test refs", "schema refs", "governance review refs"],
    acceptance_gate: "Audit fails done tasks whose review evidence has no independent evidence category after the cutoff task.",
    verdict_boundary: "Evidence-independence structure only; not proof that the evidence proves semantic truth."
  },
  "context-reference-integrity-audit": {
    quality_intent: "Work and release claims disclose the context and external references they depended on.",
    risk: "AOF answers look correct while relying on stale, hidden, unavailable, or unreviewed context.",
    loss_boundary: "Do not claim release readiness when implementation-grade work lacks context integrity records, unresolved required refs, external reference freshness evidence, or explicit not-proven boundaries.",
    evidence_refs: ["context integrity records", "external reference integrity records", "context packs", "agent session records"],
    acceptance_gate: "Audit fails missing context records, unresolved required refs, stale/unavailable external refs without accepted residual risk, blocked context, or absent not-proven boundaries.",
    verdict_boundary: "Context/reference integrity evidence only; not proof that the referenced material is semantically correct."
  },
  "work-execution-packet-audit": {
    quality_intent: "Execution claims are bounded by task, context, actor handoff, verification, and stop/continue evidence.",
    risk: "AOF treats scattered runtime artifacts as proof of execution even when no one can reconstruct what was handed off, checked, and decided.",
    loss_boundary: "Do not claim execution readiness or release readiness when implementation-grade work lacks a Work Execution Packet with resolvable handoff, lineage, verification, and stop/continue evidence.",
    evidence_refs: ["work execution packets", "context integrity records", "agent session records", "execution lineage", "verification evidence"],
    acceptance_gate: "Audit fails missing packets, unresolved refs, absent actor handoff, absent verification evidence, missing stop/continue decision, or absent not-proven boundary.",
    verdict_boundary: "Execution packet integrity only; not proof that the executed work is semantically valuable or externally validated."
  },
  "multi-actor-pilot-audit": {
    quality_intent: "Multi-actor execution claims are backed by Council roster, actor handoff, Council judgment, and bounded packet evidence.",
    risk: "AOF claims an organization worked when one parent AI silently role-played actors or skipped Council judgment.",
    loss_boundary: "Do not claim governed multi-actor work when core Council roles, actor roster, actor handoffs, Council judgment, or Work Execution Packet evidence is missing or unresolved.",
    evidence_refs: ["multi-actor pilot records", "actor roster refs", "actor handoff refs", "Council judgment refs", "Work Execution Packet refs"],
    acceptance_gate: "Audit fails missing pilot records, missing Visionary/Builder/Guardian, insufficient actor handoffs, unresolved refs, absent boundary, or absent not-proven statement.",
    verdict_boundary: "Multi-actor governance evidence only; not proof that actor judgment was semantically correct or externally validated."
  },
  "parallel-lane-audit": {
    quality_intent: "Parallel execution claims are backed by bounded lane-local evidence and Council join semantics.",
    risk: "AOF claims parallel work happened when activity was only simultaneous or fragmented, with no reconstructable lane split, join decision, blocker state, or Council merge/stop authority.",
    loss_boundary: "Do not claim governed parallel work when lane evidence, join/conflict semantics, Council decision, Work Execution Packet evidence, or upstream multi-actor evidence is missing or unresolved.",
    evidence_refs: ["parallel lane pilot records", "lane input/output/verification refs", "join packet", "Council decision refs", "Work Execution Packet refs", "Multi-Actor Pilot refs"],
    acceptance_gate: "Audit fails missing pilot records, fewer than two lanes, unresolved lane refs, incomplete join packet, missing Council decision, missing upstream packet evidence, or absent not-proven statement.",
    verdict_boundary: "Parallel lane governance evidence only; not proof that parallel execution was faster, autonomous, or semantically correct."
  },
  "requirement-coverage-audit": {
    quality_intent: "Requirement, work, evidence, and forecast claims are traceable before release sign-off.",
    risk: "AOF claims progress, completion, or forecast confidence from task counts or dashboard state without proving which requirements are covered by which work and evidence.",
    loss_boundary: "Do not claim release readiness from coverage or forecast data when requirement records, work refs, evidence refs, blockers, forecast boundaries, or not-proven limits are missing or unresolved.",
    evidence_refs: ["requirement coverage records", "work item refs", "requirement source refs", "evidence refs", "burndown refs"],
    acceptance_gate: "Audit fails missing records, invalid schemas, unresolved refs, inconsistent coverage counts, missing forecast boundaries, or absent not-proven statements.",
    verdict_boundary: "Coverage and forecast governance evidence only; not proof that requirements are semantically satisfied or forecasts will be accurate."
  },
  "session-export-audit": {
    quality_intent: "Agent/session evidence can be exported without depending on a vendor-specific stream as the source of truth.",
    risk: "AOF claims AI work is portable or auditable while prompts, responses, tool calls, artifacts, task links, requirement links, tests, risks, decisions, redaction boundaries, or release-ready evidence remain hidden or provider-locked.",
    loss_boundary: "Do not claim provider-neutral session export readiness when required event summaries, resolvable refs, redaction boundary, release-ready boundary, or not-proven limits are missing.",
    evidence_refs: ["session export records", "agent session records", "task refs", "requirement refs", "test evidence refs", "release-ready refs"],
    acceptance_gate: "Audit fails missing exports, missing required event types, unresolved refs, missing source-of-truth boundary, missing redaction boundary, missing release-ready boundary, or absent not-proven statement.",
    verdict_boundary: "Export governance evidence only; not proof that session content is semantically correct, privacy-safe in every downstream context, or externally adopted."
  },
  "provider-adapter-audit": {
    quality_intent: "Provider adapters cannot be used as hidden authority channels.",
    risk: "AOF treats external provider adapters as implementation details and silently grants read, write, freshness, approval, or side-effect authority without a governed contract.",
    loss_boundary: "Do not claim provider adapter readiness when provider/resource refs, authority boundaries, freshness checks, approval policy, write escalation, provenance, or not-proven boundaries are missing.",
    evidence_refs: ["provider adapter records", "external runtime resource records", "approval policy refs"],
    acceptance_gate: "Audit fails missing adapter records, unresolved refs, missing boundaries, write-capable modes without escalation, ready dangerous adapters, or absent runtime provenance.",
    verdict_boundary: "Adapter governance evidence only; not proof that a provider response is semantically correct or that external writes are safe in every context."
  },
  "provider-adapter-pilot-audit": {
    quality_intent: "Provider adapter execution pilots are bounded experiments, not hidden production automation.",
    risk: "AOF treats provider pilot activity as safe execution while approval, dry-run/default-deny, redaction, rollback, provenance, or stop conditions are missing.",
    loss_boundary: "Do not claim provider adapter pilot readiness when pilot records are absent, refs are unresolved, write pilots lack approval, production/billing/secret/deploy actions are not denied, or not-proven boundaries are missing.",
    evidence_refs: ["provider adapter pilot records", "provider adapter records", "work item refs", "session refs", "verification refs"],
    acceptance_gate: "Audit fails missing pilots, unresolved refs, absent execution boundaries, unapproved write pilots, executable external writes by default, or absent runtime provenance.",
    verdict_boundary: "Pilot boundary evidence only; not proof that provider execution is production-safe, credential-safe, billing-safe, autonomous, or semantically correct."
  },
  "operator-validation-audit": {
    quality_intent: "AOF distinguishes internally green work from operator-understood, reproducible, and accepted work.",
    risk: "AOF claims adoption or release acceptance from tests, dashboards, or artifact volume while the operator cannot understand, reproduce, or accept the governed work path.",
    loss_boundary: "Do not claim operator acceptance when feedback records, release/work/Mission Control/evidence refs, outcome boundaries, governance action, provenance, or not-proven limits are missing.",
    evidence_refs: ["operator validation records", "Mission Control payload", "work item refs", "release refs", "verification evidence refs"],
    acceptance_gate: "Audit fails missing feedback records, unresolved refs, unclear or negative outcomes without escalation, blocked feedback without blocking reason, or absent runtime provenance.",
    verdict_boundary: "Operator validation evidence only; not proof of market truth, broad adoption, semantic correctness, or product value."
  },
  "adoption-proof-benchmark": {
    quality_intent: "A fresh project can reach first governed work without opaque setup magic.",
    risk: "AOF claims adoption readiness while first-time operators cannot reproduce or understand the governed work path.",
    loss_boundary: "Do not claim adoption proof if initialized work, governance checks, and human-readable recognition are not all present.",
    evidence_refs: ["benchmark output", "fresh managed-project fixture", "recognition summary"],
    acceptance_gate: "AP checks pass and expose what was checked, expected, and still unproven.",
    verdict_boundary: "Structural/runtime adoption proof only; not external market validation."
  },
  "command-routing-audit": {
    quality_intent: "AI and operators can choose commands without reading the full CLI reference.",
    risk: "Runtime answers drift into memory-based command selection and skip required verification.",
    loss_boundary: "Do not claim command readiness if bootstrap, orientation, and registry routing are inconsistent.",
    evidence_refs: [".aof/command-registry.json", ".aof/project-bootstrap.json", ".aof/context/active/project-orientation.json"],
    acceptance_gate: "Registry, orientation, top commands, and runtime flow align.",
    verdict_boundary: "Routing integrity only; does not prove the selected command solves the user's semantic need."
  },
  "cli-help-benchmark": {
    quality_intent: "Every supported command has a compact AI-readable help surface.",
    risk: "AI context cost rises because orchestration requires loading large docs or guessing command semantics.",
    loss_boundary: "Do not claim AI command help readiness if a supported command lacks category, purpose, input, output, or failure meaning.",
    evidence_refs: ["generated command help index", "generated per-command help"],
    acceptance_gate: "All supported commands produce structured help and benchmark checks pass.",
    verdict_boundary: "Help surface completeness only; does not prove every command behavior is correct."
  },
  "need-validation-benchmark": {
    quality_intent: "Raw needs are validated before project creation.",
    risk: "AOF organizes and executes the wrong problem.",
    loss_boundary: "Do not create a project from a raw need without validation, reframing, rejection, deferral, or experiment gate.",
    evidence_refs: ["Need Validation benchmark output", "Need Validation records"],
    acceptance_gate: "NV checks reject weak/false needs and require validated readiness before project creation.",
    verdict_boundary: "Validation behavior proof only; semantic truth still requires human/expert/operator evidence."
  },
  "organization-verify": {
    quality_intent: "Canonical organization artifacts remain internally consistent.",
    risk: "Runtime governance claims are based on unresolved refs, missing contracts, or invalid organization structure.",
    loss_boundary: "Do not claim organization readiness when schema validation or cross-reference integrity fails.",
    evidence_refs: [".aof/organization.json", "schemas/aof-organization.schema.json"],
    acceptance_gate: "Organization verification passes without unresolved team, council, contract, or artifact refs.",
    verdict_boundary: "Structural integrity only; not proof of product value."
  },
  "release-state-audit": {
    quality_intent: "Release claims point to the same version, docs, checklist, and notes.",
    risk: "AOF ships with stale or contradictory release surfaces.",
    loss_boundary: "Do not sign off a release when package, bootstrap, active manifest, README, or release docs disagree.",
    evidence_refs: ["active release manifest", "package metadata", "release definition", "release checklist"],
    acceptance_gate: "Release state audit passes for the target version.",
    verdict_boundary: "Release-surface consistency only; not semantic quality proof."
  }
};

function findCommand(command) {
  const registry = buildCommandRegistryPayload(new Date(0).toISOString());
  return registry.commands.find((entry) => entry.command === command);
}

function fallbackFailureMeaning(entry) {
  if (entry.category === "verify") {
    return "A fail result means the governed claim must not be used until the reported checks are repaired or explicitly escalated.";
  }
  if (entry.category === "write") {
    return "A failure means the canonical artifact was not safely written and downstream runtime steps should not depend on it.";
  }
  if (entry.category === "execute") {
    return "A failure means the runtime did not advance; inspect the error and do not infer progress from intent alone.";
  }
  if (entry.category === "observe") {
    return "A failure means the visibility or analytics surface is incomplete; do not use it as evidence until refreshed.";
  }
  return "A failure means the requested state surface could not be read; refresh or repair the source artifact before proceeding.";
}

export function buildCommandHelp(command) {
  const entry = findCommand(command);
  if (!entry) {
    return null;
  }

  return {
    artifact_type: "aof-command-help",
    help_format_version: 1,
    command: entry.command,
    category: entry.category,
    safety_level: entry.safety_level,
    approval_policy: entry.approval_policy,
    operator_path: entry.operator_path,
    top_command: entry.top_command,
    purpose: entry.purpose,
    inputs: entry.inputs,
    outputs: entry.outputs,
    detail_ref: entry.detail_ref,
    use_when: [
      entry.purpose,
      `Use this as a ${entry.category} command in the AOF runtime flow.`
    ],
    failure_meaning: fallbackFailureMeaning(entry),
    qif_mapping: QIF_MAPPING_BY_COMMAND[entry.command] ?? {
      quality_intent: `Use ${entry.command} only when it supports an explicit AOF Quality Intent or runtime operating goal.`,
      risk: "Command output can be mistaken for quality if no intent, risk, loss boundary, evidence, and gate are attached.",
      loss_boundary: "Do not cite this command as quality proof unless the relevant Quality Intent and acceptance gate are named.",
      evidence_refs: entry.outputs,
      acceptance_gate: "Command succeeds and its output is linked to the governing artifact, benchmark, release, or review claim.",
      verdict_boundary: "Command success is operational evidence, not semantic truth by itself."
    }
  };
}

export function buildCommandHelpIndex() {
  const registry = buildCommandRegistryPayload(new Date(0).toISOString());
  return {
    artifact_type: "aof-command-help-index",
    help_format_version: 1,
    generated_from: "command-registry",
    command_count: registry.commands.length,
    detail_ref: registry.detail_ref,
    categories: COMMAND_CATEGORY_SUMMARIES,
    safety_levels: COMMAND_SAFETY_LEVELS,
    top_commands: COMMAND_ROUTING_TOP_COMMANDS.map((command) => buildCommandHelp(command)).filter(Boolean),
    runtime_flow: COMMAND_ROUTING_FLOW,
    ai_usage: [
      "Use `aof --help --json` to get this compact command index.",
      "Use `aof <command> --help --json` to get command-specific purpose, inputs, outputs, failure meaning, and QIF boundary.",
      "Use `aof command-register --project .` only when the full command list is needed.",
      "Use `docs/cli-reference.md` only when implementation-level option detail is needed.",
      "Treat safety_level as the permission boundary: safe_read and safe_local_write are preapproved in normal local runs; project_write, external_write, and dangerous require per-run human approval."
    ]
  };
}

export function formatCommandHelpText(payload) {
  if (payload.artifact_type === "aof-command-help-index") {
    const top = payload.top_commands
      .map((entry) => `- ${entry.command} [${entry.category}]: ${entry.purpose}`)
      .join("\n");
    return [
      "AOF AI Command Help",
      `Commands: ${payload.command_count}`,
      `Detail reference: ${payload.detail_ref}`,
      "",
      "Top commands:",
      top,
      "",
      "For command-specific help: aof <command> --help --json"
    ].join("\n");
  }

  return [
    `AOF Command Help: ${payload.command}`,
    `Category: ${payload.category}`,
    `Safety: ${payload.safety_level}`,
    `Default permission: ${payload.approval_policy?.default_run_permission ?? "unknown"}`,
    `Purpose: ${payload.purpose}`,
    `Inputs: ${payload.inputs.length ? payload.inputs.join(", ") : "(none declared)"}`,
    `Outputs: ${payload.outputs.length ? payload.outputs.join(", ") : "(none declared)"}`,
    `Failure: ${payload.failure_meaning}`,
    `QIF intent: ${payload.qif_mapping.quality_intent}`,
    `Detail reference: ${payload.detail_ref}`
  ].join("\n");
}
