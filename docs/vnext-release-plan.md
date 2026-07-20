# Next Release Plan

## Version

Candidate: `v8.6.0`

## Release Theme

External Runtime Execution Approval Bridge.

`v8.5.0` made provider adapter execution pilots governed dry-run/default-deny experiments. The next bottleneck is the approval bridge: before any external runtime execution step is allowed to create a real provider side effect, AOF must prove that approval, scope, redaction, rollback, provenance, and stop conditions are explicit and auditable.

Human-facing wording:

> v8.6 should prove the approval bridge for external runtime execution before any real external write path is trusted.

More explicit wording:

> External runtime execution should require a visible approval bridge, not hidden permission metadata.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v8.5.0`
- v8.5 evidence: `docs/v8.5-release-definition.md`, `docs/v8.5.0-release-notes.md`, `.aof/artifacts/provider-adapter-pilots/provider-adapter-pilot-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v8.6` External Runtime Execution Approval Bridge

## Required Outcomes

Required:

- define an external runtime execution approval bridge as a bounded precondition for any real provider side effect
- require explicit operator or Council approval artifact before external writes
- bind approval to one work item, one provider adapter, one expected effect, one rollback plan, and one stop condition set
- show approval bridge state in Mission Control without implying broad production authority
- keep v8.5 provider adapter pilot boundaries compatible

Deferred:

- autonomous production provider execution
- production deployment automation
- credential or billing management
- hosted multi-tenant runtime
- semantic correctness of provider output

## Release Gates

### Gate 1: External Runtime Execution Approval Bridge

- approval bridge records explicit authorized external action scope
- approval is single-use or explicitly bounded by work item and provider adapter
- no production write, billing, deploy, secret, or irreversible action is allowed without approval evidence and rollback plan

### Gate 2: Runtime Evidence

- runtime artifacts link execution approval, provider refs, resource refs, pilot refs, rollback refs, and verification refs
- Mission Control can show approval bridge readiness and blocking reason
- provider-neutral session export remains reconstructable for pilot events

### Gate 3: Governance Boundary

- missing approval, missing redaction, missing rollback, missing provenance, or unclear external effect blocks external execution claims
- approval bridge readiness is not treated as production safety, semantic truth, or credential authority
- v8.5 provider adapter pilot boundary still passes
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
- README and roadmap describe the external runtime approval bridge without claiming semantic truth, production safety, or autonomous external execution

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

- pilot readiness with external write approval
- approval metadata with bounded human/Council approval
- single-use approval with broad production authority
- execution traceability with semantic correctness
- activity volume with accepted external work quality

## Post-v8.5 Direction

The next line should proceed in this order:

1. `v8.6`: External Runtime Execution Approval Bridge
2. `v8.7`: External Runtime Reproduction and Rollback Proof
3. `v8.8`: External Runtime Outcome Evidence and Learning Loop

Canonical planning reference:

- `docs/vnext-roadmap.md`
