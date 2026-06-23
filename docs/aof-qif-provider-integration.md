# AOF QIF Provider Integration

## Purpose

AOF uses QIF as an external, versioned quality framework. AOF must not vendor QIF as an internal copy of truth.

The active provider profile is:

- `.aof/quality/qif-provider-profile.json`

The current pinned source is:

- repository: `ai-org-labs/quality-intent-framework`
- tag: `v0.2.1`
- release: `https://github.com/ai-org-labs/quality-intent-framework/releases/tag/v0.2.1`
- tree: `https://github.com/ai-org-labs/quality-intent-framework/tree/v0.2.1`
- tag SHA: `449b80b28750eca4946ef6a1c4a03a41cec93eb6`

## Design Decision

QIF evolves independently from AOF.

AOF therefore stores only a provider profile and adapter contract:

- which QIF version is selected
- where the selected source lives
- which AOF surfaces are mapped into QIF
- which quality claims are allowed
- which semantic truth boundaries remain unproven
- when governance review is required

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

## Upgrade Policy

When QIF releases a new version, AOF should add or update a provider profile rather than edit all quality claims blindly.

Required upgrade steps:

1. Record the new QIF repository, tag, release URL, tree URL, and tag SHA.
2. Compare the new QIF concepts against the active AOF adapter contract.
3. Mark compatibility as active, candidate, or deprecated.
4. Run governance review before using the new QIF version for release-quality claims.
5. Preserve the prior profile as fallback until the new profile is verified.

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
