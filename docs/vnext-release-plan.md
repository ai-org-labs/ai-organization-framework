# AOF vNext Release Plan

## Current Release

- v11.9.0 ships Tool Governance Replay in Mission Control.

## Release Closure

- Validate Mission Control exposes `tool_governance_replay`.
- Validate replay records are derived from canonical agent-session `tool_call` events.
- Validate replay counts allowed, denied, review-required, unknown, risky, external-write, and dangerous decisions.
- Validate not-proven boundaries remain visible.
- Validate product value and capability delta evidence.
- Confirm local tests, smoke, clean checkout audit, GitHub main CI, tag CI, and GitHub Release.

## Next Releases

- v12.0: Provider-backed Operator Decision Console.
- v12.1: Non-self-hosting External Operator Adoption Drill.
- v12.2: Provider-backed Work Order Preflight.
- v12.3: Provider Decision Outcome Scorecard.
- v12.4: Agent Tool Policy Simulation and Replay Drill.
