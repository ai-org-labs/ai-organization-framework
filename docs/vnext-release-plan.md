# Next Release Plan

## Version

Candidate: `v8.5.0`

## Release Theme

Provider Adapter Execution Pilot Boundary.

`v8.4.0` made externalized runtime safety visible before externalized execution advances. The next bottleneck is the execution pilot boundary: before provider adapters are used for real external work, AOF must prove that a pilot can be bounded by approval, dry-run, provenance, rollback, redaction, and no-production-write constraints.

Human-facing wording:

> v8.5 should prove the boundary for provider adapter execution pilots before any real external write path is trusted.

More explicit wording:

> Provider adapter execution pilots should be governed experiments, not quiet automation.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v8.4.0`
- v8.4 evidence: `docs/v8.4-release-definition.md`, `docs/v8.4.0-release-notes.md`, `.aof/artifacts/visibility/current/mission-control.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v8.5` Provider Adapter Execution Pilot Boundary

## Required Outcomes

Required:

- define a provider adapter execution pilot as a bounded experiment
- require explicit approval, dry-run/default-deny, provenance, redaction, rollback, and no-production-write boundaries
- record pilot inputs, expected external effect, allowed commands, denied commands, evidence refs, and stop conditions
- show pilot readiness in Mission Control without implying autonomous production execution
- keep v8.4 external runtime safety visibility compatible

Deferred:

- autonomous production provider execution
- production deployment automation
- credential or billing management
- hosted multi-tenant runtime
- semantic correctness of provider output

## Release Gates

### Gate 1: Provider Adapter Pilot Boundary

- provider adapter pilot records explicit allowed/denied external actions
- pilot is default-deny and dry-run unless approved otherwise
- no production write, billing, deploy, secret, or irreversible action is allowed without a separate approval artifact

### Gate 2: Runtime Evidence

- runtime artifacts link pilot claim, provider refs, resource refs, approval refs, and verification refs
- Mission Control can show pilot readiness and blocking reason
- provider-neutral session export remains reconstructable for pilot events

### Gate 3: Governance Boundary

- missing approval, missing redaction, missing rollback, missing provenance, or unclear external effect blocks pilot execution claims
- pilot readiness is not treated as production safety, semantic truth, or credential authority
- v8.4 external runtime safety visibility still passes
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

- provider adapter existence with safe execution
- dry-run pilot with production authority
- approval metadata with human governance approval
- execution traceability with semantic correctness
- activity volume with accepted external work quality

## Post-v8.4 Direction

The next line should proceed in this order:

1. `v8.5`: Provider Adapter Execution Pilot Boundary
2. `v8.6`: External Runtime Execution Approval Bridge
3. `v8.7`: External Runtime Reproduction and Rollback Proof

Canonical planning reference:

- `docs/vnext-roadmap.md`
