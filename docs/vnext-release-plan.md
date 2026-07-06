# Next Release Plan

## Version

Candidate: `v7.0.0`

## Release Theme

Agent Session Observability and Runtime Event Stream.

`v6.9.0` made implementation readiness executable before work starts. The next bottleneck is that AOF can prove final artifacts and release gates, but a human still cannot always reconstruct the live agent session path: prompt, response, tool call, artifact write, council decision, verification, blocker, and stop condition.

Human-facing wording:

> v7.0 should let an operator reconstruct what the AI organization actually did, step by step, without reverse-engineering scattered final artifacts.

More explicit wording:

> AOF should treat session events as canonical runtime evidence: who/what initiated an event, which command/tool ran, which artifact changed, what decision was made, what verification happened, and why the loop stopped.

## Runtime Evidence Basis

- runtime command: `situation-assess --project .`
- direction task: `TASK-084`
- direction review: `docs/v7.0-agent-session-observability-direction.md`
- external signal: GitHub Copilot agent session streaming public preview, 2026-07-02
- Council review packet: `.aof/artifacts/execution/council-reviews/CRP-TASK-084-SESSION-OBSERVABILITY-DIRECTION.json`

## Required Outcomes

Required:

- define `session-event-record`
- define `runtime-event-stream`
- add a narrow local event writer
- add `session-observability-audit`
- require artifact writes, council decisions, verification results, blockers, and stop/defer/reopen outcomes to be reconstructable from session events
- expose the current event stream in Mission Control / operator surfaces without making the viewer a source of truth

Deferred:

- vendor-specific Copilot API dependency
- SIEM integration
- live network streaming
- semantic correctness scoring
- full governed parallel actor orchestration

## Release Gates

### Gate 1: Session Event Contract

- session event schema exists
- runtime event stream schema exists
- event records include actor/source, command/tool, artifact refs, decision refs, and timestamp
- stop/defer/reopen events can be represented

### Gate 2: Governance Continuity

- Archmap impact audit still passes for `TASK-071` onward
- review provenance audit still passes for done work at `TASK-071` onward
- evidence independence audit still passes for done work at `TASK-071` onward
- quality ledger audit still passes
- work readiness audit still passes
- event stream presence remains reconstructability evidence, not proof of truth

### Gate 3: Observability Audit

- `session-observability-audit` fails missing stream refs
- audit rejects council decisions without preceding evidence events
- audit rejects artifact writes without producing events
- audit checks tool-call safety level and approval policy metadata

### Gate 4: Release Surface

- package version is updated to the selected release
- active release manifest points at selected release docs
- README and roadmap describe session observability without overclaiming semantic truth

### Gate 5: Verification

- quality ledger audit
- work readiness audit
- session observability audit
- command routing audit
- CLI help benchmark
- organization verification
- release-state audit
- governance audits
- decision verification
- focused runtime tests
- `npm test`
- `npm run smoke`

## Release Decision

Release only if AOF now makes it harder to confuse:

- final artifacts with live process evidence
- tool execution with governed tool execution
- council approval with preceding reviewable evidence
- an agent session with an auditable session stream
- reconstructability with semantic correctness

## Post-v7 Direction Candidate

After the event stream exists, the next frontier can return to governed multi-actor orchestration or external provider adapters.
