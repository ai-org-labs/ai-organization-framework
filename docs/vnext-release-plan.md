# Next Release Plan

## Version

Candidate: `v7.6.0`

## Release Theme

Provider-Neutral Session Export.

`v7.5.0` made requirement coverage and forecast claims auditable through requirement records, work links, evidence refs, coverage counts, forecast boundaries, and not-proven limits. The next bottleneck is portability: AOF should be able to export agent/session evidence as a provider-neutral package instead of depending on one vendor's session stream.

Human-facing wording:

> v7.6 should prove that AOF can export the evidence of AI work in a portable package that connects session events to tasks, requirements, tests, risks, decisions, and release-readiness boundaries.

More explicit wording:

> AOF should treat provider session streams as input evidence, not as the canonical source of truth; the canonical source is the normalized AOF export package and its refs.

## Runtime Evidence Basis

- runtime basis: `docs/v7.x-roadmap.md`
- previous release: `v7.5.0`
- v7.5 evidence: `docs/v7.5-release-definition.md`, `docs/v7.5.0-release-notes.md`, `.aof/artifacts/requirement-coverage/TASK-094.json`
- current frontier candidate: `v7.6` Provider-Neutral Session Export

## Required Outcomes

Required:

- define provider-neutral session export schema
- include prompt, response, tool call, artifact write, verification, blocker, and stop-condition event summaries
- link exported events to task refs, requirement refs, test evidence refs, risk candidates, decision candidates, and release-ready evidence
- include redaction and privacy boundary fields
- audit export presence, schema validity, required links, redaction boundary, and not-proven limits
- integrate the export audit into release-state governance for `7.6.0` and later

Deferred:

- provider-specific streaming adapters
- external SIEM/observability integrations
- real-time event ingestion
- semantic judgment of prompt or response quality
- market/operator acceptance claims

## Release Gates

### Gate 1: Export Contract

- session export schema exists
- exported event summaries cover prompt, response, tool call, artifact write, verification, blocker, and stop condition
- export includes provider/source metadata without requiring a vendor as source of truth

### Gate 2: Linkage

- exported session data links to task refs
- exported session data links to requirement refs
- exported session data links to test evidence refs
- exported session data links to risk and decision candidates
- release-ready evidence is explicit and bounded

### Gate 3: Governance Boundary

- redaction/privacy boundary is mandatory
- missing export, missing links, missing redaction boundary, or absent not-proven limits fail the audit
- v7.5 Requirement Coverage audit still passes
- v7.4 Parallel Lane audit still passes
- v7.3 Multi-Actor Pilot audit still passes
- v7.2 Work Execution Packet audit still passes

### Gate 4: Release Surface

- package version is updated to the selected release
- active release manifest points at selected release docs
- README and roadmap describe provider-neutral export without claiming provider automation or semantic truth

### Gate 5: Verification

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

- provider stream availability with canonical evidence
- session event existence with semantic quality
- export completeness with privacy safety
- task linkage with requirement satisfaction
- release-ready evidence with external validation

## Post-v7.5 Direction

The v7 line should proceed in this order:

1. `v7.6`: Provider-Neutral Session Export
2. `v7.7`: Adoption-Grade v7 Runtime
3. `v7.8`: Mission Control Coverage Forecast Projection
4. `v8.0`: Externalized Organization Runtime

Canonical planning reference:

- `docs/v7.x-roadmap.md`
