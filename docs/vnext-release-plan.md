# Next Release Plan

## Version

`v6.8.0`

## Release Theme

Executable Quality Ledger.

`v6.7.0` made governance claims harder to fake by requiring machine-checkable Archmap impact, Council provenance, and evidence independence. The next bottleneck is that quality-relevant corrections and contradicted claims can still drift as prose instead of being recorded as auditable ledger events.

Human-facing wording:

> v6.8 should make quality-relevant evidence changes appendable and auditable, so AOF cannot quietly treat "we wrote a report" as "quality truth stayed current."

More explicit wording:

> AOF should reject unsafe quality claims when ledger events lack task/runtime/QIF/evidence refs, miss required governance escalation, or claim semantic truth from ledger presence alone.

## Runtime Evidence Basis

- runtime command: `release-state-audit --project .`
- release task: `TASK-079`
- release definition: `docs/v6.8-release-definition.md`
- release checklist: `docs/v6.8-release-checklist.md`
- release notes: `docs/v6.8.0-release-notes.md`
- roadmap: `docs/v6.7-v8.0-completion-roadmap.md`
- Archmap source: `docs/archmaps/aof-runtime-current.archmap`
- Council review packet: `.aof/artifacts/execution/council-reviews/CRP-TASK-078-QUALITY-LEDGER-FOUNDATION.json`

## Required Outcomes

Required:

- add `quality-ledger-record`
- add `quality-ledger-audit`
- add quality ledger event and audit schemas
- add a committed ledger event fixture for `TASK-078`
- verify negative audit cases for missing QIF refs, unresolved evidence refs, unsupported semantic truth claims, missing escalation, and missing state transition intent
- refresh command registry so ledger commands have AI-readable input/output hints
- align package, active release manifest, organization contract, README, quickstart, checklist, and notes to `6.8.0`

Deferred:

- automatic semantic truth scoring
- external market/product validation
- full external QIF verifier execution
- automatic replacement of Council judgment
- Node.js 25+ support

## Release Gates

### Gate 1: Quality Ledger Commands

- `quality-ledger-record` writes schema-valid events
- `quality-ledger-audit` passes committed ledger events
- `quality-ledger-audit` fails unsafe or incomplete event patterns

### Gate 2: Governance Continuity

- Archmap impact audit still passes for `TASK-071` onward
- review provenance audit still passes for done work at `TASK-071` onward
- evidence independence audit still passes for done work at `TASK-071` onward
- ledger presence remains evidence, not proof of truth

### Gate 3: Command Help Completeness

- command registry entries have inputs and outputs
- `cli-help-benchmark` fails missing input/output hints
- command help remains compact and AI-readable

### Gate 4: Release Surface

- package version is `6.8.0`
- package-lock version is `6.8.0`
- active release manifest points at v6.8 docs
- organization release contract points at `docs/v6.8-release-definition.md`
- README and quickstart point at v6.8

### Gate 5: Verification

- command routing audit
- CLI help benchmark
- organization verification
- release-state audit
- governance audits
- decision verification
- focused runtime tests
- `npm test`
- `npm run smoke`

## Release Decision

Release `v6.8.0` only if AOF now makes it harder to confuse:

- ledger existence with quality proof
- activity evidence with Quality Intent evidence
- corrected assumptions with hidden churn
- low-confidence evidence with release-ready truth
- runtime traceability with semantic validation

## Post-v6.8 Direction Candidate

After v6.8, choose the next frontier through runtime-backed review before opening implementation work. Strong candidates are executable pre-implementation quality gates, standalone context/reference audits, or the first bounded step toward governed multi-actor orchestration.
