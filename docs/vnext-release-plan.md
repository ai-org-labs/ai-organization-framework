# Next Release Plan

## Version

Candidate: `v8.2.0`

## Release Theme

Adoption Feedback And Operator Validation Loop.

`v8.1.0` made provider adapters governable through adapter records, adapter audit, release-state integration, and Mission Control projection. The next bottleneck is operator validation: AOF should record whether a real adopter or operator could understand, reproduce, and accept the governed work path.

Human-facing wording:

> v8.2 should let AOF collect adoption feedback as governed runtime evidence, not as loose chat impressions.

More explicit wording:

> Operator validation should become a release input, not a post-release surprise.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v8.1.0`
- v8.1 evidence: `docs/v8.1-release-definition.md`, `docs/v8.1.0-release-notes.md`, `.aof/artifacts/provider-adapters/provider-adapter-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v8.2` Adoption Feedback And Operator Validation Loop

## Required Outcomes

Required:

- define operator validation feedback records
- link feedback to task, release, Mission Control view, and evidence refs
- distinguish understood, reproducible, accepted, rejected, and needs-clarification outcomes
- keep provider adapter governance compatible from v8.1
- project operator validation status into Mission Control from canonical artifacts

Deferred:

- autonomous external provider execution
- production deployment automation
- credential or billing management
- hosted multi-tenant runtime
- semantic correctness of external tool outputs

## Release Gates

### Gate 1: Operator Validation Contract

- operator/adopter feedback is represented as a governed artifact
- feedback is linked to the work item, release, and evidence it evaluates
- feedback is not treated as semantic truth without evidence boundary

### Gate 2: Runtime Evidence

- local runtime artifacts link to operator validation claims
- Mission Control can show whether a release was understood and accepted
- provider-neutral session export remains reconstructable

### Gate 3: Governance Boundary

- missing operator feedback links fail the audit
- unclear feedback outcome requires governance review
- rejected or context-mismatched feedback blocks release acceptance claims
- operator feedback is not treated as market truth
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

- an internally green release with an operator-accepted release
- dashboard presence with human comprehension
- feedback collection with validated product value
- activity volume with adoption quality
- provider adapter readiness with operator acceptance

## Post-v8.1 Direction

The next line should proceed in this order:

1. `v8.2`: Adoption Feedback And Operator Validation Loop
2. `v8.3`: Mission Control Operator Acceptance Evidence
3. `v8.4`: Externalized Runtime Operator Safety Proof
4. `v8.4`: Externalized Runtime Operator Safety Proof

Canonical planning reference:

- `docs/vnext-roadmap.md`
