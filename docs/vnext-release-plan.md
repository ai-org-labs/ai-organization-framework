# Next Release Plan

## Version

Candidate: `v9.4.0`

## Release Theme

Provider-backed Controlled Execution Candidate.

`v9.3.0` fixed the release-comprehension problem: releases must start from user-visible capability, delta, value evidence, and not-proven boundary. The next bottleneck returns to the provider track. AOF has approval, target, reproduction, rollback, outcome, learning, operator acceptance, product value, and production-boundary evidence, but those artifacts are still scattered.

Human-facing wording:

> v9.4 should let an operator inspect one controlled provider execution candidate and decide whether the provider-backed action is ready for explicit go/no-go, without mistaking that state for production execution authorization.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v9.3.0`
- v9.3 evidence: `docs/v9.3-release-definition.md`, `docs/v9.3.0-release-notes.md`, `.aof/artifacts/capability-release-deltas/capability-first-release-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v9.4` Provider-backed Controlled Execution Candidate

## Required Outcomes

Required:

- add `provider-controlled-execution-candidate-record`
- add `provider-controlled-execution-candidate-audit`
- bind approval, target operation, reproduction, rollback, outcome, learning, operator acceptance, product value, and production-boundary refs into one candidate
- make `release-state-audit` include the v9.4 candidate audit
- update the capability matrix and release notes from user-visible capability first
- keep production provider execution explicitly unauthorized

Deferred:

- live production provider execution
- hosted provider orchestration
- credential/billing safety proof in a live provider
- actual rollback execution against an external provider
- broad market adoption or semantic correctness of provider output

## Release Gates

- controlled execution candidate audit passes
- release-state audit includes the v9.4 gate
- product value evidence audit remains green
- capability-first release audit remains green
- README and Quickstart point at the current release
- full runtime tests and smoke validation pass

## Release Decision

Release only if AOF makes it harder to confuse:

- provider readiness artifacts with a controlled execution candidate
- operator go/no-go with production execution authorization
- external write candidate status with credential/billing safety
- audit pass with semantic correctness
- release mechanism with user-visible capability

## Forward Path

1. `v9.4`: Provider-backed Controlled Execution Candidate
2. `v9.5`: External Runtime Incident Drill and Recovery Evidence
3. `v9.6`: Provider Execution Cost and Quota Boundary
4. `v9.7`: Third-party Operator Validation for External Runtime Claims
5. `v9.8`: Production Execution Go/No-Go Evidence Candidate
