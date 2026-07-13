# Next Release Plan

## Version

Candidate: `v7.4.0`

## Release Theme

Governed Parallel Lanes.

`v7.3.0` made multi-actor claims auditable through Council roles, actor roster, actor handoffs, Council judgment, and Work Execution Packet closure. The next bottleneck is proving that multiple bounded lanes can run in parallel without losing join, conflict, blocker, and Council decision semantics.

Human-facing wording:

> v7.4 should prove that AOF can split work into bounded parallel lanes, track lane-local evidence, and join or stop the lanes through Council judgment.

More explicit wording:

> AOF should treat parallelism as governed lane evidence, not as simultaneous unbounded AI activity.

## Runtime Evidence Basis

- runtime basis: `docs/v7.x-roadmap.md`
- previous release: `v7.3.0`
- v7.3 evidence: `docs/v7.3-release-definition.md`, `docs/v7.3.0-release-notes.md`, `.aof/artifacts/multi-actor-pilots/TASK-092.json`
- current frontier candidate: `v7.4` Governed Parallel Lanes

## Required Outcomes

Required:

- define a parallel lane contract for bounded work splits
- record lane-local inputs, actor assignment, evidence, blocker, and output refs
- record lane join/conflict semantics
- require Council merge, stop, defer, or reopen decision before the work is treated as joined
- preserve Work Execution Packet and Multi-Actor Pilot evidence as upstream gates

Deferred:

- full autonomous workforce execution
- external worker adapters
- provider-specific session streaming integrations
- runtime scheduler automation

## Release Gates

### Gate 1: Parallel Lane Contract

- each lane has a goal, owner actor, input refs, expected output, verification refs, and stop condition
- lanes are explicitly linked to the parent work item
- missing lane evidence blocks join claims

### Gate 2: Join And Conflict

- lane outputs are joined only through a recorded join packet
- conflicts and blockers are explicit
- Council can merge, stop, defer, or reopen

### Gate 3: Governance Continuity

- v7.0 session observability audit still passes
- v7.1 context/reference integrity audit still passes
- v7.2 Work Execution Packet audit still passes
- v7.3 Multi-Actor Pilot audit still passes
- work readiness, quality ledger, Archmap impact, review provenance, and evidence independence audits still pass

### Gate 4: Release Surface

- package version is updated to the selected release
- active release manifest points at selected release docs
- README and roadmap describe governed parallel lane evidence without overclaiming autonomous scheduling or autonomous workforce performance

### Gate 5: Verification

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

- parallel activity with governed lane evidence
- lane completion with parent work completion
- join packets with semantic correctness
- Council merge with decoration
- speed with quality

## Post-v7.3 Direction

The v7 line should proceed in this order:

1. `v7.4`: Governed Parallel Lanes
2. `v7.5`: Requirements Coverage, Forecasting, And Organization Analytics
3. `v7.6`: Provider-Neutral Session Export
4. `v7.7`: Adoption-Grade v7 Runtime

Canonical planning reference:

- `docs/v7.x-roadmap.md`

Do not jump directly from multi-actor pilot evidence to autonomous workforce claims. The
runtime must first prove parallel lane join/conflict semantics,
requirement-linked coverage/forecasting, and evidence-backed analytics.

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
