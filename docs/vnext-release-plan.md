# Next Release Plan

## Version

`v6.5.0`

## Release Theme

Execution Hygiene and Command Safety.

`v6.4.0` made AOF better at stopping wrong work before implementation. The next bottleneck is operational: AOF itself can become too heavy if every run carries too much persistent context, too many tools, too much stale conversation memory, or too many approval prompts.

Human-facing wording:

> v6.5 should make AOF runs lighter, safer, and easier to approve by separating safe local runtime work from project, external, and dangerous operations.

More explicit wording:

> AOF should not become a giant prompt, a giant `CLAUDE.md`, or a permission-fatigue machine. Each run should know its work item boundary, what context is persistent, what artifacts are loaded on demand, what local commands are preapproved, and what actions require explicit human approval.

## Runtime Evidence Basis

- runtime command: `situation-assess --project .`
- release task: `TASK-070`
- execution hygiene doc: `docs/v6.5-execution-hygiene.md`
- command registry: `.aof/command-registry.json`
- CLI reference: `docs/cli-reference.md`
- current baseline release definition: `docs/v6.4-release-definition.md`
- roadmap: `docs/vnext-roadmap.md`

## Required Outcomes

Required:

- define minimal persistent context
- define skills / artifacts on demand
- define work item session boundary
- define small diff / small work item rule
- define specialist actor composition
- define Council-ready handoff
- define approved run contract
- define batch safe local commands
- define permission fatigue avoidance
- classify commands by `safe_read`, `safe_local_write`, `project_write`, `external_write`, and `dangerous`
- expose `safety_level` and `approval_policy` through command registry and AI help
- verify safety metadata through `cli-help-benchmark`
- prevent `situation-assess` from mistaking a shipped release mention for the target frontier

Deferred:

- full Mission Control UX redesign
- automatic enforcement of every safety class
- external tool permission automation
- governed multi-actor orchestration

## Release Gates

### Gate 1: Runtime Direction

- `situation-assess` reports `TASK-070` as the v6.5 frontier
- `situation-assess` reports no truth conflicts
- operating goal and next value slice point at Execution Hygiene + Human Recognition

### Gate 2: Execution Hygiene

- Execution Hygiene doc exists
- the nine hygiene principles are defined
- failure modes are named
- work item session boundary and handoff expectations are visible

### Gate 3: Command Safety

- command registry schema includes safety fields
- command registry artifact includes safety fields
- command help includes safety fields
- `cli-help-benchmark` checks safety metadata

### Gate 4: Approval Boundary

- safe local read/write actions are described as preapproved for normal local runs
- project writes require care
- external writes require explicit approval
- dangerous operations require explicit approval
- release docs do not claim permission bypass

### Gate 5: Verification

- command routing audit
- organization verification
- release-state audit
- decision verification
- focused runtime situation tests
- `npm test`
- `npm run smoke`

## Release Decision

Release `v6.5.0` only if AOF now makes it harder to confuse:

- CLI help with runtime proof
- `.aof` artifact writes with project source edits
- project writes with external writes
- safe local commands with deploy/publish/secrets/billing/destructive/production actions
- long conversation state with canonical work item handoff artifacts

## Post-v6.5 Direction Candidate

After v6.5, Mission Control / Human Recognition should render the Execution Hygiene state directly: active work item, run contract, command safety boundary, actor handoff, Council readiness, blockers, and runtime proof.
