# Next Release Plan

## Version

`v6.6.0`

## Release Theme

Archmap-Aware Mission Control.

`v6.5.0` made AOF runs lighter and safer by separating safe local runtime work from project, external, and dangerous operations. The next bottleneck is architectural traceability: implementation work can change the organization/runtime shape without a governed map-impact decision.

Human-facing wording:

> v6.6 should make architecture impact visible as governed work progresses by connecting work items, Archmap source, Council disposition, and Mission Control projection.

More explicit wording:

> AOF should not let architecture drift become hidden context. Each implementation-grade work item should either update the architecture map, mark the map as unaffected, or defer the map impact with an explicit reason and follow-up.

## Runtime Evidence Basis

- runtime command: `situation-assess --project .`
- release task: `TASK-071`
- Archmap integration doc: `docs/v6.6-archmap-integration.md`
- Archmap source: `docs/archmaps/aof-runtime-current.archmap`
- Archmap impact record: `.aof/artifacts/archmap/impact/TASK-071.json`
- Council review packet: `.aof/artifacts/execution/council-reviews/CRP-TASK-071-V66-ARCHMAP.json`
- QIF readiness review: `docs/v6.6-qif-release-readiness-review.md`
- roadmap: `docs/vnext-roadmap.md`

## Required Outcomes

Required:

- define Archmap architecture impact as governed work evidence
- define `archmap_update_required`, `archmap_unaffected`, and `archmap_deferred_with_reason`
- commit a current AOF runtime Archmap source
- record the current work item impact for `TASK-071`
- resolve the Archmap impact Council status
- project Archmap source and map-impact state into Mission Control without making Mission Control source of truth
- keep QIF v0.3.1 as provider guidance, not executable verifier replacement
- add Node.js 24 to the CI runtime lane
- preserve Node.js 25+ unsupported warning

Deferred:

- full Archmap renderer integration into Mission Control
- mandatory `@archmap/core` runtime dependency
- mandatory `@archmap/icons` dependency
- automatic architecture quality scoring from diagrams
- full machine-verification of every implementation-grade work item map impact

## Release Gates

### Gate 1: Runtime Direction

- `situation-assess` reported `TASK-071` as the v6.6 frontier before release closure
- `situation-assess` reported no truth conflicts
- operating goal and next value slice point at Archmap-aware Mission Control

### Gate 2: Archmap Contract

- Archmap integration doc exists
- Archmap source exists
- current work item impact record exists
- contract distinguishes update, unaffected, and deferred outcomes
- docs state that icons and diagrams are not quality evidence by themselves

### Gate 3: Council Disposition

- Council review packet exists for `TASK-071`
- Archmap impact status is no longer pending
- release does not treat pending review as approval

### Gate 4: Mission Control Boundary

- Mission Control projects current map ref
- Mission Control projects latest impact status
- Mission Control does not become source of truth

### Gate 5: Runtime Support

- package engines allow Node.js `>=22 <25`
- CI validates Node.js 22
- CI validates Node.js 24
- CLI warns for Node.js 25+
- quickstart documents Node.js 22/24 support

### Gate 6: Verification

- command routing audit
- organization verification
- release-state audit
- decision verification
- focused runtime situation tests
- `npm test`
- `npm run smoke`

## Release Decision

Release `v6.6.0` only if AOF now makes it harder to confuse:

- architecture documentation with governed architecture impact
- Mission Control projection with source of truth
- visual icons with quality evidence
- pending Council review with approval
- permissive Node engine range with CI-validated runtime support

## Post-v6.6 Direction Candidate

After v6.6, the next frontier should be selected through runtime-backed review. The strongest known candidate is first-class machine verification that every implementation-grade work item has an explicit architecture impact decision before release sign-off.
