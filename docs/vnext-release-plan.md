# Next Release Plan

## Version

Candidate: `v8.3.0`

## Release Theme

Mission Control Operator Acceptance Evidence.

`v8.2.0` made operator/adopter feedback governable through operator validation records, audit, release-state integration, and Mission Control projection. The next bottleneck is acceptance evidence usability: Mission Control should make operator validation status obvious enough that a human can see acceptance, rejection, clarification need, and evidence path without reading raw JSON.

Human-facing wording:

> v8.3 should make operator acceptance evidence visible in Mission Control without raw artifact reading.

More explicit wording:

> Operator acceptance should be legible as a live runtime state, not buried in audit JSON.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v8.2.0`
- v8.2 evidence: `docs/v8.2-release-definition.md`, `docs/v8.2.0-release-notes.md`, `.aof/artifacts/operator-validation/operator-validation-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v8.3` Mission Control Operator Acceptance Evidence

## Required Outcomes

Required:

- make Mission Control render operator validation status as first-class acceptance evidence
- show acceptance, rejection, clarification, and reproduction outcomes without raw JSON reading
- link visible acceptance state to release, task, evidence, and governance action
- keep operator-validation-audit compatible from v8.2
- keep provider adapter governance compatible from v8.1

Deferred:

- autonomous external provider execution
- production deployment automation
- credential or billing management
- hosted multi-tenant runtime
- semantic correctness of external tool outputs

## Release Gates

### Gate 1: Operator Acceptance Visibility

- Mission Control shows operator validation status from canonical artifacts
- accepted / rejected / needs-clarification / not-reproduced states are visually and semantically distinguishable
- visible acceptance state links back to release, work item, and evidence refs

### Gate 2: Runtime Evidence

- local runtime artifacts link to operator acceptance claims
- Mission Control can show why a release is or is not operator-accepted
- provider-neutral session export remains reconstructable

### Gate 3: Governance Boundary

- missing acceptance evidence remains visible as incomplete
- unclear feedback outcome requires governance review
- rejected or context-mismatched feedback blocks release acceptance claims
- operator feedback is not treated as market truth
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
- README and roadmap describe operator acceptance visibility without claiming semantic truth or market adoption

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

- an internally green release with an operator-accepted release
- dashboard presence with visible acceptance evidence
- feedback collection with validated product value
- activity volume with adoption quality
- provider adapter readiness with operator acceptance

## Post-v8.2 Direction

The next line should proceed in this order:

1. `v8.3`: Mission Control Operator Acceptance Evidence
2. `v8.4`: Externalized Runtime Operator Safety Proof
3. `v8.5`: Provider Adapter Execution Pilot Boundary
4. `v8.6`: External Runtime Execution Approval Bridge

Canonical planning reference:

- `docs/vnext-roadmap.md`
