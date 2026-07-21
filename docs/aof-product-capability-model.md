# AOF Product Capability Model

## Purpose

AOF releases must start from user-recognizable capability, not internal mechanism.

Internal artifacts, schemas, audits, commands, dashboards, and tags are implementation evidence. They are not release value by themselves.

## Product Capability

A product capability is something a user can now do or understand because AOF exists.

Each capability must have:

- `capability_id`
- `name`
- `description`
- `user_value`
- `first_version`
- `status`
- `evidence_refs`

Canonical register:

- `.aof/product-capabilities.json`

## Release Rule

Every release note must begin with:

1. What You Can Do Now
2. Capability Delta
3. Capability Matrix
4. Value Evidence

Implementation details come after those sections.

## Acceptance Criteria

A release is not release-ready unless:

- at least one capability is new, improved, or explicitly removed
- the capability delta is recorded
- a user can understand the release value in one minute
- a user can understand the version difference in thirty seconds
- value evidence says what work was reduced or what judgment became easier
- unclear value feedback becomes a product review trigger, not a documentation footnote

## Boundary

Capability evidence is not market proof.

It does not prove:

- broad adoption
- semantic correctness
- operator satisfaction
- business value
- production safety

It proves that AOF can make the release claim start from user capability and preserve the evidence behind that claim.
