# Next Release Plan

## Version

Candidate: `v8.0.0`

## Release Theme

Externalized Organization Runtime.

`v7.8.0` made Mission Control project requirement coverage, forecast, adoption proof, session, context, release, and Archmap evidence from canonical runtime artifacts. The next bottleneck is externalization: AOF should be able to describe and govern organization runtime boundaries when some actors, tools, providers, or references live outside the local repo.

Human-facing wording:

> v8.0 should let AOF govern externalized organization work without losing source-of-truth boundaries, approval gates, or reconstructable runtime evidence.

More explicit wording:

> External actors, tools, providers, and references should become governed runtime resources, not invisible context or untracked side effects.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v7.8.0`
- v7.8 evidence: `docs/v7.8-release-definition.md`, `docs/v7.8.0-release-notes.md`, `.aof/artifacts/mission-control/mission-control-projection-audit.json`
- current frontier candidate: `v8.0` Externalized Organization Runtime

## Required Outcomes

Required:

- define external actor/tool/provider/reference boundaries as governed runtime resources
- require source-of-truth, permission, freshness, availability, and not-proven boundaries for externalized organization work
- make externalization visible in Mission Control without making the viewer the source of truth
- preserve reconstructable session, task, requirement, test, risk, decision, and release evidence across externalized work
- extend release audit so externalized organization claims fail when source boundaries or approval gates are missing

Deferred:

- autonomous external provider execution
- production deployment automation
- credential or billing management
- hosted multi-tenant runtime
- semantic correctness of external tool outputs

## Release Gates

### Gate 1: Externalization Contract

- external actor/tool/provider/reference resources are represented with explicit boundaries
- source-of-truth and approval policies are explicit
- external side effects are not hidden behind local artifact presence

### Gate 2: Runtime Evidence

- local runtime artifacts link to externalized work claims
- context/reference integrity is preserved
- provider-neutral session export remains reconstructable
- Mission Control shows externalization status from canonical artifacts

### Gate 3: Governance Boundary

- missing external source-of-truth boundaries fail the audit
- missing approval policy for external writes fails the audit
- unavailable or stale external references fail when freshness is required
- externalized runtime evidence is not treated as semantic truth
- v7.8 Mission Control projection audit still passes
- v7.7 Adoption Proof benchmark still passes
- v7.6 Session Export audit still passes
- v7.5 Requirement Coverage audit still passes
- v7.4 Parallel Lane audit still passes
- v7.3 Multi-Actor Pilot audit still passes
- v7.2 Work Execution Packet audit still passes

### Gate 4: Release Surface

- package version is updated to the selected release
- active release manifest points at selected release docs
- README and roadmap describe Mission Control projection without claiming semantic truth or delivery certainty

### Gate 5: Verification

- Mission Control projection audit
- adoption-proof benchmark
- provider-neutral session export audit
- requirement coverage audit
- parallel lane audit
- multi-actor pilot audit
- work execution packet audit
- context/reference integrity audit
- work readiness audit
- governance audits
- command routing audit
- CLI help benchmark
- organization verification
- release-state audit
- decision verification
- focused runtime tests
- `npm test`
- `npm run smoke`

## Release Decision

Release only if AOF now makes it harder to confuse:

- external tool output with validated truth
- provider activity with governed work
- local artifact presence with external source-of-truth control
- approval policy text with actual permission safety
- adapter availability with release readiness

## Post-v7.8 Direction

The next line should proceed in this order:

1. `v8.0`: Externalized Organization Runtime
2. `v8.1`: External Reference And Provider Adapter Governance
3. `v8.2`: Adoption Feedback And Operator Validation Loop
4. `v8.3`: Mission Control Operator Acceptance Evidence

Canonical planning reference:

- `docs/vnext-roadmap.md`
