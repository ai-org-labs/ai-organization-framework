# Next Release Plan

## Version

Candidate: `v8.1.0`

## Release Theme

External Reference And Provider Adapter Governance.

`v8.0.0` made external actors, tools, providers, and references governable as runtime resources through resource/use records, audit, release-state integration, and Mission Control projection. The next bottleneck is adapter governance: AOF should define safe read adapter contracts, freshness checks, approval policy gates, and explicit external-write escalation before any provider adapter can be treated as operationally safe.

Human-facing wording:

> v8.1 should let AOF use provider adapters only when the adapter's read/write authority, freshness, approval, and side effects are visible and bounded.

More explicit wording:

> Provider adapters should become governed access paths, not hidden execution shortcuts.

## Runtime Evidence Basis

- runtime basis: `docs/vnext-roadmap.md`
- previous release: `v8.0.0`
- v8.0 evidence: `docs/v8.0-release-definition.md`, `docs/v8.0.0-release-notes.md`, `.aof/artifacts/external-resources/external-resource-audit.json`, `.aof/context/active/release-state-audit.json`
- current frontier candidate: `v8.1` External Reference And Provider Adapter Governance

## Required Outcomes

Required:

- define provider adapter records with read/write authority boundaries
- require freshness checks and approval policy evidence before adapter use is release-ready
- fail unapproved external-write adapter paths
- preserve external resource/use audit compatibility from v8.0
- project adapter readiness into Mission Control from canonical artifacts

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

- missing provider adapter source-of-truth boundaries fail the audit
- missing approval policy for external-write adapter paths fails the audit
- unavailable or stale adapter references fail when freshness is required
- adapter runtime evidence is not treated as semantic truth
- v8.0 external-resource-audit still passes
- v7.9 externalization readiness audit still passes
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

## Post-v8.0 Direction

The next line should proceed in this order:

1. `v8.1`: External Reference And Provider Adapter Governance
2. `v8.2`: Adoption Feedback And Operator Validation Loop
3. `v8.3`: Mission Control Operator Acceptance Evidence
4. `v8.4`: Externalized Runtime Operator Safety Proof

Canonical planning reference:

- `docs/vnext-roadmap.md`
