# AOF vNext Release Plan

## Current Release

- v11.5.0 ships Human-readable Provider Observation Replay.

## Release Closure

- Validate provider observation replay records explain what external state was read.
- Validate replay records explain why provider state mattered and what changed.
- Validate replay records preserve not-proven boundaries and deny external writes.
- Validate raw provider refs without operator-readable replay fail closed.
- Validate `release-state-audit` includes `provider-observation-replay-audit`.
- Validate product value and capability delta evidence.
- Confirm local tests, smoke, clean checkout audit, GitHub main CI, tag CI, and GitHub Release.

## Next Releases

- v11.6: External Operator Reproduction Feedback Intake.
- v11.7: Provider Read Decision Replay in Mission Control.
- v11.8: External Provider Read Freshness Refresh Gate.
- v11.9: Tool Governance Replay in Mission Control.
- v12.0: Provider-backed Operator Decision Console.
