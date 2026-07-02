# AOF Post-v6.5 Roadmap

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

`v6.3.0` establishes AI Command Help Surface:

- compact `aof --help` command index for AI command discovery
- structured `aof --help --json` and `aof <command> --help --json`
- command help with purpose, category, inputs, outputs, failure meaning, and QIF boundary
- `cli-help-benchmark` coverage for supported commands
- active QIF provider profile upgraded to QIF `v0.3.0`
- QIF Core / Discovery Layer / AOF Integration boundaries recorded without overclaiming executable v0.3 verifier support

`v6.4.0` establishes Pre-Implementation Quality Gate and QIF-Governed Explanation direction:

- problem-before-solution and product assumption review become release-quality requirements
- negative acceptance becomes first-class evidence
- corrected assumptions become part of the learning loop instead of silent churn
- evidence independence is explicit; code reading and symmetry reasoning are low-independence evidence for user-visible/public-path claims
- Guardian done-before questions cover adjacent paths, shared assumptions, and public/irreversible risk
- visual/browser work requires rubric-based observation
- QIF is treated as a living ledger updated by bugs, corrections, contradicted assumptions, confidence changes, and residual risk

`v6.5.0` establishes Execution Hygiene and Command Safety:

- minimal persistent context and on-demand skill/artifact loading are defined as operating principles
- work item session boundaries, small diffs, specialist actor composition, Council-ready handoff, approved run contracts, safe local command batching, and permission fatigue avoidance are documented
- command registry and AI help expose `safety_level` and `approval_policy`
- `safe_read`, `safe_local_write`, `project_write`, `external_write`, and `dangerous` are defined
- `cli-help-benchmark` verifies safety metadata
- `situation-assess` correctly targets the future track when a slice mentions the shipped release first

Post-v6.5 QIF provider alignment:

- active QIF provider profile is updated to QIF `v0.3.1`
- QIF v0.3.1 is treated as guidance alignment for pre-implementation review, negative acceptance, evidence independence, visual verification, Living QIF Ledger, and extended Discovery Layer taxonomy
- active machine-readable QIF package remains v0.2.1-compatible until QIF publishes executable v0.3+ schemas, examples, and verifier rules

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

### `v6.3.0`: AI Command Help Surface

Completed release task:

- `TASK-066`: Ship v6.3 AI Command Help Surface with QIF v0.3 provider alignment

Required outcomes:

- AI can get compact command routing help without reading the full CLI reference
- command-level help exposes purpose, inputs, outputs, failure meaning, and QIF boundary
- `cli-help-benchmark` verifies help coverage for supported commands
- QIF v0.3.0 is recorded as the active external provider profile
- QIF v0.3 Discovery Layer is treated as provider alignment, not as executable verifier replacement

### `v6.4.0`: Pre-Implementation Quality Gate and QIF-Governed Explanation

Completed release tasks:

- `TASK-067`: Refine v6.4 direction from external AOF/QIF retrospective
- `TASK-068`: Add evidence grading and done-before-forcing functions to v6.4 direction
- `TASK-069`: Release v6.4 Pre-Implementation Quality Gate

Required outcomes:

- AOF/QIF is framed as a done-before forcing function, not only a post-implementation archive
- solution-shaped tasks must be challenged through problem-before-solution and product assumption review
- negative acceptance and corrected assumption loops are explicitly required
- user-visible claims require appropriately independent evidence
- Guardian review includes adjacent/downstream/public-path risk questions
- QIF living-ledger behavior is required when bugs or corrected assumptions appear

### Post-v6.4 Operating Clarification

Completed runtime task:

- `TASK-070`: Codify CLI help boundary and runtime-backed evidence rule

Clarification:

- CLI help is an AI-oriented command routing surface, not a complete human manual.
- `command-registry.json` is routing evidence, not proof that runtime work happened.
- If command help lacks option-level detail, use the existing artifact format and full CLI reference rather than blocking runtime usage.
- Direction, review, self-review, retrospective, and release sign-off claims require at least one executed runtime command with an execution log or artifact ref.
- Verification, audit, self-audit, and retrospective evidence should be produced by runtime commands whenever the claim depends on AOF having actually operated.

Runtime hygiene extension:

- canonical doc: `docs/v6.5-execution-hygiene.md`
- command registry entries now expose `safety_level` and `approval_policy`
- command help exposes safety metadata so an AI can distinguish routing from permission boundary
- v6.5 should preserve minimal persistent context, on-demand skills/artifacts, work item session boundaries, small diffs, specialist actor composition, Council-ready handoff, approved run contracts, safe local command batching, and permission fatigue avoidance

### `v6.5.0`: Execution Hygiene and Command Safety

Completed release task:

- `TASK-070`: v6.5 bridge: Codify CLI help boundary and runtime-backed evidence rule

Required outcomes:

- AOF has a documented Execution Hygiene contract
- command category and command safety are separate axes
- command registry and help expose safety metadata
- safe local reads/writes are distinguished from project, external, and dangerous operations
- release docs preserve the boundary that AOF does not bypass platform or human permissions

## Next Frontier Candidates

### Completed: `v6.5` Execution Hygiene And Human Recognition

Theme:

- make AOF safer and lighter to operate by bounding context, sessions, command safety, approval boundaries, and handoff artifacts

Why it matters:

- this directly addresses giant `CLAUDE.md`, one-shot prompt overload, mid-run compaction loss, external tool sprawl, design dumping, review weakness, and conversation drag
- Mission Control / Human Recognition should show not only what is happening, but whether the current run is hygienic: bounded work item, approved command scope, actor handoff, council-ready output, blockers, and runtime proof

Boundary:

- do not treat command help as proof of runtime execution
- do not bypass tool or platform permissions
- do not approve external writes, deploys, secrets, billing, destructive, production, or irreversible operations through generic local-run consent

### Candidate: `v6.6` Archmap-Aware Mission Control

Theme:

- make AOF construct and maintain an Archmap architecture map as governed work progresses
- connect Mission Control / Human Recognition to architecture impact without making the viewer a source of truth

Why it matters:

- AOF should not only say what work is active; it should show how the work changes the organization/runtime architecture
- Archmap can make components, dependencies, zones, boundaries, data flows, and external references recognizable at a glance
- architecture impact should become part of Council-ready handoff instead of after-the-fact documentation

Boundary:

- Archmap source and AOF artifacts are source of truth; Mission Control only projects them
- icons improve recognition but do not prove architecture quality
- every implementation-grade work item should declare `archmap_update_required`, `archmap_unaffected`, or `archmap_deferred_with_reason`
- do not require full Archmap rendering integration before the map-impact contract is proven

Initial task:

- `TASK-071`: v6.6 frontier: Integrate Archmap into AOF governed development flow

Canonical references:

- `docs/v6.6-archmap-integration.md`
- `docs/archmaps/aof-runtime-current.archmap`
- Archmap `v0.1.0`: `https://github.com/ai-org-labs/archmap/tree/v0.1.0`
- archmap-icons `v0.1.1`: `https://github.com/ai-org-labs/archmap-icons/tree/v0.1.1`

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
- Done claims require evidence appropriate to the claim; code reading and symmetry reasoning are low-independence evidence for user-visible or public-path behavior.
- Guardian review must ask what adjacent path, downstream surface, or public/irreversible impact could break before done is declared.
- Visual or browser-facing work requires rubric-based observation, not merely a screenshot or DOM presence check.
- QIF must operate as a living ledger: bugs, corrected assumptions, and user corrections should update Quality Intent evidence, confidence, uncertainty, negative acceptance, or follow-up tasks.
- CLI help and command registry are command-discovery aids. They do not prove runtime execution, semantic quality, or release readiness without corresponding verification, audit, self-audit, or retrospective command evidence.
- AOF run contracts should preapprove safe local reads/writes only; project writes, external writes, and dangerous operations require explicit per-run approval.
- Work item boundaries and handoff artifacts should prevent long conversation context from becoming the hidden source of truth.

## Current Recommendation

After `v6.5.0`, choose the next frontier through runtime-backed review before opening implementation work.

Priority order:

1. `v6.6`: Archmap-aware Mission Control that makes architecture impact visible as governed work progresses
2. `v6.x`: first-class runtime commands/schemas for the v6.4 pre-implementation gates
3. `v6.x`: standalone context / external-ref / operational-map audits
4. `v7.0`: governed multi-actor orchestration

Reasoning:

- AI Command Help Surface is now complete enough to support command discovery, but it must not be confused with runtime proof.
- Execution Hygiene is now the v6.5 baseline; the next product gap is making the run contract, permission boundary, and architecture impact visible in Mission Control.
- Pre-Implementation Quality Gate is now the v6.4 baseline; the next product gap is making those gates visible and actionable to a human operator.
- Mission Control redesign should show assumptions, negative acceptance, evidence independence, Guardian questions, QIF ledger state, and Archmap impact without inventing its own truth.
- Multi-actor orchestration should wait until command discovery, quality explanation, and visibility surfaces are stable enough to govern parallel actor work.
