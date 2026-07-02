# AI Authoring Guide

This is the first document an AI actor should read before authoring AOF artifacts, docs, release notes, benchmark explanations, or quality claims.

Purpose:

- understand how AOF uses QIF
- avoid claiming quality from activity volume
- write artifacts that can survive Guardian / Council review
- know when runtime evidence, human review, or governance escalation is required

## First Rule

Do not treat output as quality.

These are not quality by themselves:

- many agents
- many roles
- many artifacts
- many tests
- many releases
- large documentation
- a passing validator
- a good-looking dashboard

They become evidence only when they support a specific Quality Intent, risk, loss boundary, acceptance gate, and verdict.

## QIF In One Minute

QIF means:

```text
Quality Intent
-> Risk
-> Loss Boundary
-> Evidence
-> Verdict
-> Acceptance Gate
-> Governance Trigger
```

Use this chain before saying a work item is good, done, safe, useful, understandable, or release-ready.

If the Quality Intent is unclear, do not judge evidence yet. First discover the Quality Intent.

## Active QIF Boundary

AOF uses QIF as an external provider, not as vendored internal truth.

Read these refs when deeper context is needed:

- provider profile: `.aof/quality/qif-provider-profile.json`
- provider integration: `docs/aof-qif-provider-integration.md`
- quality definition: `docs/aof-qif-quality-definition.md`
- active machine-readable package: `.aof/quality/QIFPKG-AOF-V5-001.json`

Current boundary:

- QIF provider profile: `v0.3.1`
- active executable package baseline: v0.2.1-compatible
- QIF v0.3.1 guidance is a provider-level authoring and review boundary, not yet a replacement executable verifier inside AOF

## Authoring Checklist

Before writing or changing an AOF artifact, answer:

1. What Quality Intent does this support?
2. What harm or loss does this prevent?
3. What would count as unacceptable failure?
4. What evidence will be produced?
5. Is the evidence structural, runtime-backed, operator-validated, expert-validated, or externally validated?
6. What remains uncertain?
7. Who must review or approve if confidence is low, evidence conflicts, or the claim affects users, releases, public paths, architecture, safety, cost, or external systems?

If you cannot answer these, write a discovery / validation artifact instead of a done claim.

## Verdict Language

Use careful verdicts.

Preferred:

- `structurally_achieved`
- `runtime_achieved`
- `operator_validated`
- `externally_validated`
- `partially_achieved`
- `blocked`
- `governance_review_required`
- `not_proven`

Avoid:

- `achieved`
- `done`
- `quality proven`
- `validated`
- `safe`
- `correct`

unless the evidence and acceptance gate prove that exact claim.

## Evidence Grades

Treat evidence by independence and claim scope.

Low independence:

- code reading only
- symmetry reasoning
- generated text explaining itself
- schema pass without semantic review
- screenshot without rubric

Medium independence:

- runtime command output
- benchmark result with explicit expected/fail meaning
- artifact cross-reference verification
- unit test tied to a loss boundary

Higher independence:

- user-visible E2E observation
- reproduction test
- human/operator review
- expert review
- production or real operational feedback

For user-visible, public-path, release, external-write, architecture, billing, secret, destructive, or irreversible claims, prefer higher-independence evidence.

## Runtime Rule

Direction, review, self-review, retrospective, and release sign-off must be runtime-backed.

Minimum:

- run at least one relevant AOF runtime command
- record or cite the command
- cite the artifact ref or output ref
- state what the runtime did and did not prove

Useful commands:

```bash
node ./src/cli.js situation-assess --project .
node ./src/cli.js organization-status --project .
node ./src/cli.js organization-verify --project .
node ./src/cli.js command-routing-audit --project .
node ./src/cli.js release-state-audit --project .
node ./src/cli.js visibility-export --project .
```

Use `node ./src/cli.js --help --json` and `node ./src/cli.js <command> --help --json` for command routing. Help is routing evidence, not runtime proof.

## Pre-Implementation Gate

Before building, ask:

- Is this solving the right problem?
- Is the need validated or should it be reframed?
- What negative acceptance must fail if we are wrong?
- What adjacent path, downstream surface, or public/irreversible impact can break?
- What QIF intent or evidence ledger needs to change?

For solution-shaped requests, do not jump directly to implementation. Run Need Validation, Discovery, or a work-governance handoff as appropriate.

## Maker / Checker / Council

Keep roles separated.

- Builder makes or proposes the artifact.
- Guardian checks evidence, risk, loss boundary, and failure modes.
- Council decides approval, rejection, defer, or request-more-evidence.

Do not let the maker be the only judge of quality.

## Loop Rule

A loop is only a loop if it has:

```text
goal + execution + verification + stop condition
```

Without verification, it is repetition.

Without a stop condition, it is unbounded churn.

Use stop conditions such as:

- max iterations
- token / time / cost budget
- confidence threshold
- human review threshold
- stop / defer / reopen decision

## Architecture / Archmap Rule

If the work changes architecture, runtime structure, artifact contracts, command surfaces, external references, data flow, boundaries, or Mission Control projection, record Archmap impact.

Required outcome for implementation-grade work:

- `archmap_update_required`
- `archmap_unaffected`
- `archmap_deferred_with_reason`

Canonical refs:

- integration rule: `docs/v6.6-archmap-integration.md`
- current map source: `docs/archmaps/aof-runtime-current.archmap`

Mission Control may project map state, but Archmap source and AOF artifacts remain the source of truth.

## Writing Style For AOF Artifacts

Write for audit, not persuasion.

Use:

- concrete artifact refs
- explicit boundaries
- falsifiable acceptance criteria
- uncertainty
- governance triggers
- short rationale

Avoid:

- vague success language
- generic AI roleplay
- activity-count claims
- broad "validated" claims
- uncited quality assertions

## Minimal Template

Use this shape when authoring a QIF-governed explanation:

```markdown
## Quality Intent

What quality is intended, for whom, and why.

## Risk

What harm happens if this is wrong.

## Loss Boundary

What must not happen.

## Evidence

- artifact or command ref
- what it proves
- what it does not prove

## Verdict

Use structural / runtime / operator / external validation wording.

## Uncertainty

What remains unknown or weak.

## Governance Trigger

When to escalate to Guardian / Council / human review.
```

## Common Failure Modes

Stop and correct if you see:

- "tests pass" used as a full quality claim
- "dashboard exists" used as recognition proof
- "many artifacts exist" used as progress proof
- "AI reviewed it" without independent criteria
- "runtime-backed" without a command or artifact ref
- QIF validator pass treated as semantic truth
- implementation before Need Validation when the need is uncertain
- Archmap or Mission Control becoming a second source of truth

## Final Rule

AOF quality is not proven by activity.

AOF quality is proven only when the right Quality Intent is selected, the relevant harm is bounded, evidence is traceable, verdicts are reproducible, and semantic uncertainty is escalated rather than hidden.
