# Next Release Plan

## Version

Candidate: `v7.1.0`

## Release Theme

Context and Reference Integrity.

`v7.0.0` made the live agent session path reconstructable as local runtime event evidence. The next bottleneck is that a reconstructable session can still depend on hidden conversation context, stale external references, or undeclared sources that the operator cannot verify.

Human-facing wording:

> v7.1 should let an operator see which context and references the AI organization relied on, and whether those inputs were declared, current, and reviewable.

More explicit wording:

> AOF should treat context and external references as explicit runtime dependencies, not invisible conversation residue.

## Runtime Evidence Basis

- runtime basis: `docs/v7.x-roadmap.md`
- previous release: `v7.0.0`
- v7.0 evidence: `docs/v7.0-release-definition.md`, `docs/v7.0.0-release-notes.md`
- current frontier candidate: `v7.1` Context and Reference Integrity

## Required Outcomes

Required:

- define context pack integrity expectations for runtime work
- define external reference resolution expectations
- detect stale, missing, or hidden reference dependencies
- project context/reference blockers into Mission Control
- connect context/reference evidence to session event streams and Council review

Deferred:

- semantic validation of every referenced source
- automated web freshness scoring for all domains
- external service writes
- general autonomous workforce execution

## Release Gates

### Gate 1: Context Contract

- work items can declare required context refs
- hidden conversation context can be represented as a blocker
- context refs link to session and Council evidence

### Gate 2: External Reference Integrity

- external refs can declare source, access date, freshness expectation, and usage
- unresolved or stale refs can fail the audit
- reference presence is not misrepresented as semantic truth

### Gate 3: Governance Continuity

- v7.0 session observability audit still passes
- work readiness, quality ledger, Archmap impact, review provenance, and evidence independence audits still pass
- Council review can see which refs were actually used

### Gate 4: Release Surface

- package version is updated to the selected release
- active release manifest points at selected release docs
- README and roadmap describe context/reference integrity without overclaiming semantic truth

### Gate 5: Verification

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

- declared context with hidden context
- available references with trusted references
- stale external references with current evidence
- event reconstructability with input integrity
- reference presence with semantic correctness

## Post-v7.1 Direction

The v7 line should proceed in this order:

1. `v7.2`: Work Execution Packet
2. `v7.3`: Governed Multi-Actor Pilot
3. `v7.4`: Governed Parallel Lanes
4. `v7.5`: Requirements Coverage, Forecasting, And Organization Analytics
5. `v7.6`: Provider-Neutral Session Export
6. `v7.7`: Adoption-Grade v7 Runtime

Canonical planning reference:

- `docs/v7.x-roadmap.md`

Do not jump directly from event streams to autonomous workforce claims. The
runtime must first prove context integrity, bounded execution packets, Council
join semantics, requirement-linked coverage/forecasting, and evidence-backed
analytics.

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
