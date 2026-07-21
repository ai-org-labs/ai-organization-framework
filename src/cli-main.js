#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { buildCommandHandlers } from "./runtime/command-catalog.js";
import { buildCommandHelp, buildCommandHelpIndex, formatCommandHelpText } from "./runtime/command-help.js";

const COMMAND_HANDLERS = buildCommandHandlers();

const SUPPORTED_COMMANDS = new Set(Object.keys(COMMAND_HANDLERS));
const WORK_GOVERNANCE_PAYLOAD_COMMANDS = new Set([
  "work-item-goal",
  "actor-compose",
  "council-ready-output",
  "go-no-go-visualization",
  "operational-map-change-log",
  "context-pack"
]);
const TRANSIENT_CLI_ERROR_PATTERNS = [
  /Unexpected end of input/,
  /Invalid or unexpected token/,
  /ENOENT: no such file or directory, read/,
  /missing \) after argument list/
];

function isTransientCliError(error) {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
  return TRANSIENT_CLI_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function printUnsupportedNodeWarning() {
  const major = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);
  if (!Number.isFinite(major) || major < 25 || process.env.AOF_SUPPRESS_NODE_WARNING === "1") {
    return;
  }
  console.error(
    `[aof] Warning: Node.js ${process.versions.node} is outside the CI-validated runtime lane. ` +
    "AOF is verified in CI on Node 22 and Node 24, and local parallel standalone CLI runs have shown intermittent read/import instability on Node 25+. " +
    "If you see transient `Unexpected end of input` or JSON truncation errors, rerun on Node 22 or Node 24."
  );
}

function printHelp() {
  console.log(`AOF prototype CLI

Usage:
  aof run "<request>" [--project <path>] [--fast-track|--deep-path]
  aof init [--project <path>] --topology <self-hosting|managed-project> [--write-target <target>] [--project-type <type>] [--domain-summary "<text>"] [--install-mode <runtime-on|framing-only>]
  aof upgrade [--project <path>] [--write-target <target>] [--install-mode <runtime-on|framing-only>]
  aof answer --session <path> --response "<text>" [--response "<text>"]
  aof outcome-report --session <path> --result <success|partial|failure> [--note "<text>"] [--signal-ref <ref>]
  aof allocation-plan-record --project <path> --subject-ref <ref> --target-role-ref <ref> [--target-role-ref <ref>] [--candidate-resource-ref <ref>] --recommended-allocation-json '<json>' [--recommended-allocation-json '<json>'] [--unfilled-role-ref <ref>] [--policy-ref <ref>] [--risk-note "<text>"] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof policy-evaluation-report --project <path> --subject-ref <ref> --evaluation-scope "<text>" --overall-outcome <allowed|requires-approval|requires-review|escalate|denied> [--policy-ref <ref>] --result-json '<json>' [--result-json '<json>'] [--recommended-action "<text>"] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof resource-claim-record --project <path> --subject-ref <ref> --resource-ref <ref> --claimant-role-ref <ref> --claim-scope "<text>" --claim-status <requested|approved|denied|released> [--approval-policy-ref <ref>] --justification "<text>" [--allocation-plan-ref <path>] [--policy-evaluation-ref <path>] [--expires-at <date-time>] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof actor-skill-packet-record --project <path> --objective "<text>" [--actor-ref <ref>] --role-ref <ref> [--team-ref <ref>] --assignment-reason "<text>" --execution-mode <single-actor|council-seat|team-member|tool-backed> --skill-ref <ref> [--skill-ref <ref>] --capability-fit-json '<json>' [--resource-ref <ref>] [--policy-ref <ref>] --output-artifact-type <type> [--output-artifact-schema-ref <path>] --required-section <text> --acceptance-criterion <text> --review-criterion-json '<json>' [--blocker-json '<json>'] --character-label "<text>" --speech-bubble "<text>" --current-action "<text>" --confidence-label <high|medium|low|blocked> --next-action "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--status <draft|ready-for-assignment|blocked|completed>] [--write-artifact <path>]
  aof actor-assignment-evaluation-record --project <path> --actor-skill-packet-ref <path> [--evaluation-id <id>] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof actor-execution-gate-record --project <path> --actor-assignment-evaluation-ref <path> [--gate-id <id>] [--resource-claim-ref <path>] [--resource-claim-ref <path>] [--policy-evaluation-ref <path>] [--policy-evaluation-ref <path>] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof work-item-goal --project <path> --payload-json '<json>' [--write-artifact <path>]
  aof actor-compose --project <path> --payload-json '<json>' [--write-artifact <path>]
  aof council-ready-output --project <path> --payload-json '<json>' [--write-artifact <path>]
  aof go-no-go-visualization --project <path> --payload-json '<json>' [--write-artifact <path>]
  aof operational-map-change-log --project <path> --payload-json '<json>' [--write-artifact <path>]
  aof context-pack --project <path> --payload-json '<json>' [--write-artifact <path>]
  aof work-governance-benchmark [--project <path>] [--write-artifact <path>]
  aof adoption-proof-benchmark [--project <path>] [--write-artifact <path>]
  aof skillful-actor-benchmark [--project <path>] [--write-artifact <path>]
  aof skillful-actor-hri-projection --project <path> --actor-skill-packet-ref <path> --actor-assignment-evaluation-ref <path> --actor-execution-gate-ref <path> --skillful-actor-benchmark-ref <path> [--projection-id <id>] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof task-open --project <path> --title "<text>" [--description "<text>"] [--origin <origin>] [--orchestrator-session-id <id>] [--assigned-session-id <id>] [--related-decision-record-id <id>] [--operating-goal-ref <ref>] [--triage-notes "<text>"]
  aof task-update --project <path> --task-id <TASK-id> [--status <open|assigned|done|archived|retired>] [--assigned-session-id <id>] [--related-decision-record-id <id>] [--triage-notes "<text>"]
  aof goal-project --project <path> --goal-type <north-star|operating-goal|next-value-slice> --content "<text>" [--agreed-with-human] [--source-session-id <id>] [--source-decision-record-id <id>] [--declared-complete]
  aof confirmation-window-record --project <path> --question "<text>" --answer "<text>" [--expectation-state "<text>"] [--mismatch-state "<text>"] [--scale-direction "<text>"] [--source-session-id <id>] [--source-decision-record-id <id>] [--max-entries <n>]
  aof alignment-pulse --project <path> --question "<text>" --answer "<text>" [--expectation-state "<text>"] [--mismatch-state "<text>"] [--scale-direction "<text>"] [--prioritized-task-id <TASK-id>] [--stale-task-id <TASK-id>] [--retire-candidate-task-id <TASK-id>] [--triage-note "<text>"] [--source-session-id <id>] [--source-decision-record-id <id>] [--max-entries <n>]
  aof cadence-trigger-guide --project <path> [--source-session-id <id>] [--source-decision-record-id <id>] [--max-entries <n>]
  aof cadence-follow-through --project <path> [--resolution <retire|keep-open>] [--note "<text>"] [--source-session-id <id>] [--source-decision-record-id <id>] [--max-entries <n>]
  aof self-audit-record --project <path> --audit-id <id> --scope "<text>" --summary "<text>" --detected-gap "<text>" --next-action "<text>" [--result-state <active|stable|escalate>] [--related-task-id <TASK-id>] [--source-session-id <id>] [--source-decision-record-id <id>] [--next-value-slice "<text>"] [--max-entries <n>]
  aof retire-candidate-review --project <path> --resolution <retire|keep-open> --task-id <TASK-id> [--task-id <TASK-id>] --note "<text>" [--source-session-id <id>] [--source-decision-record-id <id>] [--max-entries <n>]
  aof live-verify --project <path> [--request "<text>"] [--response "<text>"] [--signal-response "<text>"] [--escalation-response "<text>"] --provider <provider> --artifact-dir <path> [--model <name>] [--base-url <url>] [--api-key-env <name>] [--ping] [--include-middle-stages] [--include-approval] [--include-signal-reopen] [--include-escalation-reopen] [--include-escalation-terminal] [--signal-path <path>] [--timeout-ms <ms>] [--max-retries <n>] [--archive] [--archive-dir <path>] [--archive-max-runs <n>]
  aof decision-verify [--project <path>]
  aof decision-register [--project <path>]
  aof discovery-question-set-record --project <path> --discovery-objective "<text>" --key-question "<text>" [--key-question "<text>"] --target-user-or-market-slice "<text>" [--target-assumption "<text>"] [--target-anomaly "<text>"] [--signal "<text>"] [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--note "<text>"] [--write-artifact <path>]
  aof breakthrough-pattern-record --project <path> --source-domain "<text>" --triggering-tension "<text>" --broken-assumption "<text>" --enabling-tool-or-method "<text>" --transfer-hypothesis "<text>" --expected-relevance "<text>" [--evidence-ref <path>] [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--note "<text>"] [--write-artifact <path>]
  aof breakthrough-library-register [--project <path>]
  aof assumption-map-record --project <path> --subject "<text>" --assumption-json '<json>' [--assumption-json '<json>'] [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof anomaly-log-record --project <path> --subject "<text>" --anomaly-json '<json>' [--anomaly-json '<json>'] [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof discovery-judgment-packet --project <path> --council-id <id> --judgment-status <continue-exploration|pivot|synthesize-handoff|stop> --decision-summary "<text>" --rationale "<text>" --desirability-assessment "<text>" --feasibility-assessment "<text>" --risk-assessment "<text>" --evidence-quality-state <weak|mixed|sufficient|strong|contested> --recommended-next-step "<text>" [--question-set-ref <path>] [--artifact-ref <path>] [--follow-up-question "<text>"] [--promotion-ready] [--handoff-required] [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof discovery-handoff-record --project <path> --selected-need "<text>" --intended-user-or-segment "<text>" --context-summary "<text>" --hypothesis "<text>" [--evidence-ref <path>] [--rejected-alternative "<text>"] [--explicit-risk "<text>"] [--delivery-validation "<text>"] --need "<text>" --intent "<text>" --context "<text>" [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof discovery-handoff-benchmark [--project <path>] [--write-artifact <path>]
  aof release-state-refresh --project <path> --release-version <version> --release-tag <tag> --release-definition-ref <path> --release-notes-ref <path> --release-checklist-ref <path> [--roadmap-ref <path>] [--release-plan-ref <path>] [--mission "<text>"] [--write-artifact <path>]
  aof release-state-audit [--project <path>] [--write-artifact <path>]
  aof archmap-impact-audit [--project <path>] [--cutoff-task-id <TASK-id>] [--write-artifact <path>]
  aof review-provenance-audit [--project <path>] [--cutoff-task-id <TASK-id>] [--write-artifact <path>]
  aof evidence-independence-audit [--project <path>] [--cutoff-task-id <TASK-id>] [--write-artifact <path>]
  aof quality-ledger-record --project <path> --event-type <evidence_added|claim_contradicted|runtime_evidence_missing|assumption_corrected|verdict_changed|governance_escalation> --quality-intent-ref <ref> --work-item-ref <ref> --claim "<text>" [--evidence-ref <path>] [--qif-ref <path>] [--prior-state "<text>"] [--new-state "<text>"] [--confidence <0-1>] [--semantic-truth-claimed] [--operator-validated] [--governance-action <none|review-required|block-release|request-evidence|update-verdict>] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--note "<text>"] [--write-artifact <path>]
  aof quality-ledger-audit [--project <path>] [--write-artifact <path>]
  aof work-readiness-record --project <path> --work-item-id <TASK-id> --work-item-ref <path> --goal "<text>" --risk "<text>" --loss-boundary "<text>" --acceptance-gate "<text>" [--acceptance-gate "<text>"] --evidence-plan "<text>" [--evidence-plan "<text>"] --maker-role <role> --checker-role <role> --council-ref <ref> --stop-condition "<text>" [--stop-condition "<text>"] --qif-ref <path> [--qif-ref <path>] [--readiness-status <ready|blocked|deferred>] [--archmap-impact-expected <yes|no|unknown>] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--note "<text>"] [--write-artifact <path>]
  aof work-readiness-audit [--project <path>] [--cutoff-task-id <TASK-id>] [--write-artifact <path>]
  aof work-execution-packet-record --project <path> --work-item-id <TASK-id> --work-item-ref <path> --context-integrity-ref <path> --actor-handoff-ref <path> [--actor-handoff-ref <path>] --execution-lineage-ref <path> --verification-evidence-ref <path> [--verification-evidence-ref <path>] --stop-continue-decision <continue|stop|defer|reopen> --stop-continue-rationale "<text>" --stop-continue-decided-by <ref> --stop-continue-evidence-ref <path> [--stop-continue-evidence-ref <path>] --not-proven "<text>" [--execution-status <draft|ready|blocked|completed>] --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--note "<text>"] [--write-artifact <path>]
  aof work-execution-packet-audit [--project <path>] [--cutoff-task-id <TASK-id>] [--write-artifact <path>]
  aof multi-actor-pilot-record --project <path> --work-item-id <TASK-id> --work-item-ref <path> --parent-orchestrator-ref <path> --council-role visionary --council-role builder --council-role guardian --actor-roster-ref <path> --actor-output-handoff-ref <path> [--actor-output-handoff-ref <path>] --council-judgment-ref <path> --work-execution-packet-ref <path> --maker-checker-council-boundary "<text>" --not-proven "<text>" [--pilot-status <draft|ready|blocked|completed>] --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--note "<text>"] [--write-artifact <path>]
  aof multi-actor-pilot-audit [--project <path>] [--cutoff-task-id <TASK-id>] [--write-artifact <path>]
  aof parallel-lane-record --project <path> --work-item-id <TASK-id> --work-item-ref <path> --parent-multi-actor-pilot-ref <path> --work-execution-packet-ref <path> --lane-json '<json>' --lane-json '<json>' --join-decision <merge|stop|defer|reopen> --joined-lane-id <id> --joined-lane-id <id> --conflict-summary "<text>" --blocker-summary "<text>" --merge-rationale "<text>" --council-authority "<text>" --council-decision-ref <path> --not-proven "<text>" [--pilot-status <draft|ready|blocked|completed>] [--join-status <ready|blocked|merged|stopped|deferred|reopened>] --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--note "<text>"] [--write-artifact <path>]
  aof parallel-lane-audit [--project <path>] [--cutoff-task-id <TASK-id>] [--write-artifact <path>]
  aof requirement-coverage-record --project <path> --work-item-id <TASK-id> --work-item-ref <path> --requirement-json '<json>' [--requirement-json '<json>'] --coverage-summary-json '<json>' --forecast-json '<json>' --not-proven "<text>" [--coverage-status <draft|ready|blocked|completed>] --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--note "<text>"] [--write-artifact <path>]
  aof requirement-coverage-audit [--project <path>] [--cutoff-task-id <TASK-id>] [--write-artifact <path>]
  aof session-export-record --project <path> --work-item-id <TASK-id> --work-item-ref <path> --source-session-ref <path> --provider-source-json '<json>' --event-summary-json '<json>' [--event-summary-json '<json>'] --task-ref <path> --requirement-ref <path> --test-evidence-ref <path> --artifact-ref <path> --risk-candidate "<text>" --decision-candidate "<text>" --release-ready-evidence-ref <path> --redaction-boundary "<text>" --release-ready-boundary "<text>" --not-proven "<text>" [--export-status <draft|ready|blocked|completed>] --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--note "<text>"] [--write-artifact <path>]
  aof session-export-audit [--project <path>] [--cutoff-task-id <TASK-id>] [--write-artifact <path>]
  aof agent-session-record --project <path> --session-id <id> --actor-ref <ref> --role-ref <ref> --event-json '<json>' [--event-json '<json>'] --task-ref <path> --requirement-ref <path> --test-evidence-ref <path> --risk-candidate "<text>" --decision-candidate "<text>" --release-ready-evidence-ref <path> [--release-ready-verdict <not_ready|structurally_ready|runtime_ready|operator_validated>] [--release-ready-claim "<text>"] [--provider <name>] [--model <name>] [--parent-session-id <id>] [--commit-ref <ref>] [--pr-ref <ref>] [--artifact-ref <path>] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof session-observability-audit [--project <path>] [--write-artifact <path>]
  aof context-integrity-record --project <path> --work-item-id <TASK-id> --work-item-ref <path> --session-ref <path> [--context-pack-ref <path>] [--declared-context-ref <path>] [--required-context-ref <path>] [--missing-context-ref <path>] [--hidden-context-signal "<text>"] --integrity-status <ready|warning|blocked|accepted_residual_risk> --not-proven "<text>" [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof external-reference-integrity-record --project <path> --external-ref "<ref>" --external-ref-artifact-ref <path> --source-system "<text>" --url <url> --relationship "<text>" --source-of-truth "<text>" --sync-policy "<text>" --usage-purpose "<text>" [--freshness-required] [--observed-at <date-time>] --freshness-status <not_required|current|stale|unknown> --availability-status <available|unavailable|not_checked> --integrity-status <ready|warning|blocked|accepted_residual_risk> --not-proven "<text>" [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof context-reference-integrity-audit [--project <path>] [--cutoff-task-id <TASK-id>] [--write-artifact <path>]
  aof externalization-readiness-audit [--project <path>] [--write-artifact <path>]
  aof external-runtime-resource-record --project <path> --resource-kind <actor|tool|provider|reference> --display-name "<name>" --canonical-ref <path-or-ref> --source-system "<text>" --owner-ref <team-or-council> --source-of-truth "<text>" --permission-boundary "<text>" --freshness-boundary "<text>" --availability-boundary "<text>" --approval-boundary "<text>" --side-effect-boundary "<text>" --allowed-operation <read|local_write|external_write|dangerous> [--allowed-operation <...>] --readiness-status <ready|warning|blocked|accepted_residual_risk> --not-proven "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--write-artifact <path>]
  aof external-resource-use-record --project <path> --work-item-id <TASK-id> --work-item-ref <path> --session-ref <path> --resource-ref <path> --use-purpose "<text>" --operation-type <read|local_write|external_write|dangerous> --approval-status <not_required|pending|approved|rejected> [--approval-ref <path>] --execution-status <planned|executed|blocked|skipped> [--output-artifact-ref <path>] [--risk-candidate "<text>"] [--decision-candidate "<text>"] --not-proven "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--write-artifact <path>]
  aof external-resource-audit [--project <path>] [--write-artifact <path>]
  aof provider-adapter-record --project <path> --display-name "<name>" --provider-ref <path-or-ref> --resource-ref <path> --adapter-kind <read_only|local_write|external_write|dangerous> --operation-mode <read|local_write|external_write|dangerous> [--operation-mode <...>] --read-authority-boundary "<text>" --write-authority-boundary "<text>" --freshness-check "<text>" --approval-policy-ref <path-or-ref> --side-effect-boundary "<text>" [--escalation-required-for <read|local_write|external_write|dangerous>] --readiness-status <ready|warning|blocked|accepted_residual_risk> --not-proven "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--write-artifact <path>]
  aof provider-adapter-audit [--project <path>] [--write-artifact <path>]
  aof provider-adapter-pilot-record --project <path> --adapter-ref <path> --work-item-id <TASK-id> --work-item-ref <path> --session-ref <path> --pilot-mode <dry_run|read_only|approved_write_simulation|approved_external_write> --approval-status <not_required|approved|pending|rejected> [--approval-ref <path>] --expected-external-effect "<text>" --allowed-action "<text>" [--allowed-action "<text>"] --denied-action "<text>" [--denied-action "<text>"] --redaction-boundary "<text>" --rollback-plan "<text>" --provenance-ref <path> [--provenance-ref <path>] --verification-ref <path> [--verification-ref <path>] --stop-condition "<text>" [--stop-condition "<text>"] --execution-status <planned|simulated|executed|blocked|skipped> --not-proven "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--write-artifact <path>]
  aof provider-adapter-pilot-audit [--project <path>] [--write-artifact <path>]
  aof provider-operation-target-record --project <path> --provider <name> --resource <ref> --operation <name> --payload-hash <hash> --payload-summary "<text>" --maximum-calls <n> --expires-at <date-time> --source-task-id <TASK-id> --source-parent-session-id <id> [--endpoint <path>] [--write-artifact <path>]
  aof human-approval-record --project <path> --approver-id <id> --decision <approved|rejected|revoked> --approved-scope-hash <hash> --authentication-method "<text>" --target-operation-ref <path> --source-task-id <TASK-id> --source-parent-session-id <id> [--revocation-status <active|revoked|expired>] [--write-artifact <path>]
  aof provider-execution-approval-record --project <path> --pilot-ref <path> --adapter-ref <path> --work-item-id <TASK-id> --work-item-ref <path> --session-ref <path> --approval-decision <approved|pending|rejected|blocked> --approved-execution-mode <dry_run|read_only|bounded_external_write> [--external-write-authorized] [--human-approval-ref <path>] [--target-operation-ref <path>] --execution-scope "<text>" --allowed-operation <read|local_write|external_write|dangerous> [--allowed-operation <...>] --denied-operation "<text>" [--denied-operation "<text>"] --side-effect-boundary "<text>" --redaction-boundary "<text>" --rollback-plan "<text>" --credential-boundary "<text>" --budget-boundary "<text>" [--credential-scope "<text>"] [--budget-json '<json>'] [--rollback-json '<json>'] --provenance-ref <path> [--provenance-ref <path>] --verification-ref <path> [--verification-ref <path>] --stop-condition "<text>" [--stop-condition "<text>"] --production-execution-status <not_executed|preflight_approved|blocked|executed> --not-proven "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--write-artifact <path>]
  aof provider-execution-approval-audit [--project <path>] [--write-artifact <path>]
  aof provider-outcome-evidence-record --project <path> --approval-ref <path> --reproduction-ref <path> --rollback-ref <path> --target-operation-ref <path> --work-item-id <TASK-id> --session-ref <path> --expected-outcome "<text>" --observed-result "<text>" --outcome-status <accepted|corrected|rollback_recommended|blocked> --evidence-ref <path> [--evidence-ref <path>] --verification-ref <path> [--verification-ref <path>] --semantic-truth-boundary "<text>" --not-proven "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--outcome-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof provider-outcome-evidence-audit [--project <path>] [--write-artifact <path>]
  aof provider-learning-loop-record --project <path> --outcome-ref <path> --learning-summary "<text>" --decision <accept|correct|rollback|escalate|defer> --next-action "<text>" --update-status <updated|escalated|blocked|deferred> --learning-ref <path> [--learning-ref <path>] --evidence-ref <path> [--evidence-ref <path>] --not-proven "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--learning-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof provider-learning-loop-audit [--project <path>] [--write-artifact <path>]
  aof provider-production-boundary-record --project <path> --release-ref <path> --work-item-id <TASK-id> --work-item-ref <path> --mission-control-ref <path> --approval-ref <path> --reproduction-ref <path> --rollback-ref <path> --outcome-ref <path> --learning-ref <path> --operator-acceptance-ref <path> --product-value-evidence-ref <path> --provider-scope "<text>" --allowed-operation-class <read_only|write_preflight|controlled_write_candidate|production_write> --execution-eligibility <candidate|blocked|not_assessed> --credential-boundary "<text>" --budget-boundary "<text>" --revocation-boundary "<text>" --rollback-boundary "<text>" --monitoring-boundary "<text>" --incident-boundary "<text>" --human-go-no-go-boundary "<text>" --product-value-comprehension-boundary "<text>" --go-no-go-status <authorized|not_authorized|blocked|escalated> --governance-action <block_production_execution|allow_preproduction_review|escalate_production_review> --stop-condition "<text>" [--stop-condition "<text>"] --provenance-ref <path> [--provenance-ref <path>] --verification-ref <path> [--verification-ref <path>] --not-proven "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--boundary-id <id>] [--production-execution-authorized] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof provider-production-boundary-audit [--project <path>] [--write-artifact <path>]
  aof operator-acceptance-drill-record --project <path> --operator-ref <ref> --work-item-id <TASK-id> --approval-ref <path> --reproduction-ref <path> --rollback-ref <path> --outcome-ref <path> --learning-ref <path> --mission-control-ref <path> --decision <accept|stop|rollback|escalate|defer> --decision-rationale "<text>" --accepted-risk "<text>" --blocker-summary "<text>" --next-action "<text>" --safety-boundary "<text>" --not-proven "<text>" --evidence-ref <path> [--evidence-ref <path>] --source-task-id <TASK-id> --source-parent-session-id <id> [--drill-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof operator-acceptance-drill-audit [--project <path>] [--write-artifact <path>]
  aof product-value-evidence-record --project <path> --release-ref <path> --work-item-id <TASK-id> --work-item-ref <path> --mission-control-ref <path> --capability-statement "<text>" --before-state "<text>" --after-state "<text>" --scenario "<text>" --five-minute-demo "<text>" --time-saved-or-work-reduced "<text>" --cognitive-load-removed "<text>" --capability-row-json '<json>' [--capability-row-json '<json>'] --understanding-outcome <understood|partially_understood|not_understood|not_checked> --evidence-ref <path> [--evidence-ref <path>] --governance-action <none|improve_release_explanation|reopen_need|block_release_claim|escalate_product_review> --not-proven "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--value-evidence-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof product-value-evidence-audit [--project <path>] [--write-artifact <path>]
  aof operator-validation-record --project <path> --operator-ref <ref> --feedback-source <human_operator|adopter|expert_reviewer|self_hosting_operator|simulated_operator> --release-ref <ref> --work-item-id <TASK-id> --work-item-ref <path> --mission-control-ref <path> --evidence-ref <path> [--evidence-ref <path>] --understanding-outcome <understood|partially_understood|not_understood|needs_clarification|not_checked> --reproduction-outcome <reproduced|partially_reproduced|not_reproduced|needs_clarification|not_checked> --acceptance-outcome <accepted|accepted_with_residual_risk|rejected|needs_clarification|not_checked> --feedback-summary "<text>" [--blocking-reason "<text>"] --governance-action <none|request_clarification|request_reproduction|block_release_claim|escalate_review> --not-proven "<text>" --source-task-id <TASK-id> --source-parent-session-id <id> [--source-decision-record-id <id>] [--write-artifact <path>]
  aof operator-validation-audit [--project <path>] [--write-artifact <path>]
  aof problem-statement-record --project <path> --affected-party "<text>" --actual-problem "<text>" --why-it-matters "<text>" --why-now "<text>" --evidence-ref <path> [--evidence-ref <path>] [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof value-hypothesis-record --project <path> --expected-value-creation "<text>" --beneficiary "<text>" --supporting-evidence "<text>" [--supporting-evidence "<text>"] --success-criterion "<text>" [--success-criterion "<text>"] [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof alternative-analysis-record --project <path> --subject-need "<text>" --alternative-solution "<text>" [--alternative-solution "<text>"] [--non-solution-option "<text>"] [--defer-option "<text>"] --stop-option "<text>" [--stop-option "<text>"] [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof experiment-proposal-record --project <path> --assumption-to-test "<text>" --smallest-testable-validation "<text>" --expected-learning "<text>" --expected-cost "<text>" --success-threshold "<text>" [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof project-charter-record --project <path> --validated-need-ref <path> --validated-objective "<text>" --scope-item "<text>" [--scope-item "<text>"] [--constraint "<text>"] --expected-outcome "<text>" [--expected-outcome "<text>"] [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof need-validation-record --project <path> --raw-need "<text>" --validation-status <validated|reframed|rejected|deferred|evidence-requested|experiment-required> [--validated-need "<text>"] --decision-summary "<text>" --authority-action <reject-need|defer-need|request-evidence|reframe-need|require-experiment|approve-project-charter> --project-creation-recommendation <do-not-create-project|hold-project|create-project-after-experiment|create-project> --question-answer-json '<json>' [--question-answer-json '<json>'] [--hidden-assumption "<text>"] [--evidence-gap "<text>"] --problem-statement-ref <path> --value-hypothesis-ref <path> --alternative-analysis-ref <path> [--experiment-proposal-ref <path>] [--project-charter-ref <path>] [--discovery-handoff-ref <path>] [--source-task-id <TASK-id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof need-validation-advance --session <path> --need-validation-record <path> [--project-charter-ref <path>]
  aof need-validation-benchmark [--project <path>] [--write-artifact <path>]
  aof mission-control-benchmark [--project <path>] [--write-artifact <path>]
  aof mission-control-projection-audit [--project <path>] [--write-artifact <path>]
  aof operator-brief [--project <path>] [--write-artifact <path>]
  aof operator-progress [--project <path>] [--write-artifact <path>]
  aof tree-position [--project <path>] [--write-artifact <path>]
  aof evidence-drill-down [--project <path>] [--write-artifact <path>]
  aof evidence-drill-down-benchmark [--project <path>] [--write-artifact <path>]
  aof situation-assess [--project <path>] [--write-artifact <path>]
  aof mission-control [--project <path>] [--artifact-dir <path>] [--host <host>] [--port <port>] [--title <text>] [--open-browser]
  aof role-result-record --project <path> --role <role> --stage <stage> --session-id <id> --status <completed|blocked|partial> --recommendation "<text>" --rationale "<text>" [--signal "<text>"] [--artifact-ref <path>] [--decision-required] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--blocking-reason "<text>"] [--missing-input "<text>"] [--confidence <0-1>] [--write-artifact <path>]
  aof role-join-record --project <path> --stage <stage> --expected-role <role> [--expected-role <role>] [--received-role <role>] [--missing-role <role>] --aggregate-state <ready-for-orchestrator-decision|waiting-for-missing-roles|blocked-by-signal|degraded-partial-join> --recommended-next-step "<text>" [--blocking-signal "<text>"] [--received-session-id <id>] [--join-status <open|resolved|escalated>] [--summary "<text>"] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--decision-record-ref <path>] [--write-artifact <path>]
  aof team-output-record --project <path> --team-id <id> --stage <stage> --expected-role <role> [--expected-role <role>] [--received-role <role>] [--missing-role <role>] --aggregate-state <ready-for-council-review|waiting-for-missing-roles|blocked-by-signal|degraded-partial-team-output> --recommended-next-step "<text>" [--role-result-ref <path>] [--artifact-ref <path>] [--blocking-signal "<text>"] [--decision-required] [--summary "<text>"] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof council-review-packet --project <path> --council-id <id> --stage <stage> --review-status <approved|changes-requested|blocked|deferred> --decision-summary "<text>" --rationale "<text>" --recommendation "<text>" [--target-audience "<text>"] [--expected-user-reaction "<text>"] [--blocking-reason "<text>"] [--artifact-change-recommendation "<text>"] [--organization-change-recommendation "<text>"] [--diagnosis-category "<text>"] [--diagnosis-confidence <0-1>] [--diagnosis-evidence-ref <path>] [--human-override-signal "<text>"] [--team-output-ref <path>] [--role-result-ref <path>] [--evidence-ref <path>] [--follow-up-task-id <TASK-id>] [--escalation-required] [--source-task-id <TASK-id>] [--source-parent-session-id <id>] [--source-decision-record-id <id>] [--write-artifact <path>]
  aof runtime-loop-proof --project <path> [--request "<text>"] [--response "<text>"] [--response "<text>"] [--provider <provider>] [--routing-mode <fast-track|deep-path>] [--source-task-id <TASK-id>] [--write-artifact <path>]
  aof execution-lineage [--project <path>] [--source-parent-session-id <id>] [--source-task-id <TASK-id>] [--stage <stage>]
  aof runtime-discipline-benchmark [--project <path>] [--source-task-id <TASK-id>] [--artifact-dir <path>]
  aof learning-loop-snapshot [--project <path>]
  aof contract-register [--project <path>]
  aof dependency-graph [--project <path>]
  aof metrics-snapshot [--project <path>]
  aof organization-audit [--project <path>]
  aof organization-status [--project <path>]
  aof organization-analytics-snapshot [--project <path>]
  aof organization-verify [--project <path>]
  aof command-registry-refresh [--project <path>] [--write-artifact <path>]
  aof command-register [--project <path>]
  aof command-routing-audit [--project <path>] [--write-artifact <path>]
  aof roadmap-status [--project <path>]
  aof verify-archive --project <path> --input <path> [--input <path>] [--archive-dir <path>] [--max-runs <n>]
  aof verify-archive-dashboard --index-input <path> --log-input <path> --artifact-dir <path>
  aof verify-archive-log --input <path> [--input <path>] --artifact-dir <path>
  aof verify-history --input <path> [--input <path>] --artifact-dir <path>
  aof verify-log --input <path> [--input <path>] --artifact-dir <path>
  aof verify-lineage --history-input <path> --log-input <path> --index-input <path> --artifact-dir <path>
  aof verify-dashboard --history-input <path> --log-input <path> --index-input <path> --lineage-input <path> --artifact-dir <path>
  aof verify-dashboard-log --input <path> [--input <path>] --artifact-dir <path>
  aof verify-dashboard-index --log-input <path> --artifact-dir <path>
  aof visibility-export [--project <path>] [--artifact-dir <path>]
  aof visibility-serve --status-input <path> --timeline-input <path> --flow-input <path> [--mission-input <path>] [--brief-input <path>] [--progress-input <path>] [--tree-input <path>] [--evidence-input <path>] [--runtime-execution-input <path>] [--host <host>] [--port <port>] [--title <text>]
  aof visibility-session [--project <path>] [--artifact-dir <path>] [--host <host>] [--port <port>] [--title <text>] [--open-browser]
  aof packet --session <path> --stage <stage> [--project <path>] [--role <role>]
  aof council --session <path> --stage <stage> [--project <path>] [--role <role>] [--include-optional]
  aof council-exec --session <path> --stage <stage> [--project <path>] [--role <role>] [--include-optional] [--invoke-model] [--provider <provider>] [--model <name>] [--mock-seat-decision <Role=decision>] [--mock-seat-veto <Role=yes|no>] [--write-artifact <path>] [--timeout-ms <ms>] [--max-retries <n>]
  aof provider-check [--provider <provider>] [--model <name>] [--base-url <url>] [--api-key-env <name>] [--ping] [--write-artifact <path>] [--timeout-ms <ms>] [--max-retries <n>]
  aof escalation-resolve --session <path> --resolution <approve|reopen|stop> --note "<text>"
  aof signal --session <path> --signal <path>

Examples:
  aof run "初回離脱率を下げたい"
  aof init --project . --topology managed-project --project-type web-app --domain-summary "Internal operations dashboard"
  aof upgrade --project . --install-mode runtime-on
  aof run "初回離脱率を下げたい" --project ./examples/aidlc-template
  aof answer --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json --response "新規登録導線全体" --response "登録完了率" --response "認証基盤は変更しない"
  aof outcome-report --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json --result success --note "登録導線の KPI が改善した" --signal-ref SIG-001
  aof allocation-plan-record --project . --subject-ref TASK-010 --target-role-ref builder --candidate-resource-ref resource-repo-main --candidate-resource-ref resource-npm-test --recommended-allocation-json '{"role_ref":"builder","primary_resource_ref":"resource-repo-main","supporting_resource_refs":["resource-npm-test"],"rationale":"repo access and verification support are both needed","capability_refs":["cap-contract-alignment"],"constraint_refs":["policy-main-branch-access"],"workload_state":"available","approval_required":true}' --policy-ref policy-main-branch-access --risk-note "main-branch writes remain review-gated" --source-task-id TASK-010
  aof policy-evaluation-report --project . --subject-ref TASK-010 --evaluation-scope "allocation recommendation review" --overall-outcome requires-review --policy-ref policy-main-branch-access --result-json '{"policy_id":"policy-main-branch-access","effect":"require-review","outcome":"requires-review","reason":"repository writes stay review-gated","blocking":false}' --recommended-action "Route allocation through review before execution." --source-task-id TASK-010
  aof resource-claim-record --project . --subject-ref TASK-010 --resource-ref resource-repo-main --claimant-role-ref builder --claim-scope "temporary repository write access for a governed implementation slice" --claim-status requested --approval-policy-ref policy-main-branch-access --justification "allocation plan recommends repo access but policy requires review before use" --allocation-plan-ref .aof/artifacts/allocation/plans/APL-001.json --policy-evaluation-ref .aof/artifacts/allocation/policy-evaluations/PER-001.json --source-task-id TASK-010
  aof actor-skill-packet-record --project . --objective "Implement the actor skill packet writer" --actor-ref codex --role-ref builder --team-ref runtime-team --assignment-reason "Builder owns runtime writer implementation" --execution-mode single-actor --skill-ref skill-schema-review --capability-fit-json '{"capability_ref":"cap-schema-review","fit_state":"sufficient","evidence_refs":["schemas/aof-actor-skill-packet.schema.json"],"rationale":"schema-backed writer task"}' --resource-ref resource-repo-main --policy-ref policy-runtime-backed-answer-discipline --output-artifact-type actor-skill-packet --output-artifact-schema-ref schemas/aof-actor-skill-packet.schema.json --required-section assignment --acceptance-criterion "schema validates" --review-criterion-json '{"criterion":"packet validates","evaluator_ref":"guardian","evidence_required":"schema validation","blocking":true}' --blocker-json '{"blocker_code":"missing-skill-evidence","trigger_condition":"skill evidence missing","consequence":"block-assignment","recovery_action":"add skill evidence"}' --character-label Builder --speech-bubble "I can write the packet." --current-action "Implement writer" --confidence-label medium --next-action "Submit packet for review" --source-task-id TASK-050 --source-parent-session-id SESS-PARENT-001
  aof actor-assignment-evaluation-record --project . --actor-skill-packet-ref .aof/artifacts/benchmarks/fixtures/ASP-TASK-050-BUILDER.json --source-task-id TASK-051 --source-parent-session-id SESS-PARENT-001
  aof actor-execution-gate-record --project . --actor-assignment-evaluation-ref .aof/artifacts/benchmarks/fixtures/AAE-TASK-051-SELECTED.json --resource-claim-ref .aof/artifacts/benchmarks/fixtures/RCL-TASK-052-REPO-MAIN.json --policy-evaluation-ref .aof/artifacts/benchmarks/fixtures/PER-TASK-052-RUNTIME-DISCIPLINE.json --source-task-id TASK-052 --source-parent-session-id SESS-PARENT-001
  aof skillful-actor-benchmark --project . --write-artifact /tmp/aof-skillful-actor-benchmark.json
  aof skillful-actor-hri-projection --project . --actor-skill-packet-ref .aof/artifacts/benchmarks/fixtures/ASP-TASK-050-BUILDER.json --actor-assignment-evaluation-ref .aof/artifacts/benchmarks/fixtures/AAE-TASK-051-SELECTED.json --actor-execution-gate-ref .aof/artifacts/benchmarks/fixtures/AEG-TASK-052-REQUIRES-REVIEW.json --skillful-actor-benchmark-ref .aof/artifacts/benchmarks/fixtures/SAB-TASK-053-GREEN.json --source-task-id TASK-054 --source-parent-session-id SESS-PARENT-001
  aof task-open --project ./examples/aidlc-template --title "Add runtime write path" --origin orchestrator --operating-goal-ref v1.8-self-hosting
  aof task-update --project ./examples/aidlc-template --task-id TASK-001 --status done --related-decision-record-id DEC-001
  aof goal-project --project ./examples/aidlc-template --goal-type next-value-slice --content "Add runtime write path for tasks and goals" --agreed-with-human
  aof confirmation-window-record --project ./examples/aidlc-template --question "まだ解くべき問題は同じか" --answer "はい。runtime write path が最優先" --expectation-state "self-hosting gap remains active"
  aof alignment-pulse --project ./examples/aidlc-template --question "まだ解くべき問題は同じか" --answer "はい。task triage cadence を runtime に入れる" --prioritized-task-id TASK-004 --triage-note "cadence-focused pulse after v1.9.0"
  aof cadence-trigger-guide --project ./examples/aidlc-template --source-session-id SESS-ORCH-001 --source-decision-record-id DEC-004
  aof cadence-follow-through --project ./examples/aidlc-template --resolution keep-open --note "Retain the task after guided follow-through"
  aof self-audit-record --project ./examples/aidlc-template --audit-id FSA-007 --scope "post-pulse cadence review" --summary "task triage cadence is now runtime-backed" --detected-gap "self-audit cadence is still weaker than pulse-backed task triage" --next-action "make self-audit cadence refresh through the same operating loop" --related-task-id TASK-004 --next-value-slice "Extend TASK-004 into runtime-backed self-audit cadence"
  aof retire-candidate-review --project ./examples/aidlc-template --resolution keep-open --task-id TASK-004 --note "Retain the task for the next cadence slice"
  aof live-verify --project ./examples/aidlc-template --provider mock --artifact-dir /tmp/aof-live-verification --include-middle-stages --include-approval --include-signal-reopen --include-escalation-reopen --include-escalation-terminal --timeout-ms 30000 --max-retries 0 --archive --archive-max-runs 10
  aof decision-verify --project ./examples/aidlc-template
  aof decision-register --project ./examples/aidlc-template
  aof discovery-question-set-record --project . --discovery-objective "Identify the highest-value onboarding friction to investigate" --key-question "Which user segment drops before activation?" --key-question "Which assumption is weakest?" --target-user-or-market-slice "newly invited workspace admins" --target-assumption "activation is blocked by permissions confusion" --signal "pivot if interviews contradict funnel analytics"
  aof breakthrough-pattern-record --project . --source-domain "aviation safety" --triggering-tension "rare failures were hidden by success-path reporting" --broken-assumption "aggregate success metrics are enough" --enabling-tool-or-method "incident review discipline" --transfer-hypothesis "retain anomaly evidence in product discovery" --expected-relevance "improve early problem framing" --evidence-ref docs/research/incident-notes.md
  aof breakthrough-library-register --project .
  aof assumption-map-record --project . --subject "activation funnel discovery" --assumption-json '{"assumption":"workspace admins understand permission setup","assumption_type":"user","confidence":0.4,"evidence_state":"weak","break_test_question":"What percentage can explain setup without help?"}'
  aof anomaly-log-record --project . --subject "activation funnel discovery" --anomaly-json '{"observed_anomaly":"high-intent admins abandon after invite acceptance","why_it_matters":"intent is present but setup still fails","challenged_assumption":"drop-off is caused by low motivation","follow_up_recommendation":"interview recent abandons","evidence_refs":["docs/research/funnel-notes.md"]}'
  aof discovery-judgment-packet --project . --council-id discovery-council --judgment-status synthesize-handoff --decision-summary "The question is narrow enough to hand off." --rationale "Discovery reduced the problem to permission setup confusion." --desirability-assessment "The problem is painful for a clear segment." --feasibility-assessment "A small onboarding intervention is plausible." --risk-assessment "Evidence is still limited but sufficient for delivery-side validation." --evidence-quality-state sufficient --recommended-next-step "Create a delivery handoff packet." --question-set-ref .aof/artifacts/discovery/question-sets/DQS-001.json --artifact-ref .aof/artifacts/discovery/assumption-maps/ASM-001.json --follow-up-question "Which validation metric should gate rollout?" --promotion-ready --handoff-required
  aof discovery-handoff-record --project . --selected-need "Reduce activation failure for invited admins" --intended-user-or-segment "newly invited workspace admins" --context-summary "analytics and interviews indicate confusion during permission setup" --hypothesis "clearer permission framing will improve activation completion" --evidence-ref docs/research/funnel-notes.md --rejected-alternative "focus on invite email copy first" --explicit-risk "sample size is still small" --delivery-validation "validate permission-step comprehension before UI rollout" --need "Reduce activation failure for invited admins" --intent "Ship the smallest validated onboarding change" --context "Discovery narrowed the problem to permission setup confusion"
  aof discovery-handoff-benchmark --project . --write-artifact /tmp/aof-discovery-handoff-benchmark.json
  aof release-state-refresh --project . --release-version 5.0.0 --release-tag v5.0.0 --release-definition-ref docs/v5.0-release-definition.md --release-notes-ref docs/v5.0.0-release-notes.md --release-checklist-ref docs/v5.0-release-checklist.md --mission "Keep the self-hosting runtime truthful about the active release baseline after a real release."
  aof release-state-audit --project . --write-artifact /tmp/aof-release-state-audit.json
  aof archmap-impact-audit --project . --cutoff-task-id TASK-071 --write-artifact /tmp/aof-archmap-impact-audit.json
  aof review-provenance-audit --project . --cutoff-task-id TASK-071 --write-artifact /tmp/aof-review-provenance-audit.json
  aof evidence-independence-audit --project . --cutoff-task-id TASK-071 --write-artifact /tmp/aof-evidence-independence-audit.json
  aof quality-ledger-record --project . --event-type runtime_evidence_missing --quality-intent-ref QIN-AOF-RUNTIME --work-item-ref TASK-078 --claim "A release claim has no runtime evidence yet" --qif-ref docs/aof-quality-definition-qif.md --governance-action request-evidence --source-task-id TASK-078 --source-parent-session-id SESS-PARENT-001
  aof quality-ledger-audit --project . --write-artifact /tmp/aof-quality-ledger-audit.json
  aof work-readiness-record --project . --work-item-id TASK-082 --work-item-ref .aof/tasks/open/TASK-082.json --goal "Implement executable pre-implementation gates" --risk "AOF starts work without knowing what success means" --loss-boundary "No implementation-ready claim without gates" --acceptance-gate "work-readiness-audit passes" --evidence-plan "schema, command, tests, Council review" --maker-role builder --checker-role guardian --council-ref architecture-council --stop-condition "audit passes or implementation stops" --qif-ref docs/aof-qif-quality-definition.md --source-task-id TASK-082 --source-parent-session-id SESS-PARENT-001
  aof work-readiness-audit --project . --cutoff-task-id TASK-082 --write-artifact /tmp/aof-work-readiness-audit.json
  aof work-execution-packet-record --project . --work-item-id TASK-091 --work-item-ref .aof/tasks/open/TASK-091.json --context-integrity-ref .aof/artifacts/context-integrity/TASK-091.json --actor-handoff-ref .aof/artifacts/agent-sessions/SESS-V72-WORK-EXECUTION-PACKET.json --execution-lineage-ref .aof/context/active/execution-lineage.json --verification-evidence-ref test/runtime-core-2.test.js --stop-continue-decision continue --stop-continue-rationale "all v7.2 execution packet gates are green" --stop-continue-decided-by architecture-council --stop-continue-evidence-ref .aof/artifacts/execution/council-reviews/CREV-TASK-091-V72.json --not-proven "semantic value of the work still requires operator review" --source-task-id TASK-091 --source-parent-session-id SESS-V72-WORK-EXECUTION-PACKET
  aof work-execution-packet-audit --project . --cutoff-task-id TASK-091 --write-artifact /tmp/aof-work-execution-packet-audit.json
  aof multi-actor-pilot-record --project . --work-item-id TASK-092 --work-item-ref .aof/tasks/open/TASK-092.json --parent-orchestrator-ref .aof/artifacts/agent-sessions/SESS-V73-MULTI-ACTOR-PILOT.json --council-role visionary --council-role builder --council-role guardian --actor-roster-ref .aof/artifacts/work-governance/actor-compositions/ACT-TASK-092-V73.json --actor-output-handoff-ref .aof/artifacts/execution/role-results/RRES-BUILDER.json --actor-output-handoff-ref .aof/artifacts/execution/role-results/RRES-GUARDIAN.json --council-judgment-ref .aof/artifacts/execution/council-reviews/CREV-TASK-092-V73.json --work-execution-packet-ref .aof/artifacts/work-execution-packets/TASK-092.json --maker-checker-council-boundary "Builder makes, Guardian checks, Council judges." --not-proven "multi-actor pilot evidence does not prove autonomous workforce performance" --source-task-id TASK-092 --source-parent-session-id SESS-V73-MULTI-ACTOR-PILOT
  aof multi-actor-pilot-audit --project . --cutoff-task-id TASK-092 --write-artifact /tmp/aof-multi-actor-pilot-audit.json
  aof parallel-lane-record --project . --work-item-id TASK-093 --work-item-ref .aof/tasks/open/TASK-093.json --parent-multi-actor-pilot-ref .aof/artifacts/multi-actor-pilots/TASK-093.json --work-execution-packet-ref .aof/artifacts/work-execution-packets/TASK-093.json --lane-json '{"lane_id":"schema","goal":"define contract","owner_actor_ref":"builder","input_refs":["docs/v7.4-release-definition.md"],"expected_output":"schema and writer","output_refs":["schemas/aof-parallel-lane-pilot.schema.json"],"verification_refs":["test/runtime-core-2.test.js"],"stop_condition":"stop if schema cannot fail missing lane evidence","lane_status":"completed"}' --lane-json '{"lane_id":"audit","goal":"verify join semantics","owner_actor_ref":"guardian","input_refs":["docs/v7.4-release-definition.md"],"expected_output":"audit and negative checks","output_refs":["src/commands/parallel-lane-audit.js"],"verification_refs":["test/runtime-core-2.test.js"],"stop_condition":"stop if audit cannot fail missing join evidence","lane_status":"completed"}' --join-decision merge --joined-lane-id schema --joined-lane-id audit --conflict-summary "no unresolved lane conflict" --blocker-summary "no active blocker" --merge-rationale "lane outputs are independently verified and Council-approved" --council-authority architecture-council --council-decision-ref .aof/artifacts/execution/council-reviews/CREV-TASK-093-V74.json --not-proven "parallel lane evidence does not prove autonomous scheduling or speed improvement" --source-task-id TASK-093 --source-parent-session-id SESS-V74-PARALLEL-LANES
  aof parallel-lane-audit --project . --cutoff-task-id TASK-093 --write-artifact /tmp/aof-parallel-lane-audit.json
  aof requirement-coverage-record --project . --work-item-id TASK-094 --work-item-ref .aof/tasks/open/TASK-094.json --requirement-json '{"requirement_id":"REQ-V75-001","requirement_type":"functional","source_ref":"docs/v7.5-release-definition.md","title":"record requirement coverage","owner_ref":"builder","acceptance_boundary":"covered only when linked work and evidence refs resolve","status":"covered","linked_work_item_refs":[".aof/tasks/open/TASK-094.json"],"evidence_refs":["schemas/aof-requirement-coverage-record.schema.json"]}' --coverage-summary-json '{"total_requirements":1,"covered_count":1,"partial_count":0,"blocked_count":0,"at_risk_count":0,"unstarted_count":0}' --forecast-json '{"estimated_remaining_work_items":0,"estimated_token_cost_range":"bounded release verification only","burndown_ref":"docs/v7.5-release-checklist.md","forecast_boundary":"forecast is planning evidence, not delivery certainty"}' --not-proven "coverage evidence does not prove semantic satisfaction" --source-task-id TASK-094 --source-parent-session-id SESS-V75-REQUIREMENT-COVERAGE
  aof requirement-coverage-audit --project . --cutoff-task-id TASK-094 --write-artifact /tmp/aof-requirement-coverage-audit.json
  aof session-export-record --project . --work-item-id TASK-095 --work-item-ref .aof/tasks/open/TASK-095.json --source-session-ref .aof/artifacts/agent-sessions/SESS-V76-SESSION-EXPORT.json --provider-source-json '{"provider":"local","model":"codex","source_format":"aof-agent-session-record","source_of_truth_boundary":"provider stream is input evidence; AOF export is canonical"}' --event-summary-json '{"event_id":"EVT-1","event_type":"prompt","summary":"operator requested v7.6 export","artifact_refs":[".aof/tasks/open/TASK-095.json"]}' --task-ref .aof/tasks/open/TASK-095.json --requirement-ref docs/v7.6-release-definition.md --test-evidence-ref test/runtime-core-2.test.js --artifact-ref schemas/aof-session-export-record.schema.json --risk-candidate "provider lock-in" --decision-candidate "make export audit a release gate" --release-ready-evidence-ref docs/v7.6-release-checklist.md --redaction-boundary "summaries only; secrets and raw private prompts are not exported" --release-ready-boundary "export readiness is structural evidence only" --not-proven "export does not prove semantic correctness" --source-task-id TASK-095 --source-parent-session-id SESS-V76-SESSION-EXPORT
  aof session-export-audit --project . --cutoff-task-id TASK-095 --write-artifact /tmp/aof-session-export-audit.json
  aof agent-session-record --project . --session-id SESS-001 --actor-ref codex --role-ref builder --event-json '{"event_type":"prompt","summary":"User asked for v7 session observability"}' --event-json '{"event_type":"tool_call","summary":"Ran runtime audit","tool_name":"session-observability-audit","safety_level":"safe_read","approval_policy":"preapproved"}' --task-ref .aof/tasks/open/TASK-085.json --requirement-ref docs/v7.0-agent-session-observability-direction.md --test-evidence-ref test/runtime-core-2.test.js --risk-candidate "session path is not reconstructable" --decision-candidate "promote event stream to release gate" --release-ready-evidence-ref docs/v7.0-agent-session-observability-direction.md --release-ready-verdict runtime_ready --source-task-id TASK-085 --source-parent-session-id SESS-V70-SESSION-OBSERVABILITY
  aof session-observability-audit --project . --write-artifact /tmp/aof-session-observability-audit.json
  aof problem-statement-record --project . --affected-party "newly invited workspace admins" --actual-problem "activation fails during permission setup" --why-it-matters "high-intent admins fail before value is realized" --why-now "activation drop-off is blocking current growth" --evidence-ref docs/research/funnel-notes.md
  aof value-hypothesis-record --project . --expected-value-creation "higher activation completion and faster time to first value" --beneficiary "newly invited workspace admins and the owning workspace" --supporting-evidence "interviews and analytics both indicate permission-step confusion" --success-criterion "activation completion improves" --success-criterion "permission-step comprehension improves"
  aof alternative-analysis-record --project . --subject-need "Reduce activation failure for invited admins" --alternative-solution "clarify permission setup directly in product" --alternative-solution "human-assisted onboarding for high-value accounts" --non-solution-option "tighten qualification and do nothing in-product" --defer-option "wait until more interview evidence is collected" --stop-option "do not create a project if the problem is not reproducible"
  aof experiment-proposal-record --project . --assumption-to-test "permission-step confusion is the primary activation blocker" --smallest-testable-validation "five moderated walkthroughs with revised permission framing" --expected-learning "whether comprehension improves before UI build" --expected-cost "one day of research and lightweight prototype work" --success-threshold "at least four of five participants complete setup without help"
  aof project-charter-record --project . --validated-need-ref .aof/artifacts/need-validation/records/NVR-001.json --validated-objective "Ship the smallest validated intervention that reduces permission-step activation failure" --scope-item "permission-step framing" --scope-item "activation measurement" --constraint "do not redesign the full onboarding flow" --expected-outcome "higher activation completion" --expected-outcome "clearer project scope grounded in validated need"
  aof need-validation-record --project . --raw-need "Improve onboarding" --validation-status validated --validated-need "Reduce activation failure caused by permission-step confusion for newly invited admins" --decision-summary "The raw request was too broad; the validated need is narrower and evidence-backed." --authority-action approve-project-charter --project-creation-recommendation create-project --question-answer-json '{"question":"Who is affected?","answer":"newly invited workspace admins","evidence_state":"sufficient"}' --question-answer-json '{"question":"How can the assumption be tested cheaply?","answer":"run moderated walkthroughs with revised permission framing","evidence_state":"sufficient"}' --hidden-assumption "activation failure was assumed to be motivation-related" --problem-statement-ref .aof/artifacts/need-validation/problem-statements/PST-001.json --value-hypothesis-ref .aof/artifacts/need-validation/value-hypotheses/VHY-001.json --alternative-analysis-ref .aof/artifacts/need-validation/alternative-analyses/ALT-001.json --experiment-proposal-ref .aof/artifacts/need-validation/experiment-proposals/EXP-001.json --project-charter-ref .aof/artifacts/need-validation/project-charters/PCH-001.json --discovery-handoff-ref .aof/artifacts/discovery/handoffs/DHO-001.json
  aof need-validation-advance --session ./.aof/sessions/SESS-001.json --need-validation-record .aof/artifacts/need-validation/records/NVR-001.json
  aof need-validation-benchmark --project . --write-artifact /tmp/aof-need-validation-benchmark.json
  aof mission-control-benchmark --project . --write-artifact /tmp/aof-mission-control-benchmark.json
  aof operator-brief --project . --write-artifact /tmp/aof-operator-brief.json
  aof operator-progress --project . --write-artifact /tmp/aof-operator-progress.json
  aof tree-position --project . --write-artifact /tmp/aof-tree-position.json
  aof evidence-drill-down --project . --write-artifact /tmp/aof-evidence-drill-down.json
  aof evidence-drill-down-benchmark --project . --write-artifact /tmp/aof-evidence-drill-down-benchmark.json
  aof situation-assess --project . --write-artifact /tmp/aof-situation-assessment.json
  aof mission-control --project . --port 4174 --open-browser
  aof role-result-record --project . --role Builder --stage planning --session-id SESS-001 --status completed --recommendation "merge into team packet" --rationale "implementation path is coherent" --signal "needs Guardian review" --artifact-ref docs/spec.md --decision-required --source-task-id TASK-012 --source-parent-session-id SESS-PARENT-001
  aof role-join-record --project . --stage planning --expected-role Builder --expected-role Guardian --expected-role Visionary --received-role Builder --received-role Guardian --aggregate-state waiting-for-missing-roles --recommended-next-step "wait for Visionary result" --received-session-id SESS-BUILD-001 --received-session-id SESS-GUARD-001 --source-task-id TASK-011 --source-parent-session-id SESS-PARENT-001
  aof team-output-record --project . --team-id runtime-team --stage planning --expected-role Builder --expected-role Guardian --received-role Builder --aggregate-state waiting-for-missing-roles --recommended-next-step "wait for Guardian result" --role-result-ref .aof/artifacts/execution/role-results/RRES-001.json --blocking-signal "guardian pending" --source-task-id TASK-012 --source-parent-session-id SESS-PARENT-001
  aof council-review-packet --project . --council-id architecture-council --stage review --review-status changes-requested --decision-summary "execution packet shape is close but missing Guardian evidence" --rationale "approval requires both execution and risk viewpoints" --recommendation "request Guardian output and resubmit" --target-audience "release operator" --expected-user-reaction "block until evidence is complete" --blocking-reason "Guardian evidence is missing" --artifact-change-recommendation "show the missing evidence directly in the packet" --organization-change-recommendation "require a human-facing quality check before approval" --diagnosis-category role-gap --diagnosis-confidence 0.8 --diagnosis-evidence-ref .aof/artifacts/execution/team-outputs/TOUT-001.json --human-override-signal "owner judged the packet not yet credible" --team-output-ref .aof/artifacts/execution/team-outputs/TOUT-001.json --role-result-ref .aof/artifacts/execution/role-results/RRES-001.json --follow-up-task-id TASK-012
  aof runtime-loop-proof --project . --provider mock --source-task-id TASK-011
  aof execution-lineage --project . --source-task-id TASK-012
  aof runtime-discipline-benchmark --project . --source-task-id TASK-011
  aof learning-loop-snapshot --project .
  aof contract-register --project .
  aof dependency-graph --project .
  aof metrics-snapshot --project .
  aof organization-audit --project .
  aof organization-status --project .
  aof organization-analytics-snapshot --project .
  aof organization-verify --project ./examples/aidlc-template
  aof command-registry-refresh --project .
  aof command-register --project .
  aof command-routing-audit --project .
  aof roadmap-status --project .
  aof verify-archive --project ./examples/aidlc-template --input /tmp/aof-live-verification --max-runs 10
  aof verify-archive-dashboard --index-input ./examples/aidlc-template/.aof/artifacts/verification/verification-archive-index.json --log-input ./examples/aidlc-template/.aof/artifacts/verification/archive-log/verification-archive-log.json --artifact-dir /tmp/aof-verification-archive-dashboard
  aof verify-archive-log --input ./examples/aidlc-template/.aof/artifacts/verification/verification-archive-index.json --artifact-dir /tmp/aof-verification-archive-log
  aof verify-history --input /tmp/aof-live-verification --input /tmp/aof-live-verification-second/verification-bundle.json --artifact-dir /tmp/aof-verification-history
  aof verify-log --input /tmp/aof-live-verification --artifact-dir /tmp/aof-verification-log
  aof verify-lineage --history-input /tmp/aof-verification-history/verification-history.json --log-input /tmp/aof-verification-log/verification-log.json --index-input /tmp/aof-verification-log/verification-index.json --artifact-dir /tmp/aof-verification-lineage
  aof verify-dashboard --history-input /tmp/aof-verification-history/verification-history.json --log-input /tmp/aof-verification-log/verification-log.json --index-input /tmp/aof-verification-log/verification-index.json --lineage-input /tmp/aof-verification-lineage/verification-lineage.json --artifact-dir /tmp/aof-verification-dashboard
  aof verify-dashboard-log --input /tmp/aof-verification-dashboard --artifact-dir /tmp/aof-verification-dashboard-log
  aof verify-dashboard-index --log-input /tmp/aof-verification-dashboard-log/verification-dashboard-log.json --artifact-dir /tmp/aof-verification-dashboard-index
  aof visibility-export --project .
  aof visibility-serve --status-input /tmp/aof-visibility/status-card.json --timeline-input /tmp/aof-visibility/timeline-feed.json --flow-input /tmp/aof-visibility/flow-snapshot.json --mission-input /tmp/aof-visibility/mission-control.json --progress-input /tmp/aof-visibility/operator-progress.json --tree-input /tmp/aof-visibility/tree-position.json --evidence-input /tmp/aof-visibility/evidence-drill-down.json --port 4174
  aof visibility-session --project . --port 4174 --open-browser
  aof packet --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json --stage planning
  aof council --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json --stage review --include-optional
  aof council-exec --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json --stage planning --invoke-model --provider mock
  aof council-exec --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json --stage planning --invoke-model --provider mock --write-artifact /tmp/aof-council-exec.json --timeout-ms 30000 --max-retries 0
  aof council-exec --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json --stage approval --invoke-model --provider mock --mock-seat-decision Builder=reject
  aof provider-check --provider mock
  aof provider-check --provider openai-compatible --model gpt-4.1-mini --base-url https://api.openai.com/v1 --api-key-env OPENAI_API_KEY --ping
  aof provider-check --provider openai-compatible --model gpt-4.1-mini --base-url https://api.openai.com/v1 --api-key-env OPENAI_API_KEY --ping --write-artifact /tmp/aof-provider-check.json --timeout-ms 30000 --max-retries 0
  aof escalation-resolve --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json --resolution reopen --note "Needs wider review"
  aof signal --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json --signal ./examples/aidlc-template/.aof/signals/SIG-001.json
`);
}

function parseArgs(argv) {
  const [, , command, ...rest] = argv;

  if (!command || command === "--help" || command === "-h") {
    return { command: "help", options: { json: rest.includes("--json") } };
  }

  if (!SUPPORTED_COMMANDS.has(command)) {
    throw new Error(`Unsupported command: ${command}`);
  }

  if (rest.includes("--help") || rest.includes("-h")) {
    return { command: "help", options: { targetCommand: command, json: rest.includes("--json") } };
  }

  if (command === "run" && rest.length === 0) {
    throw new Error("Missing request string for `run`.");
  }

  const options = command === "run"
    ? { project: ".", request: rest[0], routingMode: null }
    : command === "init"
      ? {
          project: ".",
          topology: "",
          writeTarget: "",
          projectType: "",
          domainSummary: "",
          installMode: "runtime-on"
        }
    : command === "upgrade"
      ? {
          project: ".",
          writeTarget: "",
          installMode: ""
        }
    : command === "answer"
      ? { session: "", responses: [] }
      : command === "outcome-report"
        ? { session: "", result: "", note: "", signalRef: "" }
      : command === "task-open"
        ? {
            project: ".",
            title: "",
            description: "",
            origin: "",
            orchestratorSessionId: "",
            assignedSessionIds: [],
            relatedDecisionRecordId: "",
            operatingGoalRef: "",
            triageNotes: ""
          }
      : command === "goal-project"
        ? {
            project: ".",
            goalType: "",
            content: "",
            agreedWithHuman: null,
            sourceSessionId: "",
            sourceDecisionRecordId: "",
            declaredComplete: false
          }
      : command === "task-update"
        ? {
            project: ".",
            taskId: "",
            status: "",
            assignedSessionIds: [],
            relatedDecisionRecordId: "",
            triageNotes: ""
          }
      : command === "confirmation-window-record"
        ? {
            project: ".",
            question: "",
            answer: "",
            expectationState: "",
            mismatchState: "",
            scaleDirection: "",
            sourceSessionId: "",
            sourceDecisionRecordId: "",
            maxEntries: 3
          }
      : command === "alignment-pulse"
        ? {
            project: ".",
            question: "",
            answer: "",
            expectationState: "",
            mismatchState: "",
            scaleDirection: "",
            prioritizedTaskIds: [],
            staleTaskIds: [],
            retireCandidateTaskIds: [],
            triageNote: "",
            sourceSessionId: "",
            sourceDecisionRecordId: "",
            maxEntries: 3
          }
      : command === "cadence-trigger-guide"
        ? {
            project: ".",
            sourceSessionId: "",
            sourceDecisionRecordId: "",
            maxEntries: 3
          }
      : command === "cadence-follow-through"
        ? {
            project: ".",
            resolution: "",
            note: "",
            sourceSessionId: "",
            sourceDecisionRecordId: "",
            maxEntries: 3
          }
      : command === "self-audit-record"
        ? {
            project: ".",
            auditId: "",
            scope: "",
            summary: "",
            detectedGap: "",
            resultState: "",
            nextAction: "",
            relatedTaskIds: [],
            sourceSessionId: "",
            sourceDecisionRecordId: "",
            nextValueSliceContent: "",
            maxEntries: 3
          }
      : command === "retire-candidate-review"
        ? {
            project: ".",
            resolution: "",
            taskIds: [],
            note: "",
            sourceSessionId: "",
            sourceDecisionRecordId: "",
            maxEntries: 3
          }
      : command === "live-verify"
        ? {
            project: ".",
            request: "初回離脱率を下げたい",
            responses: [],
            signalResponses: [],
            escalationResumeResponses: [],
            routingMode: null,
            provider: "",
            model: "",
            baseUrl: "",
            apiKey: "",
            apiKeyEnv: "",
            timeoutMs: undefined,
            maxRetries: undefined,
            temperature: undefined,
            ping: false,
            artifactDir: "",
            includeMiddleStages: false,
            includeApproval: false,
            includeSignalReopen: false,
            includeEscalationReopen: false,
            includeEscalationTerminal: false,
            signalPath: "",
            escalationReopenNote: "",
            escalationApproveNote: "",
            escalationStopNote: "",
            archiveVerification: false,
            archiveDir: "",
            archiveMaxRuns: undefined
          }
      : command === "organization-verify"
        ? {
            project: "."
          }
      : command === "command-registry-refresh"
        ? {
            project: ".",
            artifactPath: ""
          }
      : command === "command-register"
        ? {
            project: "."
          }
      : command === "command-routing-audit"
        ? {
            project: ".",
            artifactPath: ""
          }
      : command === "cli-help-benchmark"
        ? {
            project: ".",
            artifactPath: ""
          }
      : command === "decision-verify"
        ? {
            project: "."
          }
      : command === "decision-register"
        ? {
            project: "."
          }
      : command === "learning-loop-snapshot"
        ? {
            project: "."
          }
      : command === "contract-register"
        ? {
            project: "."
          }
      : command === "dependency-graph"
        ? {
            project: "."
          }
      : command === "metrics-snapshot"
        ? {
            project: "."
          }
      : command === "organization-audit"
        ? {
            project: "."
          }
      : command === "organization-status"
        ? {
            project: "."
          }
      : command === "organization-analytics-snapshot"
        ? {
            project: "."
          }
      : command === "roadmap-status"
        ? {
            project: "."
          }
      : command === "situation-assess"
        ? {
            project: ".",
            artifactPath: ""
          }
      : command === "operator-brief"
        ? {
            project: ".",
            artifactPath: ""
          }
      : command === "operator-progress"
        ? {
            project: ".",
            artifactPath: ""
          }
      : command === "tree-position"
        ? {
            project: ".",
            artifactPath: ""
          }
      : command === "evidence-drill-down"
        ? {
            project: ".",
            artifactPath: ""
          }
      : command === "evidence-drill-down-benchmark"
        ? {
            project: ".",
            artifactPath: ""
          }
      : command === "verify-history"
        ? {
            inputs: [],
            artifactDir: ""
          }
      : command === "verify-archive"
        ? {
            project: ".",
            inputs: [],
            archiveDir: "",
            maxRuns: undefined
          }
      : command === "verify-archive-dashboard"
        ? {
            indexInput: "",
            logInput: "",
            artifactDir: ""
          }
      : command === "verify-archive-log"
        ? {
            inputs: [],
            artifactDir: ""
          }
      : command === "verify-log"
        ? {
            inputs: [],
            artifactDir: ""
          }
      : command === "verify-lineage"
        ? {
            historyInput: "",
            logInput: "",
            indexInput: "",
            artifactDir: ""
          }
      : command === "verify-dashboard"
        ? {
            historyInput: "",
            logInput: "",
            indexInput: "",
            lineageInput: "",
            artifactDir: ""
          }
      : command === "verify-dashboard-log"
        ? {
            inputs: [],
            artifactDir: ""
          }
      : command === "verify-dashboard-index"
        ? {
            logInput: "",
            artifactDir: ""
          }
      : command === "visibility-serve"
        ? {
            statusInput: "",
            timelineInput: "",
            flowInput: "",
            missionInput: "",
            briefInput: "",
            progressInput: "",
            treeInput: "",
            evidenceInput: "",
            runtimeExecutionInput: "",
            host: "127.0.0.1",
            port: 4174,
            title: "AOF Mission Control Dashboard"
          }
      : command === "visibility-session"
        ? {
            project: ".",
            artifactDir: "",
            host: "127.0.0.1",
            port: 4174,
            title: "AOF Human Recognition Interface",
            openBrowser: false
          }
      : command === "mission-control"
        ? {
            project: ".",
            artifactDir: "",
            host: "127.0.0.1",
            port: 4174,
            title: "AOF Mission Control",
            openBrowser: false
          }
      : command === "visibility-export"
        ? {
            project: ".",
            artifactDir: ""
          }
      : command === "runtime-loop-proof"
        ? {
            project: ".",
            request: "初回離脱率を下げたい",
            responses: [],
            provider: "",
            routingMode: null,
            sourceTaskId: "",
            artifactPath: ""
          }
      : command === "packet"
        ? { project: "", session: "", stage: "", role: "" }
        : command === "council" || command === "council-exec"
          ? {
              project: "",
              session: "",
              stage: "",
              role: "",
              includeOptional: false,
              invokeModel: false,
              provider: "",
              model: "",
              baseUrl: "",
              apiKey: "",
              apiKeyEnv: "",
              timeoutMs: undefined,
              maxRetries: undefined,
              mockSeatDecisions: [],
              mockSeatVetos: [],
              temperature: undefined,
              artifactPath: ""
            }
          : command === "provider-check"
            ? {
                provider: "",
                model: "",
                baseUrl: "",
                apiKey: "",
                apiKeyEnv: "",
                timeoutMs: undefined,
                maxRetries: undefined,
                temperature: undefined,
                ping: false,
                artifactPath: ""
              }
          : command === "allocation-plan-record"
            ? {
                project: ".",
                allocationPlanId: "",
                subjectRef: "",
                targetRoleRefs: [],
                candidateResourceRefs: [],
                recommendedAllocations: [],
                unfilledRoleRefs: [],
                policyRefs: [],
                riskNotes: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "policy-evaluation-report"
            ? {
                project: ".",
                evaluationId: "",
                subjectRef: "",
                evaluationScope: "",
                policyRefs: [],
                overallOutcome: "",
                results: [],
                recommendedActions: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "resource-claim-record"
            ? {
                project: ".",
                claimId: "",
                subjectRef: "",
                resourceRef: "",
                claimantRoleRef: "",
                claimScope: "",
                claimStatus: "",
                approvalPolicyRefs: [],
                justification: "",
                allocationPlanRef: "",
                policyEvaluationRef: "",
                expiresAt: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "actor-skill-packet-record"
            ? {
                project: ".",
                packetId: "",
                objective: "",
                actorRef: "",
                roleRef: "",
                teamRef: "",
                assignmentReason: "",
                executionMode: "single-actor",
                requiredSkillRefs: [],
                capabilityFit: [],
                resourceRefs: [],
                policyRefs: [],
                outputArtifactType: "",
                outputArtifactSchemaRef: "",
                requiredSections: [],
                acceptanceCriteria: [],
                reviewCriteria: [],
                blockerSemantics: [],
                characterLabel: "",
                speechBubble: "",
                currentAction: "",
                confidenceLabel: "medium",
                visibleBlockers: [],
                nextAction: "",
                status: "draft",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "actor-assignment-evaluation-record"
            ? {
                project: ".",
                evaluationId: "",
                actorSkillPacketRef: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "actor-execution-gate-record"
            ? {
                project: ".",
                gateId: "",
                actorAssignmentEvaluationRef: "",
                resourceClaimRefs: [],
                policyEvaluationRefs: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "skillful-actor-benchmark"
            ? { project: ".", artifactPath: "" }
          : command === "work-governance-benchmark"
            ? { project: ".", artifactPath: "" }
          : command === "adoption-proof-benchmark"
            ? { project: ".", artifactPath: "" }
          : command === "skillful-actor-hri-projection"
            ? {
                project: ".",
                projectionId: "",
                actorSkillPacketRef: "",
                actorAssignmentEvaluationRef: "",
                actorExecutionGateRef: "",
                skillfulActorBenchmarkRef: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "escalation-resolve"
            ? { session: "", resolution: "", note: "" }
          : command === "role-result-record"
            ? {
                project: ".",
                roleResultId: "",
                role: "",
                stage: "",
                sessionId: "",
                status: "",
                recommendation: "",
                rationale: "",
                signals: [],
                artifactRefs: [],
                decisionRequired: false,
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                blockingReason: "",
                missingInputs: [],
                confidence: undefined,
                artifactPath: ""
              }
          : command === "discovery-question-set-record"
            ? {
                project: ".",
                questionSetId: "",
                discoveryObjective: "",
                keyQuestions: [],
                targetAssumptions: [],
                targetAnomalies: [],
                targetUserOrMarketSlice: "",
                stopContinuePivotSignals: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "breakthrough-pattern-record"
            ? {
                project: ".",
                patternId: "",
                sourceDomain: "",
                triggeringTension: "",
                brokenAssumption: "",
                enablingToolOrMethod: "",
                transferHypothesis: "",
                expectedRelevance: "",
                evidenceRefs: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "breakthrough-library-register"
            ? {
                project: "."
              }
          : command === "assumption-map-record"
            ? {
                project: ".",
                assumptionMapId: "",
                subject: "",
                assumptions: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                artifactPath: ""
              }
          : command === "anomaly-log-record"
            ? {
                project: ".",
                anomalyLogId: "",
                subject: "",
                anomalies: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                artifactPath: ""
              }
          : command === "discovery-judgment-packet"
            ? {
                project: ".",
                judgmentId: "",
                councilId: "",
                judgmentStatus: "",
                decisionSummary: "",
                rationale: "",
                desirabilityAssessment: "",
                feasibilityAssessment: "",
                riskAssessment: "",
                evidenceQualityState: "",
                recommendedNextStep: "",
                questionSetRefs: [],
                artifactRefs: [],
                followUpQuestions: [],
                promotionReady: false,
                handoffRequired: false,
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                artifactPath: ""
              }
          : command === "discovery-handoff-record"
            ? {
                project: ".",
                handoffId: "",
                selectedNeed: "",
                intendedUserOrSegment: "",
                contextSummary: "",
                hypothesis: "",
                evidenceRefs: [],
                rejectedAlternatives: [],
                explicitRisks: [],
                deliveryValidationRequirements: [],
                need: "",
                intent: "",
                context: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                artifactPath: ""
              }
          : command === "discovery-handoff-benchmark"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "release-state-refresh"
            ? {
                project: ".",
                releaseVersion: "",
                releaseTag: "",
                releaseDefinitionRef: "",
                releaseNotesRef: "",
                releaseChecklistRef: "",
                roadmapRef: "",
                releasePlanRef: "",
                organizationMission: "",
                artifactPath: ""
              }
          : command === "release-state-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "archmap-impact-audit"
            ? {
                project: ".",
                cutoffTaskId: "",
                artifactPath: ""
              }
          : command === "review-provenance-audit"
            ? {
                project: ".",
                cutoffTaskId: "",
                artifactPath: ""
              }
          : command === "evidence-independence-audit"
            ? {
                project: ".",
                cutoffTaskId: "",
                artifactPath: ""
              }
          : command === "quality-ledger-record"
            ? {
                project: ".",
                eventId: "",
                eventType: "",
                qualityIntentRef: "",
                workItemRef: "",
                claim: "",
                evidenceRefs: [],
                qifRefs: [],
                priorState: "",
                newState: "",
                confidence: undefined,
                semanticTruthClaimed: false,
                operatorValidated: false,
                governanceAction: "none",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "quality-ledger-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "work-readiness-record"
            ? {
                project: ".",
                recordId: "",
                workItemId: "",
                workItemRef: "",
                readinessStatus: "ready",
                goal: "",
                risk: "",
                lossBoundary: "",
                acceptanceGates: [],
                evidencePlan: [],
                makerRole: "",
                checkerRole: "",
                councilRef: "",
                stopConditions: [],
                qifRefs: [],
                archmapImpactExpected: "unknown",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "work-readiness-audit"
            ? {
                project: ".",
                cutoffTaskId: "",
                artifactPath: ""
              }
          : command === "work-execution-packet-record"
            ? {
                project: ".",
                packetId: "",
                workItemId: "",
                workItemRef: "",
                executionStatus: "ready",
                contextIntegrityRef: "",
                actorHandoffRefs: [],
                executionLineageRef: "",
                verificationEvidenceRefs: [],
                stopContinueDecision: "continue",
                stopContinueRationale: "",
                stopContinueDecidedBy: "",
                stopContinueEvidenceRefs: [],
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "work-execution-packet-audit"
            ? {
                project: ".",
                cutoffTaskId: "",
                artifactPath: ""
              }
          : command === "multi-actor-pilot-record"
            ? {
                project: ".",
                pilotId: "",
                workItemId: "",
                workItemRef: "",
                pilotStatus: "ready",
                parentOrchestratorRef: "",
                coreCouncilRoles: [],
                actorRosterRef: "",
                actorOutputHandoffRefs: [],
                councilJudgmentRef: "",
                workExecutionPacketRef: "",
                makerCheckerCouncilBoundary: "",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "multi-actor-pilot-audit"
            ? {
                project: ".",
                cutoffTaskId: "",
                artifactPath: ""
              }
          : command === "parallel-lane-record"
            ? {
                project: ".",
                pilotId: "",
                workItemId: "",
                workItemRef: "",
                pilotStatus: "ready",
                parentMultiActorPilotRef: "",
                workExecutionPacketRef: "",
                lanes: [],
                joinStatus: "ready",
                joinDecision: "",
                joinedLaneIds: [],
                conflictSummary: "",
                blockerSummary: "",
                mergeRationale: "",
                councilAuthority: "",
                councilDecisionRef: "",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "parallel-lane-audit"
            ? {
                project: ".",
                cutoffTaskId: "",
                artifactPath: ""
              }
          : command === "requirement-coverage-record"
            ? {
                project: ".",
                recordId: "",
                workItemId: "",
                workItemRef: "",
                coverageStatus: "ready",
                requirements: [],
                coverageSummary: null,
                forecast: null,
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "requirement-coverage-audit"
            ? {
                project: ".",
                cutoffTaskId: "",
                artifactPath: ""
              }
          : command === "session-export-record"
            ? {
                project: ".",
                exportId: "",
                workItemId: "",
                workItemRef: "",
                exportStatus: "ready",
                sourceSessionRef: "",
                providerSource: null,
                eventSummaries: [],
                taskRefs: [],
                requirementRefs: [],
                testEvidenceRefs: [],
                artifactRefs: [],
                riskCandidates: [],
                decisionCandidates: [],
                releaseReadyEvidenceRefs: [],
                redactionBoundary: "",
                releaseReadyBoundary: "",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "session-export-audit"
            ? {
                project: ".",
                cutoffTaskId: "",
                artifactPath: ""
              }
          : command === "agent-session-record"
            ? {
                project: ".",
                streamId: "",
                sessionId: "",
                parentSessionId: "",
                actorRef: "",
                roleRef: "",
                provider: "local",
                model: "unspecified",
                events: [],
                taskRefs: [],
                requirementRefs: [],
                testEvidenceRefs: [],
                commitRefs: [],
                prRefs: [],
                artifactRefs: [],
                riskCandidates: [],
                decisionCandidates: [],
                releaseReadyClaim: "",
                releaseReadyEvidenceRefs: [],
                releaseReadyVerdict: "not_ready",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "session-observability-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "context-integrity-record"
            ? {
                project: ".",
                recordId: "",
                workItemId: "",
                workItemRef: "",
                sessionRef: "",
                contextPackRefs: [],
                declaredContextRefs: [],
                requiredContextRefs: [],
                missingContextRefs: [],
                hiddenContextSignals: [],
                integrityStatus: "ready",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "external-reference-integrity-record"
            ? {
                project: ".",
                recordId: "",
                externalRef: "",
                externalRefArtifactRef: "",
                sourceSystem: "",
                url: "",
                relationship: "",
                sourceOfTruth: "",
                syncPolicy: "",
                usagePurpose: "",
                freshnessRequired: false,
                observedAt: "",
                freshnessStatus: "not_required",
                availabilityStatus: "not_checked",
                integrityStatus: "ready",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "context-reference-integrity-audit"
            ? {
                project: ".",
                cutoffTaskId: "",
                artifactPath: ""
              }
          : command === "externalization-readiness-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "external-runtime-resource-record"
            ? {
                project: ".",
                resourceId: "",
                resourceKind: "",
                displayName: "",
                canonicalRef: "",
                sourceSystem: "",
                ownerRef: "",
                sourceOfTruth: "",
                permissionBoundary: "",
                freshnessBoundary: "",
                availabilityBoundary: "",
                approvalBoundary: "",
                sideEffectBoundary: "",
                allowedOperations: [],
                readinessStatus: "ready",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "external-resource-use-record"
            ? {
                project: ".",
                useId: "",
                workItemId: "",
                workItemRef: "",
                sessionRef: "",
                resourceRef: "",
                usePurpose: "",
                operationType: "read",
                approvalStatus: "not_required",
                approvalRef: "",
                executionStatus: "planned",
                outputArtifactRefs: [],
                riskCandidates: [],
                decisionCandidates: [],
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "external-resource-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "provider-adapter-record"
            ? {
                project: ".",
                adapterId: "",
                displayName: "",
                providerRef: "",
                resourceRef: "",
                adapterKind: "read_only",
                operationModes: [],
                readAuthorityBoundary: "",
                writeAuthorityBoundary: "",
                freshnessCheck: "",
                approvalPolicyRef: "",
                sideEffectBoundary: "",
                escalationRequiredFor: [],
                readinessStatus: "ready",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "provider-adapter-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "provider-adapter-pilot-record"
            ? {
                project: ".",
                pilotId: "",
                adapterRef: "",
                workItemId: "",
                workItemRef: "",
                sessionRef: "",
                pilotMode: "dry_run",
                approvalStatus: "not_required",
                approvalRef: "",
                expectedExternalEffect: "",
                allowedActions: [],
                deniedActions: [],
                redactionBoundary: "",
                rollbackPlan: "",
                provenanceRefs: [],
                verificationRefs: [],
                stopConditions: [],
                executionStatus: "planned",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "provider-adapter-pilot-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "provider-operation-target-record"
            ? {
                project: ".",
                targetId: "",
                provider: "",
                resource: "",
                operation: "",
                endpoint: "",
                payloadHash: "",
                payloadSummary: "",
                maximumCalls: 1,
                expiresAt: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "human-approval-record"
            ? {
                project: ".",
                approvalId: "",
                approverId: "",
                decision: "approved",
                approvedScopeHash: "",
                approvedAt: "",
                authenticationMethod: "",
                revocationStatus: "active",
                targetOperationRef: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "provider-execution-approval-record"
            ? {
                project: ".",
                approvalId: "",
                pilotRef: "",
                adapterRef: "",
                workItemId: "",
                workItemRef: "",
                sessionRef: "",
                approvalDecision: "pending",
                approvedExecutionMode: "dry_run",
                externalWriteAuthorized: false,
                humanApprovalRef: "",
                targetOperationRef: "",
                executionScope: "",
                allowedOperations: [],
                deniedOperations: [],
                sideEffectBoundary: "",
                redactionBoundary: "",
                rollbackPlan: "",
                credentialBoundary: "",
                budgetBoundary: "",
                credentialScope: [],
                budget: { currency: "none", maximum: 0 },
                rollback: { operation: "not_defined", supported: false, artifact_ref: null },
                provenanceRefs: [],
                verificationRefs: [],
                stopConditions: [],
                productionExecutionStatus: "not_executed",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "provider-execution-approval-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "provider-outcome-evidence-record"
            ? {
                project: ".",
                outcomeId: "",
                approvalRef: "",
                reproductionRef: "",
                rollbackRef: "",
                targetOperationRef: "",
                workItemId: "",
                sessionRef: "",
                expectedOutcome: "",
                observedResult: "",
                outcomeStatus: "blocked",
                evidenceRefs: [],
                verificationRefs: [],
                semanticTruthBoundary: "",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "provider-outcome-evidence-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "provider-learning-loop-record"
            ? {
                project: ".",
                learningId: "",
                outcomeRef: "",
                learningSummary: "",
                decision: "defer",
                nextAction: "",
                updateStatus: "blocked",
                learningRefs: [],
                evidenceRefs: [],
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "provider-learning-loop-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "provider-production-boundary-record"
            ? {
                project: ".",
                boundaryId: "",
                releaseRef: "",
                workItemId: "",
                workItemRef: "",
                missionControlRef: "",
                approvalRef: "",
                reproductionRef: "",
                rollbackRef: "",
                outcomeRef: "",
                learningRef: "",
                operatorAcceptanceRef: "",
                productValueEvidenceRef: "",
                providerScope: "",
                allowedOperationClass: "controlled_write_candidate",
                executionEligibility: "blocked",
                productionExecutionAuthorized: false,
                credentialBoundary: "",
                budgetBoundary: "",
                revocationBoundary: "",
                rollbackBoundary: "",
                monitoringBoundary: "",
                incidentBoundary: "",
                humanGoNoGoBoundary: "",
                productValueComprehensionBoundary: "",
                goNoGoStatus: "not_authorized",
                governanceAction: "block_production_execution",
                stopConditions: [],
                provenanceRefs: [],
                verificationRefs: [],
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "provider-production-boundary-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "operator-acceptance-drill-record"
            ? {
                project: ".",
                drillId: "",
                operatorRef: "",
                workItemId: "",
                approvalRef: "",
                reproductionRef: "",
                rollbackRef: "",
                outcomeRef: "",
                learningRef: "",
                missionControlRef: "",
                decision: "defer",
                decisionRationale: "",
                acceptedRisk: "",
                blockerSummary: "",
                nextAction: "",
                safetyBoundary: "",
                notProven: "",
                evidenceRefs: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "operator-acceptance-drill-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "product-value-evidence-record"
            ? {
                project: ".",
                valueEvidenceId: "",
                releaseRef: "",
                workItemId: "",
                workItemRef: "",
                missionControlRef: "",
                capabilityStatement: "",
                beforeState: "",
                afterState: "",
                scenario: "",
                fiveMinuteDemo: "",
                timeSavedOrWorkReduced: "",
                cognitiveLoadRemoved: "",
                capabilityRows: [],
                understandingOutcome: "not_checked",
                evidenceRefs: [],
                governanceAction: "none",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "product-value-evidence-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "operator-validation-record"
            ? {
                project: ".",
                validationId: "",
                operatorRef: "",
                feedbackSource: "self_hosting_operator",
                releaseRef: "",
                workItemId: "",
                workItemRef: "",
                missionControlRef: "",
                evidenceRefs: [],
                understandingOutcome: "not_checked",
                reproductionOutcome: "not_checked",
                acceptanceOutcome: "not_checked",
                feedbackSummary: "",
                blockingReason: "",
                governanceAction: "none",
                notProven: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                notes: "",
                artifactPath: ""
              }
          : command === "operator-validation-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "problem-statement-record"
            ? {
                project: ".",
                problemStatementId: "",
                affectedParty: "",
                actualProblem: "",
                whyItMatters: "",
                whyNow: "",
                evidenceRefs: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                artifactPath: ""
              }
          : command === "value-hypothesis-record"
            ? {
                project: ".",
                valueHypothesisId: "",
                expectedValueCreation: "",
                beneficiary: "",
                supportingEvidence: [],
                successCriteria: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                artifactPath: ""
              }
          : command === "alternative-analysis-record"
            ? {
                project: ".",
                alternativeAnalysisId: "",
                subjectNeed: "",
                alternativeSolutions: [],
                nonSolutionOptions: [],
                deferOptions: [],
                stopOptions: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                artifactPath: ""
              }
          : command === "experiment-proposal-record"
            ? {
                project: ".",
                experimentProposalId: "",
                assumptionToTest: "",
                smallestTestableValidation: "",
                expectedLearning: "",
                expectedCost: "",
                successThreshold: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                artifactPath: ""
              }
          : command === "project-charter-record"
            ? {
                project: ".",
                projectCharterId: "",
                validatedNeedRef: "",
                validatedObjective: "",
                scope: [],
                constraints: [],
                expectedOutcomes: [],
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                artifactPath: ""
              }
          : command === "need-validation-record"
            ? {
                project: ".",
                validationId: "",
                rawNeed: "",
                validationStatus: "",
                validatedNeed: "",
                decisionSummary: "",
                authorityAction: "",
                projectCreationRecommendation: "",
                validationQuestionsAnswered: [],
                hiddenAssumptions: [],
                evidenceGaps: [],
                problemStatementRef: "",
                valueHypothesisRef: "",
                alternativeAnalysisRef: "",
                experimentProposalRef: "",
                projectCharterRef: "",
                discoveryHandoffRef: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                artifactPath: ""
              }
          : command === "need-validation-advance"
            ? {
                session: "",
                needValidationRecord: "",
                projectCharterRef: ""
              }
          : command === "need-validation-benchmark"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "mission-control-benchmark"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "mission-control-projection-audit"
            ? {
                project: ".",
                artifactPath: ""
              }
          : command === "role-join-record"
            ? {
                project: ".",
                joinId: "",
                stage: "",
                expectedRoles: [],
                receivedRoles: [],
                missingRoles: [],
                aggregateState: "",
                blockingSignals: [],
                recommendedNextStep: "",
                receivedSessionIds: [],
                joinStatus: "",
                summary: "",
                sourceTaskId: "",
                sourceParentSessionId: "",
                decisionRecordRef: "",
                artifactPath: ""
              }
          : command === "team-output-record"
            ? {
                project: ".",
                teamOutputId: "",
                teamId: "",
                stage: "",
                expectedRoles: [],
                receivedRoles: [],
                missingRoles: [],
                aggregateState: "",
                blockingSignals: [],
                recommendedNextStep: "",
                joinedRoleResultRefs: [],
                artifactRefs: [],
                decisionRequired: false,
                summary: "",
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "council-review-packet"
            ? {
                project: ".",
                reviewPacketId: "",
                councilId: "",
                stage: "",
                reviewStatus: "",
                decisionSummary: "",
                rationale: "",
                recommendation: "",
                targetAudience: "",
                expectedUserReaction: "",
                blockingReasons: [],
                artifactChangeRecommendations: [],
                organizationChangeRecommendations: [],
                diagnosisCategory: "",
                diagnosisConfidence: undefined,
                diagnosisEvidenceRefs: [],
                humanOverrideSignal: "",
                teamOutputRefs: [],
                roleResultRefs: [],
                evidenceRefs: [],
                followUpTaskIds: [],
                escalationRequired: false,
                sourceTaskId: "",
                sourceDecisionRecordId: "",
                sourceParentSessionId: "",
                artifactPath: ""
              }
          : command === "execution-lineage"
            ? {
                project: ".",
                sourceParentSessionId: "",
                sourceTaskId: "",
                stage: ""
              }
          : command === "runtime-discipline-benchmark"
            ? {
                project: ".",
                sourceTaskId: "",
                artifactDir: ""
              }
          : { session: "", signal: "" };

  if (WORK_GOVERNANCE_PAYLOAD_COMMANDS.has(command)) {
    Object.assign(options, {
      project: ".",
      payload: null,
      artifactPath: ""
    });
  }

  for (let i = command === "run" ? 1 : 0; i < rest.length; i += 1) {
    const part = rest[i];
    if (part === "--project") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --project.");
      }
      options.project = value;
      i += 1;
      continue;
    }
    if (part === "--topology") {
      options.topology = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--write-target") {
      options.writeTarget = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--project-type") {
      options.projectType = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--domain-summary") {
      options.domainSummary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--install-mode") {
      options.installMode = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--fast-track") {
      options.routingMode = "fast-track";
      continue;
    }
    if (part === "--deep-path") {
      options.routingMode = "deep-path";
      continue;
    }
    if (part === "--routing-mode") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --routing-mode.");
      }
      options.routingMode = value;
      i += 1;
      continue;
    }
    if (part === "--session") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --session.");
      }
      options.session = value;
      i += 1;
      continue;
    }
    if (part === "--response") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --response.");
      }
      options.responses.push(value);
      i += 1;
      continue;
    }
    if (part === "--result") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --result.");
      }
      options.result = value;
      i += 1;
      continue;
    }
    if (part === "--title") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --title.");
      }
      options.title = value;
      i += 1;
      continue;
    }
    if (part === "--description") {
      options.description = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--origin") {
      options.origin = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--orchestrator-session-id") {
      options.orchestratorSessionId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--assigned-session-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --assigned-session-id.");
      }
      options.assignedSessionIds.push(value);
      i += 1;
      continue;
    }
    if (part === "--related-decision-record-id") {
      options.relatedDecisionRecordId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--operating-goal-ref") {
      options.operatingGoalRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--triage-notes") {
      options.triageNotes = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--task-id") {
      if (Array.isArray(options.taskIds)) {
        const value = rest[i + 1];
        if (!value) {
          throw new Error("Missing value after --task-id.");
        }
        options.taskIds.push(value);
      } else {
        options.taskId = rest[i + 1] ?? "";
      }
      i += 1;
      continue;
    }
    if (part === "--status") {
      options.status = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--goal-type") {
      options.goalType = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--goal") {
      options.goal = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--content") {
      options.content = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--packet-id") {
      options.packetId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--evaluation-id") {
      options.evaluationId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--gate-id") {
      options.gateId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--record-id") {
      options.recordId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--work-item-id") {
      options.workItemId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--projection-id") {
      options.projectionId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--objective") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --objective.");
      }
      options.objective = value;
      i += 1;
      continue;
    }
    if (part === "--agreed-with-human") {
      options.agreedWithHuman = true;
      continue;
    }
    if (part === "--source-session-id") {
      options.sourceSessionId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--source-decision-record-id") {
      options.sourceDecisionRecordId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--question") {
      options.question = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--answer") {
      options.answer = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--expectation-state") {
      options.expectationState = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--mismatch-state") {
      options.mismatchState = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--scale-direction") {
      options.scaleDirection = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--prioritized-task-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --prioritized-task-id.");
      }
      options.prioritizedTaskIds.push(value);
      i += 1;
      continue;
    }
    if (part === "--stale-task-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --stale-task-id.");
      }
      options.staleTaskIds.push(value);
      i += 1;
      continue;
    }
    if (part === "--retire-candidate-task-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --retire-candidate-task-id.");
      }
      options.retireCandidateTaskIds.push(value);
      i += 1;
      continue;
    }
    if (part === "--related-task-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --related-task-id.");
      }
      options.relatedTaskIds.push(value);
      i += 1;
      continue;
    }
    if (part === "--triage-note") {
      options.triageNote = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--audit-id") {
      options.auditId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--scope") {
      options.scope = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--summary") {
      options.summary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--detected-gap") {
      options.detectedGap = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--result-state") {
      options.resultState = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--next-action") {
      options.nextAction = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--next-value-slice") {
      options.nextValueSliceContent = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--note") {
      options.note = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--max-entries") {
      const raw = rest[i + 1] ?? "";
      options.maxEntries = Number(raw);
      i += 1;
      continue;
    }
    if (part === "--declared-complete") {
      options.declaredComplete = true;
      continue;
    }
    if (part === "--input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --input.");
      }
      options.inputs.push(value);
      i += 1;
      continue;
    }
    if (part === "--history-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --history-input.");
      }
      options.historyInput = value;
      i += 1;
      continue;
    }
    if (part === "--log-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --log-input.");
      }
      options.logInput = value;
      i += 1;
      continue;
    }
    if (part === "--index-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --index-input.");
      }
      options.indexInput = value;
      i += 1;
      continue;
    }
    if (part === "--lineage-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --lineage-input.");
      }
      options.lineageInput = value;
      i += 1;
      continue;
    }
    if (part === "--status-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --status-input.");
      }
      options.statusInput = value;
      i += 1;
      continue;
    }
    if (part === "--timeline-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --timeline-input.");
      }
      options.timelineInput = value;
      i += 1;
      continue;
    }
    if (part === "--flow-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --flow-input.");
      }
      options.flowInput = value;
      i += 1;
      continue;
    }
    if (part === "--mission-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --mission-input.");
      }
      options.missionInput = value;
      i += 1;
      continue;
    }
    if (part === "--brief-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --brief-input.");
      }
      options.briefInput = value;
      i += 1;
      continue;
    }
    if (part === "--progress-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --progress-input.");
      }
      options.progressInput = value;
      i += 1;
      continue;
    }
    if (part === "--tree-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --tree-input.");
      }
      options.treeInput = value;
      i += 1;
      continue;
    }
    if (part === "--evidence-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --evidence-input.");
      }
      options.evidenceInput = value;
      i += 1;
      continue;
    }
    if (part === "--runtime-execution-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --runtime-execution-input.");
      }
      options.runtimeExecutionInput = value;
      i += 1;
      continue;
    }
    if (part === "--open-browser") {
      options.openBrowser = true;
      continue;
    }
    if (part === "--signal-response") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --signal-response.");
      }
      options.signalResponses.push(value);
      i += 1;
      continue;
    }
    if (part === "--escalation-response") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --escalation-response.");
      }
      options.escalationResumeResponses.push(value);
      i += 1;
      continue;
    }
    if (part === "--request") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --request.");
      }
      options.request = value;
      i += 1;
      continue;
    }
    if (part === "--subject-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --subject-ref.");
      }
      options.subjectRef = value;
      i += 1;
      continue;
    }
    if (part === "--resource-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --resource-ref.");
      }
      if (Array.isArray(options.resourceRefs)) {
        options.resourceRefs.push(value);
      } else {
        options.resourceRef = value;
      }
      i += 1;
      continue;
    }
    if (part === "--claimant-role-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --claimant-role-ref.");
      }
      options.claimantRoleRef = value;
      i += 1;
      continue;
    }
    if (part === "--claim-scope") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --claim-scope.");
      }
      options.claimScope = value;
      i += 1;
      continue;
    }
    if (part === "--claim-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --claim-status.");
      }
      options.claimStatus = value;
      i += 1;
      continue;
    }
    if (part === "--actor-skill-packet-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --actor-skill-packet-ref.");
      }
      options.actorSkillPacketRef = value;
      i += 1;
      continue;
    }
    if (part === "--actor-assignment-evaluation-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --actor-assignment-evaluation-ref.");
      }
      options.actorAssignmentEvaluationRef = value;
      i += 1;
      continue;
    }
    if (part === "--actor-execution-gate-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --actor-execution-gate-ref.");
      }
      options.actorExecutionGateRef = value;
      i += 1;
      continue;
    }
    if (part === "--skillful-actor-benchmark-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --skillful-actor-benchmark-ref.");
      }
      options.skillfulActorBenchmarkRef = value;
      i += 1;
      continue;
    }
    if (part === "--resource-claim-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --resource-claim-ref.");
      }
      options.resourceClaimRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--policy-evaluation-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --policy-evaluation-ref.");
      }
      options.policyEvaluationRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--actor-ref") {
      options.actorRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--role-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --role-ref.");
      }
      options.roleRef = value;
      i += 1;
      continue;
    }
    if (part === "--team-ref") {
      options.teamRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--assignment-reason") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --assignment-reason.");
      }
      options.assignmentReason = value;
      i += 1;
      continue;
    }
    if (part === "--execution-mode") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --execution-mode.");
      }
      options.executionMode = value;
      i += 1;
      continue;
    }
    if (part === "--skill-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --skill-ref.");
      }
      options.requiredSkillRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--capability-fit-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --capability-fit-json.");
      }
      options.capabilityFit.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--output-artifact-type") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --output-artifact-type.");
      }
      options.outputArtifactType = value;
      i += 1;
      continue;
    }
    if (part === "--output-artifact-schema-ref") {
      options.outputArtifactSchemaRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--required-section") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --required-section.");
      }
      options.requiredSections.push(value);
      i += 1;
      continue;
    }
    if (part === "--acceptance-criterion") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --acceptance-criterion.");
      }
      options.acceptanceCriteria.push(value);
      i += 1;
      continue;
    }
    if (part === "--review-criterion-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --review-criterion-json.");
      }
      options.reviewCriteria.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--blocker-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --blocker-json.");
      }
      options.blockerSemantics.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--character-label") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --character-label.");
      }
      options.characterLabel = value;
      i += 1;
      continue;
    }
    if (part === "--speech-bubble") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --speech-bubble.");
      }
      options.speechBubble = value;
      i += 1;
      continue;
    }
    if (part === "--current-action") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --current-action.");
      }
      options.currentAction = value;
      i += 1;
      continue;
    }
    if (part === "--confidence-label") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --confidence-label.");
      }
      options.confidenceLabel = value;
      i += 1;
      continue;
    }
    if (part === "--visible-blocker") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --visible-blocker.");
      }
      options.visibleBlockers.push(value);
      i += 1;
      continue;
    }
    if (part === "--evaluation-scope") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --evaluation-scope.");
      }
      options.evaluationScope = value;
      i += 1;
      continue;
    }
    if (part === "--justification") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --justification.");
      }
      options.justification = value;
      i += 1;
      continue;
    }
    if (part === "--overall-outcome") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --overall-outcome.");
      }
      options.overallOutcome = value;
      i += 1;
      continue;
    }
    if (part === "--allocation-plan-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --allocation-plan-ref.");
      }
      options.allocationPlanRef = value;
      i += 1;
      continue;
    }
    if (part === "--policy-evaluation-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --policy-evaluation-ref.");
      }
      options.policyEvaluationRef = value;
      i += 1;
      continue;
    }
    if (part === "--expires-at") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --expires-at.");
      }
      options.expiresAt = value;
      i += 1;
      continue;
    }
    if (part === "--stage") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --stage.");
      }
      options.stage = value;
      i += 1;
      continue;
    }
    if (part === "--role") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --role.");
      }
      options.role = value;
      i += 1;
      continue;
    }
    if (part === "--signal") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --signal.");
      }
      if (Array.isArray(options.signals)) {
        options.signals.push(value);
      } else if (Array.isArray(options.stopContinuePivotSignals)) {
        options.stopContinuePivotSignals.push(value);
      } else {
        options.signal = value;
      }
      i += 1;
      continue;
    }
    if (part === "--session-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --session-id.");
      }
      options.sessionId = value;
      i += 1;
      continue;
    }
    if (part === "--session-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --session-ref.");
      }
      options.sessionRef = value;
      i += 1;
      continue;
    }
    if (part === "--parent-session-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --parent-session-id.");
      }
      options.parentSessionId = value;
      i += 1;
      continue;
    }
    if (part === "--team-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --team-id.");
      }
      options.teamId = value;
      i += 1;
      continue;
    }
    if (part === "--council-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --council-id.");
      }
      options.councilId = value;
      i += 1;
      continue;
    }
    if (part === "--review-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --review-status.");
      }
      options.reviewStatus = value;
      i += 1;
      continue;
    }
    if (part === "--judgment-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --judgment-status.");
      }
      options.judgmentStatus = value;
      i += 1;
      continue;
    }
    if (part === "--decision-summary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --decision-summary.");
      }
      options.decisionSummary = value;
      i += 1;
      continue;
    }
    if (part === "--raw-need") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --raw-need.");
      }
      options.rawNeed = value;
      i += 1;
      continue;
    }
    if (part === "--validation-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --validation-status.");
      }
      options.validationStatus = value;
      i += 1;
      continue;
    }
    if (part === "--validated-need") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --validated-need.");
      }
      options.validatedNeed = value;
      i += 1;
      continue;
    }
    if (part === "--authority-action") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --authority-action.");
      }
      options.authorityAction = value;
      i += 1;
      continue;
    }
    if (part === "--project-creation-recommendation") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --project-creation-recommendation.");
      }
      options.projectCreationRecommendation = value;
      i += 1;
      continue;
    }
    if (part === "--discovery-objective") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --discovery-objective.");
      }
      options.discoveryObjective = value;
      i += 1;
      continue;
    }
    if (part === "--key-question") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --key-question.");
      }
      options.keyQuestions.push(value);
      i += 1;
      continue;
    }
    if (part === "--target-assumption") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --target-assumption.");
      }
      options.targetAssumptions.push(value);
      i += 1;
      continue;
    }
    if (part === "--target-role-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --target-role-ref.");
      }
      options.targetRoleRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--candidate-resource-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --candidate-resource-ref.");
      }
      options.candidateResourceRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--target-anomaly") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --target-anomaly.");
      }
      options.targetAnomalies.push(value);
      i += 1;
      continue;
    }
    if (part === "--target-user-or-market-slice") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --target-user-or-market-slice.");
      }
      options.targetUserOrMarketSlice = value;
      i += 1;
      continue;
    }
    if (part === "--source-domain") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --source-domain.");
      }
      options.sourceDomain = value;
      i += 1;
      continue;
    }
    if (part === "--event-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --event-id.");
      }
      options.eventId = value;
      i += 1;
      continue;
    }
    if (part === "--event-type") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --event-type.");
      }
      options.eventType = value;
      i += 1;
      continue;
    }
    if (part === "--event-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --event-json.");
      }
      options.events.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--quality-intent-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --quality-intent-ref.");
      }
      options.qualityIntentRef = value;
      i += 1;
      continue;
    }
    if (part === "--work-item-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --work-item-ref.");
      }
      options.workItemRef = value;
      i += 1;
      continue;
    }
    if (part === "--context-pack-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --context-pack-ref.");
      }
      options.contextPackRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--declared-context-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --declared-context-ref.");
      }
      options.declaredContextRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--required-context-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --required-context-ref.");
      }
      options.requiredContextRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--missing-context-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --missing-context-ref.");
      }
      options.missingContextRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--hidden-context-signal") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --hidden-context-signal.");
      }
      options.hiddenContextSignals.push(value);
      i += 1;
      continue;
    }
    if (part === "--integrity-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --integrity-status.");
      }
      options.integrityStatus = value;
      i += 1;
      continue;
    }
    if (part === "--not-proven") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --not-proven.");
      }
      options.notProven = value;
      i += 1;
      continue;
    }
    if (part === "--external-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --external-ref.");
      }
      options.externalRef = value;
      i += 1;
      continue;
    }
    if (part === "--external-ref-artifact-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --external-ref-artifact-ref.");
      }
      options.externalRefArtifactRef = value;
      i += 1;
      continue;
    }
    if (part === "--source-system") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --source-system.");
      }
      options.sourceSystem = value;
      i += 1;
      continue;
    }
    if (part === "--url") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --url.");
      }
      options.url = value;
      i += 1;
      continue;
    }
    if (part === "--relationship") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --relationship.");
      }
      options.relationship = value;
      i += 1;
      continue;
    }
    if (part === "--source-of-truth") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --source-of-truth.");
      }
      options.sourceOfTruth = value;
      i += 1;
      continue;
    }
    if (part === "--sync-policy") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --sync-policy.");
      }
      options.syncPolicy = value;
      i += 1;
      continue;
    }
    if (part === "--usage-purpose") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --usage-purpose.");
      }
      options.usagePurpose = value;
      i += 1;
      continue;
    }
    if (part === "--freshness-required") {
      options.freshnessRequired = true;
      continue;
    }
    if (part === "--observed-at") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --observed-at.");
      }
      options.observedAt = value;
      i += 1;
      continue;
    }
    if (part === "--freshness-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --freshness-status.");
      }
      options.freshnessStatus = value;
      i += 1;
      continue;
    }
    if (part === "--availability-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --availability-status.");
      }
      options.availabilityStatus = value;
      i += 1;
      continue;
    }
    if (part === "--task-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --task-ref.");
      }
      options.taskRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--requirement-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --requirement-ref.");
      }
      options.requirementRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--test-evidence-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --test-evidence-ref.");
      }
      options.testEvidenceRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--commit-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --commit-ref.");
      }
      options.commitRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--pr-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --pr-ref.");
      }
      options.prRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--claim") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --claim.");
      }
      options.claim = value;
      i += 1;
      continue;
    }
    if (part === "--risk") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --risk.");
      }
      options.risk = value;
      i += 1;
      continue;
    }
    if (part === "--risk-candidate") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --risk-candidate.");
      }
      options.riskCandidates.push(value);
      i += 1;
      continue;
    }
    if (part === "--decision-candidate") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --decision-candidate.");
      }
      options.decisionCandidates.push(value);
      i += 1;
      continue;
    }
    if (part === "--release-ready-evidence-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --release-ready-evidence-ref.");
      }
      options.releaseReadyEvidenceRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--release-ready-claim") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --release-ready-claim.");
      }
      options.releaseReadyClaim = value;
      i += 1;
      continue;
    }
    if (part === "--release-ready-verdict") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --release-ready-verdict.");
      }
      options.releaseReadyVerdict = value;
      i += 1;
      continue;
    }
    if (part === "--loss-boundary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --loss-boundary.");
      }
      options.lossBoundary = value;
      i += 1;
      continue;
    }
    if (part === "--acceptance-gate") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --acceptance-gate.");
      }
      options.acceptanceGates.push(value);
      i += 1;
      continue;
    }
    if (part === "--evidence-plan") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --evidence-plan.");
      }
      options.evidencePlan.push(value);
      i += 1;
      continue;
    }
    if (part === "--maker-role") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --maker-role.");
      }
      options.makerRole = value;
      i += 1;
      continue;
    }
    if (part === "--checker-role") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --checker-role.");
      }
      options.checkerRole = value;
      i += 1;
      continue;
    }
    if (part === "--council-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --council-ref.");
      }
      options.councilRef = value;
      i += 1;
      continue;
    }
    if (part === "--stop-condition") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --stop-condition.");
      }
      options.stopConditions.push(value);
      i += 1;
      continue;
    }
    if (part === "--readiness-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --readiness-status.");
      }
      options.readinessStatus = value;
      i += 1;
      continue;
    }
    if (part === "--resource-kind") {
      options.resourceKind = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--adapter-id") {
      options.adapterId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--pilot-id") {
      options.pilotId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--target-id") {
      options.targetId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--approval-id") {
      options.approvalId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--outcome-id") {
      options.outcomeId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--learning-id") {
      options.learningId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--drill-id") {
      options.drillId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--validation-id") {
      options.validationId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--value-evidence-id") {
      options.valueEvidenceId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--operator-ref") {
      options.operatorRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--feedback-source") {
      options.feedbackSource = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--release-ref") {
      options.releaseRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--mission-control-ref") {
      options.missionControlRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--capability-statement") {
      options.capabilityStatement = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--before-state") {
      options.beforeState = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--after-state") {
      options.afterState = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--scenario") {
      options.scenario = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--five-minute-demo") {
      options.fiveMinuteDemo = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--time-saved-or-work-reduced") {
      options.timeSavedOrWorkReduced = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--cognitive-load-removed") {
      options.cognitiveLoadRemoved = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--capability-row-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --capability-row-json.");
      }
      options.capabilityRows.push(value);
      i += 1;
      continue;
    }
    if (part === "--understanding-outcome") {
      options.understandingOutcome = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--reproduction-outcome") {
      options.reproductionOutcome = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--acceptance-outcome") {
      options.acceptanceOutcome = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--feedback-summary") {
      options.feedbackSummary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--blocking-reason") {
      options.blockingReason = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--governance-action") {
      options.governanceAction = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--adapter-kind") {
      options.adapterKind = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--provider-ref") {
      options.providerRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--adapter-ref") {
      options.adapterRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--pilot-ref") {
      options.pilotRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--resource-id") {
      options.resourceId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--display-name") {
      options.displayName = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--canonical-ref") {
      options.canonicalRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--owner-ref") {
      options.ownerRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--permission-boundary") {
      options.permissionBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--freshness-boundary") {
      options.freshnessBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--availability-boundary") {
      options.availabilityBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--approval-boundary") {
      options.approvalBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--side-effect-boundary") {
      options.sideEffectBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--allowed-operation") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --allowed-operation.");
      }
      options.allowedOperations.push(value);
      i += 1;
      continue;
    }
    if (part === "--operation-mode") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --operation-mode.");
      }
      options.operationModes.push(value);
      i += 1;
      continue;
    }
    if (part === "--pilot-mode") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --pilot-mode.");
      }
      options.pilotMode = value;
      i += 1;
      continue;
    }
    if (part === "--approval-decision") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --approval-decision.");
      }
      options.approvalDecision = value;
      i += 1;
      continue;
    }
    if (part === "--decision") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --decision.");
      }
      options.decision = value;
      i += 1;
      continue;
    }
    if (part === "--approved-execution-mode") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --approved-execution-mode.");
      }
      options.approvedExecutionMode = value;
      i += 1;
      continue;
    }
    if (part === "--external-write-authorized") {
      options.externalWriteAuthorized = true;
      continue;
    }
    if (part === "--human-approval-ref") {
      options.humanApprovalRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--target-operation-ref") {
      options.targetOperationRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--approver-id") {
      options.approverId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--approved-scope-hash") {
      options.approvedScopeHash = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--approved-at") {
      options.approvedAt = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--authentication-method") {
      options.authenticationMethod = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--revocation-status") {
      options.revocationStatus = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--provider") {
      options.provider = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--resource") {
      options.resource = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--operation") {
      options.operation = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--endpoint") {
      options.endpoint = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--payload-hash") {
      options.payloadHash = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--payload-summary") {
      options.payloadSummary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--maximum-calls") {
      options.maximumCalls = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--expires-at") {
      options.expiresAt = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--execution-scope") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --execution-scope.");
      }
      options.executionScope = value;
      i += 1;
      continue;
    }
    if (part === "--expected-external-effect") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --expected-external-effect.");
      }
      options.expectedExternalEffect = value;
      i += 1;
      continue;
    }
    if (part === "--allowed-action") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --allowed-action.");
      }
      options.allowedActions.push(value);
      i += 1;
      continue;
    }
    if (part === "--denied-action") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --denied-action.");
      }
      options.deniedActions.push(value);
      i += 1;
      continue;
    }
    if (part === "--denied-operation") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --denied-operation.");
      }
      options.deniedOperations.push(value);
      i += 1;
      continue;
    }
    if (part === "--rollback-plan") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --rollback-plan.");
      }
      options.rollbackPlan = value;
      i += 1;
      continue;
    }
    if (part === "--provenance-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --provenance-ref.");
      }
      options.provenanceRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--verification-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --verification-ref.");
      }
      options.verificationRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--read-authority-boundary") {
      options.readAuthorityBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--write-authority-boundary") {
      options.writeAuthorityBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--freshness-check") {
      options.freshnessCheck = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--approval-policy-ref") {
      options.approvalPolicyRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--escalation-required-for") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --escalation-required-for.");
      }
      options.escalationRequiredFor.push(value);
      i += 1;
      continue;
    }
    if (part === "--use-id") {
      options.useId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--use-purpose") {
      options.usePurpose = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--operation-type") {
      options.operationType = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--approval-status") {
      options.approvalStatus = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--approval-ref") {
      options.approvalRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--reproduction-ref") {
      options.reproductionRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--rollback-ref") {
      options.rollbackRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--outcome-ref") {
      options.outcomeRef = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--learning-summary") {
      options.learningSummary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--update-status") {
      options.updateStatus = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--learning-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --learning-ref.");
      }
      if (Array.isArray(options.learningRefs)) {
        options.learningRefs.push(value);
      } else {
        options.learningRef = value;
      }
      i += 1;
      continue;
    }
    if (part === "--operator-acceptance-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --operator-acceptance-ref.");
      }
      options.operatorAcceptanceRef = value;
      i += 1;
      continue;
    }
    if (part === "--product-value-evidence-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --product-value-evidence-ref.");
      }
      options.productValueEvidenceRef = value;
      i += 1;
      continue;
    }
    if (part === "--provider-scope") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --provider-scope.");
      }
      options.providerScope = value;
      i += 1;
      continue;
    }
    if (part === "--allowed-operation-class") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --allowed-operation-class.");
      }
      options.allowedOperationClass = value;
      i += 1;
      continue;
    }
    if (part === "--execution-eligibility") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --execution-eligibility.");
      }
      options.executionEligibility = value;
      i += 1;
      continue;
    }
    if (part === "--production-execution-authorized") {
      options.productionExecutionAuthorized = true;
      continue;
    }
    if (part === "--credential-boundary") {
      options.credentialBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--budget-boundary") {
      options.budgetBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--revocation-boundary") {
      options.revocationBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--rollback-boundary") {
      options.rollbackBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--monitoring-boundary") {
      options.monitoringBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--incident-boundary") {
      options.incidentBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--human-go-no-go-boundary") {
      options.humanGoNoGoBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--product-value-comprehension-boundary") {
      options.productValueComprehensionBoundary = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--go-no-go-status") {
      options.goNoGoStatus = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--boundary-id") {
      options.boundaryId = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--credential-scope") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --credential-scope.");
      }
      options.credentialScope.push(value);
      i += 1;
      continue;
    }
    if (part === "--budget-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --budget-json.");
      }
      options.budget = JSON.parse(value);
      i += 1;
      continue;
    }
    if (part === "--rollback-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --rollback-json.");
      }
      options.rollback = JSON.parse(value);
      i += 1;
      continue;
    }
    if (part === "--output-artifact-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --output-artifact-ref.");
      }
      options.outputArtifactRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--execution-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --execution-status.");
      }
      options.executionStatus = value;
      i += 1;
      continue;
    }
    if (part === "--production-execution-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --production-execution-status.");
      }
      options.productionExecutionStatus = value;
      i += 1;
      continue;
    }
    if (part === "--pilot-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --pilot-status.");
      }
      options.pilotStatus = value;
      i += 1;
      continue;
    }
    if (part === "--join-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --join-status.");
      }
      options.joinStatus = value;
      i += 1;
      continue;
    }
    if (part === "--context-integrity-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --context-integrity-ref.");
      }
      options.contextIntegrityRef = value;
      i += 1;
      continue;
    }
    if (part === "--parent-orchestrator-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --parent-orchestrator-ref.");
      }
      options.parentOrchestratorRef = value;
      i += 1;
      continue;
    }
    if (part === "--parent-multi-actor-pilot-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --parent-multi-actor-pilot-ref.");
      }
      options.parentMultiActorPilotRef = value;
      i += 1;
      continue;
    }
    if (part === "--council-role") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --council-role.");
      }
      options.coreCouncilRoles.push(value);
      i += 1;
      continue;
    }
    if (part === "--actor-roster-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --actor-roster-ref.");
      }
      options.actorRosterRef = value;
      i += 1;
      continue;
    }
    if (part === "--actor-output-handoff-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --actor-output-handoff-ref.");
      }
      options.actorOutputHandoffRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--council-judgment-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --council-judgment-ref.");
      }
      options.councilJudgmentRef = value;
      i += 1;
      continue;
    }
    if (part === "--work-execution-packet-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --work-execution-packet-ref.");
      }
      options.workExecutionPacketRef = value;
      i += 1;
      continue;
    }
    if (part === "--lane-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --lane-json.");
      }
      options.lanes.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--requirement-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --requirement-json.");
      }
      options.requirements.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--coverage-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --coverage-status.");
      }
      options.coverageStatus = value;
      i += 1;
      continue;
    }
    if (part === "--coverage-summary-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --coverage-summary-json.");
      }
      options.coverageSummary = JSON.parse(value);
      i += 1;
      continue;
    }
    if (part === "--forecast-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --forecast-json.");
      }
      options.forecast = JSON.parse(value);
      i += 1;
      continue;
    }
    if (part === "--provider-source-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --provider-source-json.");
      }
      options.providerSource = JSON.parse(value);
      i += 1;
      continue;
    }
    if (part === "--event-summary-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --event-summary-json.");
      }
      options.eventSummaries.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--export-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --export-status.");
      }
      options.exportStatus = value;
      i += 1;
      continue;
    }
    if (part === "--source-session-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --source-session-ref.");
      }
      options.sourceSessionRef = value;
      i += 1;
      continue;
    }
    if (part === "--redaction-boundary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --redaction-boundary.");
      }
      options.redactionBoundary = value;
      i += 1;
      continue;
    }
    if (part === "--release-ready-boundary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --release-ready-boundary.");
      }
      options.releaseReadyBoundary = value;
      i += 1;
      continue;
    }
    if (part === "--join-decision") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --join-decision.");
      }
      options.joinDecision = value;
      i += 1;
      continue;
    }
    if (part === "--joined-lane-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --joined-lane-id.");
      }
      options.joinedLaneIds.push(value);
      i += 1;
      continue;
    }
    if (part === "--conflict-summary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --conflict-summary.");
      }
      options.conflictSummary = value;
      i += 1;
      continue;
    }
    if (part === "--blocker-summary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --blocker-summary.");
      }
      options.blockerSummary = value;
      i += 1;
      continue;
    }
    if (part === "--decision-rationale") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --decision-rationale.");
      }
      options.decisionRationale = value;
      i += 1;
      continue;
    }
    if (part === "--accepted-risk") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --accepted-risk.");
      }
      options.acceptedRisk = value;
      i += 1;
      continue;
    }
    if (part === "--safety-boundary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --safety-boundary.");
      }
      options.safetyBoundary = value;
      i += 1;
      continue;
    }
    if (part === "--merge-rationale") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --merge-rationale.");
      }
      options.mergeRationale = value;
      i += 1;
      continue;
    }
    if (part === "--council-authority") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --council-authority.");
      }
      options.councilAuthority = value;
      i += 1;
      continue;
    }
    if (part === "--council-decision-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --council-decision-ref.");
      }
      options.councilDecisionRef = value;
      i += 1;
      continue;
    }
    if (part === "--maker-checker-council-boundary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --maker-checker-council-boundary.");
      }
      options.makerCheckerCouncilBoundary = value;
      i += 1;
      continue;
    }
    if (part === "--actor-handoff-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --actor-handoff-ref.");
      }
      options.actorHandoffRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--execution-lineage-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --execution-lineage-ref.");
      }
      options.executionLineageRef = value;
      i += 1;
      continue;
    }
    if (part === "--verification-evidence-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --verification-evidence-ref.");
      }
      options.verificationEvidenceRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--stop-continue-decision") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --stop-continue-decision.");
      }
      options.stopContinueDecision = value;
      i += 1;
      continue;
    }
    if (part === "--stop-continue-rationale") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --stop-continue-rationale.");
      }
      options.stopContinueRationale = value;
      i += 1;
      continue;
    }
    if (part === "--stop-continue-decided-by") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --stop-continue-decided-by.");
      }
      options.stopContinueDecidedBy = value;
      i += 1;
      continue;
    }
    if (part === "--stop-continue-evidence-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --stop-continue-evidence-ref.");
      }
      options.stopContinueEvidenceRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--archmap-impact-expected") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --archmap-impact-expected.");
      }
      options.archmapImpactExpected = value;
      i += 1;
      continue;
    }
    if (part === "--qif-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --qif-ref.");
      }
      options.qifRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--prior-state") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --prior-state.");
      }
      options.priorState = value;
      i += 1;
      continue;
    }
    if (part === "--new-state") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --new-state.");
      }
      options.newState = value;
      i += 1;
      continue;
    }
    if (part === "--semantic-truth-claimed") {
      options.semanticTruthClaimed = true;
      continue;
    }
    if (part === "--operator-validated") {
      options.operatorValidated = true;
      continue;
    }
    if (part === "--governance-action") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --governance-action.");
      }
      options.governanceAction = value;
      i += 1;
      continue;
    }
    if (part === "--affected-party") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --affected-party.");
      }
      options.affectedParty = value;
      i += 1;
      continue;
    }
    if (part === "--actual-problem") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --actual-problem.");
      }
      options.actualProblem = value;
      i += 1;
      continue;
    }
    if (part === "--why-it-matters") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --why-it-matters.");
      }
      options.whyItMatters = value;
      i += 1;
      continue;
    }
    if (part === "--why-now") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --why-now.");
      }
      options.whyNow = value;
      i += 1;
      continue;
    }
    if (part === "--expected-value-creation") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --expected-value-creation.");
      }
      options.expectedValueCreation = value;
      i += 1;
      continue;
    }
    if (part === "--beneficiary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --beneficiary.");
      }
      options.beneficiary = value;
      i += 1;
      continue;
    }
    if (part === "--subject-need") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --subject-need.");
      }
      options.subjectNeed = value;
      i += 1;
      continue;
    }
    if (part === "--assumption-to-test") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --assumption-to-test.");
      }
      options.assumptionToTest = value;
      i += 1;
      continue;
    }
    if (part === "--smallest-testable-validation") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --smallest-testable-validation.");
      }
      options.smallestTestableValidation = value;
      i += 1;
      continue;
    }
    if (part === "--expected-learning") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --expected-learning.");
      }
      options.expectedLearning = value;
      i += 1;
      continue;
    }
    if (part === "--expected-cost") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --expected-cost.");
      }
      options.expectedCost = value;
      i += 1;
      continue;
    }
    if (part === "--success-threshold") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --success-threshold.");
      }
      options.successThreshold = value;
      i += 1;
      continue;
    }
    if (part === "--validated-need-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --validated-need-ref.");
      }
      options.validatedNeedRef = value;
      i += 1;
      continue;
    }
    if (part === "--validated-objective") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --validated-objective.");
      }
      options.validatedObjective = value;
      i += 1;
      continue;
    }
    if (part === "--need-validation-record") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --need-validation-record.");
      }
      options.needValidationRecord = value;
      i += 1;
      continue;
    }
    if (part === "--triggering-tension") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --triggering-tension.");
      }
      options.triggeringTension = value;
      i += 1;
      continue;
    }
    if (part === "--broken-assumption") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --broken-assumption.");
      }
      options.brokenAssumption = value;
      i += 1;
      continue;
    }
    if (part === "--enabling-tool-or-method") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --enabling-tool-or-method.");
      }
      options.enablingToolOrMethod = value;
      i += 1;
      continue;
    }
    if (part === "--transfer-hypothesis") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --transfer-hypothesis.");
      }
      options.transferHypothesis = value;
      i += 1;
      continue;
    }
    if (part === "--expected-relevance") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --expected-relevance.");
      }
      options.expectedRelevance = value;
      i += 1;
      continue;
    }
    if (part === "--assumption-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --assumption-json.");
      }
      options.assumptions.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--recommended-allocation-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --recommended-allocation-json.");
      }
      options.recommendedAllocations.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--result-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --result-json.");
      }
      options.results.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--anomaly-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --anomaly-json.");
      }
      options.anomalies.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--question-answer-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --question-answer-json.");
      }
      options.validationQuestionsAnswered.push(JSON.parse(value));
      i += 1;
      continue;
    }
    if (part === "--unfilled-role-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --unfilled-role-ref.");
      }
      options.unfilledRoleRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--subject" && (command === "assumption-map-record" || command === "anomaly-log-record")) {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --subject.");
      }
      options.subject = value;
      i += 1;
      continue;
    }
    if (part === "--selected-need") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --selected-need.");
      }
      options.selectedNeed = value;
      i += 1;
      continue;
    }
    if (part === "--intended-user-or-segment") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --intended-user-or-segment.");
      }
      options.intendedUserOrSegment = value;
      i += 1;
      continue;
    }
    if (part === "--context-summary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --context-summary.");
      }
      options.contextSummary = value;
      i += 1;
      continue;
    }
    if (part === "--hypothesis") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --hypothesis.");
      }
      options.hypothesis = value;
      i += 1;
      continue;
    }
    if (part === "--need") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --need.");
      }
      options.need = value;
      i += 1;
      continue;
    }
    if (part === "--release-version") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --release-version.");
      }
      options.releaseVersion = value;
      i += 1;
      continue;
    }
    if (part === "--release-tag") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --release-tag.");
      }
      options.releaseTag = value;
      i += 1;
      continue;
    }
    if (part === "--release-definition-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --release-definition-ref.");
      }
      options.releaseDefinitionRef = value;
      i += 1;
      continue;
    }
    if (part === "--release-notes-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --release-notes-ref.");
      }
      options.releaseNotesRef = value;
      i += 1;
      continue;
    }
    if (part === "--release-checklist-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --release-checklist-ref.");
      }
      options.releaseChecklistRef = value;
      i += 1;
      continue;
    }
    if (part === "--roadmap-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --roadmap-ref.");
      }
      options.roadmapRef = value;
      i += 1;
      continue;
    }
    if (part === "--release-plan-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --release-plan-ref.");
      }
      options.releasePlanRef = value;
      i += 1;
      continue;
    }
    if (part === "--mission") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --mission.");
      }
      options.organizationMission = value;
      i += 1;
      continue;
    }
    if (part === "--intent") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --intent.");
      }
      options.intent = value;
      i += 1;
      continue;
    }
    if (part === "--context") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --context.");
      }
      options.context = value;
      i += 1;
      continue;
    }
    if (part === "--rejected-alternative") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --rejected-alternative.");
      }
      options.rejectedAlternatives.push(value);
      i += 1;
      continue;
    }
    if (part === "--alternative-solution") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --alternative-solution.");
      }
      options.alternativeSolutions.push(value);
      i += 1;
      continue;
    }
    if (part === "--non-solution-option") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --non-solution-option.");
      }
      options.nonSolutionOptions.push(value);
      i += 1;
      continue;
    }
    if (part === "--defer-option") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --defer-option.");
      }
      options.deferOptions.push(value);
      i += 1;
      continue;
    }
    if (part === "--stop-option") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --stop-option.");
      }
      options.stopOptions.push(value);
      i += 1;
      continue;
    }
    if (part === "--risk-note") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --risk-note.");
      }
      options.riskNotes.push(value);
      i += 1;
      continue;
    }
    if (part === "--explicit-risk") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --explicit-risk.");
      }
      options.explicitRisks.push(value);
      i += 1;
      continue;
    }
    if (part === "--recommended-action") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --recommended-action.");
      }
      options.recommendedActions.push(value);
      i += 1;
      continue;
    }
    if (part === "--delivery-validation") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --delivery-validation.");
      }
      options.deliveryValidationRequirements.push(value);
      i += 1;
      continue;
    }
    if (part === "--supporting-evidence") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --supporting-evidence.");
      }
      options.supportingEvidence.push(value);
      i += 1;
      continue;
    }
    if (part === "--success-criterion") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --success-criterion.");
      }
      options.successCriteria.push(value);
      i += 1;
      continue;
    }
    if (part === "--scope-item") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --scope-item.");
      }
      options.scope.push(value);
      i += 1;
      continue;
    }
    if (part === "--constraint") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --constraint.");
      }
      options.constraints.push(value);
      i += 1;
      continue;
    }
    if (part === "--expected-outcome") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --expected-outcome.");
      }
      if (Array.isArray(options.expectedOutcomes)) {
        options.expectedOutcomes.push(value);
      } else {
        options.expectedOutcome = value;
      }
      i += 1;
      continue;
    }
    if (part === "--observed-result") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --observed-result.");
      }
      options.observedResult = value;
      i += 1;
      continue;
    }
    if (part === "--outcome-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --outcome-status.");
      }
      options.outcomeStatus = value;
      i += 1;
      continue;
    }
    if (part === "--semantic-truth-boundary") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --semantic-truth-boundary.");
      }
      options.semanticTruthBoundary = value;
      i += 1;
      continue;
    }
    if (part === "--hidden-assumption") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --hidden-assumption.");
      }
      options.hiddenAssumptions.push(value);
      i += 1;
      continue;
    }
    if (part === "--evidence-gap") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --evidence-gap.");
      }
      options.evidenceGaps.push(value);
      i += 1;
      continue;
    }
    if (part === "--problem-statement-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --problem-statement-ref.");
      }
      options.problemStatementRef = value;
      i += 1;
      continue;
    }
    if (part === "--value-hypothesis-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --value-hypothesis-ref.");
      }
      options.valueHypothesisRef = value;
      i += 1;
      continue;
    }
    if (part === "--alternative-analysis-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --alternative-analysis-ref.");
      }
      options.alternativeAnalysisRef = value;
      i += 1;
      continue;
    }
    if (part === "--experiment-proposal-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --experiment-proposal-ref.");
      }
      options.experimentProposalRef = value;
      i += 1;
      continue;
    }
    if (part === "--project-charter-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --project-charter-ref.");
      }
      options.projectCharterRef = value;
      i += 1;
      continue;
    }
    if (part === "--discovery-handoff-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --discovery-handoff-ref.");
      }
      options.discoveryHandoffRef = value;
      i += 1;
      continue;
    }
    if (part === "--desirability-assessment") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --desirability-assessment.");
      }
      options.desirabilityAssessment = value;
      i += 1;
      continue;
    }
    if (part === "--feasibility-assessment") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --feasibility-assessment.");
      }
      options.feasibilityAssessment = value;
      i += 1;
      continue;
    }
    if (part === "--risk-assessment") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --risk-assessment.");
      }
      options.riskAssessment = value;
      i += 1;
      continue;
    }
    if (part === "--evidence-quality-state") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --evidence-quality-state.");
      }
      options.evidenceQualityState = value;
      i += 1;
      continue;
    }
    if (part === "--note" && (command === "discovery-question-set-record" || command === "breakthrough-pattern-record")) {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --note.");
      }
      options.notes = value;
      i += 1;
      continue;
    }
    if (part === "--recommendation") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --recommendation.");
      }
      options.recommendation = value;
      i += 1;
      continue;
    }
    if (part === "--rationale") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --rationale.");
      }
      options.rationale = value;
      i += 1;
      continue;
    }
    if (part === "--decision-required") {
      options.decisionRequired = true;
      continue;
    }
    if (part === "--escalation-required") {
      options.escalationRequired = true;
      continue;
    }
    if (part === "--promotion-ready") {
      options.promotionReady = true;
      continue;
    }
    if (part === "--handoff-required") {
      options.handoffRequired = true;
      continue;
    }
    if (part === "--artifact-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --artifact-ref.");
      }
      options.artifactRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--policy-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --policy-ref.");
      }
      options.policyRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--approval-policy-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --approval-policy-ref.");
      }
      options.approvalPolicyRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--question-set-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --question-set-ref.");
      }
      options.questionSetRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--follow-up-question") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --follow-up-question.");
      }
      options.followUpQuestions.push(value);
      i += 1;
      continue;
    }
    if (part === "--role-result-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --role-result-ref.");
      }
      if (Array.isArray(options.joinedRoleResultRefs)) {
        options.joinedRoleResultRefs.push(value);
      } else if (Array.isArray(options.roleResultRefs)) {
        options.roleResultRefs.push(value);
      }
      i += 1;
      continue;
    }
    if (part === "--team-output-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --team-output-ref.");
      }
      options.teamOutputRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--evidence-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --evidence-ref.");
      }
      options.evidenceRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--expected-role") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --expected-role.");
      }
      options.expectedRoles.push(value);
      i += 1;
      continue;
    }
    if (part === "--received-role") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --received-role.");
      }
      options.receivedRoles.push(value);
      i += 1;
      continue;
    }
    if (part === "--missing-role") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --missing-role.");
      }
      options.missingRoles.push(value);
      i += 1;
      continue;
    }
    if (part === "--aggregate-state") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --aggregate-state.");
      }
      options.aggregateState = value;
      i += 1;
      continue;
    }
    if (part === "--blocking-signal") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --blocking-signal.");
      }
      options.blockingSignals.push(value);
      i += 1;
      continue;
    }
    if (part === "--recommended-next-step") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --recommended-next-step.");
      }
      options.recommendedNextStep = value;
      i += 1;
      continue;
    }
    if (part === "--received-session-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --received-session-id.");
      }
      options.receivedSessionIds.push(value);
      i += 1;
      continue;
    }
    if (part === "--join-status") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --join-status.");
      }
      options.joinStatus = value;
      i += 1;
      continue;
    }
    if (part === "--source-task-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --source-task-id.");
      }
      options.sourceTaskId = value;
      i += 1;
      continue;
    }
    if (part === "--source-parent-session-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --source-parent-session-id.");
      }
      options.sourceParentSessionId = value;
      i += 1;
      continue;
    }
    if (part === "--decision-record-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --decision-record-ref.");
      }
      options.decisionRecordRef = value;
      i += 1;
      continue;
    }
    if (part === "--blocking-reason") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --blocking-reason.");
      }
      if (Array.isArray(options.blockingReasons)) {
        options.blockingReasons.push(value);
      } else {
        options.blockingReason = value;
      }
      i += 1;
      continue;
    }
    if (part === "--missing-input") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --missing-input.");
      }
      options.missingInputs.push(value);
      i += 1;
      continue;
    }
    if (part === "--confidence") {
      const raw = rest[i + 1] ?? "";
      options.confidence = Number(raw);
      i += 1;
      continue;
    }
    if (part === "--follow-up-task-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --follow-up-task-id.");
      }
      options.followUpTaskIds.push(value);
      i += 1;
      continue;
    }
    if (part === "--target-audience") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --target-audience.");
      }
      options.targetAudience = value;
      i += 1;
      continue;
    }
    if (part === "--expected-user-reaction") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --expected-user-reaction.");
      }
      options.expectedUserReaction = value;
      i += 1;
      continue;
    }
    if (part === "--artifact-change-recommendation") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --artifact-change-recommendation.");
      }
      options.artifactChangeRecommendations.push(value);
      i += 1;
      continue;
    }
    if (part === "--organization-change-recommendation") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --organization-change-recommendation.");
      }
      options.organizationChangeRecommendations.push(value);
      i += 1;
      continue;
    }
    if (part === "--diagnosis-category") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --diagnosis-category.");
      }
      options.diagnosisCategory = value;
      i += 1;
      continue;
    }
    if (part === "--diagnosis-confidence") {
      const raw = rest[i + 1] ?? "";
      options.diagnosisConfidence = Number(raw);
      i += 1;
      continue;
    }
    if (part === "--diagnosis-evidence-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --diagnosis-evidence-ref.");
      }
      options.diagnosisEvidenceRefs.push(value);
      i += 1;
      continue;
    }
    if (part === "--human-override-signal") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --human-override-signal.");
      }
      options.humanOverrideSignal = value;
      i += 1;
      continue;
    }
    if (part === "--signal-ref") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --signal-ref.");
      }
      options.signalRef = value;
      i += 1;
      continue;
    }
    if (part === "--resolution") {
      options.resolution = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--note") {
      options.note = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--include-optional") {
      options.includeOptional = true;
      continue;
    }
    if (part === "--invoke-model") {
      options.invokeModel = true;
      continue;
    }
    if (part === "--provider") {
      options.provider = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--model") {
      options.model = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--base-url") {
      options.baseUrl = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--host") {
      options.host = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--port") {
      const raw = rest[i + 1] ?? "";
      options.port = Number(raw);
      i += 1;
      continue;
    }
    if (part === "--title") {
      options.title = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--api-key") {
      options.apiKey = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--api-key-env") {
      options.apiKeyEnv = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (part === "--temperature") {
      const raw = rest[i + 1] ?? "";
      options.temperature = Number(raw);
      i += 1;
      continue;
    }
    if (part === "--timeout-ms") {
      const raw = rest[i + 1] ?? "";
      options.timeoutMs = Number(raw);
      i += 1;
      continue;
    }
    if (part === "--max-retries") {
      const raw = rest[i + 1] ?? "";
      options.maxRetries = Number(raw);
      i += 1;
      continue;
    }
    if (part === "--mock-seat-decision") {
      const value = rest[i + 1] ?? "";
      options.mockSeatDecisions.push(value);
      i += 1;
      continue;
    }
    if (part === "--mock-seat-veto") {
      const value = rest[i + 1] ?? "";
      options.mockSeatVetos.push(value);
      i += 1;
      continue;
    }
    if (part === "--ping") {
      options.ping = true;
      continue;
    }
    if (part === "--include-approval") {
      options.includeApproval = true;
      continue;
    }
    if (part === "--include-signal-reopen") {
      options.includeSignalReopen = true;
      continue;
    }
    if (part === "--include-escalation-reopen") {
      options.includeEscalationReopen = true;
      continue;
    }
    if (part === "--include-escalation-terminal") {
      options.includeEscalationTerminal = true;
      continue;
    }
    if (part === "--include-middle-stages") {
      options.includeMiddleStages = true;
      continue;
    }
    if (part === "--cutoff-task-id") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --cutoff-task-id.");
      }
      options.cutoffTaskId = value;
      i += 1;
      continue;
    }
    if (part === "--archive") {
      options.archiveVerification = true;
      continue;
    }
    if (part === "--signal-path") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --signal-path.");
      }
      options.signalPath = value;
      i += 1;
      continue;
    }
    if (part === "--escalation-note") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --escalation-note.");
      }
      options.escalationReopenNote = value;
      i += 1;
      continue;
    }
    if (part === "--write-artifact") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --write-artifact.");
      }
      options.artifactPath = value;
      i += 1;
      continue;
    }
    if (part === "--payload-json") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --payload-json.");
      }
      options.payload = JSON.parse(value);
      i += 1;
      continue;
    }
    if (part === "--artifact-dir") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --artifact-dir.");
      }
      options.artifactDir = value;
      i += 1;
      continue;
    }
    if (part === "--archive-dir") {
      const value = rest[i + 1];
      if (!value) {
        throw new Error("Missing value after --archive-dir.");
      }
      options.archiveDir = value;
      i += 1;
      continue;
    }
    if (part === "--archive-max-runs") {
      const raw = rest[i + 1] ?? "";
      options.archiveMaxRuns = Number(raw);
      i += 1;
      continue;
    }
    if (part === "--max-runs") {
      const raw = rest[i + 1] ?? "";
      options.maxRuns = Number(raw);
      i += 1;
      continue;
    }
    throw new Error(`Unknown option: ${part}`);
  }

  if (command === "answer") {
    if (!options.session) {
      throw new Error("Missing --session for `answer`.");
    }
    if (options.responses.length === 0) {
      throw new Error("At least one --response is required for `answer`.");
    }
  }

  if (command === "init") {
    if (!options.topology) {
      throw new Error("Missing --topology for `init`.");
    }
    if (!["self-hosting", "managed-project"].includes(options.topology)) {
      throw new Error("Invalid --topology for `init`.");
    }
    if (options.installMode && !["runtime-on", "framing-only"].includes(options.installMode)) {
      throw new Error("Invalid --install-mode for `init`.");
    }
  }

  if (command === "upgrade" && options.installMode && !["runtime-on", "framing-only"].includes(options.installMode)) {
    throw new Error("Invalid --install-mode for `upgrade`.");
  }

  if (command === "outcome-report") {
    if (!options.session) {
      throw new Error("Missing --session for `outcome-report`.");
    }
    if (!options.result) {
      throw new Error("Missing --result for `outcome-report`.");
    }
    if (!["success", "partial", "failure"].includes(options.result)) {
      throw new Error("Invalid --result for `outcome-report`.");
    }
  }

  if (command === "task-open") {
    if (!options.title) {
      throw new Error("Missing --title for `task-open`.");
    }
  }

  if (command === "goal-project") {
    if (!options.goalType) {
      throw new Error("Missing --goal-type for `goal-project`.");
    }
    if (!["north-star", "operating-goal", "next-value-slice"].includes(options.goalType)) {
      throw new Error("Invalid --goal-type for `goal-project`.");
    }
    if (!options.content) {
      throw new Error("Missing --content for `goal-project`.");
    }
  }

  if (command === "task-update") {
    if (!options.taskId) {
      throw new Error("Missing --task-id for `task-update`.");
    }
    if (options.status && !["open", "assigned", "done", "archived", "retired"].includes(options.status)) {
      throw new Error("Invalid --status for `task-update`.");
    }
  }

  if (command === "confirmation-window-record") {
    if (!options.question) {
      throw new Error("Missing --question for `confirmation-window-record`.");
    }
    if (!options.answer) {
      throw new Error("Missing --answer for `confirmation-window-record`.");
    }
    if (!Number.isInteger(options.maxEntries) || options.maxEntries <= 0) {
      throw new Error("Invalid --max-entries for `confirmation-window-record`.");
    }
  }

  if (command === "alignment-pulse") {
    if (!options.question) {
      throw new Error("Missing --question for `alignment-pulse`.");
    }
    if (!options.answer) {
      throw new Error("Missing --answer for `alignment-pulse`.");
    }
    if (!Number.isInteger(options.maxEntries) || options.maxEntries <= 0) {
      throw new Error("Invalid --max-entries for `alignment-pulse`.");
    }
  }

  if (command === "cadence-trigger-guide") {
    if (!Number.isInteger(options.maxEntries) || options.maxEntries <= 0) {
      throw new Error("Invalid --max-entries for `cadence-trigger-guide`.");
    }
  }

  if (command === "cadence-follow-through") {
    if (options.resolution && !["retire", "keep-open"].includes(options.resolution)) {
      throw new Error("Invalid --resolution for `cadence-follow-through`.");
    }
    if (!Number.isInteger(options.maxEntries) || options.maxEntries <= 0) {
      throw new Error("Invalid --max-entries for `cadence-follow-through`.");
    }
  }

  if (command === "self-audit-record") {
    if (!options.auditId) {
      throw new Error("Missing --audit-id for `self-audit-record`.");
    }
    if (!options.scope) {
      throw new Error("Missing --scope for `self-audit-record`.");
    }
    if (!options.summary) {
      throw new Error("Missing --summary for `self-audit-record`.");
    }
    if (!options.detectedGap) {
      throw new Error("Missing --detected-gap for `self-audit-record`.");
    }
    if (!options.nextAction) {
      throw new Error("Missing --next-action for `self-audit-record`.");
    }
    if (options.resultState && !["active", "stable", "escalate"].includes(options.resultState)) {
      throw new Error("Invalid --result-state for `self-audit-record`.");
    }
    if (!Number.isInteger(options.maxEntries) || options.maxEntries <= 0) {
      throw new Error("Invalid --max-entries for `self-audit-record`.");
    }
  }

  if (command === "retire-candidate-review") {
    if (!["retire", "keep-open"].includes(options.resolution)) {
      throw new Error("Invalid --resolution for `retire-candidate-review`.");
    }
    if (!options.taskIds.length) {
      throw new Error("Missing --task-id for `retire-candidate-review`.");
    }
    if (!options.note) {
      throw new Error("Missing --note for `retire-candidate-review`.");
    }
    if (!Number.isInteger(options.maxEntries) || options.maxEntries <= 0) {
      throw new Error("Invalid --max-entries for `retire-candidate-review`.");
    }
  }

  if (command === "packet") {
    if (!options.session) {
      throw new Error("Missing --session for `packet`.");
    }
    if (!options.stage) {
      throw new Error("Missing --stage for `packet`.");
    }
  }

  if (command === "signal") {
    if (!options.session) {
      throw new Error("Missing --session for `signal`.");
    }
    if (!options.signal) {
      throw new Error("Missing --signal for `signal`.");
    }
  }

  if (command === "escalation-resolve") {
    if (!options.session) {
      throw new Error("Missing --session for `escalation-resolve`.");
    }
    if (!options.resolution) {
      throw new Error("Missing --resolution for `escalation-resolve`.");
    }
    if (!["approve", "reopen", "stop"].includes(options.resolution)) {
      throw new Error("Invalid --resolution for `escalation-resolve`.");
    }
  }

  if (command === "council" || command === "council-exec") {
    if (!options.session) {
      throw new Error(`Missing --session for \`${command}\`.`);
    }
    if (!options.stage) {
      throw new Error(`Missing --stage for \`${command}\`.`);
    }
    if (Number.isNaN(options.temperature)) {
      throw new Error(`Invalid --temperature for \`${command}\`.`);
    }
    if (options.timeoutMs !== undefined && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
      throw new Error(`Invalid --timeout-ms for \`${command}\`.`);
    }
    if (options.maxRetries !== undefined && (!Number.isInteger(options.maxRetries) || options.maxRetries < 0)) {
      throw new Error(`Invalid --max-retries for \`${command}\`.`);
    }
    for (const pair of [...options.mockSeatDecisions, ...options.mockSeatVetos]) {
      if (!pair.includes("=")) {
        throw new Error(`Invalid seat override '${pair}' for \`${command}\`. Use Role=value.`);
      }
    }
  }

  if (command === "provider-check") {
    if (Number.isNaN(options.temperature)) {
      throw new Error("Invalid --temperature for `provider-check`.");
    }
    if (options.timeoutMs !== undefined && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
      throw new Error("Invalid --timeout-ms for `provider-check`.");
    }
    if (options.maxRetries !== undefined && (!Number.isInteger(options.maxRetries) || options.maxRetries < 0)) {
      throw new Error("Invalid --max-retries for `provider-check`.");
    }
  }

  if (command === "live-verify") {
    if (!options.provider) {
      throw new Error("Missing --provider for `live-verify`.");
    }
    if (!options.artifactDir) {
      throw new Error("Missing --artifact-dir for `live-verify`.");
    }
    if (Number.isNaN(options.temperature)) {
      throw new Error("Invalid --temperature for `live-verify`.");
    }
    if (options.timeoutMs !== undefined && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
      throw new Error("Invalid --timeout-ms for `live-verify`.");
    }
    if (options.maxRetries !== undefined && (!Number.isInteger(options.maxRetries) || options.maxRetries < 0)) {
      throw new Error("Invalid --max-retries for `live-verify`.");
    }
    if (options.archiveMaxRuns !== undefined && (!Number.isInteger(options.archiveMaxRuns) || options.archiveMaxRuns <= 0)) {
      throw new Error("Invalid --archive-max-runs for `live-verify`.");
    }
  }

  if (command === "verify-archive") {
    if (!options.project) {
      throw new Error("Missing --project for `verify-archive`.");
    }
    if (!Array.isArray(options.inputs) || options.inputs.length === 0) {
      throw new Error("At least one --input is required for `verify-archive`.");
    }
    if (options.maxRuns !== undefined && (!Number.isInteger(options.maxRuns) || options.maxRuns <= 0)) {
      throw new Error("Invalid --max-runs for `verify-archive`.");
    }
  }

  if (command === "verify-history" || command === "verify-archive-log" || command === "verify-log" || command === "verify-dashboard-log") {
    if (!Array.isArray(options.inputs) || options.inputs.length === 0) {
      throw new Error(`At least one --input is required for \`${command}\`.`);
    }
    if (!options.artifactDir) {
      throw new Error(`Missing --artifact-dir for \`${command}\`.`);
    }
  }

  if (command === "verify-archive-dashboard") {
    if (!options.indexInput || !options.logInput) {
      throw new Error("Missing --index-input or --log-input for `verify-archive-dashboard`.");
    }
    if (!options.artifactDir) {
      throw new Error("Missing --artifact-dir for `verify-archive-dashboard`.");
    }
  }

  if (command === "verify-lineage") {
    if (!options.historyInput || !options.logInput || !options.indexInput) {
      throw new Error("Missing --history-input, --log-input, or --index-input for `verify-lineage`.");
    }
    if (!options.artifactDir) {
      throw new Error("Missing --artifact-dir for `verify-lineage`.");
    }
  }

  if (command === "verify-dashboard") {
    if (!options.historyInput || !options.logInput || !options.indexInput || !options.lineageInput) {
      throw new Error("Missing --history-input, --log-input, --index-input, or --lineage-input for `verify-dashboard`.");
    }
    if (!options.artifactDir) {
      throw new Error("Missing --artifact-dir for `verify-dashboard`.");
    }
  }

  if (command === "verify-dashboard-index") {
    if (!options.logInput) {
      throw new Error("Missing --log-input for `verify-dashboard-index`.");
    }
    if (!options.artifactDir) {
      throw new Error("Missing --artifact-dir for `verify-dashboard-index`.");
    }
  }

  if (command === "visibility-serve") {
    if (!options.statusInput || !options.timelineInput || !options.flowInput) {
      throw new Error("Missing --status-input, --timeline-input, or --flow-input for `visibility-serve`.");
    }
    if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
      throw new Error("Invalid --port for `visibility-serve`.");
    }
  }

  if (command === "visibility-export") {
    if (!options.project) {
      throw new Error("Missing --project for `visibility-export`.");
    }
  }

  if (command === "visibility-session") {
    if (!options.project) {
      throw new Error("Missing --project for `visibility-session`.");
    }
    if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
      throw new Error("Invalid --port for `visibility-session`.");
    }
  }

  if (command === "mission-control") {
    if (!options.project) {
      throw new Error("Missing --project for `mission-control`.");
    }
    if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
      throw new Error("Invalid --port for `mission-control`.");
    }
  }

  if (command === "role-result-record") {
    if (!options.role) {
      throw new Error("Missing --role for `role-result-record`.");
    }
    if (!options.stage) {
      throw new Error("Missing --stage for `role-result-record`.");
    }
    if (!options.sessionId) {
      throw new Error("Missing --session-id for `role-result-record`.");
    }
    if (!options.status) {
      throw new Error("Missing --status for `role-result-record`.");
    }
    if (!["completed", "blocked", "partial"].includes(options.status)) {
      throw new Error("Invalid --status for `role-result-record`.");
    }
    if (!options.recommendation) {
      throw new Error("Missing --recommendation for `role-result-record`.");
    }
    if (!options.rationale) {
      throw new Error("Missing --rationale for `role-result-record`.");
    }
    if (options.confidence !== undefined && (!Number.isFinite(options.confidence) || options.confidence < 0 || options.confidence > 1)) {
      throw new Error("Invalid --confidence for `role-result-record`.");
    }
  }

  if (command === "role-join-record") {
    if (!options.stage) {
      throw new Error("Missing --stage for `role-join-record`.");
    }
    if (!Array.isArray(options.expectedRoles) || options.expectedRoles.length === 0) {
      throw new Error("At least one --expected-role is required for `role-join-record`.");
    }
    if (!options.aggregateState) {
      throw new Error("Missing --aggregate-state for `role-join-record`.");
    }
    if (!options.recommendedNextStep) {
      throw new Error("Missing --recommended-next-step for `role-join-record`.");
    }
    if (options.joinStatus && !["open", "resolved", "escalated"].includes(options.joinStatus)) {
      throw new Error("Invalid --join-status for `role-join-record`.");
    }
  }

  if (command === "runtime-loop-proof") {
    if (!options.project) {
      throw new Error("Missing --project for `runtime-loop-proof`.");
    }
    if (options.routingMode && !["fast-track", "deep-path"].includes(options.routingMode)) {
      throw new Error("Invalid --routing-mode for `runtime-loop-proof`.");
    }
  }

  if (command === "runtime-discipline-benchmark") {
    if (!options.project) {
      throw new Error("Missing --project for `runtime-discipline-benchmark`.");
    }
  }

  if (WORK_GOVERNANCE_PAYLOAD_COMMANDS.has(command)) {
    if (!options.project) {
      throw new Error(`Missing --project for \`${command}\`.`);
    }
    if (!options.payload) {
      throw new Error(`Missing --payload-json for \`${command}\`.`);
    }
  }

  if (command === "allocation-plan-record") {
    if (!options.subjectRef) {
      throw new Error("Missing --subject-ref for `allocation-plan-record`.");
    }
    if (!Array.isArray(options.targetRoleRefs) || options.targetRoleRefs.length === 0) {
      throw new Error("At least one --target-role-ref is required for `allocation-plan-record`.");
    }
    if (!Array.isArray(options.recommendedAllocations) || options.recommendedAllocations.length === 0) {
      throw new Error("At least one --recommended-allocation-json is required for `allocation-plan-record`.");
    }
  }

  if (command === "policy-evaluation-report") {
    if (!options.subjectRef) {
      throw new Error("Missing --subject-ref for `policy-evaluation-report`.");
    }
    if (!options.evaluationScope) {
      throw new Error("Missing --evaluation-scope for `policy-evaluation-report`.");
    }
    if (!options.overallOutcome) {
      throw new Error("Missing --overall-outcome for `policy-evaluation-report`.");
    }
    if (!["allowed", "requires-approval", "requires-review", "escalate", "denied"].includes(options.overallOutcome)) {
      throw new Error("Invalid --overall-outcome for `policy-evaluation-report`.");
    }
    if (!Array.isArray(options.results) || options.results.length === 0) {
      throw new Error("At least one --result-json is required for `policy-evaluation-report`.");
    }
  }

  if (command === "resource-claim-record") {
    if (!options.subjectRef) {
      throw new Error("Missing --subject-ref for `resource-claim-record`.");
    }
    if (!options.resourceRef) {
      throw new Error("Missing --resource-ref for `resource-claim-record`.");
    }
    if (!options.claimantRoleRef) {
      throw new Error("Missing --claimant-role-ref for `resource-claim-record`.");
    }
    if (!options.claimScope) {
      throw new Error("Missing --claim-scope for `resource-claim-record`.");
    }
    if (!options.claimStatus) {
      throw new Error("Missing --claim-status for `resource-claim-record`.");
    }
    if (!["requested", "approved", "denied", "released"].includes(options.claimStatus)) {
      throw new Error("Invalid --claim-status for `resource-claim-record`.");
    }
    if (!options.justification) {
      throw new Error("Missing --justification for `resource-claim-record`.");
    }
  }

  if (command === "actor-skill-packet-record") {
    if (!options.objective) {
      throw new Error("Missing --objective for `actor-skill-packet-record`.");
    }
    if (!options.roleRef) {
      throw new Error("Missing --role-ref for `actor-skill-packet-record`.");
    }
    if (!options.assignmentReason) {
      throw new Error("Missing --assignment-reason for `actor-skill-packet-record`.");
    }
    if (!["single-actor", "council-seat", "team-member", "tool-backed"].includes(options.executionMode)) {
      throw new Error("Invalid --execution-mode for `actor-skill-packet-record`.");
    }
    if (!Array.isArray(options.requiredSkillRefs) || options.requiredSkillRefs.length === 0) {
      throw new Error("At least one --skill-ref is required for `actor-skill-packet-record`.");
    }
    if (!Array.isArray(options.capabilityFit) || options.capabilityFit.length === 0) {
      throw new Error("At least one --capability-fit-json is required for `actor-skill-packet-record`.");
    }
    if (!Array.isArray(options.resourceRefs) || options.resourceRefs.length === 0) {
      throw new Error("At least one --resource-ref is required for `actor-skill-packet-record`.");
    }
    if (!Array.isArray(options.policyRefs) || options.policyRefs.length === 0) {
      throw new Error("At least one --policy-ref is required for `actor-skill-packet-record`.");
    }
    if (!options.outputArtifactType) {
      throw new Error("Missing --output-artifact-type for `actor-skill-packet-record`.");
    }
    if (!Array.isArray(options.requiredSections) || options.requiredSections.length === 0) {
      throw new Error("At least one --required-section is required for `actor-skill-packet-record`.");
    }
    if (!Array.isArray(options.acceptanceCriteria) || options.acceptanceCriteria.length === 0) {
      throw new Error("At least one --acceptance-criterion is required for `actor-skill-packet-record`.");
    }
    if (!Array.isArray(options.reviewCriteria) || options.reviewCriteria.length === 0) {
      throw new Error("At least one --review-criterion-json is required for `actor-skill-packet-record`.");
    }
    if (!Array.isArray(options.blockerSemantics) || options.blockerSemantics.length === 0) {
      throw new Error("At least one --blocker-json is required for `actor-skill-packet-record`.");
    }
    if (!options.characterLabel) {
      throw new Error("Missing --character-label for `actor-skill-packet-record`.");
    }
    if (!options.speechBubble) {
      throw new Error("Missing --speech-bubble for `actor-skill-packet-record`.");
    }
    if (!options.currentAction) {
      throw new Error("Missing --current-action for `actor-skill-packet-record`.");
    }
    if (!["high", "medium", "low", "blocked"].includes(options.confidenceLabel)) {
      throw new Error("Invalid --confidence-label for `actor-skill-packet-record`.");
    }
    if (!options.nextAction) {
      throw new Error("Missing --next-action for `actor-skill-packet-record`.");
    }
    if (!options.sourceTaskId) {
      throw new Error("Missing --source-task-id for `actor-skill-packet-record`.");
    }
    if (!options.sourceParentSessionId) {
      throw new Error("Missing --source-parent-session-id for `actor-skill-packet-record`.");
    }
    if (!["draft", "ready-for-assignment", "blocked", "completed"].includes(options.status)) {
      throw new Error("Invalid --status for `actor-skill-packet-record`.");
    }
  }

  if (command === "actor-assignment-evaluation-record") {
    if (!options.actorSkillPacketRef) {
      throw new Error("Missing --actor-skill-packet-ref for `actor-assignment-evaluation-record`.");
    }
  }

  if (command === "actor-execution-gate-record") {
    if (!options.actorAssignmentEvaluationRef) {
      throw new Error("Missing --actor-assignment-evaluation-ref for `actor-execution-gate-record`.");
    }
  }

  if (command === "skillful-actor-benchmark") {
    if (!options.project) {
      throw new Error("Missing --project for `skillful-actor-benchmark`.");
    }
  }

  if (command === "skillful-actor-hri-projection") {
    if (!options.actorSkillPacketRef) {
      throw new Error("Missing --actor-skill-packet-ref for `skillful-actor-hri-projection`.");
    }
    if (!options.actorAssignmentEvaluationRef) {
      throw new Error("Missing --actor-assignment-evaluation-ref for `skillful-actor-hri-projection`.");
    }
    if (!options.actorExecutionGateRef) {
      throw new Error("Missing --actor-execution-gate-ref for `skillful-actor-hri-projection`.");
    }
    if (!options.skillfulActorBenchmarkRef) {
      throw new Error("Missing --skillful-actor-benchmark-ref for `skillful-actor-hri-projection`.");
    }
  }

  if (command === "discovery-question-set-record") {
    if (!options.discoveryObjective) {
      throw new Error("Missing --discovery-objective for `discovery-question-set-record`.");
    }
    if (!Array.isArray(options.keyQuestions) || options.keyQuestions.length === 0) {
      throw new Error("At least one --key-question is required for `discovery-question-set-record`.");
    }
    if (!options.targetUserOrMarketSlice) {
      throw new Error("Missing --target-user-or-market-slice for `discovery-question-set-record`.");
    }
    if (!Array.isArray(options.stopContinuePivotSignals) || options.stopContinuePivotSignals.length === 0) {
      throw new Error("At least one --signal is required for `discovery-question-set-record`.");
    }
  }

  if (command === "breakthrough-pattern-record") {
    if (!options.sourceDomain) {
      throw new Error("Missing --source-domain for `breakthrough-pattern-record`.");
    }
    if (!options.triggeringTension) {
      throw new Error("Missing --triggering-tension for `breakthrough-pattern-record`.");
    }
    if (!options.brokenAssumption) {
      throw new Error("Missing --broken-assumption for `breakthrough-pattern-record`.");
    }
    if (!options.enablingToolOrMethod) {
      throw new Error("Missing --enabling-tool-or-method for `breakthrough-pattern-record`.");
    }
    if (!options.transferHypothesis) {
      throw new Error("Missing --transfer-hypothesis for `breakthrough-pattern-record`.");
    }
    if (!options.expectedRelevance) {
      throw new Error("Missing --expected-relevance for `breakthrough-pattern-record`.");
    }
  }

  if (command === "assumption-map-record") {
    if (!options.subject) {
      throw new Error("Missing --subject for `assumption-map-record`.");
    }
    if (!Array.isArray(options.assumptions) || options.assumptions.length === 0) {
      throw new Error("At least one --assumption-json is required for `assumption-map-record`.");
    }
  }

  if (command === "anomaly-log-record") {
    if (!options.subject) {
      throw new Error("Missing --subject for `anomaly-log-record`.");
    }
    if (!Array.isArray(options.anomalies) || options.anomalies.length === 0) {
      throw new Error("At least one --anomaly-json is required for `anomaly-log-record`.");
    }
  }

  if (command === "discovery-judgment-packet") {
    if (!options.councilId) {
      throw new Error("Missing --council-id for `discovery-judgment-packet`.");
    }
    if (!options.judgmentStatus) {
      throw new Error("Missing --judgment-status for `discovery-judgment-packet`.");
    }
    if (!["continue-exploration", "pivot", "synthesize-handoff", "stop"].includes(options.judgmentStatus)) {
      throw new Error("Invalid --judgment-status for `discovery-judgment-packet`.");
    }
    if (!options.decisionSummary) {
      throw new Error("Missing --decision-summary for `discovery-judgment-packet`.");
    }
    if (!options.rationale) {
      throw new Error("Missing --rationale for `discovery-judgment-packet`.");
    }
    if (!options.desirabilityAssessment || !options.feasibilityAssessment || !options.riskAssessment) {
      throw new Error("Missing --desirability-assessment, --feasibility-assessment, or --risk-assessment for `discovery-judgment-packet`.");
    }
    if (!options.evidenceQualityState) {
      throw new Error("Missing --evidence-quality-state for `discovery-judgment-packet`.");
    }
    if (!["weak", "mixed", "sufficient", "strong", "contested"].includes(options.evidenceQualityState)) {
      throw new Error("Invalid --evidence-quality-state for `discovery-judgment-packet`.");
    }
    if (!options.recommendedNextStep) {
      throw new Error("Missing --recommended-next-step for `discovery-judgment-packet`.");
    }
  }

  if (command === "discovery-handoff-record") {
    if (!options.selectedNeed) {
      throw new Error("Missing --selected-need for `discovery-handoff-record`.");
    }
    if (!options.intendedUserOrSegment) {
      throw new Error("Missing --intended-user-or-segment for `discovery-handoff-record`.");
    }
    if (!options.contextSummary) {
      throw new Error("Missing --context-summary for `discovery-handoff-record`.");
    }
    if (!options.hypothesis) {
      throw new Error("Missing --hypothesis for `discovery-handoff-record`.");
    }
    if (!options.need || !options.intent || !options.context) {
      throw new Error("Missing --need, --intent, or --context for `discovery-handoff-record`.");
    }
  }

  if (command === "discovery-handoff-benchmark") {
    if (!options.project) {
      throw new Error("Missing --project for `discovery-handoff-benchmark`.");
    }
  }

  if (command === "release-state-refresh") {
    if (!options.project) {
      throw new Error("Missing --project for `release-state-refresh`.");
    }
    if (!options.releaseVersion || !options.releaseTag || !options.releaseDefinitionRef || !options.releaseNotesRef || !options.releaseChecklistRef) {
      throw new Error("Missing required release refs for `release-state-refresh`.");
    }
  }

  if (command === "release-state-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `release-state-audit`.");
    }
  }

  if (command === "archmap-impact-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `archmap-impact-audit`.");
    }
  }

  if (command === "review-provenance-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `review-provenance-audit`.");
    }
  }

  if (command === "evidence-independence-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `evidence-independence-audit`.");
    }
  }

  if (command === "command-registry-refresh" || command === "command-register" || command === "command-routing-audit" || command === "cli-help-benchmark") {
    if (!options.project) {
      throw new Error(`Missing --project for \`${command}\`.`);
    }
  }

  if (command === "agent-session-record") {
    if (!options.sessionId) {
      throw new Error("Missing --session-id for `agent-session-record`.");
    }
    if (!options.actorRef) {
      throw new Error("Missing --actor-ref for `agent-session-record`.");
    }
    if (!options.roleRef) {
      throw new Error("Missing --role-ref for `agent-session-record`.");
    }
    if (!Array.isArray(options.events) || options.events.length === 0) {
      throw new Error("At least one --event-json is required for `agent-session-record`.");
    }
    if (!Array.isArray(options.taskRefs) || options.taskRefs.length === 0) {
      throw new Error("At least one --task-ref is required for `agent-session-record`.");
    }
    if (!Array.isArray(options.requirementRefs) || options.requirementRefs.length === 0) {
      throw new Error("At least one --requirement-ref is required for `agent-session-record`.");
    }
    if (!Array.isArray(options.testEvidenceRefs) || options.testEvidenceRefs.length === 0) {
      throw new Error("At least one --test-evidence-ref is required for `agent-session-record`.");
    }
    if (!Array.isArray(options.riskCandidates) || options.riskCandidates.length === 0) {
      throw new Error("At least one --risk-candidate is required for `agent-session-record`.");
    }
    if (!Array.isArray(options.decisionCandidates) || options.decisionCandidates.length === 0) {
      throw new Error("At least one --decision-candidate is required for `agent-session-record`.");
    }
    if (!Array.isArray(options.releaseReadyEvidenceRefs) || options.releaseReadyEvidenceRefs.length === 0) {
      throw new Error("At least one --release-ready-evidence-ref is required for `agent-session-record`.");
    }
    if (!options.sourceTaskId) {
      throw new Error("Missing --source-task-id for `agent-session-record`.");
    }
    if (!options.sourceParentSessionId) {
      throw new Error("Missing --source-parent-session-id for `agent-session-record`.");
    }
    if (!["not_ready", "structurally_ready", "runtime_ready", "operator_validated"].includes(options.releaseReadyVerdict)) {
      throw new Error("Invalid --release-ready-verdict for `agent-session-record`.");
    }
  }

  if (command === "session-observability-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `session-observability-audit`.");
    }
  }

  if (command === "context-integrity-record") {
    if (!options.workItemId) {
      throw new Error("Missing --work-item-id for `context-integrity-record`.");
    }
    if (!options.workItemRef) {
      throw new Error("Missing --work-item-ref for `context-integrity-record`.");
    }
    if (!options.sessionRef) {
      throw new Error("Missing --session-ref for `context-integrity-record`.");
    }
    if (!["ready", "warning", "blocked", "accepted_residual_risk"].includes(options.integrityStatus)) {
      throw new Error("Invalid --integrity-status for `context-integrity-record`.");
    }
    if (!options.notProven) {
      throw new Error("Missing --not-proven for `context-integrity-record`.");
    }
    if (!options.sourceTaskId) {
      throw new Error("Missing --source-task-id for `context-integrity-record`.");
    }
    if (!options.sourceParentSessionId) {
      throw new Error("Missing --source-parent-session-id for `context-integrity-record`.");
    }
  }

  if (command === "external-reference-integrity-record") {
    for (const [flag, value] of [
      ["--external-ref", options.externalRef],
      ["--external-ref-artifact-ref", options.externalRefArtifactRef],
      ["--source-system", options.sourceSystem],
      ["--url", options.url],
      ["--relationship", options.relationship],
      ["--source-of-truth", options.sourceOfTruth],
      ["--sync-policy", options.syncPolicy],
      ["--usage-purpose", options.usagePurpose],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`external-reference-integrity-record\`.`);
      }
    }
    if (!["not_required", "current", "stale", "unknown"].includes(options.freshnessStatus)) {
      throw new Error("Invalid --freshness-status for `external-reference-integrity-record`.");
    }
    if (!["available", "unavailable", "not_checked"].includes(options.availabilityStatus)) {
      throw new Error("Invalid --availability-status for `external-reference-integrity-record`.");
    }
    if (!["ready", "warning", "blocked", "accepted_residual_risk"].includes(options.integrityStatus)) {
      throw new Error("Invalid --integrity-status for `external-reference-integrity-record`.");
    }
  }

  if (command === "context-reference-integrity-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `context-reference-integrity-audit`.");
    }
  }

  if (command === "work-execution-packet-record") {
    if (!options.workItemId) {
      throw new Error("Missing --work-item-id for `work-execution-packet-record`.");
    }
    if (!options.workItemRef) {
      throw new Error("Missing --work-item-ref for `work-execution-packet-record`.");
    }
    if (!["draft", "ready", "blocked", "completed"].includes(options.executionStatus)) {
      throw new Error("Invalid --execution-status for `work-execution-packet-record`.");
    }
    if (!options.contextIntegrityRef) {
      throw new Error("Missing --context-integrity-ref for `work-execution-packet-record`.");
    }
    if (!Array.isArray(options.actorHandoffRefs) || options.actorHandoffRefs.length === 0) {
      throw new Error("At least one --actor-handoff-ref is required for `work-execution-packet-record`.");
    }
    if (!options.executionLineageRef) {
      throw new Error("Missing --execution-lineage-ref for `work-execution-packet-record`.");
    }
    if (!Array.isArray(options.verificationEvidenceRefs) || options.verificationEvidenceRefs.length === 0) {
      throw new Error("At least one --verification-evidence-ref is required for `work-execution-packet-record`.");
    }
    if (!["continue", "stop", "defer", "reopen"].includes(options.stopContinueDecision)) {
      throw new Error("Invalid --stop-continue-decision for `work-execution-packet-record`.");
    }
    if (!options.stopContinueRationale || !options.stopContinueDecidedBy) {
      throw new Error("Missing --stop-continue-rationale or --stop-continue-decided-by for `work-execution-packet-record`.");
    }
    if (!Array.isArray(options.stopContinueEvidenceRefs) || options.stopContinueEvidenceRefs.length === 0) {
      throw new Error("At least one --stop-continue-evidence-ref is required for `work-execution-packet-record`.");
    }
    if (!options.notProven) {
      throw new Error("Missing --not-proven for `work-execution-packet-record`.");
    }
    if (!options.sourceTaskId) {
      throw new Error("Missing --source-task-id for `work-execution-packet-record`.");
    }
    if (!options.sourceParentSessionId) {
      throw new Error("Missing --source-parent-session-id for `work-execution-packet-record`.");
    }
  }

  if (command === "work-execution-packet-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `work-execution-packet-audit`.");
    }
  }

  if (command === "multi-actor-pilot-record") {
    if (!options.workItemId) {
      throw new Error("Missing --work-item-id for `multi-actor-pilot-record`.");
    }
    if (!options.workItemRef) {
      throw new Error("Missing --work-item-ref for `multi-actor-pilot-record`.");
    }
    if (!["draft", "ready", "blocked", "completed"].includes(options.pilotStatus)) {
      throw new Error("Invalid --pilot-status for `multi-actor-pilot-record`.");
    }
    if (!options.parentOrchestratorRef) {
      throw new Error("Missing --parent-orchestrator-ref for `multi-actor-pilot-record`.");
    }
    for (const role of ["visionary", "builder", "guardian"]) {
      if (!options.coreCouncilRoles.includes(role)) {
        throw new Error(`Missing --council-role ${role} for \`multi-actor-pilot-record\`.`);
      }
    }
    if (!options.actorRosterRef) {
      throw new Error("Missing --actor-roster-ref for `multi-actor-pilot-record`.");
    }
    if (!Array.isArray(options.actorOutputHandoffRefs) || options.actorOutputHandoffRefs.length < 2) {
      throw new Error("At least two --actor-output-handoff-ref values are required for `multi-actor-pilot-record`.");
    }
    if (!options.councilJudgmentRef) {
      throw new Error("Missing --council-judgment-ref for `multi-actor-pilot-record`.");
    }
    if (!options.workExecutionPacketRef) {
      throw new Error("Missing --work-execution-packet-ref for `multi-actor-pilot-record`.");
    }
    if (!options.makerCheckerCouncilBoundary) {
      throw new Error("Missing --maker-checker-council-boundary for `multi-actor-pilot-record`.");
    }
    if (!options.notProven) {
      throw new Error("Missing --not-proven for `multi-actor-pilot-record`.");
    }
    if (!options.sourceTaskId) {
      throw new Error("Missing --source-task-id for `multi-actor-pilot-record`.");
    }
    if (!options.sourceParentSessionId) {
      throw new Error("Missing --source-parent-session-id for `multi-actor-pilot-record`.");
    }
  }

  if (command === "multi-actor-pilot-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `multi-actor-pilot-audit`.");
    }
  }

  if (command === "parallel-lane-record") {
    if (!options.workItemId) {
      throw new Error("Missing --work-item-id for `parallel-lane-record`.");
    }
    if (!options.workItemRef) {
      throw new Error("Missing --work-item-ref for `parallel-lane-record`.");
    }
    if (!["draft", "ready", "blocked", "completed"].includes(options.pilotStatus)) {
      throw new Error("Invalid --pilot-status for `parallel-lane-record`.");
    }
    if (!options.parentMultiActorPilotRef) {
      throw new Error("Missing --parent-multi-actor-pilot-ref for `parallel-lane-record`.");
    }
    if (!options.workExecutionPacketRef) {
      throw new Error("Missing --work-execution-packet-ref for `parallel-lane-record`.");
    }
    if (!Array.isArray(options.lanes) || options.lanes.length < 2) {
      throw new Error("At least two --lane-json values are required for `parallel-lane-record`.");
    }
    if (!["ready", "blocked", "merged", "stopped", "deferred", "reopened"].includes(options.joinStatus)) {
      throw new Error("Invalid --join-status for `parallel-lane-record`.");
    }
    if (!["merge", "stop", "defer", "reopen"].includes(options.joinDecision)) {
      throw new Error("Invalid --join-decision for `parallel-lane-record`.");
    }
    if (!Array.isArray(options.joinedLaneIds) || options.joinedLaneIds.length < 2) {
      throw new Error("At least two --joined-lane-id values are required for `parallel-lane-record`.");
    }
    for (const flag of [
      ["--conflict-summary", options.conflictSummary],
      ["--blocker-summary", options.blockerSummary],
      ["--merge-rationale", options.mergeRationale],
      ["--council-authority", options.councilAuthority],
      ["--council-decision-ref", options.councilDecisionRef],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!flag[1]) {
        throw new Error(`Missing ${flag[0]} for \`parallel-lane-record\`.`);
      }
    }
  }

  if (command === "parallel-lane-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `parallel-lane-audit`.");
    }
  }

  if (command === "requirement-coverage-record") {
    if (!options.workItemId) {
      throw new Error("Missing --work-item-id for `requirement-coverage-record`.");
    }
    if (!options.workItemRef) {
      throw new Error("Missing --work-item-ref for `requirement-coverage-record`.");
    }
    if (!["draft", "ready", "blocked", "completed"].includes(options.coverageStatus)) {
      throw new Error("Invalid --coverage-status for `requirement-coverage-record`.");
    }
    if (!Array.isArray(options.requirements) || options.requirements.length === 0) {
      throw new Error("At least one --requirement-json value is required for `requirement-coverage-record`.");
    }
    if (!options.coverageSummary || typeof options.coverageSummary !== "object") {
      throw new Error("Missing --coverage-summary-json for `requirement-coverage-record`.");
    }
    if (!options.forecast || typeof options.forecast !== "object") {
      throw new Error("Missing --forecast-json for `requirement-coverage-record`.");
    }
    for (const flag of [
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!flag[1]) {
        throw new Error(`Missing ${flag[0]} for \`requirement-coverage-record\`.`);
      }
    }
  }

  if (command === "requirement-coverage-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `requirement-coverage-audit`.");
    }
  }

  if (command === "session-export-record") {
    if (!options.workItemId) {
      throw new Error("Missing --work-item-id for `session-export-record`.");
    }
    if (!options.workItemRef) {
      throw new Error("Missing --work-item-ref for `session-export-record`.");
    }
    if (!["draft", "ready", "blocked", "completed"].includes(options.exportStatus)) {
      throw new Error("Invalid --export-status for `session-export-record`.");
    }
    if (!options.sourceSessionRef) {
      throw new Error("Missing --source-session-ref for `session-export-record`.");
    }
    if (!options.providerSource || typeof options.providerSource !== "object") {
      throw new Error("Missing --provider-source-json for `session-export-record`.");
    }
    if (!Array.isArray(options.eventSummaries) || options.eventSummaries.length === 0) {
      throw new Error("At least one --event-summary-json value is required for `session-export-record`.");
    }
    for (const [flagName, values] of [
      ["--task-ref", options.taskRefs],
      ["--requirement-ref", options.requirementRefs],
      ["--test-evidence-ref", options.testEvidenceRefs],
      ["--artifact-ref", options.artifactRefs],
      ["--risk-candidate", options.riskCandidates],
      ["--decision-candidate", options.decisionCandidates],
      ["--release-ready-evidence-ref", options.releaseReadyEvidenceRefs]
    ]) {
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error(`At least one ${flagName} value is required for \`session-export-record\`.`);
      }
    }
    for (const flag of [
      ["--redaction-boundary", options.redactionBoundary],
      ["--release-ready-boundary", options.releaseReadyBoundary],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!flag[1]) {
        throw new Error(`Missing ${flag[0]} for \`session-export-record\`.`);
      }
    }
  }

  if (command === "session-export-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `session-export-audit`.");
    }
  }

  if (command === "problem-statement-record") {
    if (!options.affectedParty) {
      throw new Error("Missing --affected-party for `problem-statement-record`.");
    }
    if (!options.actualProblem) {
      throw new Error("Missing --actual-problem for `problem-statement-record`.");
    }
    if (!options.whyItMatters || !options.whyNow) {
      throw new Error("Missing --why-it-matters or --why-now for `problem-statement-record`.");
    }
    if (!Array.isArray(options.evidenceRefs) || options.evidenceRefs.length === 0) {
      throw new Error("At least one --evidence-ref is required for `problem-statement-record`.");
    }
  }

  if (command === "value-hypothesis-record") {
    if (!options.expectedValueCreation) {
      throw new Error("Missing --expected-value-creation for `value-hypothesis-record`.");
    }
    if (!options.beneficiary) {
      throw new Error("Missing --beneficiary for `value-hypothesis-record`.");
    }
    if (!Array.isArray(options.supportingEvidence) || options.supportingEvidence.length === 0) {
      throw new Error("At least one --supporting-evidence is required for `value-hypothesis-record`.");
    }
    if (!Array.isArray(options.successCriteria) || options.successCriteria.length === 0) {
      throw new Error("At least one --success-criterion is required for `value-hypothesis-record`.");
    }
  }

  if (command === "alternative-analysis-record") {
    if (!options.subjectNeed) {
      throw new Error("Missing --subject-need for `alternative-analysis-record`.");
    }
    if (!Array.isArray(options.alternativeSolutions) || options.alternativeSolutions.length === 0) {
      throw new Error("At least one --alternative-solution is required for `alternative-analysis-record`.");
    }
    if (!Array.isArray(options.stopOptions) || options.stopOptions.length === 0) {
      throw new Error("At least one --stop-option is required for `alternative-analysis-record`.");
    }
  }

  if (command === "experiment-proposal-record") {
    if (!options.assumptionToTest) {
      throw new Error("Missing --assumption-to-test for `experiment-proposal-record`.");
    }
    if (!options.smallestTestableValidation || !options.expectedLearning || !options.expectedCost || !options.successThreshold) {
      throw new Error("Missing experiment proposal fields for `experiment-proposal-record`.");
    }
  }

  if (command === "project-charter-record") {
    if (!options.validatedNeedRef) {
      throw new Error("Missing --validated-need-ref for `project-charter-record`.");
    }
    if (!options.validatedObjective) {
      throw new Error("Missing --validated-objective for `project-charter-record`.");
    }
    if (!Array.isArray(options.scope) || options.scope.length === 0) {
      throw new Error("At least one --scope-item is required for `project-charter-record`.");
    }
    if (!Array.isArray(options.expectedOutcomes) || options.expectedOutcomes.length === 0) {
      throw new Error("At least one --expected-outcome is required for `project-charter-record`.");
    }
  }

  if (command === "need-validation-record") {
    if (!options.rawNeed) {
      throw new Error("Missing --raw-need for `need-validation-record`.");
    }
    if (!options.validationStatus) {
      throw new Error("Missing --validation-status for `need-validation-record`.");
    }
    if (!["validated", "reframed", "rejected", "deferred", "evidence-requested", "experiment-required"].includes(options.validationStatus)) {
      throw new Error("Invalid --validation-status for `need-validation-record`.");
    }
    if (!options.decisionSummary) {
      throw new Error("Missing --decision-summary for `need-validation-record`.");
    }
    if (!options.authorityAction) {
      throw new Error("Missing --authority-action for `need-validation-record`.");
    }
    if (!["reject-need", "defer-need", "request-evidence", "reframe-need", "require-experiment", "approve-project-charter"].includes(options.authorityAction)) {
      throw new Error("Invalid --authority-action for `need-validation-record`.");
    }
    if (!options.projectCreationRecommendation) {
      throw new Error("Missing --project-creation-recommendation for `need-validation-record`.");
    }
    if (!["do-not-create-project", "hold-project", "create-project-after-experiment", "create-project"].includes(options.projectCreationRecommendation)) {
      throw new Error("Invalid --project-creation-recommendation for `need-validation-record`.");
    }
    if (!Array.isArray(options.validationQuestionsAnswered) || options.validationQuestionsAnswered.length === 0) {
      throw new Error("At least one --question-answer-json is required for `need-validation-record`.");
    }
    if (!options.problemStatementRef || !options.valueHypothesisRef || !options.alternativeAnalysisRef) {
      throw new Error("Missing required artifact refs for `need-validation-record`.");
    }
  }

  if (command === "need-validation-advance") {
    if (!options.session) {
      throw new Error("Missing --session for `need-validation-advance`.");
    }
    if (!options.needValidationRecord) {
      throw new Error("Missing --need-validation-record for `need-validation-advance`.");
    }
  }

  if (command === "need-validation-benchmark") {
    if (!options.project) {
      throw new Error("Missing --project for `need-validation-benchmark`.");
    }
  }

  if (command === "mission-control-benchmark") {
    if (!options.project) {
      throw new Error("Missing --project for `mission-control-benchmark`.");
    }
  }

  if (command === "mission-control-projection-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `mission-control-projection-audit`.");
    }
  }

  if (command === "externalization-readiness-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `externalization-readiness-audit`.");
    }
  }

  if (command === "external-runtime-resource-record") {
    for (const [flag, value] of [
      ["--resource-kind", options.resourceKind],
      ["--display-name", options.displayName],
      ["--canonical-ref", options.canonicalRef],
      ["--source-system", options.sourceSystem],
      ["--owner-ref", options.ownerRef],
      ["--source-of-truth", options.sourceOfTruth],
      ["--permission-boundary", options.permissionBoundary],
      ["--freshness-boundary", options.freshnessBoundary],
      ["--availability-boundary", options.availabilityBoundary],
      ["--approval-boundary", options.approvalBoundary],
      ["--side-effect-boundary", options.sideEffectBoundary],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`external-runtime-resource-record\`.`);
      }
    }
    if (!["actor", "tool", "provider", "reference"].includes(options.resourceKind)) {
      throw new Error("Invalid --resource-kind for `external-runtime-resource-record`.");
    }
    if (!Array.isArray(options.allowedOperations) || options.allowedOperations.length === 0) {
      throw new Error("At least one --allowed-operation is required for `external-runtime-resource-record`.");
    }
    if (!options.allowedOperations.every((operation) => ["read", "local_write", "external_write", "dangerous"].includes(operation))) {
      throw new Error("Invalid --allowed-operation for `external-runtime-resource-record`.");
    }
    if (!["ready", "warning", "blocked", "accepted_residual_risk"].includes(options.readinessStatus)) {
      throw new Error("Invalid --readiness-status for `external-runtime-resource-record`.");
    }
  }

  if (command === "external-resource-use-record") {
    for (const [flag, value] of [
      ["--work-item-id", options.workItemId],
      ["--work-item-ref", options.workItemRef],
      ["--session-ref", options.sessionRef],
      ["--resource-ref", options.resourceRef],
      ["--use-purpose", options.usePurpose],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`external-resource-use-record\`.`);
      }
    }
    if (!["read", "local_write", "external_write", "dangerous"].includes(options.operationType)) {
      throw new Error("Invalid --operation-type for `external-resource-use-record`.");
    }
    if (!["not_required", "pending", "approved", "rejected"].includes(options.approvalStatus)) {
      throw new Error("Invalid --approval-status for `external-resource-use-record`.");
    }
    if (!["planned", "executed", "blocked", "skipped"].includes(options.executionStatus)) {
      throw new Error("Invalid --execution-status for `external-resource-use-record`.");
    }
  }

  if (command === "external-resource-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `external-resource-audit`.");
    }
  }

  if (command === "provider-adapter-record") {
    for (const [flag, value] of [
      ["--display-name", options.displayName],
      ["--provider-ref", options.providerRef],
      ["--resource-ref", options.resourceRef],
      ["--adapter-kind", options.adapterKind],
      ["--read-authority-boundary", options.readAuthorityBoundary],
      ["--write-authority-boundary", options.writeAuthorityBoundary],
      ["--freshness-check", options.freshnessCheck],
      ["--approval-policy-ref", options.approvalPolicyRef],
      ["--side-effect-boundary", options.sideEffectBoundary],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`provider-adapter-record\`.`);
      }
    }
    if (!["read_only", "local_write", "external_write", "dangerous"].includes(options.adapterKind)) {
      throw new Error("Invalid --adapter-kind for `provider-adapter-record`.");
    }
    if (!Array.isArray(options.operationModes) || options.operationModes.length === 0) {
      throw new Error("At least one --operation-mode is required for `provider-adapter-record`.");
    }
    if (!options.operationModes.every((mode) => ["read", "local_write", "external_write", "dangerous"].includes(mode))) {
      throw new Error("Invalid --operation-mode for `provider-adapter-record`.");
    }
    if (!options.escalationRequiredFor.every((mode) => ["read", "local_write", "external_write", "dangerous"].includes(mode))) {
      throw new Error("Invalid --escalation-required-for for `provider-adapter-record`.");
    }
    if (!["ready", "warning", "blocked", "accepted_residual_risk"].includes(options.readinessStatus)) {
      throw new Error("Invalid --readiness-status for `provider-adapter-record`.");
    }
  }

  if (command === "provider-adapter-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `provider-adapter-audit`.");
    }
  }

  if (command === "provider-adapter-pilot-record") {
    for (const [flag, value] of [
      ["--adapter-ref", options.adapterRef],
      ["--work-item-id", options.workItemId],
      ["--work-item-ref", options.workItemRef],
      ["--session-ref", options.sessionRef],
      ["--pilot-mode", options.pilotMode],
      ["--approval-status", options.approvalStatus],
      ["--expected-external-effect", options.expectedExternalEffect],
      ["--redaction-boundary", options.redactionBoundary],
      ["--rollback-plan", options.rollbackPlan],
      ["--execution-status", options.executionStatus],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`provider-adapter-pilot-record\`.`);
      }
    }
    if (!["dry_run", "read_only", "approved_write_simulation", "approved_external_write"].includes(options.pilotMode)) {
      throw new Error("Invalid --pilot-mode for `provider-adapter-pilot-record`.");
    }
    if (!["not_required", "approved", "pending", "rejected"].includes(options.approvalStatus)) {
      throw new Error("Invalid --approval-status for `provider-adapter-pilot-record`.");
    }
    if (!["planned", "simulated", "executed", "blocked", "skipped"].includes(options.executionStatus)) {
      throw new Error("Invalid --execution-status for `provider-adapter-pilot-record`.");
    }
    for (const [flag, values] of [
      ["--allowed-action", options.allowedActions],
      ["--denied-action", options.deniedActions],
      ["--provenance-ref", options.provenanceRefs],
      ["--verification-ref", options.verificationRefs],
      ["--stop-condition", options.stopConditions]
    ]) {
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error(`At least one ${flag} is required for \`provider-adapter-pilot-record\`.`);
      }
    }
  }

  if (command === "provider-adapter-pilot-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `provider-adapter-pilot-audit`.");
    }
  }

  if (command === "provider-execution-approval-record") {
    for (const [flag, value] of [
      ["--pilot-ref", options.pilotRef],
      ["--adapter-ref", options.adapterRef],
      ["--work-item-id", options.workItemId],
      ["--work-item-ref", options.workItemRef],
      ["--session-ref", options.sessionRef],
      ["--approval-decision", options.approvalDecision],
      ["--approved-execution-mode", options.approvedExecutionMode],
      ["--execution-scope", options.executionScope],
      ["--side-effect-boundary", options.sideEffectBoundary],
      ["--redaction-boundary", options.redactionBoundary],
      ["--rollback-plan", options.rollbackPlan],
      ["--credential-boundary", options.credentialBoundary],
      ["--budget-boundary", options.budgetBoundary],
      ["--production-execution-status", options.productionExecutionStatus],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`provider-execution-approval-record\`.`);
      }
    }
    if (!["approved", "pending", "rejected", "blocked"].includes(options.approvalDecision)) {
      throw new Error("Invalid --approval-decision for `provider-execution-approval-record`.");
    }
    if (!["dry_run", "read_only", "bounded_external_write"].includes(options.approvedExecutionMode)) {
      throw new Error("Invalid --approved-execution-mode for `provider-execution-approval-record`.");
    }
    if (!["not_executed", "preflight_approved", "blocked", "executed"].includes(options.productionExecutionStatus)) {
      throw new Error("Invalid --production-execution-status for `provider-execution-approval-record`.");
    }
    for (const [flag, values] of [
      ["--allowed-operation", options.allowedOperations],
      ["--denied-operation", options.deniedOperations],
      ["--provenance-ref", options.provenanceRefs],
      ["--verification-ref", options.verificationRefs],
      ["--stop-condition", options.stopConditions]
    ]) {
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error(`At least one ${flag} is required for \`provider-execution-approval-record\`.`);
      }
    }
    if (options.externalWriteAuthorized) {
      if (!options.humanApprovalRef) {
        throw new Error("Missing --human-approval-ref for external-write `provider-execution-approval-record`.");
      }
      if (!options.targetOperationRef) {
        throw new Error("Missing --target-operation-ref for external-write `provider-execution-approval-record`.");
      }
      if (!Array.isArray(options.credentialScope) || options.credentialScope.length === 0) {
        throw new Error("At least one --credential-scope is required for external-write `provider-execution-approval-record`.");
      }
      if (!options.budget || typeof options.budget !== "object") {
        throw new Error("Missing --budget-json for external-write `provider-execution-approval-record`.");
      }
      if (!options.rollback || typeof options.rollback !== "object") {
        throw new Error("Missing --rollback-json for external-write `provider-execution-approval-record`.");
      }
    }
  }

  if (command === "provider-operation-target-record") {
    for (const [flag, value] of [
      ["--provider", options.provider],
      ["--resource", options.resource],
      ["--operation", options.operation],
      ["--payload-hash", options.payloadHash],
      ["--payload-summary", options.payloadSummary],
      ["--maximum-calls", options.maximumCalls],
      ["--expires-at", options.expiresAt],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`provider-operation-target-record\`.`);
      }
    }
  }

  if (command === "human-approval-record") {
    for (const [flag, value] of [
      ["--approver-id", options.approverId],
      ["--decision", options.decision],
      ["--approved-scope-hash", options.approvedScopeHash],
      ["--authentication-method", options.authenticationMethod],
      ["--target-operation-ref", options.targetOperationRef],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`human-approval-record\`.`);
      }
    }
    if (!["approved", "rejected", "revoked"].includes(options.decision)) {
      throw new Error("Invalid --decision for `human-approval-record`.");
    }
    if (!["active", "revoked", "expired"].includes(options.revocationStatus)) {
      throw new Error("Invalid --revocation-status for `human-approval-record`.");
    }
  }

  if (command === "provider-execution-approval-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `provider-execution-approval-audit`.");
    }
  }

  if (command === "provider-outcome-evidence-record") {
    for (const [flag, value] of [
      ["--approval-ref", options.approvalRef],
      ["--reproduction-ref", options.reproductionRef],
      ["--rollback-ref", options.rollbackRef],
      ["--target-operation-ref", options.targetOperationRef],
      ["--work-item-id", options.workItemId],
      ["--session-ref", options.sessionRef],
      ["--expected-outcome", options.expectedOutcome],
      ["--observed-result", options.observedResult],
      ["--outcome-status", options.outcomeStatus],
      ["--semantic-truth-boundary", options.semanticTruthBoundary],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`provider-outcome-evidence-record\`.`);
      }
    }
    if (!["accepted", "corrected", "rollback_recommended", "blocked"].includes(options.outcomeStatus)) {
      throw new Error("Invalid --outcome-status for `provider-outcome-evidence-record`.");
    }
    if (!Array.isArray(options.evidenceRefs) || options.evidenceRefs.length === 0) {
      throw new Error("At least one --evidence-ref is required for `provider-outcome-evidence-record`.");
    }
    if (!Array.isArray(options.verificationRefs) || options.verificationRefs.length === 0) {
      throw new Error("At least one --verification-ref is required for `provider-outcome-evidence-record`.");
    }
  }

  if (command === "provider-outcome-evidence-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `provider-outcome-evidence-audit`.");
    }
  }

  if (command === "provider-learning-loop-record") {
    for (const [flag, value] of [
      ["--outcome-ref", options.outcomeRef],
      ["--learning-summary", options.learningSummary],
      ["--decision", options.decision],
      ["--next-action", options.nextAction],
      ["--update-status", options.updateStatus],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`provider-learning-loop-record\`.`);
      }
    }
    if (!["accept", "correct", "rollback", "escalate", "defer"].includes(options.decision)) {
      throw new Error("Invalid --decision for `provider-learning-loop-record`.");
    }
    if (!["updated", "escalated", "blocked", "deferred"].includes(options.updateStatus)) {
      throw new Error("Invalid --update-status for `provider-learning-loop-record`.");
    }
    if (!Array.isArray(options.learningRefs) || options.learningRefs.length === 0) {
      throw new Error("At least one --learning-ref is required for `provider-learning-loop-record`.");
    }
    if (!Array.isArray(options.evidenceRefs) || options.evidenceRefs.length === 0) {
      throw new Error("At least one --evidence-ref is required for `provider-learning-loop-record`.");
    }
  }

  if (command === "provider-learning-loop-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `provider-learning-loop-audit`.");
    }
  }

  if (command === "provider-production-boundary-record") {
    for (const [flag, value] of [
      ["--release-ref", options.releaseRef],
      ["--work-item-id", options.workItemId],
      ["--work-item-ref", options.workItemRef],
      ["--mission-control-ref", options.missionControlRef],
      ["--approval-ref", options.approvalRef],
      ["--reproduction-ref", options.reproductionRef],
      ["--rollback-ref", options.rollbackRef],
      ["--outcome-ref", options.outcomeRef],
      ["--learning-ref", options.learningRef],
      ["--operator-acceptance-ref", options.operatorAcceptanceRef],
      ["--product-value-evidence-ref", options.productValueEvidenceRef],
      ["--provider-scope", options.providerScope],
      ["--allowed-operation-class", options.allowedOperationClass],
      ["--execution-eligibility", options.executionEligibility],
      ["--credential-boundary", options.credentialBoundary],
      ["--budget-boundary", options.budgetBoundary],
      ["--revocation-boundary", options.revocationBoundary],
      ["--rollback-boundary", options.rollbackBoundary],
      ["--monitoring-boundary", options.monitoringBoundary],
      ["--incident-boundary", options.incidentBoundary],
      ["--human-go-no-go-boundary", options.humanGoNoGoBoundary],
      ["--product-value-comprehension-boundary", options.productValueComprehensionBoundary],
      ["--go-no-go-status", options.goNoGoStatus],
      ["--governance-action", options.governanceAction],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`provider-production-boundary-record\`.`);
      }
    }
    if (!["read_only", "write_preflight", "controlled_write_candidate", "production_write"].includes(options.allowedOperationClass)) {
      throw new Error("Invalid --allowed-operation-class for `provider-production-boundary-record`.");
    }
    if (!["candidate", "blocked", "not_assessed"].includes(options.executionEligibility)) {
      throw new Error("Invalid --execution-eligibility for `provider-production-boundary-record`.");
    }
    if (!["authorized", "not_authorized", "blocked", "escalated"].includes(options.goNoGoStatus)) {
      throw new Error("Invalid --go-no-go-status for `provider-production-boundary-record`.");
    }
    if (!["block_production_execution", "allow_preproduction_review", "escalate_production_review"].includes(options.governanceAction)) {
      throw new Error("Invalid --governance-action for `provider-production-boundary-record`.");
    }
    if (options.productionExecutionAuthorized) {
      throw new Error("`provider-production-boundary-record` cannot authorize production execution in the v9.2 candidate boundary.");
    }
    if (!Array.isArray(options.stopConditions) || options.stopConditions.length === 0) {
      throw new Error("At least one --stop-condition is required for `provider-production-boundary-record`.");
    }
    if (!Array.isArray(options.provenanceRefs) || options.provenanceRefs.length === 0) {
      throw new Error("At least one --provenance-ref is required for `provider-production-boundary-record`.");
    }
    if (!Array.isArray(options.verificationRefs) || options.verificationRefs.length === 0) {
      throw new Error("At least one --verification-ref is required for `provider-production-boundary-record`.");
    }
  }

  if (command === "provider-production-boundary-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `provider-production-boundary-audit`.");
    }
  }

  if (command === "operator-acceptance-drill-record") {
    for (const [flag, value] of [
      ["--operator-ref", options.operatorRef],
      ["--work-item-id", options.workItemId],
      ["--approval-ref", options.approvalRef],
      ["--reproduction-ref", options.reproductionRef],
      ["--rollback-ref", options.rollbackRef],
      ["--outcome-ref", options.outcomeRef],
      ["--learning-ref", options.learningRef],
      ["--mission-control-ref", options.missionControlRef],
      ["--decision", options.decision],
      ["--decision-rationale", options.decisionRationale],
      ["--accepted-risk", options.acceptedRisk],
      ["--blocker-summary", options.blockerSummary],
      ["--next-action", options.nextAction],
      ["--safety-boundary", options.safetyBoundary],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`operator-acceptance-drill-record\`.`);
      }
    }
    if (!["accept", "stop", "rollback", "escalate", "defer"].includes(options.decision)) {
      throw new Error("Invalid --decision for `operator-acceptance-drill-record`.");
    }
    if (!Array.isArray(options.evidenceRefs) || options.evidenceRefs.length === 0) {
      throw new Error("At least one --evidence-ref is required for `operator-acceptance-drill-record`.");
    }
  }

  if (command === "operator-acceptance-drill-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `operator-acceptance-drill-audit`.");
    }
  }

  if (command === "product-value-evidence-record") {
    for (const [flag, value] of [
      ["--release-ref", options.releaseRef],
      ["--work-item-id", options.workItemId],
      ["--work-item-ref", options.workItemRef],
      ["--mission-control-ref", options.missionControlRef],
      ["--capability-statement", options.capabilityStatement],
      ["--before-state", options.beforeState],
      ["--after-state", options.afterState],
      ["--scenario", options.scenario],
      ["--five-minute-demo", options.fiveMinuteDemo],
      ["--time-saved-or-work-reduced", options.timeSavedOrWorkReduced],
      ["--cognitive-load-removed", options.cognitiveLoadRemoved],
      ["--understanding-outcome", options.understandingOutcome],
      ["--governance-action", options.governanceAction],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`product-value-evidence-record\`.`);
      }
    }
    if (!["understood", "partially_understood", "not_understood", "not_checked"].includes(options.understandingOutcome)) {
      throw new Error("Invalid --understanding-outcome for `product-value-evidence-record`.");
    }
    if (!["none", "improve_release_explanation", "reopen_need", "block_release_claim", "escalate_product_review"].includes(options.governanceAction)) {
      throw new Error("Invalid --governance-action for `product-value-evidence-record`.");
    }
    if (!Array.isArray(options.capabilityRows) || options.capabilityRows.length === 0) {
      throw new Error("At least one --capability-row-json is required for `product-value-evidence-record`.");
    }
    if (!Array.isArray(options.evidenceRefs) || options.evidenceRefs.length === 0) {
      throw new Error("At least one --evidence-ref is required for `product-value-evidence-record`.");
    }
  }

  if (command === "product-value-evidence-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `product-value-evidence-audit`.");
    }
  }

  if (command === "operator-validation-record") {
    for (const [flag, value] of [
      ["--operator-ref", options.operatorRef],
      ["--feedback-source", options.feedbackSource],
      ["--release-ref", options.releaseRef],
      ["--work-item-id", options.workItemId],
      ["--work-item-ref", options.workItemRef],
      ["--mission-control-ref", options.missionControlRef],
      ["--feedback-summary", options.feedbackSummary],
      ["--governance-action", options.governanceAction],
      ["--not-proven", options.notProven],
      ["--source-task-id", options.sourceTaskId],
      ["--source-parent-session-id", options.sourceParentSessionId]
    ]) {
      if (!value) {
        throw new Error(`Missing ${flag} for \`operator-validation-record\`.`);
      }
    }
    if (!["human_operator", "adopter", "expert_reviewer", "self_hosting_operator", "simulated_operator"].includes(options.feedbackSource)) {
      throw new Error("Invalid --feedback-source for `operator-validation-record`.");
    }
    if (!Array.isArray(options.evidenceRefs) || options.evidenceRefs.length === 0) {
      throw new Error("At least one --evidence-ref is required for `operator-validation-record`.");
    }
    if (!["understood", "partially_understood", "not_understood", "needs_clarification", "not_checked"].includes(options.understandingOutcome)) {
      throw new Error("Invalid --understanding-outcome for `operator-validation-record`.");
    }
    if (!["reproduced", "partially_reproduced", "not_reproduced", "needs_clarification", "not_checked"].includes(options.reproductionOutcome)) {
      throw new Error("Invalid --reproduction-outcome for `operator-validation-record`.");
    }
    if (!["accepted", "accepted_with_residual_risk", "rejected", "needs_clarification", "not_checked"].includes(options.acceptanceOutcome)) {
      throw new Error("Invalid --acceptance-outcome for `operator-validation-record`.");
    }
    if (!["none", "request_clarification", "request_reproduction", "block_release_claim", "escalate_review"].includes(options.governanceAction)) {
      throw new Error("Invalid --governance-action for `operator-validation-record`.");
    }
  }

  if (command === "operator-validation-audit") {
    if (!options.project) {
      throw new Error("Missing --project for `operator-validation-audit`.");
    }
  }

  if (command === "work-governance-benchmark") {
    if (!options.project) {
      throw new Error("Missing --project for `work-governance-benchmark`.");
    }
  }

  if (command === "adoption-proof-benchmark") {
    if (!options.project) {
      throw new Error("Missing --project for `adoption-proof-benchmark`.");
    }
  }

  if (command === "operator-brief") {
    if (!options.project) {
      throw new Error("Missing --project for `operator-brief`.");
    }
  }

  if (command === "operator-progress") {
    if (!options.project) {
      throw new Error("Missing --project for `operator-progress`.");
    }
  }

  if (command === "tree-position") {
    if (!options.project) {
      throw new Error("Missing --project for `tree-position`.");
    }
  }

  if (command === "evidence-drill-down") {
    if (!options.project) {
      throw new Error("Missing --project for `evidence-drill-down`.");
    }
  }

  if (command === "evidence-drill-down-benchmark") {
    if (!options.project) {
      throw new Error("Missing --project for `evidence-drill-down-benchmark`.");
    }
  }

  if (command === "situation-assess") {
    if (!options.project) {
      throw new Error("Missing --project for `situation-assess`.");
    }
  }

  if (command === "team-output-record") {
    if (!options.teamId) {
      throw new Error("Missing --team-id for `team-output-record`.");
    }
    if (!options.stage) {
      throw new Error("Missing --stage for `team-output-record`.");
    }
    if (!Array.isArray(options.expectedRoles) || options.expectedRoles.length === 0) {
      throw new Error("At least one --expected-role is required for `team-output-record`.");
    }
    if (!options.aggregateState) {
      throw new Error("Missing --aggregate-state for `team-output-record`.");
    }
    if (!options.recommendedNextStep) {
      throw new Error("Missing --recommended-next-step for `team-output-record`.");
    }
  }

  if (command === "council-review-packet") {
    if (!options.councilId) {
      throw new Error("Missing --council-id for `council-review-packet`.");
    }
    if (!options.stage) {
      throw new Error("Missing --stage for `council-review-packet`.");
    }
    if (!options.reviewStatus) {
      throw new Error("Missing --review-status for `council-review-packet`.");
    }
    if (!["approved", "changes-requested", "blocked", "deferred"].includes(options.reviewStatus)) {
      throw new Error("Invalid --review-status for `council-review-packet`.");
    }
    if (!options.decisionSummary) {
      throw new Error("Missing --decision-summary for `council-review-packet`.");
    }
    if (!options.rationale) {
      throw new Error("Missing --rationale for `council-review-packet`.");
    }
    if (!options.recommendation) {
      throw new Error("Missing --recommendation for `council-review-packet`.");
    }
    if (
      options.diagnosisConfidence !== undefined
      && (!Number.isFinite(options.diagnosisConfidence) || options.diagnosisConfidence < 0 || options.diagnosisConfidence > 1)
    ) {
      throw new Error("Invalid --diagnosis-confidence for `council-review-packet`.");
    }
  }

  return { command, options };
}

async function main() {
  try {
    printUnsupportedNodeWarning();
    const parsed = parseArgs(process.argv);
    if (parsed.command === "help") {
      const payload = parsed.options?.targetCommand
        ? buildCommandHelp(parsed.options.targetCommand)
        : buildCommandHelpIndex();
      if (!payload) {
        throw new Error(`Unsupported command: ${parsed.options.targetCommand}`);
      }
      if (parsed.options?.json) {
        console.log(JSON.stringify(payload, null, 2));
      } else {
        console.log(formatCommandHelpText(payload));
      }
      return;
    }
    const handler = COMMAND_HANDLERS[parsed.command];
    if (!handler) {
      throw new Error(`Unsupported command: ${parsed.command}`);
    }
    let lastError = null;
    let output = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const module = await handler.load();
        const commandFn = module[handler.exportName];
        if (typeof commandFn !== "function") {
          throw new Error(`Command export is missing: ${handler.exportName}`);
        }
        const result = await commandFn(parsed.options);
        output = typeof handler.formatResult === "function"
          ? handler.formatResult(result)
          : result;
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (attempt === 2 || !isTransientCliError(error)) {
          throw error;
        }
        await delay(50 * (attempt + 1));
      }
    }

    if (lastError) {
      throw lastError;
    }

    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    const retryCount = Number.parseInt(process.env.AOF_CLI_RETRY_COUNT ?? "0", 10) || 0;
    if (retryCount < 2 && isTransientCliError(error)) {
      const nextEnv = {
        ...process.env,
        AOF_CLI_RETRY_COUNT: String(retryCount + 1)
      };
      const retried = spawnSync(process.execPath, process.argv.slice(1), {
        encoding: "utf8",
        stdio: "pipe",
        env: nextEnv
      });
      if (retried.stdout) {
        process.stdout.write(retried.stdout);
      }
      if (retried.stderr) {
        process.stderr.write(retried.stderr);
      }
      process.exitCode = retried.status ?? 1;
      return;
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

main();
