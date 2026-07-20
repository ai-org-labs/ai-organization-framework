# Next Release Plan

## Version

Candidate: `v8.8.0`

## Release Theme

External Runtime Reproduction and Rollback Proof.

`v8.7.0` corrected the approval bridge by requiring adapter capability alignment, independent human approval, concrete target operation binding, credential scope, budget, rollback, and stop conditions before external write can be authorized. The next bottleneck is proof after approval: AOF must be able to reconstruct what would happen, replay the evidence path, and prove rollback readiness before a later external execution claim is trusted.

Human-facing wording:

> v8.8 should prove that an approved external runtime action can be reproduced and rolled back from evidence, not just approved on paper.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v8.7.0`
- v8.7 evidence: `docs/v8.7-release-definition.md`, `docs/v8.7.0-release-notes.md`, `.aof/artifacts/provider-execution-approvals/provider-execution-approval-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v8.8` External Runtime Reproduction and Rollback Proof

## Required Outcomes

Required:

- define a reproduction proof record for approved provider execution plans
- bind reproduction to provider execution approval, adapter, work item, session, inputs, expected side effect, and verification refs
- define rollback proof evidence before production execution is trusted
- make Mission Control show reproduction and rollback readiness without implying provider correctness
- keep v8.7 approval authenticity and v8.5 pilot boundaries compatible

Deferred:

- autonomous production provider execution
- hosted provider orchestration
- credential or billing management
- semantic correctness of provider output
- market or operator value proof beyond bounded feedback evidence

## Release Gates

- reproduction proof audit passes
- rollback proof audit passes or is explicitly represented as blocking
- release-state audit includes the new v8.8 gates
- Mission Control shows approval, reproduction, rollback, blocker, and not-proven boundaries
- existing v8.7 provider execution approval audit remains green

## Release Decision

Release only if AOF makes it harder to confuse:

- approval with reproducibility
- replay metadata with actual provider truth
- rollback plan text with rollback proof
- execution traceability with semantic correctness
- green audit with production safety

## Forward Path

1. `v8.8`: External Runtime Reproduction and Rollback Proof
2. `v8.9`: External Runtime Outcome Evidence and Learning Loop
3. `v9.0`: External Runtime Operator Acceptance and Safety Drill
4. `v9.1`: External Runtime Production Boundary Candidate
