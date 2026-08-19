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

## v10.6 Capability Delta

NEW: `PCAP-THIRD-PARTY-VALIDATION-RESULT-INGESTION` lets AOF classify external reviewer results and route uncertainty into governance.

30-second delta: v10.5 made provider-backed work understandable as a lifecycle; v10.6 defines how third-party validation results enter that lifecycle as governed evidence.

## v10.7 Capability Delta

| Capability | v10.6 | v10.7 | User-visible change |
|---|---|---|---|
| Capability Coverage Gate | - | NEW | AOF can block build/release-critical work when required roles, skills, actor assignments, execution gates, outputs, acceptance gates, or Council follow-up tasks are missing. |

## v10.8 Capability Delta

NEW: `PCAP-ROLE-ROUTING-FAIL-CLOSED` ensures required specialist roles are actually routed to actors before Council execution proceeds.

30-second delta: v10.7 could catch missing capability coverage after work was represented as governed. v10.8 moves the protection earlier: if a required role such as `Game Planner`, `UX`, `Level Designer`, or `QA` has no actor, Council execution stops before a plan is persisted.

| Capability | v10.7.1 | v10.8.0 | User-visible change |
|---|---|---|---|
| Capability Coverage Gate | full actor output chain coverage | still available | post-work audit remains available |
| Role Routing Fail-Closed | - | NEW | required roles must resolve to actors before Council execution |
| Specialist Council Seats | manual/implicit | explicit via `--required-role` or session role requirements | domain specialists are joined into the plan |
| Missing Specialist Handling | can be found later | fail-closed before persistence | missing required roles cannot silently proceed |

## v10.9 Capability Delta

NEW: `PCAP-PROVIDER-PILOT-EXECUTION-READINESS` turns scattered provider preflight records into one operator-facing readiness chain.

30-second delta: v10.8 stopped Council work when required roles were missing. v10.9 answers a different operator question: whether a provider-backed pilot is structurally ready to advance, with adapter, approval, target, reproduction, rollback, outcome, learning, incident, cost/quota, product value, and release-state evidence connected.

| Capability | v10.8.0 | v10.9.0 | User-visible change |
|---|---|---|---|
| Provider Execution | separate governed evidence records | release-level readiness chain | Operators can ask if the pilot is ready without reading every raw provider artifact. |
| Product Value Comprehension | release value explained | provider readiness value explained | The release states what operator work is reduced. |
| Release-State Governance | gate audit chain | readiness chain checked before release | Green release means structural readiness evidence exists, not live execution permission. |

## v11.0 Capability Delta

NEW: `PCAP-GITHUB-READONLY-OBSERVATION-PROOF` lets AOF inspect real GitHub repository state without write authority and select the next most important task with Japanese, evidence-backed reasoning.

30-second delta: v10.9 answered whether a provider pilot was structurally ready. v11.0 answers what the next task should be after reading the actual GitHub repository state, while explicitly denying GitHub writes.

| Capability | v10.9.0 | v11.0.0 | User-visible change |
|---|---|---|---|
| GitHub Read-Only Observation Proof | - | NEW | AOF can pick the next task from real GitHub state without write permission. |
| Release-State Governance | provider readiness chain | GitHub observation gate added | Release readiness now checks that provider observation is bounded and auditable. |

## v11.1 Capability Delta

NEW: `PCAP-EXTERNAL-OPERATOR-REPRODUCTION-PROOF` lets a first-time or external operator reproduce AOF's next-task judgment from a bounded Japanese evidence path.

30-second delta: v11.0 lets AOF select the next task from read-only GitHub state. v11.1 lets a human verify why that task is selected without reading the whole repository.

| Capability | v11.0.0 | v11.1.0 | User-visible change |
|---|---|---|---|
| GitHub Read-Only Observation Proof | AOF selects next task | Feeds reproduction drill | GitHub-grounded judgment becomes human-replayable. |
| External Operator Reproduction Proof | - | NEW | Operator gets current situation, candidate comparison, evidence path, Go/No-Go, and not-proven boundary. |
| Next Task Judgment | AI-readable evidence | five-minute human replay | Operator can decide whether to accept the judgment. |

## v11.2 Capability Delta

NEW: `PCAP-PROVIDER-READ-INTEGRATION-PROOF` lets AOF represent a real external provider read as governed runtime work with adapter/resource refs, observed provider data, no-write boundaries, decision output, evidence refs, and an audit gate.

30-second delta: v11.1 made the next-task judgment reproducible for humans. v11.2 makes the upstream GitHub read itself a first-class governed integration instead of a one-off observation.

| Capability | v11.1.0 | v11.2.0 | User-visible change |
|---|---|---|---|
| External Operator Reproduction Proof | five-minute replay path | still available | The human can still replay the decision. |
| Provider Read Integration Proof | - | NEW | Operator can inspect the provider, adapter, read output, no-write boundary, and decision in one audited record. |
| GitHub Read-Only Observation Proof | observation packet | governed integration record | GitHub read is now a runtime integration with release-state audit coverage. |

## v11.3 Capability Delta

NEW: `PCAP-EXTERNAL-VALIDATION-REPLAY` lets AOF replay external validation results against provider-read evidence and route uncertainty into governance.

30-second delta: v11.2 made the upstream GitHub read a governed integration. v11.3 makes external validation of that read confidence-aware and auditable.

| Capability | v11.2.0 | v11.3.0 | User-visible change |
|---|---|---|---|
| Provider Read Integration Proof | governed provider read | improved with validation replay | Provider-read confidence can now be strengthened or challenged by replayed validation results. |
| External Validation Replay | - | NEW | Operator can inspect validation result, confidence before/after, governance route, and no-write boundary. |
| Release-State Governance | provider-read audit gate | validation replay audit gate added | Green release now checks validation replay evidence and fail-closed uncertainty routing. |

## v11.4 Capability Delta

NEW: `PCAP-AGENT-SESSION-CONTRACT` lets AOF treat AI work sessions as release evidence only when tool authority and proof links are explicit.

30-second delta: v11.3 made external validation replay confidence-aware. v11.4 makes the AI work session itself auditable: prompt, response, tool calls, tool safety, approval policy, task/requirement/test links, risks, decisions, and stop condition.

| Capability | v11.3.0 | v11.4.0 | User-visible change |
|---|---|---|---|
| Agent Session Evidence | reconstructable session records existed | governed release-ready session contract | Operator can see whether the AI session is safe enough to count as release evidence. |
| Tool Governance Evidence | scattered across command safety and approvals | checked in session contract audit | Hidden external-write permission fails closed. |
| Release-State Governance | validation replay audit gate | agent-session contract audit gate added | Green release now checks AI work-session authority as part of release readiness. |

## v11.5 Capability Delta

NEW: `PCAP-PROVIDER-OBSERVATION-REPLAY` turns provider-read evidence into an operator-readable replay packet.

30-second delta: v11.4 made AI session tool authority auditable. v11.5 makes external provider observation evidence understandable without raw JSON reconstruction.

| Capability | v11.4.0 | v11.5.0 | User-visible change |
|---|---|---|---|
| Provider Read Integration Proof | raw records and audits | human-readable replay added | Operator can see what was read, why it mattered, what changed, and what remains unproven. |
| External Validation Replay | confidence and governance routing | included in provider observation story | Validation result becomes part of a readable provider evidence chain. |
| Release-State Governance | agent-session contract audit gate | provider-observation replay audit gate added | Green release now checks provider evidence comprehension, not just raw artifact presence. |

## v11.6 Capability Delta

NEW: `PCAP-EXTERNAL-OPERATOR-FEEDBACK` records whether an external operator understood, reproduced, rejected, or was confused by a provider observation replay.

30-second delta: v11.5 made provider observation evidence readable. v11.6 makes operator comprehension and reproduction feedback auditable, and weak feedback must route to product review.

| Capability | v11.5.0 | v11.6.0 | User-visible change |
|---|---|---|---|
| Human-readable Provider Observation Replay | readable replay packet | feedback intake linked to replay | Operator can see whether the replay actually landed with a reviewer. |
| Product Value Comprehension | value evidence stated before/after | feedback route becomes product evidence | Confusion, rejection, or failed reproduction is treated as a product issue, not prose feedback. |
| Release-State Governance | provider-observation replay audit gate | external-operator feedback audit gate added | Green release now checks that weak feedback cannot silently pass as accepted evidence. |

## v11.7 Capability Delta

NEW: `PCAP-PROVIDER-READ-DECISION-REPLAY` shows provider-read decision state in Mission Control.

30-second delta: v11.6 captured operator feedback. v11.7 turns that feedback into a visible provider-read decision replay.

| Capability | v11.6.0 | v11.7.0 | User-visible change |
|---|---|---|---|
| Provider Read Decision Replay | no Mission Control decision projection | accepted / blocked / reopened / deferred / needs-review state visible | Operators can inspect decision state without reconstructing raw artifacts. |
| External Operator Feedback | feedback record exists | feedback route drives decision state | Feedback becomes an operational decision input. |
| Provider Observation Replay | readable replay exists | replay linked to downstream decision | Provider evidence becomes visible as part of a governed decision chain. |
