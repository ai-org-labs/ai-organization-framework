# Next Release Plan

## Version

`v6.9.0`

## Release Theme

Executable Pre-Implementation Quality Gates.

`v6.8.0` made quality-relevant evidence appendable and auditable after evidence exists. The next bottleneck is that work can still begin before success expectations, loss boundaries, evidence plans, maker/checker separation, and stop conditions are explicit.

Human-facing wording:

> v6.9 should stop AOF from starting implementation work while the definition of success is still hidden in the conversation.

More explicit wording:

> AOF should reject implementation-readiness claims when the work item lacks goal, risk, loss boundary, acceptance gates, evidence plan, maker/checker separation, stop conditions, or QIF refs.

## Runtime Evidence Basis

- runtime command: `situation-assess --project .`
- direction task: `TASK-081`
- implementation task: `TASK-082`
- release task: `TASK-083`
- release definition: `docs/v6.9-release-definition.md`
- release checklist: `docs/v6.9-release-checklist.md`
- release notes: `docs/v6.9.0-release-notes.md`
- Council review packet: `.aof/artifacts/execution/council-reviews/CRP-TASK-082-WORK-READINESS-GATE.json`

## Required Outcomes

Required:

- add `work-readiness-record`
- add `work-readiness-audit`
- add work readiness record and audit schemas
- add committed readiness records for `TASK-082` and release closure `TASK-083`
- verify negative audit cases for missing readiness records
- integrate `work-readiness-audit` into `release-state-audit` for `6.9.0` and later
- refresh command registry so readiness commands have AI-readable input/output hints
- align package, active release manifest, organization contract, README, checklist, and notes to `6.9.0`

Deferred:

- automatic QIF verdict computation
- semantic truth validation
- standalone context/reference audits
- governed parallel actor orchestration
- Node.js 25+ support

## Release Gates

### Gate 1: Work Readiness Commands

- `work-readiness-record` writes schema-valid records
- `work-readiness-audit` passes committed readiness records
- `work-readiness-audit` fails missing or incomplete readiness patterns

### Gate 2: Governance Continuity

- Archmap impact audit still passes for `TASK-071` onward
- review provenance audit still passes for done work at `TASK-071` onward
- evidence independence audit still passes for done work at `TASK-071` onward
- quality ledger audit still passes
- readiness presence remains evidence, not proof of truth

### Gate 3: Command Help Completeness

- command registry entries have inputs and outputs
- `cli-help-benchmark` fails missing input/output hints
- command help remains compact and AI-readable

### Gate 4: Release Surface

- package version is `6.9.0`
- package-lock version is `6.9.0`
- active release manifest points at v6.9 docs
- organization release contract points at `docs/v6.9-release-definition.md`
- README and roadmap point at v6.9

### Gate 5: Verification

- work readiness audit
- quality ledger audit
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

Release `v6.9.0` only if AOF now makes it harder to confuse:

- conversation intent with declared work goal
- activity with acceptance
- maker output with checked output
- iteration with a loop
- readiness evidence with semantic truth

## Post-v6.9 Direction Candidate

After v6.9, choose the next frontier through runtime-backed review before opening implementation work. Strong candidates are standalone context/reference audits or the first bounded step toward governed multi-actor orchestration.
