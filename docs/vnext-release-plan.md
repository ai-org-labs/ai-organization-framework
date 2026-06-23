# Next Release Plan

## Version

`v6.1.0`

## Release Theme

Work Governance Integration.

`v6.0.0` made AOF publishable as a public runtime baseline. `v6.1.0` makes the next frontier concrete: AOF can represent, write, verify, and project governed cross-domain work items rather than only software tasks.

The `v6.1` slice remains bounded. It does not claim full autonomous Work Governance or bidirectional external tool synchronization.

## Runtime Evidence Basis

- runtime command: `organization-status --project .`
- roadmap command: `roadmap-status --project .`
- situation assessment command: `situation-assess --project .`
- task: `.aof/tasks/assigned/TASK-063.json`
- integration plan: `docs/v6.1-work-governance-integration-plan.md`
- examples: `docs/v6.1-work-governance-examples.md`
- release definition: `docs/v6.1-release-definition.md`
- core model: `docs/aof-core-model.md`
- roadmap: `docs/vnext-roadmap.md`

## Required Outcomes

Required:

- Work Governance is defined as the AOF Core concept
- PMO is explicitly treated as a view or alias, not the core concept
- work item is defined as broader than task
- work item goal requirements are defined
- actor composition / actor selection requirements are defined
- Council-ready output is defined
- Go / No-Go visualization requirements are defined
- Operational Map is defined as a core concept
- Context Pack and context audit direction are defined
- External Reference model direction is defined
- schema contracts and fixtures exist
- narrow CLI writers exist
- `work-governance-benchmark` exists
- Mission Control projection exists
- software and non-software examples exist

Deferred:

- full Jira bidirectional sync
- full external tool adapters
- autonomous Work Governance
- replacing `.aof/tasks/` with a new work item store
- standalone `context-audit`, `external-ref-audit`, and `operational-map-audit` commands

## Release Gates

### Gate 1: Runtime Direction

- `situation-assess` reports `TASK-063` as the active v6.1 release-closure frontier
- `TASK-057` through `TASK-062` are done
- `TASK-063` is approved before sign-off

### Gate 2: Core Model Alignment

- `docs/aof-core-model.md` defines Work Governance
- `task` / `work item` relationship is explicit
- Mission Control authority boundary is explicit

### Gate 3: Contracts And Examples

- Work Governance schemas validate
- software and manufacturing fixture chains exist
- `docs/v6.1-work-governance-examples.md` references both chains
- `work-governance-benchmark` passes

### Gate 4: Roadmap Alignment

- `docs/vnext-roadmap.md` treats `v6.1.0` as the completed Work Governance Integration track
- next candidates remain visible without conflicting with Work Governance

### Gate 5: Verification

- `command-routing-audit`
- `organization-verify`
- `decision-verify`
- `release-state-audit`
- `work-governance-benchmark`
- `npm test`
- `npm run smoke`

## Release Decision

Release `v6.1.0` only if Work Governance contracts, CLI writers, benchmark, Mission Control projection, cross-domain examples, release docs, and release state are internally consistent.

Do not claim that Work Governance runtime automation is complete in `v6.1.0`. The claim is that the governing work-item chain is now structurally represented, writable, verifiable, and visible.
