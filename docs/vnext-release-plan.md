# Next Release Plan

## Version

`v6.3.0`

## Release Theme

AI Command Help Surface with QIF v0.3 Provider Alignment.

`v6.2.0` proved that a fresh managed project can reach a first governed work item. The next bottleneck is AI operation cost: an orchestrator should not need to read the full CLI reference or rely on memory to choose the correct runtime command.

Human-facing wording:

> v6.3 makes AOF easier for AI to operate correctly by exposing compact, structured command help with failure meaning and QIF boundary.

More explicit wording:

> AOF should let an AI ask for the command map, inspect a specific command, understand what input/output is expected, and know what command failure means before it claims progress or quality.

## Runtime Evidence Basis

- runtime command: `situation-assess --project .`
- command registry command: `command-registry-refresh --project .`
- release state command: `release-state-refresh --project .`
- benchmark command: `cli-help-benchmark --project .`
- QIF provider profile: `.aof/quality/qif-provider-profile.json`
- baseline release definition: `docs/v6.2-release-definition.md`
- release definition: `docs/v6.3-release-definition.md`
- roadmap: `docs/vnext-roadmap.md`

## Required Outcomes

Required:

- `aof --help` provides a compact AI-oriented index
- `aof --help --json` provides machine-readable help index
- `aof <command> --help` provides command-level help
- `aof <command> --help --json` provides command-level structured help
- command help includes purpose, category, inputs, outputs, failure meaning, and QIF boundary
- `cli-help-benchmark` verifies command help coverage
- active QIF provider profile points to QIF `v0.3.0`
- QIF Core / Discovery Layer / AOF Integration boundaries are recorded
- QIF v0.3 Discovery Layer is not overclaimed as executable verifier support

Deferred:

- full QIF-governed benchmark explanation outputs
- Mission Control UX redesign
- standalone context / external-ref / operational-map audits
- governed multi-actor orchestration

## Release Gates

### Gate 1: Runtime Direction

- runtime state supports v6.3 as the next bounded frontier
- `TASK-066` records the implementation work

### Gate 2: Help Surface

- global help works in text and JSON forms
- command help works in text and JSON forms
- help is generated from command registry metadata

### Gate 3: QIF Provider Alignment

- provider profile validates against schema
- provider points to QIF `v0.3.0`
- docs preserve semantic truth and executable-verifier boundaries

### Gate 4: Verification

- `cli-help-benchmark`
- `command-routing-audit`
- `organization-verify`
- `decision-verify`
- `release-state-audit`
- focused tests
- `npm test`
- `npm run smoke`

## Release Decision

Release `v6.3.0` only if AI command discovery is compact, structured, registry-backed, and QIF-boundary-aware.

Do not claim that help coverage proves runtime quality. It only proves that an AI can discover commands and understand the operational boundary before choosing one.

## Post-v6.3 Direction Candidate

The strongest immediate follow-up is QIF-Governed Benchmark Explanation.

### v6.4 Candidate: QIF-Governed Benchmark Explanation

Purpose:

- translate benchmark checks into Quality Intent, risk, loss boundary, evidence refs, acceptance gate, verdict, confidence, uncertainty, and governance trigger

Why this follows v6.3:

- command help now exposes QIF boundary language
- benchmark output still needs first-class explanation of what was checked, what the expected standard was, what failure means, and what remains unproven

Boundary:

- explanation improves human and AI comprehension
- it must not claim semantic truth merely because a benchmark passed
