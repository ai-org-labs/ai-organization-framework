# AOF Capability Matrix

This matrix is the human-facing release map. It answers: what can a user do now?

| Capability | First Version | v7.x | v8.x | v9.0-v9.2 | v9.3 | v9.4 | v9.5 |
|---|---:|---|---|---|---|---|---|
| Traceability | v7.0 | Session/task/evidence chain | External refs begin | Provider chain evidence | Unchanged | Unchanged | Incident chain evidence |
| Organization Memory | v7.1 | Context/reference integrity | External resource state | Release state and feedback chain | Unchanged | Controlled candidate memory | Recovery drill memory |
| Governance | v6.4 | Work execution and multi-actor gates | Provider governance gates | Operator/product gates | Unchanged | Controlled candidate gate | Incident recovery gate |
| Human Approval | v8.7 | Not present | Independent approval artifact | Production boundary candidate consumes it | Unchanged | Operator go/no-go remains required | Resume remains review-bound |
| External Resource Access | v8.0 | Not present | External resources and adapters | Provider execution evidence chain | Unchanged | Controlled provider-backed candidate | Incident response evidence |
| Provider Execution | v8.5 | Not present | Pilot and approval bridge | Reproduction, rollback, outcome, learning, production boundary | Deferred after capability-first gate | Controlled execution candidate | Candidate must have recovery drill |
| Provider Incident Recovery | v9.5 | Not present | Not present | Incident boundary only | Not present | Incident boundary text only | Detection, containment, rollback, recovery, notification, learning, resume/stop audit |
| Rollback | v8.8 | Not present | Rollback readiness proof | Production boundary consumes rollback | Unchanged | Candidate cannot pass without rollback ref | Incident drill must bind rollback decision |
| Learning | v8.9 | Not present | Outcome-to-learning update | Production boundary consumes learning | Unchanged | Candidate cannot pass without learning ref | Incident drill must bind learning update |
| Product Value Comprehension | v9.1 | Not present | Not present | Product value evidence gate | Improved | Candidate value evidence required | Incident recovery value evidence required |
| Capability-First Release | v9.3 | Not present | Not present | Informal/partial | Formal model, delta, matrix, and audit | Gate persists | Gate persists |

## v9.5 Delta In 30 Seconds

Before v9.5, AOF could say a provider-backed action was a controlled candidate, but the incident response path was mostly boundary text.

After v9.5, AOF can require a provider incident drill: detection signal, containment, rollback decision, recovery action, operator notification, learning update, and resume/stop governance.

## v9.4 Delta In 30 Seconds

Before v9.4, provider readiness existed across several artifacts and the operator had to assemble the chain.

After v9.4, AOF can expose one controlled provider execution candidate: ready for operator go/no-go, not authorized for production execution.

## Not A Quality Claim

This matrix does not prove that every capability is valuable in the market.

It proves that AOF no longer lets release value be hidden behind implementation mechanism.
