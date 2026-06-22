# Next Release Plan

## Version

`v6.0.0`

## Release Theme

Public Runtime Readiness.

`v5.0.0` made actor assignment more skillful through skill, capability, resource, policy, and review evidence.

`v6.0.0` does not add another autonomy layer. It makes AOF publishable and adoptable by proving the current runtime surface is discoverable, testable, honestly bounded, and clean of personal-account history.

## Runtime Evidence Basis

- runtime session: `.aof/sessions/SESS-MQPCFZHQ-MV6A1U.json`
- task: `.aof/tasks/open/TASK-056.json`
- problem statement: `.aof/artifacts/need-validation/problem-statements/PST-TASK-056-V60-PUBLIC-READINESS.json`
- value hypothesis: `.aof/artifacts/need-validation/value-hypotheses/VHY-TASK-056-V60-PUBLIC-READINESS.json`
- alternative analysis: `.aof/artifacts/need-validation/alternative-analyses/ALT-TASK-056-V60-PUBLIC-READINESS.json`
- experiment proposal: `.aof/artifacts/need-validation/experiment-proposals/EXP-TASK-056-V60-PUBLIC-READINESS.json`
- project charter: `.aof/artifacts/need-validation/project-charters/PCH-TASK-056-V60-PUBLIC-READINESS.json`
- need validation record: `.aof/artifacts/need-validation/records/NVR-TASK-056-V60-PUBLIC-READINESS.json`

## Required Outcomes

Required:

- README and quickstart point at `v6.0.0`
- v6 release definition, checklist, release notes, and public readiness docs exist
- examples explain starter-template semantics and are not mistaken for empty products
- viewer status is explicitly bounded
- command registry and routing audit are green
- organization, decision, release-state, QIF, test, and smoke validations pass
- package/bootstrap/active release state align with `6.0.0`
- local `v6.0.0` tag is created

Deferred:

- full viewer redesign
- general multi-actor autonomy
- live provider proof for every command
- GitHub release if credentials still lack `ai-org-labs` write access

## Release Gates

### Gate 1: Runtime Direction

- v6.0 session exists
- Need Validation approved the v6 project charter
- TASK-056 is the release task

### Gate 2: Public Baseline Hygiene

- no personal account references
- no copied `.git` history in the public snapshot
- no `.DS_Store`
- sanitized author/tagger identity

### Gate 3: Command Readiness

- `command-register` reports the command surface
- `command-routing-audit` passes
- limitations are documented: registry-routable does not mean every command was manually production-executed

### Gate 4: Runtime Verification

- `organization-verify`
- `decision-verify`
- `release-state-audit`
- QIF validation
- `npm test`
- `npm run smoke`

### Gate 5: Adoption Surface

- examples documented
- quickstart current
- viewer status current
- roadmap current

### Gate 6: Release Closure

- package version `6.0.0`
- active release manifest `6.0.0`
- TASK-056 done
- tag `v6.0.0`
- remote push/release done or blocked by explicit credential evidence

## Release Decision

Release if all local gates pass.

If GitHub still rejects push as a user without `ai-org-labs` write access, treat remote publication as blocked external state, not as a local release failure.

