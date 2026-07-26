# Next Release Plan

## Version

Candidate: `v9.7.0`

## Release Theme

Archmap v0.4.0 Lifecycle Traceability Baseline.

`v9.6.0` made provider spend and quota boundaries auditable before controlled provider execution advances. The next bottleneck is architecture/work lifecycle recognition: AOF must show how requirements, acceptance criteria, decisions, risks, tests, and evidence connect without turning the visualization provider into the source of truth.

Human-facing wording:

> v9.7 should let an operator inspect how AOF work evidence maps into Archmap v0.4 lifecycle concepts while preserving AOF artifacts as the canonical evidence.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v9.6.0`
- v9.6 evidence: `docs/v9.6-release-definition.md`, `docs/v9.6.0-release-notes.md`, `.aof/artifacts/provider-cost-quotas/provider-cost-quota-boundary-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v9.7` Archmap v0.4.0 Lifecycle Traceability Baseline

## Required Outcomes

Required:

- adopt Archmap v0.4.0 as the current external provider baseline
- record the provider reference in `.aof/external-refs/Archmap-v0.4.0.json`
- document the AOF-to-Archmap lifecycle mapping for Requirement, Acceptance, Decision, Risk, Test, and Evidence
- update the current Archmap source with lifecycle projection nodes and mapping
- add a user-facing product capability and capability matrix delta
- keep AOF artifacts as the source of truth and Archmap as an optional projection provider

Deferred:

- full Mission Control Archmap renderer integration
- rendered UX quality proof
- third-party operator comprehension proof
- package availability proof in every environment
- semantic correctness of all lifecycle relationships
- production provider execution

## Release Gates

- Archmap v0.4.0 external reference exists
- Archmap adoption and integration docs name v0.4.0 as current baseline
- current Archmap source includes lifecycle projection mapping
- capability register and matrix include Archmap lifecycle traceability
- archmap-impact-audit passes
- release-state audit passes
- README and Quickstart point at the current release
- full runtime tests and smoke validation pass

## Release Decision

Release only if AOF makes it harder to confuse:

- Archmap projection with AOF source of truth
- lifecycle traceability with lifecycle correctness
- provider baseline adoption with rendered UX quality
- release mechanism with user-visible capability

## Forward Path

1. `v9.7`: Archmap v0.4.0 Lifecycle Traceability Baseline
2. `v9.8`: Production Execution Go/No-Go Evidence Candidate
3. `v9.9`: External Runtime Production Readiness Review
4. `v10.0`: External Runtime Productization Decision
5. `v10.1`: Third-party Operator Validation for External Runtime Claims
