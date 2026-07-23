# Next Release Plan

## Version

Candidate: `v9.5.0`

## Release Theme

External Runtime Incident Drill and Recovery Evidence.

`v9.4.2` corrected the controlled execution candidate release line so clean checkouts can reproduce the provider-backed candidate audit. The next bottleneck is failure handling: a candidate is not enough if the operator cannot see what happens when the provider action fails.

Human-facing wording:

> v9.5 should let an operator inspect the incident recovery drill for a controlled provider candidate before allowing external provider work to advance.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v9.4.2`
- v9.4 evidence: `docs/v9.4-release-definition.md`, `docs/v9.4.2-release-notes.md`, `.aof/artifacts/provider-controlled-execution-candidates/provider-controlled-execution-candidate-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v9.5` External Runtime Incident Drill and Recovery Evidence

## Required Outcomes

Required:

- add `provider-incident-recovery-record`
- add `provider-incident-recovery-audit`
- bind controlled execution candidate, approval, reproduction, rollback, outcome, learning, operator acceptance, and production-boundary refs into one incident recovery drill
- make `release-state-audit` include the v9.5 incident recovery audit
- update the capability matrix and release notes from user-visible capability first
- keep production provider execution explicitly unauthorized

Deferred:

- live production provider execution
- hosted provider orchestration
- credential/billing safety proof in a live provider
- actual rollback execution against an external provider
- actual incident recovery performance in production
- broad market adoption or semantic correctness of provider output

## Release Gates

- provider incident recovery audit passes
- release-state audit includes the v9.5 gate
- product value evidence audit remains green
- capability-first release audit remains green
- README and Quickstart point at the current release
- full runtime tests and smoke validation pass

## Release Decision

Release only if AOF makes it harder to confuse:

- provider controlled execution candidate with incident recovery readiness
- incident recovery drill with production recovery performance
- resume decision with hidden autonomous execution authority
- audit pass with semantic correctness
- release mechanism with user-visible capability

## Forward Path

1. `v9.5`: External Runtime Incident Drill and Recovery Evidence
2. `v9.6`: Provider Execution Cost and Quota Boundary
3. `v9.7`: Third-party Operator Validation for External Runtime Claims
4. `v9.8`: Production Execution Go/No-Go Evidence Candidate
5. `v9.9`: External Runtime Production Readiness Review
