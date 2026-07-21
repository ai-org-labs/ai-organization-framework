# Next Release Plan

## Version

Candidate: `v9.3.0`

## Release Theme

Capability-First Release Comprehension.

`v9.2.0` added the External Runtime Production Boundary Candidate. The next bottleneck is not another provider mechanism; it is product comprehension. Users cannot trust the release train if they cannot understand what capability changed.

Human-facing wording:

> v9.3 should make every release capability-first: what the user can do, what changed, why it matters, what evidence supports it, and what remains unproven must be visible before mechanism details.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v9.2.0`
- v9.2 evidence: `docs/v9.2-release-definition.md`, `docs/v9.2.0-release-notes.md`, `.aof/artifacts/provider-production-boundaries/provider-production-boundary-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v9.3` Capability-First Release Comprehension

## Required Outcomes

Required:

- define a product capability model
- commit a product capability register
- add a capability matrix that explains version differences in 30 seconds
- record capability delta for the active release
- add `capability-first-release-audit`
- preserve provider preflight work as the next frontier after comprehension is fixed

Deferred:

- controlled provider-backed execution candidate
- autonomous provider execution
- hosted provider orchestration
- semantic correctness of provider output
- market truth beyond bounded value comprehension evidence

## Release Gates

- capability-first release audit passes
- product value evidence audit remains green
- release notes begin with user capability before mechanism
- README exposes capability matrix
- release-state audit includes the new v9.3 gate

## Release Decision

Release only if AOF makes it harder to confuse:

- artifacts with capability
- audits with user value
- release tags with product progress
- dashboards with comprehension
- value explanation with market validation

## Forward Path

1. `v9.3`: Capability-First Release Comprehension
2. `v9.4`: Provider-backed Controlled Execution Candidate
3. `v9.5`: External Runtime Incident Drill and Recovery Evidence
4. `v9.6`: Provider Execution Cost and Quota Boundary
5. `v9.7`: Third-party Operator Validation for External Runtime Claims
