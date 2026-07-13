# Next Release Plan

## Version

Candidate: `v7.3.0`

## Release Theme

Governed Multi-Actor Pilot.

`v7.2.0` made execution claims bounded through a Work Execution Packet. The next bottleneck is proving that AOF can use that packet as the handoff unit for a small governed multi-actor loop without hiding actor work, weakening Maker / Checker separation, or turning Council review into decoration.

Human-facing wording:

> v7.3 should prove that a Council can select multiple actors, assign bounded work, receive actor handoffs, judge the output, and return a reconstructable Work Execution Packet.

More explicit wording:

> AOF should treat actor work as governed organization evidence, not as one parent AI silently role-playing every participant.

## Runtime Evidence Basis

- runtime basis: `docs/v7.x-roadmap.md`
- previous release: `v7.2.0`
- v7.2 evidence: `docs/v7.2-release-definition.md`, `docs/v7.2.0-release-notes.md`, `.aof/artifacts/work-execution-packets/TASK-091.json`
- current frontier candidate: `v7.3` Governed Multi-Actor Pilot

## Required Outcomes

Required:

- define the parent orchestrator assignment packet for a bounded pilot
- keep Visionary / Builder / Guardian present as Council participants
- record actor roster proposal and Council approval before execution
- require actor output handoffs before Council judgment
- close the pilot through Work Execution Packet audit

Deferred:

- full autonomous workforce execution
- external worker adapters
- parallel lane join/conflict semantics
- provider-specific session streaming integrations

## Release Gates

### Gate 1: Council And Actor Contract

- Council roster includes Visionary, Builder, and Guardian
- parent orchestrator proposes actor roster before work execution
- Council can approve, reject, or request changes to the roster

### Gate 2: Actor Handoff

- actor outputs are submitted through organization handoff artifacts
- actor handoffs link to source task, packet, session evidence, and verification evidence
- actor work is not treated as final truth without Council judgment

### Gate 3: Governance Continuity

- v7.0 session observability audit still passes
- v7.1 context/reference integrity audit still passes
- v7.2 Work Execution Packet audit still passes
- work readiness, quality ledger, Archmap impact, review provenance, and evidence independence audits still pass

### Gate 4: Release Surface

- package version is updated to the selected release
- active release manifest points at selected release docs
- README and roadmap describe governed multi-actor evidence without overclaiming autonomous organization performance

### Gate 5: Verification

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

- parent orchestration with silent role-play
- actor participation with actor handoff evidence
- Council approval with decoration
- packet completeness with semantic truth
- multi-actor activity with governed organization work

## Post-v7.2 Direction

The v7 line should proceed in this order:

1. `v7.3`: Governed Multi-Actor Pilot
2. `v7.4`: Governed Parallel Lanes
3. `v7.5`: Requirements Coverage, Forecasting, And Organization Analytics
4. `v7.6`: Provider-Neutral Session Export
5. `v7.7`: Adoption-Grade v7 Runtime

Canonical planning reference:

- `docs/v7.x-roadmap.md`

Do not jump directly from bounded packets to autonomous workforce claims. The
runtime must first prove Council join semantics, actor handoff integrity,
parallel lane join/conflict semantics, requirement-linked coverage/forecasting,
and evidence-backed analytics.

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
