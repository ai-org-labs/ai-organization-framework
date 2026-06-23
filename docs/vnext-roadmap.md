# AOF Post-v6.2 Roadmap

## North Star

AOF should become an AI Organization Operating System that can:

- discover what is worth investigating
- validate what is worth turning into a project
- govern how work is executed
- keep the whole chain auditable across human, AI, and tool work
- make the current organizational mission recognizable to a human at a glance
- assign the right actor to the right work with the right skill, resource, policy, and review contract
- let new public adopters verify the runtime before trusting it

## Current Baseline

`v5.0.0` established the Skillful Actor Runtime:

- actor skill packets
- capability-fit assignment evaluation
- resource and policy execution gates
- negative Skillful Actor benchmarks
- Skillful Actor projection into the Human Recognition Interface

`v6.0.0` establishes Public Runtime Readiness:

- historyless public baseline for `ai-org-labs/ai-organization-framework`
- public identity and `.DS_Store` hygiene
- command readiness evidence
- documented example starter-template semantics
- explicit viewer limitation statement
- v6 release definition, checklist, notes, and roadmap alignment
- runtime-backed Need Validation before release execution

`v6.1.0` establishes Work Governance Integration:

- Work Governance as the core cross-domain concept
- work item as the broader concept above task
- work item goal, actor composition, Go / No-Go, Council-ready output, Operational Map, Context Pack, and External Reference contracts
- Mission Control as a business dashboard projection, not a source of truth
- software and non-software applicability through committed examples
- narrow CLI writers and `work-governance-benchmark`

`v6.2.0` establishes Worked Adoption Proof:

- fresh managed-project proof through `adoption-proof-benchmark`
- first governed work item chain in a clean project
- human-readable first-work recognition summary
- explicit rule that correct JSON without human recognition is incomplete
- release proof that adoption quality is bounded to one reproducible first governed work loop

## Completed Track

### `v5.0.0`: Skillful Actor Runtime

Completed:

1. `TASK-049`: actor skill packet contract
2. `TASK-050`: actor skill packet writer and fixtures
3. `TASK-051`: capability-fit and assignment evaluation
4. `TASK-052`: resource claim and policy gate integration
5. `TASK-053`: Skillful Actor negative benchmarks
6. `TASK-054`: Skillful Actor HRI projection and proof
7. `TASK-055`: release closure

### `v6.0.0`: Public Runtime Readiness

Completed:

- `TASK-056`: Ship v6.0 Public Runtime Readiness

Runtime basis:

- `.aof/sessions/SESS-MQPCFZHQ-MV6A1U.json`
- `.aof/artifacts/need-validation/records/NVR-TASK-056-V60-PUBLIC-READINESS.json`
- `.aof/artifacts/need-validation/project-charters/PCH-TASK-056-V60-PUBLIC-READINESS.json`

Required outcomes:

- public repo baseline is clean of personal account references
- command registry and routing are auditably aligned
- examples are understandable starter templates rather than empty-looking folders
- viewer is described honestly as runtime-backed visibility, not a finished UX
- quickstart, README, release definition, release checklist, and notes point at v6.0
- release can be prepared locally even if GitHub push remains credential-blocked

### `v6.1.0`: Work Governance Integration

Completed release task:

- `TASK-063`: Close v6.1.0 Work Governance release

Completed release slices:

1. `TASK-057`: Work Governance integration plan
2. `TASK-058`: schemas and fixtures
3. `TASK-059`: CLI writers
4. `TASK-060`: Work Governance benchmark
5. `TASK-061`: Mission Control projection
6. `TASK-062`: cross-domain examples
7. `TASK-063`: release closure

Required outcomes:

- Work Governance is the core operating concept, with PMO as a view or alias
- work items can carry goal, actor composition, Council-ready output, Go / No-Go, Operational Map impact, Context Pack, and External Reference refs
- software and manufacturing examples are adoption-facing
- Mission Control projects Work Governance without owning truth
- verification is reproducible through `work-governance-benchmark` and the normal runtime/test suite

### `v6.2.0`: Worked Adoption Proof

Completed release task:

- `TASK-064`: Ship v6.2 Worked Adoption Proof

Required outcomes:

- a fresh managed project can initialize AOF
- the first governed work item can be reproduced in a clean project
- machine checks confirm the required Work Governance artifact chain
- human-readable recognition explains what the work is, why it matters, who judges it, what evidence exists, what is blocked, and what should happen next
- the release claim remains bounded to one first governed work loop

## Next Frontier Candidates

### Candidate: Human Recognition Interface Redesign

Theme:

- rebuild viewer into a true one-screen organization recognition interface

Why it matters:

- current viewer is truthful but not good enough as a product surface
- the operator should see council, actors, active work, blockers, timeline, and next action without reading raw JSON

Boundary:

- all displayed state must derive from canonical runtime artifacts
- decorative UI does not count as recognition quality

### Later Candidate: `v7.0` Governed Multi-Actor Orchestration

Theme:

- move beyond single parent runtime acting sequentially into governed parent/child actor execution where maker/checker/council separation is first-class

Why it matters:

- this is closer to the full AI Organization OS promise

Boundary:

- do not claim autonomous workforce execution before artifact contracts, budgets, stop conditions, and verification gates exist

## Roadmap Rules

- Discovery does not directly authorize project creation.
- Need Validation remains the mandatory pre-project gate.
- Work Governance is the core operating layer for work intake, triage, priority, interrupt handling, approval, actor assignment, evidence, external references, Operational Maps, and Council-ready outputs.
- PMO is a view or alias for project-oriented teams, not the core AOF concept.
- Work item is broader than task; task remains the current runtime storage object.
- Mission Control must not become a second source of truth.
- Visibility derives from canonical artifacts and is not a source of authority.
- Human-readable recognition output is part of the runtime contract, not after-the-fact documentation. AOF must translate canonical artifacts into plain language that explains what is happening, why it matters, what is blocked, and what should happen next.
- Actor skillfulness must be falsifiable through artifacts and benchmarks.
- Loop means `goal + execution + verification + stop condition`.
- Maker and Checker roles must remain separated.
- Manual proof comes before automation.
- Cost should be evaluated per accepted change, not only by token volume or artifact count.
- Quality cannot be claimed from activity volume; it requires Quality Intent, risk, loss boundary, evidence, verdict, and acceptance gate.

## Current Recommendation

Close `v6.1.0` through `TASK-063`, then run a runtime-backed frontier review before opening v6.2 work.

The strongest next candidates are:

- worked adoption proof
- Mission Control / Human Recognition redesign grounded in Work Governance artifacts
- standalone context/external-ref/operational-map audits
- governed multi-actor orchestration

The preferred `v6.2` wording for humans is:

> v6.2 proves that AOF can be introduced into a new project and guide a first-time operator from setup to the first governed work item: what the work is, why it matters, who judges it, what evidence exists, and what should happen next.
