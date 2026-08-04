# AOF Capability Matrix

This matrix is the human-facing release map. It answers: what can a user do now?

| Capability | First Version | v7.x | v8.x | v9.0-v9.2 | v9.3 | v9.4 | v9.5 | v9.6 | v9.7 | v9.8 |
|---|---:|---|---|---|---|---|---|---|---|---|
| Traceability | v7.0 | Session/task/evidence chain | External refs begin | Provider chain evidence | Unchanged | Unchanged | Incident chain evidence | Cost/quota chain evidence | Production go/no-go evidence chain |
| Organization Memory | v7.1 | Context/reference integrity | External resource state | Release state and feedback chain | Unchanged | Controlled candidate memory | Recovery drill memory | Spend boundary memory | Production candidate memory |
| Governance | v6.4 | Work execution and multi-actor gates | Provider governance gates | Operator/product gates | Unchanged | Controlled candidate gate | Incident recovery gate | Cost/quota gate | Go/no-go candidate gate |
| Human Approval | v8.7 | Not present | Independent approval artifact | Production boundary candidate consumes it | Unchanged | Operator go/no-go remains required | Resume remains review-bound | Budget owner must be explicit | Consumed by candidate boundary |
| External Resource Access | v8.0 | Not present | External resources and adapters | Provider execution evidence chain | Unchanged | Controlled provider-backed candidate | Incident response evidence | Spend/quota boundary evidence | Production readiness evidence candidate |
| Provider Execution | v8.5 | Not present | Pilot and approval bridge | Reproduction, rollback, outcome, learning, production boundary | Deferred after capability-first gate | Controlled execution candidate | Candidate must have recovery drill | Candidate must have cost/quota boundary | One operator-facing production go/no-go candidate |
| Provider Incident Recovery | v9.5 | Not present | Not present | Incident boundary only | Not present | Incident boundary text only | Detection, containment, rollback, recovery, notification, learning, resume/stop audit | Required upstream evidence | Required upstream evidence |
| Provider Cost/Quota Boundary | v9.6 | Not present | Not present | Budget boundary text only | Not present | Candidate budget text only | Incident path but no spend gate | Budget owner, cost ceiling, token/call/retry cap, quota/rate-limit, billing, overage audit | Required upstream evidence |
| Rollback | v8.8 | Not present | Rollback readiness proof | Production boundary consumes rollback | Unchanged | Candidate cannot pass without rollback ref | Incident drill must bind rollback decision | Cost overage can block before rollback is needed | Required upstream evidence |
| Learning | v8.9 | Not present | Outcome-to-learning update | Production boundary consumes learning | Unchanged | Candidate cannot pass without learning ref | Incident drill must bind learning update | Cost/quota decisions become auditable learning inputs | Required upstream evidence |
| Product Value Comprehension | v9.1 | Not present | Not present | Product value evidence gate | Improved | Candidate value evidence required | Incident recovery value evidence required | Spend/quota value evidence required | Production movement explained as user-facing judgment capability |
| Capability-First Release | v9.3 | Not present | Not present | Informal/partial | Formal model, delta, matrix, and audit | Gate persists | Gate persists | Gate persists |

## v9.8 Delta In 30 Seconds

Before v9.8, AOF had separate provider readiness artifacts, but an operator had to assemble the production-readiness chain manually.

After v9.8, AOF can present one bounded production go/no-go evidence candidate that connects approval, target, reproduction, rollback, outcome, incident, cost/quota, and value evidence without authorizing live execution.

## v9.7 Delta In 30 Seconds

Before v9.7, AOF had Archmap integration guidance, but the current Archmap provider baseline did not explicitly carry lifecycle traceability across requirements, acceptance criteria, decisions, risks, tests, and evidence.

After v9.7, AOF can treat Archmap v0.4.0 as the lifecycle projection baseline while preserving AOF artifacts as the source of truth.

## v9.6 Delta In 30 Seconds

Before v9.6, AOF could show the candidate and failure path for provider-backed work, but spend and quota limits were not a first-class release gate.

After v9.6, AOF can require a provider cost/quota boundary: budget owner, budget period, cost ceiling, token/call/retry caps, quota/rate-limit, billing boundary, overage policy, and stop governance.

## v9.5 Delta In 30 Seconds

Before v9.5, AOF could say a provider-backed action was a controlled candidate, but the incident response path was mostly boundary text.

After v9.5, AOF can require a provider incident drill: detection signal, containment, rollback decision, recovery action, operator notification, learning update, and resume/stop governance.

## v9.4 Delta In 30 Seconds

Before v9.4, provider readiness existed across several artifacts and the operator had to assemble the chain.

After v9.4, AOF can expose one controlled provider execution candidate: ready for operator go/no-go, not authorized for production execution.

## Not A Quality Claim

This matrix does not prove that every capability is valuable in the market.

It proves that AOF no longer lets release value be hidden behind implementation mechanism.

## v9.9 Delta In 30 Seconds

| Version | New Capability | User-Visible Difference | Not Proven |
|---|---|---|---|
| v9.9 | Production Readiness Review | Operator can review whether external runtime work is ready for production go/no-go consideration. | Live execution, production safety, third-party acceptance, and market value. |

| Capability | v9.8 | v9.9 |
|---|---|---|
| Production Go/No-Go Evidence | Candidate bundle | Feeds readiness review |
| Production Readiness Review | - | NEW |
| Provider Execution | Bounded candidate only | Readiness reviewed; live execution still blocked |

## v10.0 Delta In 30 Seconds

| Version | New Capability | User-Visible Difference | Not Proven |
|---|---|---|---|
| v10.0 | External Runtime Productization Decision | Operator can see whether external runtime advances as a product-grade candidate and what proof remains. | Live execution, third-party validation, product-market fit, production safety. |

| Capability | v9.9 | v10.0 |
|---|---|---|
| Production Readiness Review | Ready for review | Feeds productization decision |
| External Runtime Productization | - | NEW |
| Provider Execution | Live execution blocked | Product direction explicit; live execution still blocked |

## v10.1 Delta In 30 Seconds

| Version | New Capability | User-Visible Difference | Not Proven |
|---|---|---|---|
| v10.1 | Third-Party Operator Validation Contract | Operator can see what external validation must prove before self-hosting claims become third-party claims. | Completed third-party validation, adoption, market value, production authorization. |

| Capability | v10.0 | v10.1 |
|---|---|---|
| External Runtime Productization | Product-grade candidate decision | Has explicit external validation contract |
| Third-Party Validation | - | NEW contract only |
| Provider Execution | Live execution blocked | Still blocked; validation contract added |


## v10.2 Delta In 30 Seconds

| Version | New Capability | User-Visible Difference | Not Proven |
|---|---|---|---|
| v10.2 | External Provider Pilot Selection | Operator can see that GitHub read-first is the selected first provider pilot, why it was selected, and what remains blocked. | Completed provider integration, provider writes, live execution, production safety, third-party validation completion. |

| Capability | v10.1 | v10.2 |
|---|---|---|
| Third-Party Validation | Contract only | Feeds pilot selection criteria |
| External Provider Pilot Selection | - | NEW selection contract |
| Provider Execution | Live execution blocked | Still blocked; first provider pilot selected |

## v10.3 Capability Delta

NEW: `PCAP-PRODUCTION-EXECUTION-AUTHORIZATION-MODEL` lets operators see the exact gates required before live provider execution can be allowed.

30-second delta: v10.2 selected the first provider pilot; v10.3 defines the permission model that blocks live execution until authority, approval, budget, rollback, incident, stop, reproduction, and adapter-capability gates exist.

## v10.4 Capability Delta

NEW: `PCAP-EXTERNAL-VALUE-REPRODUCTION-PACKAGE` lets operators hand a bounded value reproduction package to an external reviewer.

30-second delta: v10.3 defined what must authorize live provider execution; v10.4 defines how an external operator should reproduce and report whether AOF value is visible outside self-hosting.

## v10.5 Capability Delta

NEW: `PCAP-PROVIDER-BACKED-WORK-LIFECYCLE-SURFACE` lets operators see provider-backed work as one lifecycle instead of separate proof artifacts.

30-second delta: v10.4 gave external reviewers a value reproduction package; v10.5 turns provider-backed work into a product story: need, validation, planning, provider candidate, authorization, evidence, Council review, blocker, and next action.
