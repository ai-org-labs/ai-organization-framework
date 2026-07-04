# AOF QIF Provider Integration

## Purpose

AOF uses QIF as an external, versioned quality framework. AOF must not vendor QIF as an internal copy of truth.

The active provider profile is:

- `.aof/quality/qif-provider-profile.json`

The current pinned source is:

- repository: `ai-org-labs/quality-intent-framework`
- tag: `v0.3.1`
- release: `https://github.com/ai-org-labs/quality-intent-framework/releases/tag/v0.3.1`
- tree: `https://github.com/ai-org-labs/quality-intent-framework/tree/v0.3.1`
- tag SHA: `f175e583008c9490eb2fb35ea910854244dd8800`
- commit SHA: `1ba7c9c17216acaa24f20dbbae67172ef3a00dd2`

## Design Decision

QIF evolves independently from AOF.

AOF therefore stores only a provider profile and adapter contract:

- which QIF version is selected
- where the selected source lives
- which AOF surfaces are mapped into QIF
- which quality claims are allowed
- which semantic truth boundaries remain unproven
- when governance review is required

## Layer Model

QIF v0.3.1 keeps the Discovery Layer design boundary and adds pre-implementation review guidance. AOF treats the selected provider as three connected layers:

- QIF Core: Quality Intent, risk, loss boundary, evidence, verdict, confidence, uncertainty, acceptance gate, and governance trigger.
- QIF Discovery Layer: discovery of candidate Quality Intents before a formal QIF package is authored, including solution-bias discovery, boundary-confusion discovery, and concept-comprehension discovery.
- AOF Integration: mapping AOF runtime commands, benchmark results, release gates, work artifacts, and council evidence into QIF-governed quality claims.

Important boundary:

QIF v0.3.1 does not yet replace the executable v0.2.1 package baseline. It adds documentation guidance for pre-implementation review, negative acceptance, evidence independence, done-before Guardian questions, rubric-based visual verification, Living QIF Ledger behavior, and v0.4 quality gate runtime requirements. Until QIF publishes v0.3+ schemas, example packages, and verifier rules, AOF keeps `.aof/quality/QIFPKG-AOF-V5-001.json` as the active machine-readable package and uses v0.3.1 for provider-level guidance alignment.

## Adapter Responsibility

AOF benchmark and release results must be explainable as:

- Quality Intent
- Risk
- Loss Boundary
- Evidence refs
- Acceptance Gate
- Verdict
- Confidence
- Uncertainty
- Governance Trigger

The adapter must not treat `pass` as a universal quality verdict.

For example, `AP-003 pass` means the first governed work chain is structurally coherent under Work Governance rules. It does not prove that the work is valuable, correctly scoped, commercially useful, or semantically true.

## Executable Quality Ledger

`v6.8` introduces an AOF-side Quality Ledger as an executable adapter surface for QIF-relevant evidence changes.

The ledger records events such as:

- evidence added
- claim contradicted
- runtime evidence missing
- assumption corrected
- verdict changed
- governance escalation

The ledger does not compute QIF verdicts and does not prove semantic truth. It makes the evidence history auditable so a future reviewer can see when a claim was missing evidence, contradicted, corrected, or escalated.

Runtime commands:

- `quality-ledger-record`: write one append-only quality evidence event.
- `quality-ledger-audit`: verify event structure, evidence refs, QIF refs, and governance escalation boundaries.

Boundary:

- `semantic_truth_claimed` should remain false unless there is explicit human/expert/reproduction/operational evidence.
- `operator_validated` should remain false unless an operator validation artifact exists.
- `runtime_evidence_missing`, `claim_contradicted`, and `assumption_corrected` events require a non-`none` governance action.

## Upgrade Policy

When QIF releases a new version, AOF should add or update a provider profile rather than edit all quality claims blindly.

Required upgrade steps:

1. Record the new QIF repository, tag, release URL, tree URL, and tag SHA.
2. Compare the new QIF concepts against the active AOF adapter contract.
3. Mark compatibility as active, candidate, or deprecated.
4. Run governance review before using the new QIF version for release-quality claims.
5. Preserve the prior profile as fallback until the new profile is verified.
6. If the new QIF version introduces a Discovery Layer without executable schemas, record that layer as a provider boundary and do not overclaim verifier support.

## Boundary

QIF provider compatibility can confirm:

- selected source version
- required AOF-to-QIF mapping surface
- structural quality explanation readiness
- governance escalation boundary

It cannot confirm:

- semantic truth
- market truth
- expert correctness
- operator comprehension
- real-world effectiveness

Those require human review, expert review, reproduction tests, operational feedback, or governance decisions.
