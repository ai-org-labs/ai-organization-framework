# AOF Post-v6.0 Roadmap

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

Current release task:

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

## Next Frontier Candidates

### Candidate A: `v6.1` Worked Adoption Proof

Theme:

- prove that a fresh external project can install AOF, initialize `.aof/`, run the quickstart path, and produce the expected first artifacts

Why it matters:

- `v6.0` makes public readiness explicit
- `v6.1` should prove adoption from outside the self-hosting repo

Likely gates:

- clean temp repo install
- `aof init --topology managed-project`
- first `run -> answer -> council-exec`
- command readiness matrix for top commands
- generated artifacts are human-readable

### Candidate B: `v6.2` Human Recognition Interface Redesign

Theme:

- rebuild viewer into a true one-screen organization recognition interface

Why it matters:

- current viewer is truthful but not good enough as a product surface
- the operator should see council, actors, active work, blockers, timeline, and next action without reading raw JSON

Boundary:

- all displayed state must derive from canonical runtime artifacts
- decorative UI does not count as recognition quality

### Candidate C: `v7.0` Governed Multi-Actor Orchestration

Theme:

- move beyond single parent runtime acting sequentially into governed parent/child actor execution where maker/checker/council separation is first-class

Why it matters:

- this is closer to the full AI Organization OS promise

Boundary:

- do not claim autonomous workforce execution before artifact contracts, budgets, stop conditions, and verification gates exist

## Roadmap Rules

- Discovery does not directly authorize project creation.
- Need Validation remains the mandatory pre-project gate.
- Visibility derives from canonical artifacts and is not a source of authority.
- Actor skillfulness must be falsifiable through artifacts and benchmarks.
- Loop means `goal + execution + verification + stop condition`.
- Maker and Checker roles must remain separated.
- Manual proof comes before automation.
- Cost should be evaluated per accepted change, not only by token volume or artifact count.
- Quality cannot be claimed from activity volume; it requires Quality Intent, risk, loss boundary, evidence, verdict, and acceptance gate.

## Current Recommendation

Finish `v6.0.0` as Public Runtime Readiness.

After that, choose between:

- `v6.1` if the next highest risk is public adoption from a clean external project
- `v6.2` if the next highest risk is that humans still cannot visually understand the organization
- `v7.0` only after v6 adoption and recognition surfaces are credible enough to support governed multi-actor orchestration

