# Next Release Plan

## Version

Candidate: `v7.7.0`

## Release Theme

Adoption-Grade v7 Runtime.

`v7.6.0` made provider-neutral session export claims auditable through normalized session export artifacts, required event summaries, resolvable links, source-of-truth boundaries, redaction boundaries, release-ready evidence, and not-proven limits. The next bottleneck is adoption: AOF should prove that a fresh project can reach governed work without depending on implicit maintainer knowledge or full-repo context loading.

Human-facing wording:

> v7.7 should prove that a new project can use the v7 runtime path to reach governed work with bounded context, explicit commands, requirement coverage, session export evidence, and release-ready boundaries.

More explicit wording:

> AOF should treat examples, docs, and generated artifacts as adoption aids, not as quality proof; the proof is whether a bounded adoption run produces valid runtime evidence and clear human handoff.

## Runtime Evidence Basis

- runtime basis: `docs/v7.x-roadmap.md`
- previous release: `v7.6.0`
- v7.6 evidence: `docs/v7.6-release-definition.md`, `docs/v7.6.0-release-notes.md`, `.aof/artifacts/session-exports/TASK-095.json`
- current frontier candidate: `v7.7` Adoption-Grade v7 Runtime

## Required Outcomes

Required:

- define an adoption run contract for a fresh managed project
- define the minimal context packet required to start governed work without reading the full repository
- verify that the adoption run creates work readiness, context integrity, execution packet, requirement coverage, and session export evidence
- make failure conditions human-readable: missing context, missing requirement, missing task linkage, missing export, missing release-ready boundary
- keep adoption proof bounded to structural/runtime evidence and avoid claiming external market adoption

Deferred:

- external customer adoption
- hosted onboarding service
- provider-specific managed integrations
- semantic quality proof of the adopter's actual product idea
- market/operator acceptance claims beyond the committed adoption run

## Release Gates

### Gate 1: Adoption Contract

- adoption run contract exists
- required starting packet is explicit
- commands required for first governed work are discoverable through AI-oriented help/registry

### Gate 2: Governed Work Chain

- fresh-project work item reaches readiness, execution, review, and closure evidence
- requirement coverage and session export evidence are created for the adoption work
- links resolve without maintainer-only local state

### Gate 3: Governance Boundary

- context and permission boundaries are mandatory
- missing work chain, missing requirement linkage, missing export linkage, or absent not-proven limits fail the audit
- v7.6 Session Export audit still passes
- v7.5 Requirement Coverage audit still passes
- v7.4 Parallel Lane audit still passes
- v7.3 Multi-Actor Pilot audit still passes
- v7.2 Work Execution Packet audit still passes

### Gate 4: Release Surface

- package version is updated to the selected release
- active release manifest points at selected release docs
- README and roadmap describe provider-neutral export without claiming provider automation or semantic truth

### Gate 5: Verification

- adoption-run audit
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

- onboarding material with governed work
- example artifact existence with adoption success
- session export completeness with semantic quality
- requirement linkage with requirement satisfaction
- release-ready evidence with external validation

## Post-v7.6 Direction

The v7 line should proceed in this order:

1. `v7.7`: Adoption-Grade v7 Runtime
2. `v7.8`: Mission Control Coverage Forecast Projection
3. `v8.0`: Externalized Organization Runtime
4. `v8.1`: External Reference And Provider Adapter Governance

Canonical planning reference:

- `docs/v7.x-roadmap.md`
