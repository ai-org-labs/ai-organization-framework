# Next Release Plan

## Version

Candidate: `v9.0.0`

## Release Theme

External Runtime Operator Acceptance and Safety Drill.

`v8.9.0` proved that an approved, locally reproduced, rollback-ready external runtime path can record bounded outcome evidence and a learning-loop update without claiming semantic or market truth. The next bottleneck is operator judgment: a human operator must be able to inspect that full chain and decide accept, stop, rollback, or escalate before controlled provider execution advances.

Human-facing wording:

> v9.0 should prove that a human operator can review the approved, reproduced, rollback-ready, outcome-recorded, learning-updated chain and make a safe go/no-go decision before controlled provider execution.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v8.9.0`
- v8.9 evidence: `docs/v8.9-release-definition.md`, `docs/v8.9.0-release-notes.md`, `.aof/artifacts/provider-outcome-evidence/provider-outcome-evidence-audit.json`, `.aof/artifacts/provider-learning-loop/provider-learning-loop-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v9.0` External Runtime Operator Acceptance and Safety Drill

## Required Outcomes

Required:

- define operator acceptance drill records for external runtime chains
- bind operator decisions to approval, reproduction, rollback proof, outcome evidence, learning-loop update, Mission Control projection, and not-proven boundaries
- require explicit accept, stop, rollback, escalate, or defer decision states
- make Mission Control show the operator decision path and unresolved blockers without implying production safety
- keep v8.9 outcome and learning-loop boundaries compatible

Deferred:

- autonomous production provider execution
- hosted provider orchestration
- credential or billing management
- semantic correctness of provider output
- market truth beyond bounded operator acceptance evidence

## Release Gates

- operator acceptance drill audit passes
- safety drill records can represent accept, stop, rollback, escalate, and defer decisions
- release-state audit includes the new v9.0 gates
- Mission Control shows approval, reproduction, rollback, outcome, learning, operator decision, blocker, and not-proven boundaries
- existing v8.9 outcome and learning-loop audits remain green

## Release Decision

Release only if AOF makes it harder to confuse:

- operator acceptance with production safety
- operator feedback with market validation
- observed outcome with semantic truth
- rollback readiness with rollback execution
- green audit with external execution authority

## Forward Path

1. `v9.0`: External Runtime Operator Acceptance and Safety Drill
2. `v9.1`: External Runtime Production Boundary Candidate
3. `v9.2`: Provider-backed Controlled Execution Candidate
4. `v9.3`: External Runtime Incident Drill and Recovery Evidence
