# Next Release Plan

## Version

Candidate: `v9.3.0`

## Release Theme

Provider-backed Controlled Execution Candidate.

`v9.2.0` added the External Runtime Production Boundary Candidate. The next bottleneck is controlled provider-backed execution without hidden autonomy: AOF must prove it can run only a bounded operation after the production-boundary candidate, human go/no-go, rollback, monitoring, incident, and product-value comprehension conditions are satisfied.

Human-facing wording:

> v9.3 should attempt the narrowest controlled provider-backed operation only after the v9.2 production boundary says the operation is eligible, and should stop rather than execute when any boundary is missing.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v9.2.0`
- v9.2 evidence: `docs/v9.2-release-definition.md`, `docs/v9.2.0-release-notes.md`, `.aof/artifacts/provider-production-boundaries/provider-production-boundary-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v9.3` Provider-backed Controlled Execution Candidate

## Required Outcomes

Required:

- define a bounded controlled execution record
- require a passing v9.2 production-boundary audit before execution is eligible
- require human go/no-go and revocation state at the moment of execution
- record operation target, provider result, monitoring signal, rollback readiness, incident owner, and stop condition
- preserve product-value comprehension as a release gate

Deferred:

- autonomous provider execution
- hosted provider orchestration
- general credential or billing management implementation
- semantic correctness of provider output
- market truth beyond bounded operator acceptance evidence

## Release Gates

- controlled execution candidate audit passes
- production-boundary audit remains green before execution candidate is accepted
- missing human go/no-go, revocation, rollback, monitoring, incident, or product-value evidence blocks execution
- release-state audit includes the new v9.3 gates
- Mission Control shows controlled-execution state without implying autonomous safety

## Release Decision

Release only if AOF makes it harder to confuse:

- controlled execution candidate with autonomous provider execution
- operator feedback with market validation
- observed outcome with semantic truth
- rollback readiness with rollback execution
- green audit with external execution authority

## Forward Path

1. `v9.3`: Provider-backed Controlled Execution Candidate
2. `v9.4`: External Runtime Incident Drill and Recovery Evidence
3. `v9.5`: Provider Execution Cost and Quota Boundary
4. `v9.6`: Third-party Operator Validation for External Runtime Claims
