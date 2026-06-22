# AOF Examples

The examples are starter templates, not completed projects.

They intentionally include enough `.aof/` structure for runtime commands to start, but they do not ship a full generated artifact archive. Fresh runtime artifacts should be produced by the quickstart commands so the operator can see what AOF actually creates.

## Included Templates

- `aidlc-template`: AIDLC software-development flow with Visionary / Builder / Guardian actors, workflow config, seed sessions, and a signal example.
- `generic-template`: non-AIDLC service-design flow with the same core AOF structure adapted to a different workflow.

## Why Some Directories Start Empty

Directories such as `.aof/artifacts/`, `.aof/context/archive/`, and `.aof/prompts/` may start with `.gitkeep` only.

That is intentional:

- runtime artifacts should be generated during a run
- stale generated artifacts would be misleading as universal examples
- templates should show the minimal seed state needed to start

To generate artifacts, follow `docs/quickstart.md`.

