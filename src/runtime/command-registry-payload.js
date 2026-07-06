export const COMMAND_REGISTRY_DETAIL_REF = "docs/cli-reference.md";
export const COMMAND_REGISTRY_FILE = "command-registry.json";
export const COMMAND_REGISTRY_FORMAT_VERSION = 1;

export const COMMAND_CATEGORY_SUMMARIES = [
  { category: "read", purpose: "Inspect current runtime state, registries, and operator-facing summaries." },
  { category: "verify", purpose: "Validate integrity, drift, and benchmark-grade compliance." },
  { category: "write", purpose: "Write canonical runtime artifacts, decisions, and state transitions." },
  { category: "execute", purpose: "Advance the runtime, orchestration, or repair path." },
  { category: "observe", purpose: "Export or visualize evidence, metrics, lineage, and analytics." }
];

export const COMMAND_SAFETY_LEVELS = [
  {
    safety_level: "safe_read",
    purpose: "Read, verify, audit, brief, or inspect local runtime state without changing project source or external systems.",
    default_run_permission: "preapproved"
  },
  {
    safety_level: "safe_local_write",
    purpose: "Write local AOF runtime artifacts, goals, logs, visibility packets, or benchmark evidence under the project.",
    default_run_permission: "preapproved"
  },
  {
    safety_level: "project_write",
    purpose: "Modify project docs, schemas, source, tests, examples, or other product repository files.",
    default_run_permission: "requires_approval"
  },
  {
    safety_level: "external_write",
    purpose: "Write to external services, invoke billable or credentialed external systems, or publish outside the local project.",
    default_run_permission: "requires_approval"
  },
  {
    safety_level: "dangerous",
    purpose: "Delete, deploy, publish, mutate secrets, change billing, touch production, or perform irreversible operations.",
    default_run_permission: "requires_approval"
  }
];

export const COMMAND_ROUTING_TOP_COMMANDS = [
  "init",
  "upgrade",
  "command-register",
  "operator-brief",
  "operator-progress",
  "tree-position",
  "evidence-drill-down",
  "situation-assess",
  "organization-status",
  "organization-verify",
  "command-routing-audit",
  "run",
  "council-exec",
  "release-state-audit",
  "need-validation-benchmark"
];

export const COMMAND_ROUTING_FLOW = [
  "Read the command register first to route without loading the full CLI reference.",
  "Use read commands to inspect runtime state before changing artifacts.",
  "Use verify commands before claiming correctness or release readiness.",
  "Use write commands to persist canonical artifacts and governed state changes.",
  "Use execute commands to move the runtime or orchestration loop forward.",
  "Use observe commands when exporting visibility, metrics, or analytical outputs."
];

const COMMAND_NAMES = [
  "run",
  "init",
  "upgrade",
  "answer",
  "outcome-report",
  "allocation-plan-record",
  "policy-evaluation-report",
  "resource-claim-record",
  "actor-skill-packet-record",
  "actor-assignment-evaluation-record",
  "actor-execution-gate-record",
  "work-item-goal",
  "actor-compose",
  "council-ready-output",
  "go-no-go-visualization",
  "operational-map-change-log",
  "context-pack",
  "work-governance-benchmark",
  "adoption-proof-benchmark",
  "skillful-actor-benchmark",
  "skillful-actor-hri-projection",
  "task-open",
  "task-update",
  "goal-project",
  "confirmation-window-record",
  "alignment-pulse",
  "cadence-trigger-guide",
  "cadence-follow-through",
  "self-audit-record",
  "retire-candidate-review",
  "live-verify",
  "decision-verify",
  "decision-register",
  "discovery-question-set-record",
  "breakthrough-pattern-record",
  "breakthrough-library-register",
  "assumption-map-record",
  "anomaly-log-record",
  "discovery-judgment-packet",
  "discovery-handoff-record",
  "discovery-handoff-benchmark",
  "release-state-refresh",
  "release-state-audit",
  "archmap-impact-audit",
  "review-provenance-audit",
  "evidence-independence-audit",
  "quality-ledger-record",
  "quality-ledger-audit",
  "work-readiness-record",
  "work-readiness-audit",
  "agent-session-record",
  "session-observability-audit",
  "problem-statement-record",
  "value-hypothesis-record",
  "alternative-analysis-record",
  "experiment-proposal-record",
  "project-charter-record",
  "need-validation-record",
  "need-validation-advance",
  "need-validation-benchmark",
  "learning-loop-snapshot",
  "contract-register",
  "dependency-graph",
  "metrics-snapshot",
  "organization-audit",
  "organization-status",
  "organization-analytics-snapshot",
  "organization-verify",
  "roadmap-status",
  "verify-archive",
  "verify-archive-dashboard",
  "verify-archive-log",
  "verify-history",
  "verify-log",
  "verify-lineage",
  "verify-dashboard",
  "verify-dashboard-log",
  "verify-dashboard-index",
  "visibility-export",
  "operator-brief",
  "operator-progress",
  "tree-position",
  "evidence-drill-down",
  "evidence-drill-down-benchmark",
  "mission-control-benchmark",
  "cli-help-benchmark",
  "situation-assess",
  "visibility-serve",
  "visibility-session",
  "packet",
  "signal",
  "council",
  "council-exec",
  "provider-check",
  "escalation-resolve",
  "role-result-record",
  "role-join-record",
  "team-output-record",
  "council-review-packet",
  "runtime-loop-proof",
  "execution-lineage",
  "runtime-discipline-benchmark",
  "command-registry-refresh",
  "command-register",
  "command-routing-audit"
];

const CATEGORY_OVERRIDES = {
  run: "execute",
  init: "execute",
  upgrade: "execute",
  answer: "execute",
  "outcome-report": "write",
  "cadence-trigger-guide": "execute",
  "cadence-follow-through": "execute",
  "live-verify": "execute",
  "decision-verify": "verify",
  "decision-register": "read",
  "breakthrough-library-register": "read",
  "discovery-handoff-benchmark": "verify",
  "release-state-refresh": "execute",
  "release-state-audit": "verify",
  "archmap-impact-audit": "verify",
  "review-provenance-audit": "verify",
  "evidence-independence-audit": "verify",
  "need-validation-advance": "execute",
  "need-validation-benchmark": "verify",
  "learning-loop-snapshot": "observe",
  "contract-register": "read",
  "dependency-graph": "read",
  "metrics-snapshot": "observe",
  "organization-audit": "verify",
  "organization-status": "read",
  "organization-analytics-snapshot": "observe",
  "organization-verify": "verify",
  "roadmap-status": "read",
  "verify-archive": "observe",
  "verify-archive-dashboard": "observe",
  "verify-archive-log": "observe",
  "verify-history": "observe",
  "verify-log": "observe",
  "verify-lineage": "observe",
  "verify-dashboard": "observe",
  "verify-dashboard-log": "observe",
  "verify-dashboard-index": "observe",
  "visibility-export": "observe",
  "operator-brief": "read",
  "operator-progress": "read",
  "tree-position": "read",
  "evidence-drill-down": "read",
  "evidence-drill-down-benchmark": "verify",
  "mission-control-benchmark": "verify",
  "situation-assess": "read",
  "visibility-serve": "observe",
  "visibility-session": "execute",
  packet: "read",
  signal: "write",
  council: "read",
  "council-exec": "execute",
  "provider-check": "read",
  "escalation-resolve": "write",
  "runtime-loop-proof": "execute",
  "execution-lineage": "observe",
  "runtime-discipline-benchmark": "verify",
  "command-registry-refresh": "execute",
  "command-register": "read",
  "command-routing-audit": "verify"
};

const PURPOSE_OVERRIDES = {
  init: "Seed a project with the canonical AOF runtime skeleton and recognition packet.",
  upgrade: "Upgrade an existing AOF installation to the current bootstrap shape.",
  "command-registry-refresh": "Write the canonical command registry artifact from the CLI command catalog.",
  "command-register": "Read the command registry so operators and AI can route without loading the full CLI reference.",
  "command-routing-audit": "Verify that bootstrap, orientation, and command registry routing surfaces remain aligned.",
  "organization-status": "Read the operator-facing organization summary and active goals.",
  "organization-verify": "Verify bootstrap, organization, capability, and command-routing integrity.",
  "release-state-audit": "Verify that active release refs and governed release surfaces remain aligned.",
  "archmap-impact-audit": "Verify that implementation-grade work items carry resolvable Archmap impact records with non-pending Council disposition.",
  "review-provenance-audit": "Verify that done implementation-grade work has resolvable Council review provenance instead of self-attested review claims.",
  "evidence-independence-audit": "Verify that release-signoff evidence is not only maker-authored or self-attested.",
  "quality-ledger-record": "Write an append-only quality evidence event without claiming semantic truth or computing a QIF verdict.",
  "quality-ledger-audit": "Verify Quality Ledger event structure, evidence refs, QIF refs, and governance escalation for missing or contradicted quality evidence.",
  "work-readiness-record": "Write a pre-implementation readiness gate with goal, risk, loss boundary, acceptance gates, evidence plan, maker/checker separation, and stop conditions.",
  "work-readiness-audit": "Verify implementation work is not treated as ready without executable pre-implementation quality gates.",
  "agent-session-record": "Write a local agent session event stream that links AI work to task, requirement, test evidence, risk candidates, decision candidates, and release-ready evidence.",
  "session-observability-audit": "Verify agent session streams are reconstructable and contain task, requirement, test evidence, risk, decision, and release-ready linkages.",
  "release-state-refresh": "Repair the active release manifest and governed release refs.",
  run: "Start an AOF runtime session from a user request.",
  "council-exec": "Execute a council stage and optionally invoke model-backed seats.",
  "need-validation-benchmark": "Benchmark whether Need Validation rejects, reframes, and gates project creation correctly.",
  "mission-control-benchmark": "Benchmark whether Mission Control truthfully advances through runtime stage transitions.",
  "cli-help-benchmark": "Benchmark whether every supported CLI command exposes compact AI-readable help with failure meaning and QIF boundaries.",
  "operator-brief": "Read the compact operator-facing brief derived from current runtime situation assessment.",
  "operator-progress": "Read the bounded operator progress packet that explains what changed since the last checkpoint.",
  "tree-position": "Read the bounded trunk-and-branch position packet for the current frontier.",
  "evidence-drill-down": "Read the bounded answer-to-proof packet below the operator brief.",
  "evidence-drill-down-benchmark": "Verify that the evidence drill-down packet stays aligned to the live operator brief.",
  "situation-assess": "Diagnose the current runtime situation, truth conflicts, and best next operating move.",
  "visibility-session": "Export the current visibility packet, start the viewer session, and optionally open the browser.",
  "actor-skill-packet-record": "Write a schema-valid actor skill packet with assignment, skill, capability, resource, policy, review, blocker, HRI, and provenance evidence.",
  "actor-assignment-evaluation-record": "Evaluate an actor skill packet into selected, degraded, blocked, or escalated assignment state.",
  "actor-execution-gate-record": "Gate a selected actor assignment against required resource claims and policy evaluation evidence.",
  "skillful-actor-benchmark": "Run negative Skillful Actor benchmark checks for missing skills, weak assignments, resource gaps, policy bypass, stale release state, and output contract mismatch.",
  "skillful-actor-hri-projection": "Project Skillful Actor packet, assignment, gate, benchmark, council-review need, blockers, and next action into the Human Recognition Interface.",
  "work-item-goal": "Write a schema-valid Work Governance work item goal artifact from a bounded payload.",
  "actor-compose": "Write a schema-valid actor composition artifact with selected actors and authority boundaries.",
  "council-ready-output": "Write a schema-valid council-ready output artifact for Go / No-Go judgment.",
  "go-no-go-visualization": "Write a schema-valid Go / No-Go visualization artifact.",
  "operational-map-change-log": "Write a schema-valid operational map change log for a work item.",
  "context-pack": "Write a bounded context pack with summaries and refs instead of raw artifact bodies.",
  "work-governance-benchmark": "Benchmark Work Governance artifact chains for goal, actor, council, Go/No-Go, operational map, context pack, and external source-of-truth coverage.",
  "adoption-proof-benchmark": "Benchmark whether a fresh managed project can initialize AOF, produce a first governed work chain, pass Work Governance checks, and explain the work in plain language."
};

const INPUT_HINTS = {
  init: ["project", "topology"],
  upgrade: ["project"],
  run: ["request", "project?"],
  "command-registry-refresh": ["project", "write-artifact?"],
  "command-register": ["project"],
  "command-routing-audit": ["project", "write-artifact?"],
  "operator-brief": ["project", "write-artifact?"],
  "operator-progress": ["project", "write-artifact?"],
  "tree-position": ["project", "write-artifact?"],
  "evidence-drill-down": ["project", "write-artifact?"],
  "evidence-drill-down-benchmark": ["project", "write-artifact?"],
  "organization-status": ["project"],
  "organization-verify": ["project"],
  "release-state-refresh": ["project", "release-version", "release-tag"],
  "release-state-audit": ["project"],
  "archmap-impact-audit": ["project", "cutoff-task-id?", "write-artifact?"],
  "review-provenance-audit": ["project", "cutoff-task-id?", "write-artifact?"],
  "evidence-independence-audit": ["project", "cutoff-task-id?", "write-artifact?"],
  "quality-ledger-record": ["project", "event-type", "quality-intent-ref", "work-item-ref", "claim", "qif-ref", "evidence-ref?", "write-artifact?"],
  "quality-ledger-audit": ["project", "write-artifact?"],
  "work-readiness-record": ["project", "work-item-id", "work-item-ref", "goal", "risk", "loss-boundary", "acceptance-gate", "evidence-plan", "stop-condition", "qif-ref", "write-artifact?"],
  "work-readiness-audit": ["project", "cutoff-task-id?", "write-artifact?"],
  "agent-session-record": ["project", "session-id", "actor-ref", "role-ref", "event-json", "task-ref", "requirement-ref", "test-evidence-ref", "risk-candidate", "decision-candidate", "release-ready-evidence-ref", "write-artifact?"],
  "session-observability-audit": ["project", "write-artifact?"],
  "council-exec": ["session", "stage", "project?"],
  "need-validation-benchmark": ["project", "write-artifact?"],
  "mission-control-benchmark": ["project", "write-artifact?"],
  "cli-help-benchmark": ["project", "write-artifact?"],
  "situation-assess": ["project", "write-artifact?"],
  "visibility-session": ["project", "artifact-dir?", "host?", "port?", "open-browser?"],
  "actor-skill-packet-record": ["project", "objective", "role-ref", "skill-ref", "capability-fit-json", "source-task-id", "source-parent-session-id", "write-artifact?"],
  "actor-assignment-evaluation-record": ["project", "actor-skill-packet-ref", "write-artifact?"],
  "actor-execution-gate-record": ["project", "actor-assignment-evaluation-ref", "resource-claim-ref", "policy-evaluation-ref", "write-artifact?"],
  "skillful-actor-benchmark": ["project", "write-artifact?"],
  "skillful-actor-hri-projection": ["project", "actor-skill-packet-ref", "actor-assignment-evaluation-ref", "actor-execution-gate-ref", "skillful-actor-benchmark-ref", "write-artifact?"],
  "work-item-goal": ["project", "payload-json", "write-artifact?"],
  "actor-compose": ["project", "payload-json", "write-artifact?"],
  "council-ready-output": ["project", "payload-json", "write-artifact?"],
  "go-no-go-visualization": ["project", "payload-json", "write-artifact?"],
  "operational-map-change-log": ["project", "payload-json", "write-artifact?"],
  "context-pack": ["project", "payload-json", "write-artifact?"],
  "work-governance-benchmark": ["project", "write-artifact?"],
  "adoption-proof-benchmark": ["project", "write-artifact?"]
};

const OUTPUT_HINTS = {
  init: ["bootstrap artifacts"],
  upgrade: ["upgraded bootstrap artifacts"],
  run: ["runtime session"],
  "command-registry-refresh": ["command registry artifact"],
  "command-register": ["command routing summary"],
  "command-routing-audit": ["routing audit result"],
  "operator-brief": ["operator briefing packet"],
  "operator-progress": ["operator progress packet"],
  "tree-position": ["tree position packet"],
  "evidence-drill-down": ["evidence drill-down packet"],
  "evidence-drill-down-benchmark": ["benchmark report"],
  "organization-status": ["organization summary"],
  "organization-verify": ["verification report"],
  "release-state-refresh": ["active release manifest"],
  "release-state-audit": ["release drift audit"],
  "archmap-impact-audit": ["archmap impact audit result"],
  "review-provenance-audit": ["review provenance audit result"],
  "evidence-independence-audit": ["evidence independence audit result"],
  "quality-ledger-record": ["quality ledger event artifact"],
  "quality-ledger-audit": ["quality ledger audit result"],
  "work-readiness-record": ["work readiness artifact"],
  "work-readiness-audit": ["work readiness audit result"],
  "agent-session-record": ["agent session event stream artifact"],
  "session-observability-audit": ["session observability audit result"],
  "council-exec": ["council execution packet"],
  "need-validation-benchmark": ["benchmark report"],
  "mission-control-benchmark": ["benchmark report"],
  "cli-help-benchmark": ["benchmark report"],
  "situation-assess": ["situation diagnosis"],
  "visibility-session": ["viewer session"],
  "actor-skill-packet-record": ["actor skill packet artifact"],
  "actor-assignment-evaluation-record": ["actor assignment evaluation artifact"],
  "actor-execution-gate-record": ["actor execution gate artifact"],
  "skillful-actor-benchmark": ["skillful actor benchmark report"],
  "skillful-actor-hri-projection": ["skillful actor HRI projection artifact"],
  "work-item-goal": ["work item goal artifact"],
  "actor-compose": ["actor composition artifact"],
  "council-ready-output": ["council-ready output artifact"],
  "go-no-go-visualization": ["go/no-go visualization artifact"],
  "operational-map-change-log": ["operational map change log artifact"],
  "context-pack": ["context pack artifact"],
  "work-governance-benchmark": ["benchmark report"],
  "adoption-proof-benchmark": ["benchmark report"]
};

function humanizeCommand(command) {
  return command.replace(/-/g, " ");
}

function inferCategory(command) {
  if (CATEGORY_OVERRIDES[command]) {
    return CATEGORY_OVERRIDES[command];
  }
  if (command.endsWith("-record")) {
    return "write";
  }
  if (command.endsWith("-verify") || command.endsWith("-benchmark") || command.endsWith("-audit")) {
    return "verify";
  }
  if (command.endsWith("-status") || command.endsWith("-register")) {
    return "read";
  }
  return "execute";
}

function inferPurpose(command, category) {
  if (PURPOSE_OVERRIDES[command]) {
    return PURPOSE_OVERRIDES[command];
  }
  const label = humanizeCommand(command);
  if (category === "write") {
    return `Write the canonical ${label} artifact.`;
  }
  if (category === "verify") {
    return `Verify ${label} integrity and governed correctness.`;
  }
  if (category === "observe") {
    return `Export or inspect ${label} evidence for operators.`;
  }
  if (category === "read") {
    return `Read the current ${label} surface.`;
  }
  return `Advance the runtime through ${label}.`;
}

function inferOperatorPath(command, category) {
  if (COMMAND_ROUTING_TOP_COMMANDS.includes(command)) {
    return "top-level-routing";
  }
  if (category === "write") {
    return "artifact-recording";
  }
  if (category === "verify") {
    return "integrity-and-benchmarking";
  }
  if (category === "observe") {
    return "visibility-and-analysis";
  }
  if (category === "read") {
    return "state-inspection";
  }
  return "runtime-execution";
}

function inferInputHints(command, category) {
  if (INPUT_HINTS[command]) {
    return INPUT_HINTS[command];
  }
  if (category === "write") {
    return ["project", "payload/options", "write-artifact?"];
  }
  if (category === "execute") {
    return ["project", "runtime context/options"];
  }
  if (category === "observe") {
    return ["project", "write-artifact?"];
  }
  return ["project"];
}

function inferOutputHints(command, category) {
  if (OUTPUT_HINTS[command]) {
    return OUTPUT_HINTS[command];
  }
  const label = humanizeCommand(command);
  if (category === "write") {
    return [`${label} artifact`];
  }
  if (category === "execute") {
    return [`${label} runtime result`];
  }
  if (category === "observe") {
    return [`${label} operator surface`];
  }
  if (category === "verify") {
    return [`${label} verification result`];
  }
  return [`${label} summary`];
}

function inferSafetyLevel(command, category) {
  if ([
    "council-exec",
    "live-verify",
    "provider-check"
  ].includes(command)) {
    return "external_write";
  }
  if ([
    "init",
    "upgrade"
  ].includes(command)) {
    return "project_write";
  }
  if (command === "visibility-session") {
    return "project_write";
  }
  if (category === "observe") {
    return command === "visibility-serve" ? "safe_read" : "safe_local_write";
  }
  if (category === "read" || category === "verify") {
    return "safe_read";
  }
  return "safe_local_write";
}

function buildApprovalPolicy(safetyLevel) {
  const defaultRunPermission = ["safe_read", "safe_local_write"].includes(safetyLevel)
    ? "preapproved"
    : "requires_approval";
  return {
    default_run_permission: defaultRunPermission,
    requires_per_run_approval_for: [
      "git push",
      "npm publish",
      "deploy",
      "external service write",
      "secrets access",
      "billing operation",
      "destructive operation",
      "production mutation",
      "irreversible operation"
    ]
  };
}

export function getCommandCatalogMetadata() {
  return COMMAND_NAMES.map((command) => {
    const category = inferCategory(command);
    const safetyLevel = inferSafetyLevel(command, category);
    return {
      command,
      category,
      safety_level: safetyLevel,
      approval_policy: buildApprovalPolicy(safetyLevel),
      purpose: inferPurpose(command, category),
      operator_path: inferOperatorPath(command, category),
      top_command: COMMAND_ROUTING_TOP_COMMANDS.includes(command),
      inputs: inferInputHints(command, category),
      outputs: inferOutputHints(command, category),
      detail_ref: COMMAND_REGISTRY_DETAIL_REF
    };
  }).sort((left, right) => left.command.localeCompare(right.command));
}

export function buildCommandRegistryPayload(generatedAt) {
  return {
    artifact_type: "command-registry",
    registry_format_version: COMMAND_REGISTRY_FORMAT_VERSION,
    generated_at: generatedAt,
    detail_ref: COMMAND_REGISTRY_DETAIL_REF,
    commands: getCommandCatalogMetadata().map((entry) => ({
      command: entry.command,
      category: entry.category,
      safety_level: entry.safety_level,
      approval_policy: entry.approval_policy,
      purpose: entry.purpose,
      operator_path: entry.operator_path,
      top_command: entry.top_command,
      inputs: entry.inputs,
      outputs: entry.outputs,
      detail_ref: entry.detail_ref
    }))
  };
}

export function buildCommandRoutingSummary() {
  const registry = buildCommandRegistryPayload(new Date(0).toISOString());
  return {
    detail_ref: COMMAND_REGISTRY_DETAIL_REF,
    categories: COMMAND_CATEGORY_SUMMARIES,
    top_commands: registry.commands
      .filter((entry) => entry.top_command)
      .map((entry) => ({
        command: entry.command,
        category: entry.category,
        safety_level: entry.safety_level,
        approval_policy: entry.approval_policy,
        purpose: entry.purpose
      })),
    runtime_flow: COMMAND_ROUTING_FLOW
  };
}
