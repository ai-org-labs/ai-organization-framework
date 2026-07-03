# Next Release Plan

## Version

`v6.7.0`

## Release Theme

Verifiable Governance.

`v6.6.0` made architecture impact visible as governed work. The next bottleneck was self-attestation: AOF could still claim release readiness from artifacts that existed, even when the release gate did not machine-check whether architecture impact, Council review provenance, and evidence independence were present.

Human-facing wording:

> v6.7 should make release governance checkable before sign-off, so AOF cannot quietly treat "we wrote artifacts" as "governance happened."

More explicit wording:

> AOF should reject release readiness when implementation-grade work lacks Archmap impact disposition, Council review provenance, or evidence that is not only maker-authored/self-attested.

## Runtime Evidence Basis

- runtime command: `release-state-audit --project .`
- release task: `TASK-076`
- release definition: `docs/v6.7-release-definition.md`
- release checklist: `docs/v6.7-release-checklist.md`
- release notes: `docs/v6.7.0-release-notes.md`
- roadmap: `docs/v6.7-v8.0-completion-roadmap.md`
- Archmap source: `docs/archmaps/aof-runtime-current.archmap`
- Council review packet: `.aof/artifacts/execution/council-reviews/CRP-TASK-075-RELEASE-GOVERNANCE-GATES.json`

## Required Outcomes

Required:

- add `archmap-impact-audit`
- add `review-provenance-audit`
- add `evidence-independence-audit`
- integrate the three audits into `release-state-audit`
- make `release-state-audit` fail if any integrated governance audit fails
- make `cli-help-benchmark` fail missing command help inputs or outputs
- refresh command registry so every command has AI-readable input/output hints
- fix visibility latest Archmap work selection so later task ids are not hidden by timestamp ordering
- align package, bootstrap, active release manifest, organization contract, README, quickstart, checklist, and notes to `6.7.0`

Deferred:

- automatic semantic truth scoring
- external market/product validation
- full external QIF verifier execution
- automatic replacement of Council judgment
- Node.js 25+ support

## Release Gates

### Gate 1: Governance Audit Commands

- `archmap-impact-audit` passes for `TASK-071` onward
- `review-provenance-audit` passes for done work at `TASK-071` onward
- `evidence-independence-audit` passes for done work at `TASK-071` onward

### Gate 2: Release Sign-Off Integration

- `release-state-audit` consumes all three governance audits
- `release-state-audit` fails if any governance audit fails
- release-state schema includes `governance_audits`

### Gate 3: Command Help Completeness

- command registry entries have inputs and outputs
- `cli-help-benchmark` fails missing input/output hints
- command help remains compact and AI-readable

### Gate 4: Release Surface

- package version is `6.7.0`
- bootstrap `aof_version` is `6.7.0`
- active release manifest points at v6.7 docs
- organization release contract points at `docs/v6.7-release-definition.md`
- README and quickstart point at v6.7

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

Release `v6.7.0` only if AOF now makes it harder to confuse:

- artifact existence with governance evidence
- maker-authored output with independent verification
- pending or missing Council provenance with approval
- command availability with AI-readable command usability
- visibility projection with canonical truth

## Post-v6.7 Direction Candidate

After v6.7, choose the next frontier through runtime-backed review before opening implementation work. The known roadmap candidate is `v6.8` Executable Quality Ledger, but it should not start until a fresh direction review confirms it is still the best bounded slice.
