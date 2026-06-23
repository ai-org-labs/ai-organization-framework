# Next Release Plan

## Version

`v6.2.0`

## Release Theme

Worked Adoption Proof.

`v6.1.0` made Work Governance concrete: AOF can represent, write, verify, and project governed cross-domain work items rather than only software tasks.

`v6.2` proves that a new project can adopt AOF from a fresh setup and reach its first useful governed work item. The proof is not only that artifacts exist. A first-time human operator must be able to understand, in plain language, what work is being governed, why it matters, who judges it, what evidence exists, what is blocked, and what should happen next.

Human-facing wording:

> v6.2 proves that AOF can be introduced into a new project and guide a first-time operator from setup to the first governed work item.

More explicit wording:

> AOF should help a new project turn an initial request into a governed first work item: clear goal, actor assignment, evidence, Go / No-Go basis, council judgment, visible current state, and a plain-language explanation of the next action.

## Runtime Evidence Basis

- runtime command: `organization-status --project .`
- roadmap command: `roadmap-status --project .`
- situation assessment command: `situation-assess --project .`
- release audit command: `release-state-audit --project .`
- benchmark command: `work-governance-benchmark --project .`
- direction evidence: post-v6.1 Visionary / Builder / Guardian / Council runtime review
- baseline release definition: `docs/v6.1-release-definition.md`
- core model: `docs/aof-core-model.md`
- roadmap: `docs/vnext-roadmap.md`

## Required Outcomes

Required:

- fresh project setup path is reproducible from public instructions
- `aof init --topology managed-project` creates the expected baseline without hidden self-hosting assumptions
- the first governed work item can be created through documented commands or a guided proof script
- the first work item includes goal, actor composition, council-ready output, Go / No-Go basis, operational map impact, context pack, and external reference handling where applicable
- the runtime emits a human-readable recognition summary for the first governed work item
- the summary explains what is happening, why it matters, who judges it, what evidence exists, what is blocked, and what should happen next
- Mission Control projects the same state without becoming a source of truth
- `work-governance-benchmark` passes against the adoption proof
- the proof runs from a clean checkout without relying on local untracked artifacts

Deferred:

- full Jira bidirectional sync
- full external tool adapters
- autonomous Work Governance
- replacing `.aof/tasks/` with a new work item store
- standalone `context-audit`, `external-ref-audit`, and `operational-map-audit` commands
- full Human Recognition Interface redesign beyond the adoption-proof surface
- governed multi-actor orchestration

## Release Gates

### Gate 1: Runtime Direction

- `situation-assess` reports `frontier-definition-needed` after `v6.1.0`
- runtime-backed Visionary / Builder / Guardian outputs select the next bounded frontier
- Council review approves `v6.2` as Worked Adoption Proof before implementation

### Gate 2: Fresh Adoption Path

- fresh clone or fixture project starts from public install instructions
- managed-project topology is used
- no local-only artifacts are required
- no personal account references or `.DS_Store` files appear in the proof

### Gate 3: First Governed Work Item

- first work item goal exists
- actor composition exists
- council-ready output exists
- Go / No-Go visualization exists
- operational map change log exists
- context pack exists
- external refs are either valid or explicitly marked not applicable

### Gate 4: Human Recognition Output

- AOF generates plain-language wording for the first governed work item
- the wording avoids internal-only terms unless it explains them
- the operator can answer: what is this, why does it matter, who is responsible, what evidence exists, what is blocked, and what happens next

### Gate 5: Verification

- `command-routing-audit`
- `organization-verify`
- `decision-verify`
- `release-state-audit`
- `work-governance-benchmark`
- adoption proof command or script
- `npm test`
- `npm run smoke`

## Release Decision

Release `v6.2.0` only if a first-time adopter path is reproducible and the first governed work item is both machine-verifiable and human-recognizable.

Do not claim that AOF is broadly adoption-proven merely because self-hosting artifacts pass. The claim must be bounded: a clean project can complete one first governed work loop with traceable artifacts, verification, and plain-language recognition output.

## Post-v6.2 Direction Candidate

The strongest immediate follow-up is QIF-governed benchmark explanation.

The v6.2 adoption proof exposed a product gap: AP-001 through AP-006 can pass while a human still cannot immediately tell what was checked, what the expected standard was, what failure would mean, and what remains unproven.

AOF should therefore use the active external QIF provider profile (`.aof/quality/qif-provider-profile.json`) to translate benchmark results into Quality Intent, risk, loss boundary, evidence refs, acceptance gate, verdict, confidence, uncertainty, and governance trigger.
