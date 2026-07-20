# Next Release Plan

## Version

Candidate: `v9.1.0`

## Release Theme

External Runtime Production Boundary Candidate.

`v9.0.0` proved that an approved, locally reproduced, rollback-ready, outcome-recorded, learning-updated external runtime chain can be inspected through an operator acceptance drill before controlled provider execution advances. The next bottleneck is the production boundary: AOF must define the exact additional proof, approval, credential, budget, revocation, rollback, and monitoring preconditions required before any real provider-side execution can be considered.

Human-facing wording:

> v9.1 should define what must be true before real provider execution is even eligible, without claiming that production execution is safe today.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v9.0.0`
- v9.0 evidence: `docs/v9.0-release-definition.md`, `docs/v9.0.0-release-notes.md`, `.aof/artifacts/operator-acceptance-drills/operator-acceptance-drill-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v9.1` External Runtime Production Boundary Candidate

## Required Outcomes

Required:

- define production-boundary candidate records for provider-backed execution
- require explicit credential, budget, revocation, rollback, monitoring, incident, and human approval preconditions
- distinguish pre-production eligibility from production safety
- make Mission Control show which production-boundary prerequisites are satisfied, missing, or blocked
- keep v9.0 operator acceptance drill boundaries compatible

Deferred:

- autonomous production provider execution
- hosted provider orchestration
- credential or billing management implementation
- semantic correctness of provider output
- market truth beyond bounded operator acceptance evidence

## Release Gates

- production-boundary candidate audit passes
- missing credential, budget, revocation, rollback, monitoring, or incident evidence blocks eligibility
- release-state audit includes the new v9.1 gates
- Mission Control shows production-boundary eligibility without implying production safety
- existing v9.0 operator acceptance drill audit remains green

## Release Decision

Release only if AOF makes it harder to confuse:

- production-boundary eligibility with production safety
- operator feedback with market validation
- observed outcome with semantic truth
- rollback readiness with rollback execution
- green audit with external execution authority

## Forward Path

1. `v9.1`: External Runtime Production Boundary Candidate
2. `v9.2`: Provider-backed Controlled Execution Candidate
3. `v9.3`: External Runtime Incident Drill and Recovery Evidence
4. `v9.4`: Provider Execution Cost and Quota Boundary
