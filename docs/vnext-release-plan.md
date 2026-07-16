# Next Release Plan

## Version

Candidate: `v7.8.0`

## Release Theme

Mission Control Coverage Forecast Projection.

`v7.7.0` made adoption readiness auditable through a fresh managed-project runtime evidence chain. The next bottleneck is operator recognition: Mission Control should show requirement coverage, blocked work, forecast, adoption proof, and evidence completeness in a way that helps a human understand the current position without reading raw JSON.

Human-facing wording:

> v7.8 should make the v7 evidence chain visible as coverage, forecast, blockers, and adoption proof, while keeping canonical artifacts as the source of truth.

More explicit wording:

> Mission Control should explain what is covered, what remains, what is blocked, what the forecast says, and which evidence backs the answer.

## Runtime Evidence Basis

- runtime basis: `docs/v7.x-roadmap.md`
- previous release: `v7.7.0`
- v7.7 evidence: `docs/v7.7-release-definition.md`, `docs/v7.7.0-release-notes.md`, `.aof/artifacts/work-governance/benchmarks/adoption-proof-benchmark.json`
- current frontier candidate: `v7.8` Mission Control Coverage Forecast Projection

## Required Outcomes

Required:

- project requirement coverage into Mission Control
- project forecast / remaining work / blocked work into Mission Control
- show adoption proof status and latest benchmark evidence in Mission Control
- keep the dashboard as a read-only projection of canonical artifacts
- make failure states human-readable: missing coverage, missing benchmark, unresolved evidence, stale forecast, blocked work

Deferred:

- real-time hosted dashboard
- custom charting engine ownership
- external BI integration
- semantic correctness of forecast estimates
- operator acceptance beyond local runtime evidence

## Release Gates

### Gate 1: Projection Contract

- Mission Control projection fields are defined for coverage, forecast, blockers, adoption proof, and evidence completeness
- projection source refs point to canonical artifacts
- dashboard does not become source of truth

### Gate 2: Runtime Evidence

- latest requirement coverage is readable
- latest adoption proof benchmark is readable
- release-state evidence is readable
- blocked work and top risks are readable

### Gate 3: Governance Boundary

- missing or stale projection sources fail the audit
- unresolved refs fail the audit
- forecast is labeled as estimate, not truth
- adoption proof remains structural/runtime evidence only
- v7.7 Adoption Proof benchmark still passes
- v7.6 Session Export audit still passes
- v7.5 Requirement Coverage audit still passes
- v7.4 Parallel Lane audit still passes
- v7.3 Multi-Actor Pilot audit still passes
- v7.2 Work Execution Packet audit still passes

### Gate 4: Release Surface

- package version is updated to the selected release
- active release manifest points at selected release docs
- README and roadmap describe Mission Control projection without claiming semantic truth or delivery certainty

### Gate 5: Verification

- Mission Control projection audit
- adoption-proof benchmark
- provider-neutral session export audit
- requirement coverage audit
- parallel lane audit
- multi-actor pilot audit
- work execution packet audit
- context/reference integrity audit
- work readiness audit
- governance audits
- command routing audit
- CLI help benchmark
- organization verification
- release-state audit
- decision verification
- focused runtime tests
- `npm test`
- `npm run smoke`

## Release Decision

Release only if AOF now makes it harder to confuse:

- dashboard visibility with source-of-truth evidence
- forecast estimate with delivery certainty
- requirement coverage with semantic satisfaction
- adoption proof with market adoption
- evidence presence with operator acceptance

## Post-v7.7 Direction

The v7 line should proceed in this order:

1. `v7.8`: Mission Control Coverage Forecast Projection
2. `v8.0`: Externalized Organization Runtime
3. `v8.1`: External Reference And Provider Adapter Governance
4. `v8.2`: Adoption Feedback And Operator Validation Loop

Canonical planning reference:

- `docs/v7.x-roadmap.md`
