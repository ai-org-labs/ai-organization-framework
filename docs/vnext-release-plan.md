# Next Release Plan

## Version

Candidate: `v9.2.0`

## Release Theme

External Runtime Production Boundary Candidate.

`v9.1.0` added Product Value Comprehension Gate because user feedback showed that AOF could pass internal runtime audits while still failing to explain what became possible for a user. The next bottleneck returns to the external runtime production boundary: AOF must define the exact additional proof, approval, credential, budget, revocation, rollback, and monitoring preconditions required before any real provider-side execution can be considered, while keeping product-value comprehension as a release gate.

Human-facing wording:

> v9.2 should define what must be true before real provider execution is even eligible, without claiming that production execution is safe today, and without hiding whether users understand the release value.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v9.1.0`
- v9.1 evidence: `docs/v9.1-release-definition.md`, `docs/v9.1.0-release-notes.md`, `.aof/artifacts/product-value-evidence/product-value-evidence-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v9.2` External Runtime Production Boundary Candidate

## Required Outcomes

Required:

- define production-boundary candidate records for provider-backed execution
- require explicit credential, budget, revocation, rollback, monitoring, incident, and human approval preconditions
- distinguish pre-production eligibility from production safety
- make Mission Control show which production-boundary prerequisites are satisfied, missing, or blocked
- keep v9.0 operator acceptance drill boundaries compatible
- keep v9.1 product value comprehension gate compatible

Deferred:

- autonomous production provider execution
- hosted provider orchestration
- credential or billing management implementation
- semantic correctness of provider output
- market truth beyond bounded operator acceptance evidence

## Release Gates

- production-boundary candidate audit passes
- missing credential, budget, revocation, rollback, monitoring, or incident evidence blocks eligibility
- release-state audit includes the new v9.2 gates
- Mission Control shows production-boundary eligibility without implying production safety
- existing v9.0 operator acceptance drill audit remains green
- existing v9.1 product value evidence audit remains green

## Release Decision

Release only if AOF makes it harder to confuse:

- production-boundary eligibility with production safety
- operator feedback with market validation
- observed outcome with semantic truth
- rollback readiness with rollback execution
- green audit with external execution authority

## Forward Path

1. `v9.2`: External Runtime Production Boundary Candidate
2. `v9.3`: Provider-backed Controlled Execution Candidate
3. `v9.4`: External Runtime Incident Drill and Recovery Evidence
4. `v9.5`: Provider Execution Cost and Quota Boundary
