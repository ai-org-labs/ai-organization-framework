# AOF vNext Release Plan

## Current Release

- v11.8.0 ships External Provider Read Freshness Refresh Gate.

## Release Closure

- Validate provider read freshness refresh records link provider read decision replay, provider read integration, observation replay, and supporting evidence.
- Validate freshness status maps to a safe reuse decision: current can be used, stale requires refresh/block/defer, expired must block reuse.
- Validate Mission Control exposes provider read freshness refresh status and next action.
- Validate `release-state-audit` includes `provider-read-freshness-refresh-audit`.
- Validate product value and capability delta evidence.
- Confirm local tests, smoke, clean checkout audit, GitHub main CI, tag CI, and GitHub Release.

## Next Releases

- v11.9: Tool Governance Replay in Mission Control.
- v12.0: Provider-backed Operator Decision Console.
- v12.1: Non-self-hosting External Operator Adoption Drill.
- v12.2: Provider-backed Work Order Preflight.
- v12.3: Provider Decision Outcome Scorecard.
