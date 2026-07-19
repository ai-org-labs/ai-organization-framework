# Next Release Plan

## Version

Candidate: `v8.4.0`

## Release Theme

Externalized Runtime Operator Safety Proof.

`v8.3.0` made operator acceptance evidence visible in Mission Control without raw JSON reading. The next bottleneck is externalized runtime safety: before AOF advances toward external execution, the operator must be able to see permission, approval, risk, provenance, and not-proven boundaries clearly enough to decide whether externalized execution is safe to continue.

Human-facing wording:

> v8.4 should make externalized runtime safety visible before any external execution bridge advances.

More explicit wording:

> Externalized runtime safety should be legible as an operator decision surface, not buried in audit JSON.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v8.3.0`
- v8.3 evidence: `docs/v8.3-release-definition.md`, `docs/v8.3.0-release-notes.md`, `.aof/artifacts/operator-validation/operator-validation-audit.json`, `.aof/artifacts/visibility/current/mission-control.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v8.4` Externalized Runtime Operator Safety Proof

## Required Outcomes

Required:

- make Mission Control render externalized runtime safety status as first-class operator evidence
- show permission, approval, provenance, freshness, risk, and not-proven boundaries without raw JSON reading
- link visible externalization safety state to release, task, evidence, governance action, and provider/resource refs
- keep operator acceptance visibility compatible from v8.3
- keep operator-validation-audit compatible from v8.2
- keep provider adapter governance compatible from v8.1

Deferred:

- autonomous external provider execution
- production deployment automation
- credential or billing management
- hosted multi-tenant runtime
- semantic correctness of external tool outputs

## Release Gates

### Gate 1: Externalized Runtime Safety Visibility

- Mission Control shows externalized runtime safety status from canonical artifacts
- safe / blocked / needs approval / stale / not-proven states are visually and semantically distinguishable
- visible safety state links back to release, work item, provider/resource refs, and evidence refs

### Gate 2: Runtime Evidence

- local runtime artifacts link to externalized runtime safety claims
- Mission Control can show why externalized execution is or is not safe to advance
- provider-neutral session export remains reconstructable

### Gate 3: Governance Boundary

- missing safety evidence remains visible as incomplete
- unclear provider/resource permission state requires governance review
- unsafe, stale, unavailable, or approval-missing externalization evidence blocks external execution claims
- externalized runtime safety evidence is not treated as semantic correctness or production-write authority
- v8.3 Mission Control operator acceptance visibility still passes
- v8.2 operator-validation-audit still passes
- v8.1 provider-adapter-audit still passes
- v8.0 external-resource-audit still passes
- v7.9 externalization readiness audit still passes
- v7.8 Mission Control projection audit still passes
- v7.7 Adoption Proof benchmark still passes
- v7.6 Session Export audit still passes
- v7.5 Requirement Coverage audit still passes
- v7.4 Parallel Lane audit still passes
- v7.3 Multi-Actor Pilot audit still passes
- v7.2 Work Execution Packet audit still passes

### Gate 4: Release Surface

- package version is updated to the selected release
- active release manifest points at selected release docs
- README and roadmap describe externalized runtime safety visibility without claiming semantic truth, production safety, or autonomous external execution

### Gate 5: Verification

- Mission Control projection audit
- operator validation audit
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

- externalization readiness with external execution permission
- provider adapter readiness with operator-approved execution safety
- dashboard presence with visible safety evidence
- safety evidence with semantic correctness
- activity volume with adoption quality

## Post-v8.3 Direction

The next line should proceed in this order:

1. `v8.4`: Externalized Runtime Operator Safety Proof
2. `v8.5`: Provider Adapter Execution Pilot Boundary
3. `v8.6`: External Runtime Execution Approval Bridge

Canonical planning reference:

- `docs/vnext-roadmap.md`
