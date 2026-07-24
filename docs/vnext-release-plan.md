# Next Release Plan

## Version

Candidate: `v9.6.0`

## Release Theme

Provider Execution Cost and Quota Boundary.

`v9.5.0` made the provider failure path reconstructable through incident recovery evidence. The next bottleneck is spend and quota safety: a recovery drill is not enough if the operator cannot see whether the provider-backed action is allowed to spend tokens, calls, quota, retries, or money.

Human-facing wording:

> v9.6 should let an operator inspect the cost and quota limits for a provider-backed action before allowing external provider work to advance.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v9.5.0`
- v9.5 evidence: `docs/v9.5-release-definition.md`, `docs/v9.5.0-release-notes.md`, `.aof/artifacts/provider-incident-recoveries/provider-incident-recovery-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v9.6` Provider Execution Cost and Quota Boundary

## Required Outcomes

Required:

- add `provider-cost-quota-boundary-record`
- add `provider-cost-quota-boundary-audit`
- bind controlled execution candidate, approval, incident recovery, budget owner, cost ceiling, token/call/retry caps, quota/rate-limit, billing, overage policy, and stop governance into one cost/quota boundary
- make `release-state-audit` include the v9.6 cost/quota audit
- update the capability matrix and release notes from user-visible capability first
- keep production provider execution explicitly unauthorized

Deferred:

- live production provider execution
- actual provider billing correctness proof
- actual provider quota enforcement proof
- hosted provider orchestration
- credential safety proof in a live provider
- broad market adoption or semantic correctness of provider output

## Release Gates

- provider cost quota boundary audit passes
- release-state audit includes the v9.6 gate
- provider incident recovery audit remains green
- product value evidence audit remains green
- capability-first release audit remains green
- README and Quickstart point at the current release
- full runtime tests and smoke validation pass

## Release Decision

Release only if AOF makes it harder to confuse:

- provider execution candidate with budget approval
- incident recovery readiness with spend safety
- positive audit with actual billing correctness
- cost boundary with production execution permission
- release mechanism with user-visible capability

## Forward Path

1. `v9.6`: Provider Execution Cost and Quota Boundary
2. `v9.7`: Third-party Operator Validation for External Runtime Claims
3. `v9.8`: Production Execution Go/No-Go Evidence Candidate
4. `v9.9`: External Runtime Production Readiness Review
5. `v10.0`: External Runtime Productization Decision
