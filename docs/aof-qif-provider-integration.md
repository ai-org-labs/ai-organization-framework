# AOF QIF Provider Integration

## Purpose

AOF uses QIF as an external, versioned quality framework. AOF must not vendor QIF as an internal copy of truth.

The active provider profile is:

- `.aof/quality/qif-provider-profile.json`

The current pinned source is:

- repository: `ai-org-labs/quality-intent-framework`
- tag: `v0.3.0`
- release: `https://github.com/ai-org-labs/quality-intent-framework/releases/tag/v0.3.0`
- tree: `https://github.com/ai-org-labs/quality-intent-framework/tree/v0.3.0`
- tag SHA: `b581c8c1fd5988757415b6b5ba273933c94c1783`

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

QIF v0.3.0 introduces a Discovery Layer design boundary. AOF treats the selected provider as three connected layers:

- QIF Core: Quality Intent, risk, loss boundary, evidence, verdict, confidence, uncertainty, acceptance gate, and governance trigger.
- QIF Discovery Layer: discovery of candidate Quality Intents before a formal QIF package is authored.
- AOF Integration: mapping AOF runtime commands, benchmark results, release gates, work artifacts, and council evidence into QIF-governed quality claims.

Important boundary:

QIF v0.3.0 does not yet replace the executable v0.2.1 package baseline. Until QIF publishes v0.3 schemas, example packages, and verifier rules, AOF keeps `.aof/quality/QIFPKG-AOF-V5-001.json` as the active machine-readable package and uses v0.3.0 for provider-level Discovery Layer alignment.

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
