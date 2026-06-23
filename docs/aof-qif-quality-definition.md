# AOF Quality Definition Using QIF v0.3.0 Provider Profile

Date: `2026-06-22`

This document defines the AOF quality baseline using the active Quality Intent Framework (QIF) provider profile.

Source framework:

- `https://github.com/ai-org-labs/quality-intent-framework/tree/v0.3.0`

Active provider profile:

- `.aof/quality/qif-provider-profile.json`
- `docs/aof-qif-provider-integration.md`

Machine-readable package:

- `.aof/quality/QIFPKG-AOF-V5-001.json`

Compatibility note:

QIF v0.3.0 adds the Discovery Layer design boundary for discovering candidate Quality Intents before package authoring. It does not yet publish replacement v0.3 schemas, example packages, or verifier rules. AOF therefore uses the v0.3.0 provider profile for layer alignment while keeping the active machine-readable package v0.2.1-compatible until QIF publishes executable v0.3 artifacts.

## Purpose

The purpose is not to declare that AOF quality is fully proven.

The purpose is to establish a QIF-governed quality baseline where AOF quality claims are tied to:

- Quality Intent
- Risk
- Loss Boundary
- Evidence
- Verdict
- Acceptance Gate
- Governance escalation

QIF v0.3.0 strengthens the baseline by adding an upstream question:

> Did AOF discover the right Quality Intent before judging evidence?

AOF must therefore treat Quality Intent discovery as part of the quality workflow. It should not rush from work output to verdict if the intended harm, stakeholder concern, loss boundary, or acceptance gate is still unclear.

QIF is intentionally external to AOF. AOF must not vendor QIF as a fixed internal copy. AOF quality claims must instead reference the active QIF provider profile so QIF can evolve independently and AOF can upgrade through explicit compatibility review.

## QIF Position

QIF does not define quality as output volume.

For AOF, the following are not quality by themselves:

- number of agents
- number of roles
- number of artifacts
- number of tests
- number of releases
- documentation volume
- dashboard existence
- viewer visual appeal

These signals may be used only as evidence when they are explicitly linked to a Quality Intent, a risk, a loss boundary, and a verdict.

## AOF Quality Mission

AOF quality means the organization can repeatedly choose the right problem, assign the right actors, make runtime-backed decisions, expose state to humans, govern release truth, and learn from outcomes while keeping uncertainty visible.

## Stakeholders

| Stakeholder | Need | Harm To Avoid |
| --- | --- | --- |
| Operator / project owner | Understand what AOF is doing and why | AI appears busy but works on the wrong problem |
| Managed-project user | Bring AOF into a project safely | AOF writes unsafe automation into product main or skips validation |
| AI actor / Codex | Receive scoped, evidence-backed work | Generic roleplay without skill, resource, or policy context |
| Governance owner | Review and release with traceability | Release claims drift from runtime artifacts |

## Quality Intents

### QIN-AOF-NEED

| Field | Definition |
| --- | --- |
| intent | AOF must validate or reframe an incoming need before creating a project. |
| risk | AOF may execute well on a need that should have been reframed, rejected, deferred, or tested first. |
| loss boundary | No project should be created from a raw need without Need Validation or an explicit experiment requirement. |
| acceptance gates | Raw need is not directly converted into project work; Need Validation can reject, defer, request evidence, or require an experiment; Project Charter is based on a Validated Need. |
| evidence refs | `EVD-AOF-NEED`; `docs/aof-core-model.md`; `README.md`; `.aof/quality/QIFPKG-AOF-V5-001.json` |
| verdict | `partially-achieved`: structurally present as a gate; semantic need correctness still requires human/user evidence. |
| confidence / uncertainty | confidence `0.80`; uncertainty remains around real user evidence and market truth. |
| governance trigger | Trigger Product Council review when Need Validation is missing, weak, contradicted by evidence, or converted into a project without validation. |

### QIN-AOF-RUNTIME

| Field | Definition |
| --- | --- |
| intent | AOF direction, review, self-review, and retrospective answers must be runtime-backed. |
| risk | The orchestrator may answer, review, or self-review without actually using the AOF runtime. |
| loss boundary | Direction, review, self-review, and retrospective answers must include runtime command or artifact references; runtime loops must include goal, execution, verification, and stop condition. |
| acceptance gates | At least one runtime command is executed; answer includes command or artifact reference; stale or missing runtime state weakens the answer instead of being hidden; loop evidence includes verification and stop/budget gate. |
| evidence refs | `EVD-AOF-RUNTIME`; `node ./src/cli.js situation-assess --project .`; `.aof/context/active/active-release-manifest.json`; `.aof/goals/next-value-slice.json` |
| verdict | `partially-achieved`: runtime evidence exists for the baseline; future answers can still bypass runtime unless enforced. |
| confidence / uncertainty | confidence `0.83`; uncertainty remains around human/operator discipline in future sessions. |
| governance trigger | Trigger Operations Council review when an answer claims direction, review, self-review, or retrospective authority without runtime command evidence. |

### QIN-AOF-SKILLFUL

| Field | Definition |
| --- | --- |
| intent | AOF actor assignment must be skillful rather than generic. |
| risk | AOF may assign a generic actor without enough skill, capability, resource, policy, or review evidence. |
| loss boundary | Governed actor execution must be backed by actor skill packet, assignment evaluation, and execution gate evidence. |
| acceptance gates | Actor skill packet exists; capability fit is explicit; Maker and Checker responsibilities are separated; resource and policy gates are evaluated; weak or missing skill evidence can block, degrade, or request evidence. |
| evidence refs | `EVD-AOF-SKILLFUL`; `docs/v5.0-release-definition.md`; `docs/v5-actor-skill-packet-contract.md`; `.aof/artifacts/skillful-actor/hri-projections/SAHRI-TASK-054-PROOF.json` |
| verdict | `partially-achieved`: structural and runtime contract exists; external performance uplift is not yet proven. |
| confidence / uncertainty | confidence `0.85`; uncertainty remains around real-world actor performance and longitudinal outcome feedback. |
| governance trigger | Trigger Architecture Council review when actor execution lacks packet, capability fit, resource claim, policy evaluation, or review evidence. |

### QIN-AOF-RECOGNITION

| Field | Definition |
| --- | --- |
| intent | AOF runtime state must be recognizable to a human operator. |
| risk | AOF runtime state may be technically present but not recognizable to the human operator. |
| loss boundary | The operator must be able to identify current mission, release, frontier, blockers, next action, and runtime-backed status without reconstructing raw JSON. |
| acceptance gates | Current mission, release, frontier, next action, blockers, and runtime-backed status are visible; Human Recognition Interface does not become a second source of truth; visible actor state is derived from canonical runtime artifacts. |
| evidence refs | `EVD-AOF-RECOGNITION`; `.aof/artifacts/visibility/current/operator-brief.json`; `.aof/artifacts/visibility/current/mission-control.json`; `.aof/artifacts/visibility/current/runtime-execution.json` |
| verdict | `partially-achieved`: canonical runtime projection exists; operator UX and visual comprehension are not yet independently validated. |
| confidence / uncertainty | confidence `0.75`; uncertainty remains high enough to keep visual comprehension as a future frontier. |
| governance trigger | Trigger Product Council review when the operator cannot identify the current state, when HRI contradicts runtime artifacts, or when dashboard/viewer appeal is substituted for evidence. |

Future candidate Quality Intents:

- `QIN-AOF-HUMAN-UX`
- `QIN-AOF-VISUAL-COMPREHENSION`

These are not mandatory in the current baseline. They should become independent Quality Intents only after dedicated operator research, reproduction tests, or usability evidence exists.

### QIN-AOF-RELEASE

| Field | Definition |
| --- | --- |
| intent | AOF release state must stay truthful and auditable. |
| risk | AOF release claims may drift from package metadata, active release manifest, docs, tasks, or GitHub tags. |
| loss boundary | Release-state audit must pass before a release is considered closed. |
| acceptance gates | Package metadata, bootstrap version, active release manifest, release definition, checklist, and notes align; shipped-release tasks are not left open; release-state audit passes; GitHub tag and release claims match local release artifacts. |
| evidence refs | `EVD-AOF-RELEASE`; `docs/v5.0-release-definition.md`; `docs/v5.0-release-checklist.md`; `docs/v5.0.0-release-notes.md`; `.aof/context/active/active-release-manifest.json` |
| verdict | `partially-achieved`: release-state integrity is structurally and runtime achieved for v5.0.0; future release drift remains a monitored risk. |
| confidence / uncertainty | confidence `0.86`; uncertainty is low for current artifact alignment, but future drift requires repeated audit. |
| governance trigger | Trigger Operations Council review when release-state-audit fails, a shipped release has open tasks, or GitHub release/tag differs from local release artifacts. |

### QIN-AOF-LEARNING

| Field | Definition |
| --- | --- |
| intent | AOF must preserve learning and governance loops. |
| risk | AOF quality may be confused with counts of tests, artifacts, roles, reviews, releases, or dashboards instead of learning from evidence; loops may continue without stop conditions or accepted-change evidence. |
| loss boundary | Activity-count indicators must be evidence-only and linked to a Quality Intent and risk; unbounded loops are non-compliant. |
| acceptance gates | Outcome, self-audit, alignment pulse, or review evidence can update the next value slice; low-confidence, conflicting, or context-mismatched results trigger governance review; next implementation work is not opened by inertia after release closure; loop has max iterations, cost/token budget, confidence threshold, human review threshold, or stop/defer/reopen rule. |
| evidence refs | `EVD-AOF-LEARNING`; `.aof/context/active/alignment-pulse.json`; `.aof/goals/next-value-slice.json`; `docs/aof-qif-quality-definition.md` |
| verdict | `partially-achieved`: learning governance is structurally represented; longitudinal operational learning is not externally validated. |
| confidence / uncertainty | confidence `0.76`; uncertainty remains around future outcome feedback and reproduction across projects. |
| governance trigger | Trigger Operations Council review when low-confidence, conflicting, or context-mismatched results are accepted without explicit governance. |

## Current QIF Verdict

The current baseline should not be read as "AOF quality is fully achieved."

| Quality Intent | structurally_achieved | runtime_achieved | operator_validated | externally_validated | QIF package verdict |
| --- | --- | --- | --- | --- | --- |
| `QIN-AOF-NEED` | yes | partially | not yet | not yet | `partially-achieved` |
| `QIN-AOF-RUNTIME` | yes | yes | partially | not yet | `partially-achieved` |
| `QIN-AOF-SKILLFUL` | yes | yes | not yet | not yet | `partially-achieved` |
| `QIN-AOF-RECOGNITION` | yes | yes | partially | not yet | `partially-achieved` |
| `QIN-AOF-RELEASE` | yes | yes | partially | not yet | `partially-achieved` |
| `QIN-AOF-LEARNING` | yes | partially | not yet | not yet | `partially-achieved` |

This means AOF has a QIF-governed quality baseline. It does not mean semantic truth, market truth, operator comprehension, or long-term organizational performance have been fully proven.

## Validator Boundary

QIF validator pass means:

- required structures exist
- references resolve
- confidence calculations are reproducible
- activity-count indicators are not treated as quality itself
- acceptance artifact references exist
- rule compliance is structurally checkable

QIF validator pass does not prove:

- semantic truth
- expert correctness
- market value
- operator comprehension
- real-world effectiveness
- long-term learning performance

Semantic validity requires:

- human review
- expert review
- reproduction tests
- operational feedback
- governance decisions

## Indicators

The following metrics are allowed only as evidence:

- agent count
- role count
- artifact count
- test count
- release count
- documentation volume
- dashboard existence
- viewer visual appeal
- smoke result
- organization-verify pass count
- release-state-audit result
- command-routing-audit result
- `cost_per_accepted_change`
- `accepted_change_rate`
- `discarded_output_rate`

No indicator is quality by itself.

## Governance Rule

AOF must not claim quality merely because:

- tests pass
- many artifacts exist
- many agents participated
- a release was tagged
- dashboard exists
- viewer looks good

AOF may claim quality only when the relevant Quality Intent has:

- risk
- loss boundary
- evidence
- confidence
- verdict
- acceptance gate
- governance path for uncertainty

## Conclusion

AOF quality is not proven by activity.

AOF quality is proven only when the right Quality Intent is selected, the relevant harm is bounded, evidence is traceable, verdicts are reproducible, and semantic uncertainty is escalated rather than hidden.
