# Next Release Plan

## Version

Candidate: `v8.9.0`

## Release Theme

External Runtime Outcome Evidence and Learning Loop.

`v8.8.0` proved that an approved external runtime action can be locally reconstructed and rollback-checked from canonical evidence before production execution claims are trusted. The next bottleneck is outcome truth after a bounded external runtime action: AOF must distinguish planned execution, reproduced execution, rollback readiness, observed outcome, and learning-loop update.

Human-facing wording:

> v8.9 should prove what actually changed after a bounded external runtime action, what was learned, and whether the result should be accepted, corrected, rolled back, or escalated.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v8.8.0`
- v8.8 evidence: `docs/v8.8-release-definition.md`, `docs/v8.8.0-release-notes.md`, `.aof/artifacts/provider-execution-reproductions/provider-execution-reproduction-audit.json`, `.aof/artifacts/provider-rollback-proofs/provider-rollback-proof-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v8.9` External Runtime Outcome Evidence and Learning Loop

## Required Outcomes

Required:

- define outcome evidence records for bounded external runtime actions
- bind outcome evidence to approval, reproduction, rollback proof, target operation, actor/session, expected outcome, observed result, and verification refs
- define learning-loop update evidence that records accepted outcome, correction, rollback recommendation, or escalation
- make Mission Control show planned, approved, reproduced, rollback-ready, outcome-observed, and learning-updated states without implying semantic or market truth
- keep v8.8 reproduction and rollback boundaries compatible

Deferred:

- autonomous production provider execution
- hosted provider orchestration
- credential or billing management
- semantic correctness of provider output
- market truth beyond bounded outcome and operator feedback evidence

## Release Gates

- external runtime outcome evidence audit passes
- learning-loop update audit passes or is explicitly represented as blocking
- release-state audit includes the new v8.9 gates
- Mission Control shows approval, reproduction, rollback, outcome, learning, blocker, and not-proven boundaries
- existing v8.8 reproduction and rollback audits remain green

## Release Decision

Release only if AOF makes it harder to confuse:

- reproduction with outcome
- rollback readiness with rollback execution
- observed outcome with semantic truth
- learning-loop update with market validation
- green audit with production safety

## Forward Path

1. `v8.9`: External Runtime Outcome Evidence and Learning Loop
2. `v9.0`: External Runtime Operator Acceptance and Safety Drill
3. `v9.1`: External Runtime Production Boundary Candidate
4. `v9.2`: Provider-backed Controlled Execution Candidate
