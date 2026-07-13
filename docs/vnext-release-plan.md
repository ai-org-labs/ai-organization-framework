# Next Release Plan

## Version

Candidate: `v7.5.0`

## Release Theme

Requirements Coverage, Forecasting, And Organization Analytics.

`v7.4.0` made parallel lane claims auditable through bounded lane evidence, join/conflict semantics, Council decision, Work Execution Packet closure, and upstream Multi-Actor Pilot evidence. The next bottleneck is proving that AOF can explain how requirements are covered, which work items advance them, what remains blocked, and what completion/cost forecast follows from runtime evidence.

Human-facing wording:

> v7.5 should prove that AOF can show requirement coverage, requirement-linked task completion, blockers, completion forecast, token-cost forecast, and burndown data from canonical runtime artifacts.

More explicit wording:

> AOF should treat coverage and forecast as bounded planning evidence, not as proof that requirements are semantically satisfied.

## Runtime Evidence Basis

- runtime basis: `docs/v7.x-roadmap.md`
- previous release: `v7.4.0`
- v7.4 evidence: `docs/v7.4-release-definition.md`, `docs/v7.4.0-release-notes.md`, `.aof/artifacts/parallel-lanes/TASK-093.json`
- current frontier candidate: `v7.5` Requirements Coverage, Forecasting, And Organization Analytics

## Required Outcomes

Required:

- define requirement records for functional requirements, non-functional requirements, QIF quality gates, and acceptance boundaries
- link work items, evidence refs, blockers, and Council decisions to requirement refs
- compute requirement coverage, requirement-linked task completion, blocked/at-risk/unstarted signals, completion forecast, and token/cost forecast
- expose forecast and burndown data in Mission Control as runtime projection
- preserve Parallel Lane, Multi-Actor Pilot, Work Execution Packet, context/reference, and QIF boundaries as upstream evidence gates

Deferred:

- semantic satisfaction scoring
- market validation or operator acceptance claims
- external worker adapters
- provider-specific session streaming integrations
- runtime scheduler automation

## Release Gates

### Gate 1: Requirement Contract

- each requirement has type, source, owner, acceptance boundary, evidence refs, and status
- requirements can represent functional, non-functional, QIF quality-intent, and release-gate concerns
- missing requirement evidence blocks coverage claims

### Gate 2: Coverage And Forecast

- work items and evidence refs link to requirement refs
- coverage, completion, blocked/at-risk/unstarted signals are derived from canonical artifacts
- completion and token/cost forecast are bounded projections, not certainty claims

### Gate 3: Governance Continuity

- v7.0 session observability audit still passes
- v7.1 context/reference integrity audit still passes
- v7.2 Work Execution Packet audit still passes
- v7.3 Multi-Actor Pilot audit still passes
- v7.4 Parallel Lane audit still passes
- work readiness, quality ledger, Archmap impact, review provenance, and evidence independence audits still pass

### Gate 4: Release Surface

- package version is updated to the selected release
- active release manifest points at selected release docs
- README and roadmap describe requirement coverage and forecast evidence without overclaiming semantic satisfaction or delivery certainty

### Gate 5: Verification

- requirement coverage audit
- parallel lane audit
- multi-actor pilot audit
- work execution packet audit
- context/reference integrity audit
- session observability audit
- quality ledger audit
- work readiness audit
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

Release only if AOF now makes it harder to confuse:

- requirement presence with requirement satisfaction
- task completion with requirement coverage
- forecast with certainty
- dashboard display with proof
- QIF gates with semantic truth

## Post-v7.4 Direction

The v7 line should proceed in this order:

1. `v7.5`: Requirements Coverage, Forecasting, And Organization Analytics
2. `v7.6`: Provider-Neutral Session Export
3. `v7.7`: Adoption-Grade v7 Runtime
4. `v8.0`: Externalized Organization Runtime

Canonical planning reference:

- `docs/v7.x-roadmap.md`

Do not jump directly from parallel lane evidence to autonomous workforce claims. The
runtime must first prove requirement-linked coverage/forecasting and
evidence-backed analytics.

## Requirement Coverage Direction

The post-v7.1 roadmap must treat Mission Control as more than a status viewer.
It should eventually show:

- requirement coverage
- requirement-linked task completion rate
- blocked / at-risk / unstarted requirement signals
- completion forecast
- token or cost forecast
- burn-down chart data

This requires AOF to extract and maintain requirements before analytics can be
credible:

- raw need / validated need
- project charter objective
- functional requirements
- non-functional requirements
- QIF quality intents
- acceptance gates
- evidence refs
- verdict boundary

QIF should be used for the quality definition side: quality intent, risk, loss
boundary, acceptance gates, evidence, confidence, uncertainty, and governance
trigger. AOF should not claim that requirement-linked tasks are "satisfied"
merely because task files are done.
