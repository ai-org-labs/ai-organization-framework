# AOF Capability Matrix

This matrix is the human-facing release map. It answers: what can a user do now?

| Capability | First Version | v7.x | v8.x | v9.0-v9.2 | v9.3 | v9.4 |
|---|---:|---|---|---|---|---|
| Traceability | v7.0 | Session/task/evidence chain | External refs begin | Provider chain evidence | Unchanged | Unchanged |
| Organization Memory | v7.1 | Context/reference integrity | External resource state | Release state and feedback chain | Unchanged | Controlled candidate memory |
| Governance | v6.4 | Work execution and multi-actor gates | Provider governance gates | Operator/product gates | Unchanged | Controlled candidate gate |
| Human Approval | v8.7 | Not present | Independent approval artifact | Production boundary candidate consumes it | Unchanged | Operator go/no-go remains required |
| External Resource Access | v8.0 | Not present | External resources and adapters | Provider execution evidence chain | Unchanged | Controlled provider-backed candidate |
| Provider Execution | v8.5 | Not present | Pilot and approval bridge | Reproduction, rollback, outcome, learning, production boundary | Deferred after capability-first gate | Controlled execution candidate |
| Rollback | v8.8 | Not present | Rollback readiness proof | Production boundary consumes rollback | Unchanged | Candidate cannot pass without rollback ref |
| Learning | v8.9 | Not present | Outcome-to-learning update | Production boundary consumes learning | Unchanged | Candidate cannot pass without learning ref |
| Product Value Comprehension | v9.1 | Not present | Not present | Product value evidence gate | Improved | Candidate value evidence required |
| Capability-First Release | v9.3 | Not present | Not present | Informal/partial | Formal model, delta, matrix, and audit | Gate persists |

## v9.4 Delta In 30 Seconds

Before v9.4, provider readiness existed across several artifacts and the operator had to assemble the chain.

After v9.4, AOF can expose one controlled provider execution candidate: ready for operator go/no-go, not authorized for production execution.

## Not A Quality Claim

This matrix does not prove that every capability is valuable in the market.

It proves that AOF no longer lets release value be hidden behind implementation mechanism.
