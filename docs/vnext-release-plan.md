# Next Release Plan

## Version

Candidate: `v9.8.0`

## Release Theme

Production Execution Go/No-Go Evidence Candidate.

`v9.7.0` made architecture/work lifecycle traceability projectable through the Archmap v0.4 baseline. The next bottleneck is production movement judgment: AOF has many provider readiness records, but the operator needs one bounded go/no-go evidence candidate.

Human-facing wording:

> v9.8 should let an operator inspect one production go/no-go evidence candidate before any live provider execution is considered.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v9.7.0`
- v9.7 evidence: `docs/v9.7-release-definition.md`, `docs/v9.7.0-release-notes.md`, `.aof/artifacts/capability-release-deltas/CRD-TASK-117-V97.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v9.8` Production Execution Go/No-Go Evidence Candidate

## Required Outcomes

Required:

- define a production go/no-go evidence candidate release surface
- bind approval, target operation, reproduction, rollback, outcome, learning, incident recovery, cost/quota, product value, and not-proven boundaries
- add user-facing capability delta for production go/no-go evidence
- keep live provider execution explicitly unauthorized

Deferred:

- live provider execution
- production credential and billing safety proof
- third-party operator acceptance proof
- market value proof
- hosted provider orchestration

## Release Gates

- production go/no-go evidence candidate release docs exist
- capability register and matrix include Production Go/No-Go Evidence
- release-state audit passes
- organization verification passes
- README and Quickstart point at the current release
- full runtime tests and smoke validation pass

## Release Decision

Release only if AOF makes it harder to confuse:

- go/no-go evidence candidate with production go decision
- structural audit pass with production safety
- approval record with live execution permission
- outcome evidence with semantic truth
- product capability with market adoption

## Forward Path

1. `v9.8`: Production Execution Go/No-Go Evidence Candidate
2. `v9.9`: External Runtime Production Readiness Review
3. `v10.0`: External Runtime Productization Decision
4. `v10.1`: Third-party Operator Validation for External Runtime Claims
5. `v10.2`: External Provider Integration Pilot Selection
