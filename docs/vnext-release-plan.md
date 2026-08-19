# AOF vNext Release Plan

## Current Release

- v11.7.0 ships Provider Read Decision Replay in Mission Control.

## Release Closure

- Validate provider read decision replay records link provider read integration, observation replay, and external operator feedback.
- Validate feedback route maps to accepted / blocked / reopened / deferred / needs-review decision state.
- Validate Mission Control exposes provider read decision replay status.
- Validate `release-state-audit` includes `provider-read-decision-replay-audit`.
- Validate product value and capability delta evidence.
- Confirm local tests, smoke, clean checkout audit, GitHub main CI, tag CI, and GitHub Release.

## Next Releases

- v11.8: External Provider Read Freshness Refresh Gate.
- v11.9: Tool Governance Replay in Mission Control.
- v12.0: Provider-backed Operator Decision Console.
- v12.1: Non-self-hosting External Operator Adoption Drill.
- v12.2: Provider-backed Work Order Preflight.
