# Next Release Plan

## Version

`v6.4.0`

## Release Theme

Pre-Implementation Quality Gate and QIF-Governed Explanation.

`v6.3.0` made command discovery cheaper for AI orchestrators. The next bottleneck is earlier and more dangerous: AOF/QIF can pass structural gates after implementation while missing that the product assumption was wrong before implementation began.

Human-facing wording:

> v6.4 should help AOF stop or reframe solution-shaped work before implementation when the user problem, product assumption, data boundary, UI responsibility, or negative acceptance is unclear.

More explicit wording:

> AOF should not merely record that a task was completed and structurally verified. It should force the orchestrator to ask whether the task is solving the right problem, whether a UI solution is masking a data-model issue, what must not happen, and what evidence would prove the change is acceptable.

## Runtime Evidence Basis

- runtime command: `situation-assess --project .`
- feedback intake task: `TASK-067`
- source retrospective: external AOF/QIF retrospective dated `2026-06-25`
- release direction doc: `docs/v6.4-pre-implementation-quality-gate.md`
- QIF provider profile: `.aof/quality/qif-provider-profile.json`
- current baseline release definition: `docs/v6.3-release-definition.md`
- roadmap: `docs/vnext-roadmap.md`

## Required Outcomes

Required:

- define a problem-before-solution gate
- define a product-assumption-review surface
- define negative acceptance as first-class release-quality evidence
- define corrected-assumption recording for later user comments that overturn earlier work
- define first-use scenario review for user-facing UI/product changes
- define evidence independence grading so code reading and symmetry reasoning cannot substitute for user-visible E2E observation
- define done-before Guardian fixed questions for adjacent/downstream/public path risk
- define rubric-based visual/render/comprehension review when UI output is involved
- define QIF as a living ledger updated by bugs, corrections, and contradicted assumptions
- connect benchmark explanation to QIF Quality Intent, risk, loss boundary, evidence refs, acceptance gate, verdict boundary, confidence, uncertainty, and governance trigger
- require pre-implementation QIF review when work touches sample/new/template/seed/project loading/editor/projection/governance surfaces

Deferred:

- full Mission Control UX redesign
- automated semantic UI comprehension scoring
- full QIF v0.3 executable verifier support
- governed multi-actor orchestration

## Release Gates

### Gate 1: Runtime Direction

- `situation-assess` reports post-v6.3 frontier-definition-needed
- `TASK-067` records feedback intake
- release plan explains why v6.4 is broader than benchmark explanation alone

### Gate 2: Pre-Implementation Quality Gate

- user problem is recorded before solution
- product assumption is recorded before implementation
- data model impact is recorded
- UI responsibility is recorded
- sample/new/template/seed/project boundary impact is recorded when relevant
- alternative approaches are recorded
- stop/defer/experiment condition is recorded

### Gate 3: Negative Acceptance

- acceptance includes states that must not happen
- UI/product work cannot pass with only positive DOM existence checks
- missing negative acceptance triggers governance review

### Gate 4: Corrected Assumption Loop

- overturned assumptions can be recorded without erasing history
- corrected assumption links to original assumption, later evidence, affected tasks/releases, and new negative acceptance

### Gate 5: Evidence And Guardian Forcing Functions

- user-visible E2E evidence is required for user-visible claims
- code reading and symmetry reasoning are graded as low-independence evidence for UI/public behavior claims
- Guardian answers the fixed questions: other path, adjacent surface, public/irreversible risk
- visual or browser output is scored against grounding, visibility, size/density, transparency/occlusion, and composition/responsibility
- bug or correction intake updates the QIF ledger or records an explicit no-change rationale

### Gate 6: QIF-Governed Explanation

- benchmark results can explain what was checked
- expected standard is visible
- failure meaning is visible
- residual uncertainty is visible
- governance trigger is visible

### Gate 7: Verification

- command routing audit
- organization verification
- decision verification
- release-state audit
- focused tests
- `npm test`
- `npm run smoke`

## Release Decision

Release `v6.4.0` only if AOF gains pre-implementation stopping power.

Do not release merely because explanation docs exist. The release must make it harder for a solution-shaped task to pass without stating the problem, assumption, data boundary, negative acceptance, and QIF evidence plan.

## Post-v6.4 Direction Candidate

After v6.4, Mission Control / Human Recognition redesign becomes more realistic because the viewer can show not only what happened, but also which assumptions were challenged before implementation and which negative acceptances are guarding the work.
