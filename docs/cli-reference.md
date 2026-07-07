# CLI Reference

この文書は current prototype の `aof` CLI command をまとめた quick reference である。  
実装の正本は [src/cli.js](../src/cli.js) にある。

## Command Taxonomy

`v3.5` では command surface を次の taxonomy で扱う。

- `read`: 状態・register・status を読む
- `verify`: 整合性・drift・benchmark を検証する
- `write`: canonical artifact や governed state を書く
- `execute`: runtime や orchestration を前に進める
- `observe`: metrics・visibility・analytics を出力する

毎回この全文を読む代わりに、まず `command-register` を読む前提にする。

## Help Boundary And Runtime Evidence Rule

`v6.3` 以降の CLI help は、人間向けの完全 manual ではなく AI 向けの command routing surface である。

- `node ./src/cli.js --help --json` は command taxonomy / top commands / runtime flow を読むために使う。
- `node ./src/cli.js <command> --help --json` は command purpose / input-output shape / failure meaning / QIF boundary を読むために使う。
- option-level detail が不足する場合は、この full CLI reference または既存 artifact format を参照する。
- `--help` の存在は runtime proof ではない。
- `command-registry.json` の存在は routing evidence であり、成果物品質や semantic truth の証明ではない。

Direction / review / self-review / retrospective / release sign-off では、current artifact を読むだけでは不十分である。最低限、該当 claim に対応する runtime command を実行し、実行ログまたは artifact ref を残す。

代表例:

- verification claim: `organization-verify`, `decision-verify`, `release-state-audit`, benchmark command
- audit claim: `organization-audit`, `command-routing-audit`
- self-review claim: `self-audit-record`
- situation claim: `situation-assess`, `operator-brief`, `operator-progress`

Help は「どの command を使うべきか」を選ぶための入口であり、「実際に AOF runtime を使った」ことの証拠ではない。

## Execution Hygiene And Command Safety

`v6.5` 以降、command category と command safety は別軸で扱う。詳細は [v6.5 Execution Hygiene](./v6.5-execution-hygiene.md) を参照する。

Command category:

- `read`: 状態・register・status を読む
- `verify`: 整合性・drift・benchmark を検証する
- `write`: canonical artifact や governed state を書く
- `execute`: runtime や orchestration を前に進める
- `observe`: metrics・visibility・analytics を出力する

Command safety level:

- `safe_read`: 状態確認、brief 生成、context-pack 参照、audit / verify 表示
- `safe_local_write`: `.aof/` 配下の artifact、goal、log、visibility、benchmark evidence 更新
- `project_write`: repo 内の docs / schema / src / test / examples 更新
- `external_write`: GitHub / Jira / Slack / API / model provider など外部・credentialed・billable 操作
- `dangerous`: delete / deploy / publish / billing / secrets / production / irreversible 操作

標準 local run では `safe_read` と `safe_local_write` を preapproved とし、`project_write` / `external_write` / `dangerous` は都度承認を要求する。

## Core Flow

### `init`

別プロジェクトに AOF の canonical `.aof/` skeleton と AI recognition packet を一括配置する。

```bash
aof init --topology managed-project
```

より明示的に seed したい場合:

```bash
node ./src/cli.js init \
  --project /path/to/target-repo \
  --topology managed-project \
  --project-type web-app \
  --domain-summary "Internal operations dashboard"
```

主な option:

- `--project <path>`: target project root。default は current directory
- `--topology <self-hosting|managed-project>`: required
- `--write-target <target>`: optional override。managed-project の default は `aof/state`、self-hosting の default は `main`
- `--project-type <type>`: seed orientation に入れる project type
- `--domain-summary "<text>"`: seed orientation に入れる domain summary
- `--install-mode <runtime-on|framing-only>`: default は `runtime-on`

副作用:

- `.aof/` directory skeleton を生成する
- `.aof/project-bootstrap.json` を生成する
- `.aof/organization.json` を生成する
- `.aof/command-registry.json` を生成する
- `.aof/context/active/project-orientation.json` を生成する
- `.aof/skills.json` / `.aof/capability-registry.json` / `.aof/resource-inventory.json` / `.aof/policies.json` を生成する
- `north-star / operating-goal / next-value-slice` の seed goal file を生成する
- `recent-confirmation-window.json` を空 state で生成する

### `upgrade`

既存 `.aof/` bootstrap を current AOF installer shape に migrate する。

```bash
aof upgrade --project /path/to/target-repo
```

主な option:

- `--project <path>`: target project root。default は current directory
- `--write-target <target>`: optional override。既存 bootstrap の write target を上書きしたい時だけ使う
- `--install-mode <runtime-on|framing-only>`: optional override。既存 bootstrap の install mode を上書きしたい時だけ使う

副作用:

- `.aof/project-bootstrap.json` に `bootstrap_format_version` と current `aof_version` を反映する
- canonical refs と topology-aware write policy を補完する
- 欠けている `organization.json` / `command-registry.json` / `project-orientation.json` / capability-layer artifact / seed goals / `recent-confirmation-window.json` を再生成する
- 既存 project context をなるべく保持したまま installer state を最新 shape へ寄せる

### `command-registry-refresh`

canonical command catalog から `.aof/command-registry.json` を再生成する。

```bash
node ./src/cli.js command-registry-refresh --project .
```

主な効果:

- `.aof/command-registry.json` を current CLI surface に更新する
- command taxonomy / purpose / top command metadata を artifact 化する

### `command-register`

`command-registry.json` を読むための operator-facing read surface。

```bash
node ./src/cli.js command-register --project .
```

主な観測値:

- command count
- category counts
- top commands
- command purpose / routing metadata

### `command-routing-audit`

bootstrap / orientation / command registry の routing surface が揃っているかを narrow に検証する。

```bash
node ./src/cli.js command-routing-audit --project .
```

主な確認項目:

- `project-bootstrap.json` の `command_registry_ref`
- `project-orientation.json` の `command_registry_ref`
- routing summary category coverage
- top command coverage
- CLI reference detail ref presence

### `organization-verify`

`.aof/project-bootstrap.json` を起点に、organization / skill / capability / resource / policy artifact の schema と相互参照を検証する。

```bash
node ./src/cli.js organization-verify --project .
```

主な確認項目:

- `project-bootstrap.json` / `organization.json` / `project-orientation.json` の schema 整合
- `command-registry.json` の schema 整合
- `skills.json` / `capability-registry.json` / `resource-inventory.json` / `policies.json` の schema 整合
- organization と capability-layer artifact の ref alignment
- command registry と orientation routing summary の ref alignment
- skill / capability / resource / policy の cross-reference 整合
- contract artifact path の存在確認

### `contract-register`

current `.aof/organization.json` から contract register を返す。

```bash
node ./src/cli.js contract-register --project .
```

主な観測値:

- contract id
- name
- owner team ref
- contract type
- artifact ref
- artifact presence

### `release-state-refresh`

active release baseline を runtime-native path で更新する。

```bash
node ./src/cli.js release-state-refresh \
  --project . \
  --release-version 5.0.0 \
  --release-tag v5.0.0 \
  --release-definition-ref docs/v5.0-release-definition.md \
  --release-notes-ref docs/v5.0.0-release-notes.md \
  --release-checklist-ref docs/v5.0-release-checklist.md
```

主な効果:

- `.aof/context/active/active-release-manifest.json` を書く
- `.aof/project-bootstrap.json` の `aof_version` を更新する
- `.aof/organization.json` の `contract-governance-to-release` を更新する

### `release-state-audit`

active release baseline の drift と、v6.7 governance audit gate を narrow に検査する。

```bash
node ./src/cli.js release-state-audit --project .
```

主な確認項目:

- active release manifest の存在
- active release refs の存在
- bootstrap version alignment
- governance release contract alignment
- `archmap-impact-audit` release gate
- `review-provenance-audit` release gate
- `evidence-independence-audit` release gate

このコマンドが green でない場合、release sign-off は incomplete と扱う。Validator pass は構造・参照・証拠独立性のruntime境界を確認するものであり、semantic truth や market truth の証明ではない。

### `archmap-impact-audit`

`TASK-071` 以降の implementation-grade work item が、Archmap への影響判断を持っているかを narrow に検査する。これは v6.7 の Verifiable Governance 用 command であり、release sign-off 前に「アーキテクチャ影響を見たことにしていないか」を機械的に落とすためのもの。

```bash
node ./src/cli.js archmap-impact-audit --project . --cutoff-task-id TASK-071
```

主な確認項目:

- 対象 task に `.aof/artifacts/archmap/impact/<TASK-id>.json` が存在する
- `status` が `archmap_update_required` / `archmap_unaffected` / `archmap_deferred_with_reason` のいずれか
- `council_review_status` が `pending` ではない
- `work_item_ref` と `archmap_source_ref` が解決できる

QIF boundary:

- pass は structural/runtime evidence であり、Archmap の意味的完全性や視覚品質を証明しない
- semantic architecture correctness は Guardian / Council / human review / operational feedback の対象として残る

### `review-provenance-audit`

`TASK-071` 以降の done work item が、Council review を自己申告だけで済ませていないかを narrow に検査する。v6.7 の Verifiable Governance 用 command であり、release sign-off 前に「レビューしたことにしているだけ」の状態を機械的に落とす。

```bash
node ./src/cli.js review-provenance-audit --project . --cutoff-task-id TASK-071
```

主な確認項目:

- done task ごとに Council review packet が存在する
- `review_status` が `approved` / `changes-requested` / `blocked` / `deferred` のいずれか
- `source_task_id` が対象 task と一致する
- `source_parent_session_id` が存在する
- `role_result_refs` または `evidence_refs` が存在し、参照が解決できる

QIF boundary:

- pass は review provenance の structural/runtime evidence であり、レビュー判断の意味的正しさを証明しない
- semantic review quality は Guardian / Council / human review / operational feedback の対象として残る

### `evidence-independence-audit`

`TASK-071` 以降の done work item が、release sign-off の証拠を maker-authored / self-attested なものだけに依存していないかを narrow に検査する。v6.7 の Verifiable Governance 用 command であり、「ソースを書いた」「task を閉じた」「impact record を作った」だけで品質主張しないためのもの。

```bash
node ./src/cli.js evidence-independence-audit --project . --cutoff-task-id TASK-071
```

主な確認項目:

- done task の Council review evidence が存在する
- evidence が `src/` や `.aof/tasks/` などの maker/self-attested refs だけではない
- `test/` / `schemas/` / Council review / Guardian result / governance review / release check のいずれかの independent category が存在する
- evidence ref が解決できる

QIF boundary:

- pass は evidence independence の structural/runtime evidence であり、証拠が semantic truth を証明するとは限らない
- semantic validity は human review / expert review / reproduction test / operational feedback / governance の対象として残る

### `quality-ledger-record`

QIF / AOF の品質主張に関する evidence event を append-only に記録する。これは v6.8 の Executable Quality Ledger 用 command であり、「品質を証明する」ためではなく、「品質主張・欠落証拠・矛盾・修正・governance escalation を追跡可能にする」ためのもの。

```bash
node ./src/cli.js quality-ledger-record \
  --project . \
  --event-type runtime_evidence_missing \
  --quality-intent-ref QIN-AOF-RUNTIME \
  --work-item-ref TASK-078 \
  --claim "A release claim has no runtime evidence yet" \
  --qif-ref docs/aof-qif-quality-definition.md \
  --governance-action request-evidence \
  --source-task-id TASK-078 \
  --source-parent-session-id SESS-PARENT-001
```

主な記録項目:

- `event_type`: `evidence_added` / `claim_contradicted` / `runtime_evidence_missing` / `assumption_corrected` / `verdict_changed` / `governance_escalation`
- `quality_intent_ref`: 対象 Quality Intent
- `work_item_ref`: 対象 task / work item
- `claim`: 追跡する品質主張または欠落
- `evidence_refs`: 根拠 artifact refs
- `qif_refs`: QIF adapter / quality definition refs
- `semantic_truth_claimed`: default false
- `operator_validated`: default false
- `governance_action`: `none` / `review-required` / `block-release` / `request-evidence` / `update-verdict`

QIF boundary:

- ledger event は evidence traceability であり、QIF verdict や semantic truth を自動生成しない
- `runtime_evidence_missing` / `claim_contradicted` / `assumption_corrected` は governance action なしで受け入れてはいけない
- operator validation や external validation は明示 evidence がある場合だけ別途記録する

### `quality-ledger-audit`

Quality Ledger event が構造・参照・governance escalation 境界を満たしているかを narrow に検査する。

```bash
node ./src/cli.js quality-ledger-audit --project .
```

主な確認項目:

- ledger event が存在する
- event schema が valid
- evidence refs / QIF refs が解決できる
- `semantic_truth_claimed` が不用意に true になっていない
- missing / contradicted / corrected / escalation 系 event が governance action を持つ
- contradicted / corrected event が `prior_state` と `new_state` を持つ

QIF boundary:

- pass は Quality Ledger の structural/runtime evidence であり、品質達成・意味的正しさ・市場価値を証明しない
- semantic uncertainty は hidden にせず、ledger event と governance action として上げる

### `work-readiness-record`

work item を implementation-ready と呼ぶ前に、goal / risk / loss boundary / acceptance gate / evidence plan / maker-checker separation / stop condition を明示する。これは v6.9 の Executable Pre-Implementation Quality Gates 用 command であり、後から成功条件を作る失敗を防ぐ。

```bash
node ./src/cli.js work-readiness-record \
  --project . \
  --work-item-id TASK-082 \
  --work-item-ref .aof/tasks/open/TASK-082.json \
  --goal "Implement executable pre-implementation gates" \
  --risk "AOF starts work without knowing what success means" \
  --loss-boundary "No implementation-ready claim without gates" \
  --acceptance-gate "work-readiness-audit passes" \
  --evidence-plan "schema, command, tests, Council review" \
  --maker-role builder \
  --checker-role guardian \
  --council-ref architecture-council \
  --stop-condition "audit passes or implementation stops" \
  --qif-ref docs/aof-qif-quality-definition.md \
  --source-task-id TASK-082 \
  --source-parent-session-id SESS-PARENT-001
```

主な記録項目:

- `goal`: 何を達成する作業か
- `risk`: 着手前に潰すべき失敗モード
- `loss_boundary`: ここを越えたら品質主張できない境界
- `acceptance_gates`: 受け入れ条件
- `evidence_plan`: 何を証拠にするか
- `maker_role` / `checker_role`: 作る人と検証する人の分離
- `stop_conditions`: loop の停止条件
- `qif_refs`: 関連する Quality Intent / QIF 定義

QIF boundary:

- readiness record は「着手前の期待値」を証跡化するものであり、実装品質や semantic truth を証明しない
- readiness pass は Council review / runtime tests / release-state audit の代替ではない

### `work-readiness-audit`

implementation-grade work item が、着手前 gate を持たずに ready と扱われていないかを narrow に検査する。

```bash
node ./src/cli.js work-readiness-audit --project . --cutoff-task-id TASK-082
```

主な確認項目:

- 対象 task に `.aof/artifacts/work-readiness/<TASK-id>.json` が存在する
- readiness record schema が valid
- `work_item_id` が task と一致する
- `readiness_status` が `ready`
- goal / risk / loss boundary が存在する
- acceptance gates / evidence plan / stop conditions が存在する
- maker role と checker role が分離されている
- QIF refs と work item refs が解決できる

QIF boundary:

- pass は pre-implementation readiness の structural/runtime evidence であり、成果物の意味的正しさ・市場価値・実装品質を証明しない
- pass 後も maker/checker/Council/release-state の各 gate は必要

### `agent-session-record`

AI 作業を session event stream として記録する。v7.0 の最初の観測単位であり、AI作業を task / requirement / test evidence / risk candidate / decision candidate / release-ready evidence に紐づける。

```bash
node ./src/cli.js agent-session-record \
  --project . \
  --session-id SESS-001 \
  --actor-ref codex \
  --role-ref builder \
  --event-json '{"event_type":"prompt","summary":"User asked for v7 session observability"}' \
  --event-json '{"event_type":"tool_call","summary":"Ran runtime audit","tool_name":"session-observability-audit","safety_level":"safe_read","approval_policy":"preapproved"}' \
  --task-ref .aof/tasks/open/TASK-085.json \
  --requirement-ref docs/v7.0-agent-session-observability-direction.md \
  --test-evidence-ref test/runtime-core-2.test.js \
  --risk-candidate "session path is not reconstructable" \
  --decision-candidate "promote event stream to release gate" \
  --release-ready-evidence-ref test/runtime-core-2.test.js \
  --release-ready-verdict runtime_ready \
  --source-task-id TASK-085 \
  --source-parent-session-id SESS-V70-SESSION-OBSERVABILITY
```

必須リンク:

- `--task-ref`: このAI作業が進めた task
- `--requirement-ref`: このAI作業が満たそうとした要求
- `--test-evidence-ref`: このAI作業を検証した証跡
- `--risk-candidate`: 作業中に検出した risk 候補
- `--decision-candidate`: decision record 化すべき判断候補
- `--release-ready-evidence-ref`: release ready 判定に使える証跡

### `session-observability-audit`

`agent-session-record` の stream が再構成可能かを検証する。task / requirement / test / risk / decision / release-ready のリンクがない stream は不合格にする。

```bash
node ./src/cli.js session-observability-audit --project .
```

主な確認項目:

- session stream が存在する
- task / requirement / test evidence へのリンクがある
- risk candidate と decision candidate が記録されている
- release-ready claim が evidence ref と verdict を持つ
- prompt / response / tool_call / artifact_write / verification_result / risk_candidate / decision_candidate / stop_condition event が揃っている
- tool_call event が `tool_name` / `safety_level` / `approval_policy` を持つ
- file/path ref が解決できる

### `dependency-graph`

current `.aof/organization.json` から dependency graph を返す。

```bash
node ./src/cli.js dependency-graph --project .
```

主な観測値:

- declared dependency edges
- team-local dependency refs
- adjacency view

### `decision-register`

current `.aof/decisions/` から decision register を返す。

```bash
node ./src/cli.js decision-register --project .
```

主な観測値:

- decision id
- decision summary
- stage / scope
- markdown pair presence
- canonical path alignment

### `organization-audit`

current AOF state を operator-facing にまとめて監査する。

```bash
node ./src/cli.js organization-audit --project .
```

主な確認項目:

- organization verification summary
- decision verification summary
- task lifecycle duplicate detection
- active audit artifact writeback

### `decision-verify`

project の `.aof/decisions/` を走査して、decision record artifact の schema と pair 整合を検証する。

```bash
node ./src/cli.js decision-verify --project ./examples/aidlc-template
```

主な確認項目:

- decision record の bundled schema 整合
- project-local decision schema 整合
- `decision_id` と filename の一致
- `canonical_markdown_path` と expected path の一致
- `.json` と `.md` pair の存在確認

### `metrics-snapshot`

current `.aof/` state から最小の organization metrics snapshot を生成する。

```bash
node ./src/cli.js metrics-snapshot --project .
```

主な観測値:

- open task count
- closed throughput total
- contract coverage ratio
- unresolved escalation count
- decision record count

### `organization-status`

current `.aof/` state から operator-facing な organization summary を返す。

```bash
node ./src/cli.js organization-status --project .
```

主な観測値:

- topology / install mode / write target
- north star / operating goal / next value slice
- council / team / role summary
- task counts by lifecycle
- capability / resource / policy artifact presence

### `organization-analytics-snapshot`

current `.aof/` state から最小の organization analytics snapshot を生成する。

```bash
node ./src/cli.js organization-analytics-snapshot --project .
```

主な観測値:

- task flow by lifecycle status
- contract artifact coverage
- dependency bottleneck count
- unresolved escalation count
- human-readable observations

### `roadmap-status`

current roadmap artifact と runtime backlog の対応関係を返す。

```bash
node ./src/cli.js roadmap-status --project .
```

主な観測値:

- current next value slice
- latest alignment pulse summary
- roadmap / release plan / current release definition refs
- release track ごとの task grouping

### `learning-loop-snapshot`

current `.aof/` state から outcome / self-audit / next value slice / improvement focus を束ねた learning-loop artifact を生成する。

```bash
node ./src/cli.js learning-loop-snapshot --project .
```

主な確認項目:

- latest outcome evidence
- latest self-audit
- current next value slice
- improvement proposal basis
- current learning loop state

### `actor-skill-packet-record`

actor assignment を skill / capability / resource / policy / review evidence つきの canonical packet として記録する。

```bash
node ./src/cli.js actor-skill-packet-record \
  --project . \
  --objective "Implement the actor skill packet writer" \
  --actor-ref codex \
  --role-ref builder \
  --team-ref runtime-team \
  --assignment-reason "Builder owns runtime writer implementation" \
  --execution-mode single-actor \
  --skill-ref skill-schema-review \
  --capability-fit-json '{"capability_ref":"cap-schema-review","fit_state":"sufficient","evidence_refs":["schemas/aof-actor-skill-packet.schema.json"],"rationale":"schema-backed writer task"}' \
  --resource-ref resource-repo-main \
  --policy-ref policy-runtime-backed-answer-discipline \
  --output-artifact-type actor-skill-packet \
  --output-artifact-schema-ref schemas/aof-actor-skill-packet.schema.json \
  --required-section assignment \
  --acceptance-criterion "schema validates" \
  --review-criterion-json '{"criterion":"packet validates","evaluator_ref":"guardian","evidence_required":"schema validation","blocking":true}' \
  --blocker-json '{"blocker_code":"missing-skill-evidence","trigger_condition":"skill evidence missing","consequence":"block-assignment","recovery_action":"add skill evidence"}' \
  --character-label Builder \
  --speech-bubble "I can write the packet." \
  --current-action "Implement writer" \
  --confidence-label medium \
  --next-action "Submit packet for review" \
  --source-task-id TASK-050 \
  --source-parent-session-id SESS-PARENT-001
```

主な観測値:

- assignment / required skill refs
- capability fit evidence
- resource refs / policy refs
- expected output contract
- review criteria / blocker semantics
- HRI projection fields
- source task and parent session provenance

### `actor-assignment-evaluation-record`

actor skill packet を読み、assignment が `selected` / `degraded` / `blocked` / `escalated` のどれかを runtime evidence として記録する。

```bash
node ./src/cli.js actor-assignment-evaluation-record \
  --project . \
  --actor-skill-packet-ref .aof/artifacts/benchmarks/fixtures/ASP-TASK-050-BUILDER.json \
  --source-task-id TASK-051 \
  --source-parent-session-id SESS-PARENT-001
```

主な観測値:

- actor skill packet ref / id
- assignment identity
- capability fit summary
- selected / degraded / blocked / escalated decision
- missing evidence list
- HRI projection state
### `actor-execution-gate-record`

actor assignment evaluation を resource claim と policy evaluation に接続し、actor が実行へ進めるかを `allowed` / `blocked` / `degraded` / `requires-council-review` として記録する。

```bash
node ./src/cli.js actor-execution-gate-record \
  --project . \
  --actor-assignment-evaluation-ref .aof/artifacts/benchmarks/fixtures/AAE-TASK-051-SELECTED.json \
  --resource-claim-ref .aof/artifacts/benchmarks/fixtures/RCL-TASK-052-REPO-MAIN.json \
  --policy-evaluation-ref .aof/artifacts/benchmarks/fixtures/PER-TASK-052-RUNTIME-DISCIPLINE.json \
  --source-task-id TASK-052 \
  --source-parent-session-id SESS-PARENT-001
```

主な観測値:

- actor assignment evaluation ref
- required resource refs / resource claim refs
- required policy refs / policy evaluation refs
- execution gate state
- council review requirement
- HRI-visible blocker and next action

### `skillful-actor-benchmark`

Skillful Actor Runtime の negative benchmark family (`SAB`) を実行する。missing skill evidence、weak actor assignment、missing resource claim、policy-bypassed allocation、stale release state、output contract mismatch が green にならないことを確認する。

```bash
node ./src/cli.js skillful-actor-benchmark \
  --project . \
  --write-artifact /tmp/aof-skillful-actor-benchmark.json
```

### `skillful-actor-hri-projection`

Skillful Actor Runtime の packet / assignment evaluation / execution gate / benchmark を Human Recognition Interface 用の1枚の投影artifactへまとめる。HRIはこのartifactを読むことで、どのactorが何をしていて、何がblockerで、council reviewが必要かをruntime-backedに表示できる。

```bash
node ./src/cli.js skillful-actor-hri-projection \
  --project . \
  --actor-skill-packet-ref .aof/artifacts/benchmarks/fixtures/ASP-TASK-050-BUILDER.json \
  --actor-assignment-evaluation-ref .aof/artifacts/benchmarks/fixtures/AAE-TASK-051-SELECTED.json \
  --actor-execution-gate-ref .aof/artifacts/benchmarks/fixtures/AEG-TASK-052-REQUIRES-REVIEW.json \
  --skillful-actor-benchmark-ref .aof/artifacts/benchmarks/fixtures/SAB-TASK-053-GREEN.json \
  --source-task-id TASK-054 \
  --source-parent-session-id SESS-PARENT-001
```

### `allocation-plan-record`

governed allocation recommendation を canonical artifact として記録する。

```bash
node ./src/cli.js allocation-plan-record \
  --project . \
  --subject-ref TASK-010 \
  --target-role-ref builder \
  --candidate-resource-ref resource-repo-main \
  --recommended-allocation-json '{"role_ref":"builder","primary_resource_ref":"resource-repo-main","supporting_resource_refs":[],"rationale":"repo access needed","capability_refs":["cap-contract-alignment"],"constraint_refs":["policy-main-branch-access"],"workload_state":"available","approval_required":true}' \
  --policy-ref policy-main-branch-access \
  --risk-note "main writes require review"
```

主な観測値:

- subject ref
- target role refs
- candidate resource refs
- recommended allocations
- policy refs
- risk notes

### `policy-evaluation-report`

allocation または execution request に対する policy judgment を canonical artifact として記録する。

```bash
node ./src/cli.js policy-evaluation-report \
  --project . \
  --subject-ref TASK-010 \
  --evaluation-scope "allocation recommendation review" \
  --overall-outcome requires-review \
  --policy-ref policy-main-branch-access \
  --result-json '{"policy_id":"policy-main-branch-access","effect":"require-review","outcome":"requires-review","reason":"repository writes stay review-gated","blocking":false}' \
  --recommended-action "Route allocation through review before execution."
```

主な観測値:

- evaluation scope
- policy refs
- overall outcome
- per-policy results
- recommended actions

### `resource-claim-record`

reviewed resource reservation request を canonical artifact として記録する。

```bash
node ./src/cli.js resource-claim-record \
  --project . \
  --subject-ref TASK-010 \
  --resource-ref resource-repo-main \
  --claimant-role-ref builder \
  --claim-scope "temporary repository write access for v2.5 implementation slice" \
  --claim-status requested \
  --approval-policy-ref policy-main-branch-access \
  --justification "allocation plan recommends repo access but policy requires review before use"
```

主な観測値:

- resource ref
- claimant role ref
- claim scope
- claim status
- approval policy refs
- justification
- optional allocation plan / policy evaluation linkage

### `role-result-record`

role 単位の execution result を canonical artifact として記録する。

```bash
node ./src/cli.js role-result-record \
  --project . \
  --role Builder \
  --stage planning \
  --session-id SESS-BUILD-001 \
  --status completed \
  --recommendation "Merge into the team packet." \
  --rationale "Implementation path is coherent."
```

主な観測値:

- role / stage / session
- status / recommendation / rationale
- signal list
- artifact refs
- decision required flag

### `team-output-record`

複数 role output を team-level packet に束ねる。

```bash
node ./src/cli.js team-output-record \
  --project . \
  --team-id runtime-team \
  --stage planning \
  --expected-role Builder \
  --expected-role Guardian \
  --received-role Builder \
  --aggregate-state waiting-for-missing-roles \
  --recommended-next-step "Wait for Guardian role result."
```

主な観測値:

- expected / received / missing roles
- aggregate state
- blocking signals
- joined role result refs
- next recommended step

### `role-join-record`

親オーケストレータが複数 role result の回収状態を join artifact として記録する。

```bash
node ./src/cli.js role-join-record \
  --project . \
  --stage planning \
  --expected-role Builder \
  --expected-role Guardian \
  --expected-role Visionary \
  --received-role Builder \
  --received-role Guardian \
  --aggregate-state waiting-for-missing-roles \
  --recommended-next-step "Wait for Visionary role result."
```

主な観測値:

- expected / received / missing roles
- join aggregate state
- blocking signals
- received session ids
- orchestrator next step

### `council-review-packet`

team output を council judgment artifact に変換する。

```bash
node ./src/cli.js council-review-packet \
  --project . \
  --council-id architecture-council \
  --stage review \
  --review-status deferred \
  --decision-summary "Waiting for complete team packet." \
  --rationale "Guardian output has not arrived." \
  --recommendation "Wait for Guardian role result."
```

主な観測値:

- council id / stage / review status
- decision summary / rationale / recommendation
- team output refs / role result refs / evidence refs
- follow-up task ids
- escalation required flag

### `runtime-loop-proof`

framing から allocation, execution, review, outcome, next-step recommendation までを deterministic に 1 本通し、`TASK-011` 向けの auditable proof artifact を生成する。

```bash
node ./src/cli.js runtime-loop-proof \
  --project . \
  --provider mock \
  --source-task-id TASK-011
```

主な観測値:

- session / decision refs
- allocation / policy / resource claim refs
- role result / role join / team output / council review refs
- execution lineage ref
- learning loop ref
- per-phase proof status

### `execution-lineage`

execution artifact 群から current lineage snapshot を生成する。

```bash
node ./src/cli.js execution-lineage --project . --source-task-id TASK-012
```

主な観測値:

- role join count
- role result / team output / council review count
- stages observed
- latest stage
- blocking signal count
- recommended next step
- normalized artifact refs

### `run`

新しい request から session と initial decision record を生成する。

```bash
node ./src/cli.js run "初回離脱率を下げたい" --project ./examples/aidlc-template
```

主な option:

- `--project <path>`: target project root
- `--fast-track`: routing mode を `fast-track` に override
- `--deep-path`: routing mode を `deep-path` に override

副作用:

- `Current Operating Goal` を `.aof/goals/operating-goal.json` に initial projection として同期する

### `answer`

clarification answer を session に取り込む。

```bash
node ./src/cli.js answer \
  --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json \
  --response "新規登録導線全体" \
  --response "登録完了率を 5% 改善する" \
  --response "認証基盤は変更しない"
```

主な option:

- `--session <path>`: target session file
- `--response "<text>"`: answer text。複数回指定可

副作用:

- clarification answer を `Recent Confirmation Window` に自動追記する
- request が `framed` になった場合、`.aof/goals/operating-goal.json` を refined need に寄せて更新する

### `outcome-report`

decision 後の actual outcome を session に書き戻す。

```bash
node ./src/cli.js outcome-report \
  --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json \
  --result success \
  --note "登録導線の KPI が改善した" \
  --signal-ref SIG-001
```

主な option:

- `--session <path>`: target session file
- `--result <success|partial|failure>`: observed outcome result
- `--note "<text>"`: short outcome note
- `--signal-ref <ref>`: optional linked signal or external reference

副作用:

- current `Next Value Slice` projection を `.aof/goals/next-value-slice.json` に同期する
- outcome writeback 時点で `declared_complete_at` を埋める

### `task-open`

`.aof/tasks/open/` に canonical task artifact を作成する。

```bash
node ./src/cli.js task-open \
  --project ./examples/aidlc-template \
  --title "Add runtime write path" \
  --origin orchestrator \
  --operating-goal-ref v1.8-self-hosting
```

主な option:

- `--project <path>`: target project root
- `--title "<text>"`: task title
- `--description "<text>"`: optional description
- `--origin <discovery|experience-steward|guardian|orchestrator|human>`: optional task origin
- `--orchestrator-session-id <id>`: canonical owner session
- `--assigned-session-id <id>`: working child session, multiple allowed
- `--related-decision-record-id <id>`: optional decision record reference
- `--operating-goal-ref <ref>`: optional operating goal reference
- `--triage-notes "<text>"`: optional triage notes

### `task-update`

既存 task artifact を更新し、必要なら status directory も移動する。

```bash
node ./src/cli.js task-update \
  --project ./examples/aidlc-template \
  --task-id TASK-001 \
  --status done \
  --related-decision-record-id DEC-001
```

主な option:

- `--project <path>`: target project root
- `--task-id <TASK-id>`: target task id
- `--status <open|assigned|done|archived|retired>`: optional lifecycle transition
- `--assigned-session-id <id>`: replace assigned session list when provided, multiple allowed
- `--related-decision-record-id <id>`: optional decision evidence
- `--triage-notes "<text>"`: optional updated triage notes

### `goal-project`

`.aof/goals/` に canonical goal projection file を書き込む。

```bash
node ./src/cli.js goal-project \
  --project ./examples/aidlc-template \
  --goal-type next-value-slice \
  --content "Add runtime write path for tasks and goals" \
  --agreed-with-human
```

主な option:

- `--project <path>`: target project root
- `--goal-type <north-star|operating-goal|next-value-slice>`
- `--content "<text>"`: projected goal text
- `--agreed-with-human`: mark human agreement
- `--source-session-id <id>`: optional originating session
- `--source-decision-record-id <id>`: optional originating decision
- `--declared-complete`: write `declared_complete_at`

### `confirmation-window-record`

`Recent Confirmation Window` を `.aof/context/active/` に追記し、最新数件だけを canonical に保持する。

```bash
node ./src/cli.js confirmation-window-record \
  --project ./examples/aidlc-template \
  --question "まだ解くべき問題は同じか" \
  --answer "はい。runtime write path が最優先" \
  --expectation-state "self-hosting gap remains active"
```

主な option:

- `--project <path>`: target project root
- `--question "<text>"`: repeated confirmation question
- `--answer "<text>"`: human-aligned answer
- `--expectation-state "<text>"`: optional current expectation summary
- `--mismatch-state "<text>"`: optional mismatch summary
- `--scale-direction "<text>"`: optional next scale-up direction
- `--source-session-id <id>`: optional originating session
- `--source-decision-record-id <id>`: optional originating decision
- `--max-entries <n>`: retain only the latest `n` entries; default `3`

### `alignment-pulse`

`Alignment Pulse` を `.aof/context/active/alignment-pulse.json` と task triage metadata に書き込む。

```bash
node ./src/cli.js alignment-pulse \
  --project ./examples/aidlc-template \
  --question "まだ解くべき問題は同じか" \
  --answer "はい。task triage cadence を runtime に入れる" \
  --prioritized-task-id TASK-004 \
  --triage-note "cadence-focused pulse after v1.9.0"
```

主な option:

- `--project <path>`: target project root
- `--question "<text>"`: cadence review question
- `--answer "<text>"`: current alignment answer
- `--expectation-state "<text>"`: optional expectation summary
- `--mismatch-state "<text>"`: optional remaining gap summary
- `--scale-direction "<text>"`: optional next-step direction
- `--prioritized-task-id <TASK-id>`: mark task as prioritized, multiple allowed
- `--stale-task-id <TASK-id>`: mark task as stale candidate, multiple allowed
- `--retire-candidate-task-id <TASK-id>`: mark task as retire-review candidate, multiple allowed
- `--triage-note "<text>"`: update task triage notes
- `--max-entries <n>`: retain only the latest `n` recent confirmation entries; default `3`

副作用:

- `.aof/context/active/alignment-pulse.json` を更新する
- open task の triage freshness と stale / retire-candidate classification を更新する
- `Recent Confirmation Window` に cadence review を追記する
- pulse 実行後に `cadence-trigger-guidance.json` も自動 refresh する

### `cadence-trigger-guide`

current cadence surfaces から、次に人や Orchestrator が回すべき cadence action を要約する。

```bash
node ./src/cli.js cadence-trigger-guide \
  --project ./examples/aidlc-template \
  --source-session-id SESS-ORCH-001 \
  --source-decision-record-id DEC-004
```

主な option:

- `--project <path>`: target project root
- `--source-session-id <id>`: optional originating session
- `--source-decision-record-id <id>`: optional originating decision
- `--max-entries <n>`: retain only the latest `n` recent confirmation entries; default `3`

副作用:

- `.aof/context/active/cadence-trigger-guidance.json` を更新する
- retire review 候補 task や不足している cadence surface を要約する
- `trigger_state` と `batching_mode` により、follow-through が不要か、単独 action で足りるか、複数 action をまとめるべきかを示す
- 実際に次に叩くべき command suggestion を guidance artifact に含める
- guidance summary を `Recent Confirmation Window` に自動追記する

### `cadence-follow-through`

single-action の cadence guidance をそのまま runtime execution に落とす。

```bash
node ./src/cli.js cadence-follow-through \
  --project ./examples/aidlc-template \
  --resolution keep-open \
  --note "Retain the task after guided follow-through"
```

主な option:

- `--project <path>`: target project root
- `--resolution <retire|keep-open>`: current single-action retire review 用の resolution
- `--note "<text>"`: follow-through note
- `--source-session-id <id>`: optional originating session
- `--source-decision-record-id <id>`: optional originating decision
- `--max-entries <n>`: retain only the latest `n` recent confirmation entries; default `3`

副作用:

- `.aof/context/active/cadence-follow-through.json` を更新する
- current guidance が `single-action` かつ `retire-candidate-review` の場合、その review を runtime 経由で実行する
- follow-through outcome を `Recent Confirmation Window` に追記する
- それ以外の guidance state では skip reason を artifact に残す

### `self-audit-record`

active self-audit artifact を `.aof/context/active/framework-self-audit.json` に書き込み、  
recent confirmation と next value slice を必要に応じて更新する。

```bash
node ./src/cli.js self-audit-record \
  --project ./examples/aidlc-template \
  --audit-id FSA-007 \
  --scope "post-pulse cadence review" \
  --summary "task triage cadence is now runtime-backed" \
  --detected-gap "self-audit cadence is still weaker than pulse-backed task triage" \
  --next-action "make self-audit cadence refresh through the same operating loop" \
  --related-task-id TASK-004 \
  --next-value-slice "Extend TASK-004 into runtime-backed self-audit cadence"
```

主な option:

- `--project <path>`: target project root
- `--audit-id <id>`: self-audit identifier
- `--scope "<text>"`: audit scope
- `--summary "<text>"`: current audit summary
- `--detected-gap "<text>"`: remaining gap statement
- `--result-state <active|stable|escalate>`: optional audit state
- `--next-action "<text>"`: next operating move
- `--related-task-id <TASK-id>`: related open task, multiple allowed
- `--next-value-slice "<text>"`: optional next value slice refresh
- `--max-entries <n>`: retain only the latest `n` recent confirmation entries; default `3`

副作用:

- `.aof/context/active/framework-self-audit.json` を更新する
- `Recent Confirmation Window` に self-audit outcome を追記する
- optional に `Next Value Slice` を更新する
- self-audit 実行後に `cadence-trigger-guidance.json` も自動 refresh する

### `retire-candidate-review`

retire candidate review を active artifact として残し、review 結果に応じて task を `retired` に移すか、`open` のまま保持する。

```bash
node ./src/cli.js retire-candidate-review \
  --project ./examples/aidlc-template \
  --resolution keep-open \
  --task-id TASK-004 \
  --note "Retain the task for the next cadence slice"
```

主な option:

- `--project <path>`: target project root
- `--resolution <retire|keep-open>`: retire disposition
- `--task-id <TASK-id>`: reviewed task id, multiple allowed
- `--note "<text>"`: human-approved review note
- `--max-entries <n>`: retain only the latest `n` recent confirmation entries; default `3`

副作用:

- `.aof/context/active/retire-candidate-review.json` を更新する
- review outcome に応じて task を `retired` または `open` に更新する
- `Recent Confirmation Window` に review outcome を追記する
- retire review 実行後に `cadence-trigger-guidance.json` も自動 refresh する

## Execution Inspection

### `packet`

stage / role ごとの model input packet を出力する。

```bash
node ./src/cli.js packet \
  --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json \
  --stage planning
```

主な option:

- `--session <path>`
- `--stage <clarification|planning|proposal|review|approval|reopen>`
- `--project <path>`: optional
- `--role <role>`: optional role override

### `council`

stage-role matrix に基づく council plan を表示する。

```bash
node ./src/cli.js council \
  --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json \
  --stage review \
  --include-optional
```

主な option:

- `--session <path>`
- `--stage <stage>`
- `--project <path>`
- `--role <role>`
- `--include-optional`: optional seat も含める

### `council-exec`

council plan を実行し、必要なら provider-backed model call まで行う。

```bash
node ./src/cli.js council-exec \
  --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json \
  --stage planning \
  --invoke-model \
  --provider mock
```

主な option:

- `--session <path>`
- `--stage <stage>`
- `--project <path>`
- `--role <role>`
- `--include-optional`
- `--invoke-model`
- `--provider <provider>`
- `--model <name>`
- `--base-url <url>`
- `--api-key-env <name>`
- `--timeout-ms <ms>`
- `--max-retries <n>`
- `--mock-seat-decision <Role=decision>`
- `--mock-seat-veto <Role=yes|no>`
- `--write-artifact <path>`

副作用:

- approval stage 実行時は `Recent Confirmation Window` に approval outcome を要約記録する
- rejection 時は escalation が open されたことを mismatch として confirmation memory に残す

## Signal And Escalation

### `signal`

external signal を session に適用する。

```bash
node ./src/cli.js signal \
  --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json \
  --signal ./examples/aidlc-template/.aof/signals/SIG-001.json
```

主な option:

- `--session <path>`
- `--signal <path>`

副作用:

- signal による reopen / context update を `Recent Confirmation Window` に要約記録する
- reopen 時は mismatch と next direction を confirmation memory に残す

### `escalation-resolve`

human escalation state を `approve` / `reopen` / `stop` のいずれかに解決する。

```bash
node ./src/cli.js escalation-resolve \
  --session ./examples/aidlc-template/.aof/sessions/SESS-LX9KS8-AB12CD.json \
  --resolution reopen \
  --note "Needs wider review"
```

主な option:

- `--session <path>`
- `--resolution <approve|reopen|stop>`
- `--note "<text>"`

副作用:

- human escalation resolution を `Recent Confirmation Window` に記録する
- reopen / approve / stop に応じた next direction を confirmation memory に残す

## Provider Verification

### `provider-check`

provider config の preflight と optional ping を行う。

```bash
node ./src/cli.js provider-check \
  --provider openai-compatible \
  --model gpt-4.1-mini \
  --base-url https://api.openai.com/v1 \
  --api-key-env OPENAI_API_KEY \
  --ping
```

主な option:

- `--provider <provider>`
- `--model <name>`
- `--base-url <url>`
- `--api-key-env <name>`
- `--ping`
- `--write-artifact <path>`
- `--timeout-ms <ms>`
- `--max-retries <n>`

### `live-verify`

provider-check から planning / optional middle stages / optional reopen branches / optional approval まで one-shot で実行する。

```bash
node ./src/cli.js live-verify \
  --project ./examples/aidlc-template \
  --provider mock \
  --artifact-dir /tmp/aof-live-verification \
  --include-middle-stages \
  --include-approval \
  --include-signal-reopen \
  --include-escalation-reopen \
  --include-escalation-terminal \
  --archive \
  --archive-max-runs 10
```

主な option:

- `--project <path>`
- `--request "<text>"`
- `--response "<text>"`
- `--signal-response "<text>"`
- `--escalation-response "<text>"`
- `--provider <provider>`
- `--model <name>`
- `--base-url <url>`
- `--api-key-env <name>`
- `--ping`
- `--include-middle-stages`
- `--include-approval`
- `--include-signal-reopen`
- `--include-escalation-reopen`
- `--include-escalation-terminal`
- `--signal-path <path>`
- `--timeout-ms <ms>`
- `--max-retries <n>`
- `--artifact-dir <path>`
- `--archive`
- `--archive-dir <path>`
- `--archive-max-runs <n>`

この command は verification artifact をまとめて出す最短経路であり、運用上の入口はこの CLI reference と quickstart を正本として扱う。

## Verification Rollups

### `verify-history`

複数 bundle を比較し、run 間 drift を集計する。

```bash
node ./src/cli.js verify-history \
  --input /tmp/aof-live-verification \
  --input /tmp/aof-live-verification-second/verification-bundle.json \
  --artifact-dir /tmp/aof-verification-history
```

### `verify-log`

verification bundle を append-oriented に蓄積し、latest state と threshold trend を読む。

```bash
node ./src/cli.js verify-log \
  --input /tmp/aof-live-verification \
  --artifact-dir /tmp/aof-verification-log
```

### `verify-lineage`

history / log / index を跨いだ recommendation lineage を集約する。

```bash
node ./src/cli.js verify-lineage \
  --history-input /tmp/aof-verification-history/verification-history.json \
  --log-input /tmp/aof-verification-log/verification-log.json \
  --index-input /tmp/aof-verification-log/verification-index.json \
  --artifact-dir /tmp/aof-verification-lineage
```

### `verify-dashboard`

history / log / index / lineage を束ねた operator dashboard を生成する。

```bash
node ./src/cli.js verify-dashboard \
  --history-input /tmp/aof-verification-history/verification-history.json \
  --log-input /tmp/aof-verification-log/verification-log.json \
  --index-input /tmp/aof-verification-log/verification-index.json \
  --lineage-input /tmp/aof-verification-lineage/verification-lineage.json \
  --artifact-dir /tmp/aof-verification-dashboard
```

### `verify-dashboard-log`

dashboard snapshot を時系列で蓄積する。

```bash
node ./src/cli.js verify-dashboard-log \
  --input /tmp/aof-verification-dashboard \
  --artifact-dir /tmp/aof-verification-dashboard-log
```

### `verify-dashboard-index`

dashboard log から latest operator state を compact に読む。

```bash
node ./src/cli.js verify-dashboard-index \
  --log-input /tmp/aof-verification-dashboard-log/verification-dashboard-log.json \
  --artifact-dir /tmp/aof-verification-dashboard-index
```

## Human Visibility

### `visibility-serve`

`status_card` / `timeline_feed` / `flow_snapshot` を基本入力として、必要に応じて `mission_control` / `operator_progress` / `tree_position` / `evidence_drill_down` も読んで local web viewer を起動する。

```bash
node ./src/cli.js visibility-serve \
  --status-input /tmp/aof-visibility/status-card.json \
  --timeline-input /tmp/aof-visibility/timeline-feed.json \
  --flow-input /tmp/aof-visibility/flow-snapshot.json \
  --mission-input /tmp/aof-visibility/mission-control.json \
  --brief-input /tmp/aof-visibility/operator-brief.json \
  --progress-input /tmp/aof-visibility/operator-progress.json \
  --tree-input /tmp/aof-visibility/tree-position.json \
  --evidence-input /tmp/aof-visibility/evidence-drill-down.json \
  --runtime-execution-input /tmp/aof-visibility/runtime-execution.json \
  --port 4174
```

主な option:

- `--status-input <path>`
- `--timeline-input <path>`
- `--flow-input <path>`
- `--mission-input <path>`: optional. pass `mission-control.json` to enable Mission Control lineage / blocker / next-action view
- `--brief-input <path>`: optional. pass `operator-brief.json` to enable the headline/operator-summary surface
- `--progress-input <path>`: optional. pass `operator-progress.json` to enable `What Changed`
- `--tree-input <path>`: optional. pass `tree-position.json` to enable `Where In The Tree`
- `--evidence-input <path>`: optional. pass `evidence-drill-down.json` to enable bounded proof view
- `--runtime-execution-input <path>`: optional. pass `runtime-execution.json` to show whether the answer is actually runtime-backed
- `--host <host>`: default `127.0.0.1`
- `--port <port>`: default `4174`
- `--title "<text>"`: viewer page title

起動すると JSON で viewer URL を返し、そのまま local web server を維持する。  
`--mission-input` を省略した場合でも viewer は fallback で開くが、truthful な progress / tree / proof surface を使うなら `visibility-export` の出力をそのまま渡す方がよい。  
ただし `v3.8` 以降の main operator path は viewer-first ではなく `operator-brief` であり、`v3.9` では viewer は同じ packet を operator-facing に見せる補助面として扱う。

### `visibility-export`

current `.aof` state から `status_card` / `timeline_feed` / `flow_snapshot` / `mission_control` / `operator_brief` / `operator_progress` / `tree_position` / `evidence_drill_down` を生成し、viewer-ready な visibility packet と operator-facing brief を書き出す。

```bash
node ./src/cli.js visibility-export \
  --project . \
  --artifact-dir /tmp/aof-visibility
```

主な option:

- `--project <path>`
- `--artifact-dir <path>`: default `.aof/artifacts/visibility/current`

### `mission-control`

Mission Control の canonical operator entrypoint。current visibility packet を runtime から更新し、その packet を viewer に渡して起動する。

```bash
node ./src/cli.js mission-control \
  --project . \
  --port 4174 \
  --open-browser
```

主な option:

- `--project <path>`
- `--artifact-dir <path>`: optional. `visibility-export` の出力先 override
- `--host <host>`: default `127.0.0.1`
- `--port <port>`: default `4174`
- `--title "<text>"`: viewer title
- `--open-browser`: browser を自動で開く

この command は `visibility-export` と viewer session 起動を 1 step にまとめる。Mission Control を見たい operator / AI は、manual wiring が必要な場合を除き、この command を使う。

### `visibility-session`

current visibility packet を export し、viewer session を起動し、必要なら browser まで開く。

```bash
node ./src/cli.js visibility-session \
  --project . \
  --port 4174 \
  --open-browser
```

主な option:

- `--project <path>`
- `--artifact-dir <path>`: optional. `visibility-export` の出力先 override
- `--host <host>`: default `127.0.0.1`
- `--port <port>`: default `4174`
- `--title "<text>"`: viewer title
- `--open-browser`: browser を自動で開く

`v3.9` の operator path では、この command が runtime から viewer までの canonical entry point になる。

### `operator-brief`

current runtime situation を 1 つの operator-facing packet に圧縮して返す。  
この command は `what is happening now / why / what is blocked / what should happen next` を、canonical runtime artifacts から導出して返す。

```bash
node ./src/cli.js operator-brief \
  --project . \
  --write-artifact /tmp/aof-operator-brief.json
```

主な option:

- `--project <path>`
- `--write-artifact <path>`: optional. default は `.aof/artifacts/visibility/current/operator-brief.json`

### `operator-progress`

latest checkpoint から何が変わったかを bounded に読む。

```bash
node ./src/cli.js operator-progress \
  --project . \
  --write-artifact /tmp/aof-operator-progress.json
```

主な option:

- `--project <path>`
- `--write-artifact <path>`: optional. default は `.aof/artifacts/visibility/current/operator-progress.json`

### `tree-position`

current release trunk と current frontier branch を bounded に読む。

```bash
node ./src/cli.js tree-position \
  --project . \
  --write-artifact /tmp/aof-tree-position.json
```

主な option:

- `--project <path>`
- `--write-artifact <path>`: optional. default は `.aof/artifacts/visibility/current/tree-position.json`

### `evidence-drill-down`

operator brief の headline / blockers / next action を支える proof path を bounded に読む。

```bash
node ./src/cli.js evidence-drill-down \
  --project . \
  --write-artifact /tmp/aof-evidence-drill-down.json
```

主な option:

- `--project <path>`
- `--write-artifact <path>`: optional. default は `.aof/artifacts/visibility/current/evidence-drill-down.json`

### `mission-control-benchmark`

temp project 上で discovery handoff → Need Validation → implementation task open の chain を再生成し、`mission_control` が `visibility-baseline` から `implementation-ready` まで truthfully 遷移するかを検証する。

```bash
node ./src/cli.js mission-control-benchmark \
  --project . \
  --write-artifact /tmp/aof-mission-control-benchmark.json
```

主な option:

- `--project <path>`
- `--write-artifact <path>`: optional. benchmark summary を保存する

### `adoption-proof-benchmark`

fresh managed-project を temp に作成し、初回の governed work item まで到達できるかを検証する。v6.2 の Worked Adoption Proof 用の narrow benchmark であり、正しい JSON だけでなく、人間が初回作業を理解できる recognition summary も確認する。

```bash
node ./src/cli.js adoption-proof-benchmark \
  --project . \
  --write-artifact /tmp/aof-adoption-proof-benchmark.json
```

主な option:

- `--project <path>`
- `--work-dir <path>`: optional. fresh project を作る親ディレクトリ
- `--keep-temp`: optional. temp project を削除せず確認用に残す
- `--write-artifact <path>`: optional. benchmark summary を保存する

### AI Command Help Surface

v6.3 以降、CLI help は full reference ではなく AI-oriented command discovery surface として使う。

```bash
node ./src/cli.js --help
node ./src/cli.js --help --json
node ./src/cli.js organization-verify --help
node ./src/cli.js organization-verify --help --json
```

`--help --json` は command registry 由来の compact JSON を返す。AI orchestrator はまずここを読み、必要な時だけこの full CLI reference を読む。

### `cli-help-benchmark`

supported command が AI-readable help を持つか検証する。検証対象は command category, purpose, failure meaning, QIF mapping boundary, acceptance gate, verdict boundary である。

```bash
node ./src/cli.js cli-help-benchmark \
  --project . \
  --write-artifact /tmp/aof-cli-help-benchmark.json
```

主な option:

- `--project <path>`
- `--write-artifact <path>`: optional. benchmark summary を保存する

## Project-Local Archive

### `verify-archive`

verification run を `.aof/artifacts/verification/` に durable import し、derived artifact をまとめて更新する。

```bash
node ./src/cli.js verify-archive \
  --project ./examples/aidlc-template \
  --input /tmp/aof-live-verification \
  --input /tmp/aof-live-verification-second \
  --max-runs 10
```

主な option:

- `--project <path>`
- `--input <path>`: 複数指定可
- `--archive-dir <path>`
- `--max-runs <n>`

### `verify-archive-log`

archive index snapshot を時系列で蓄積する。

```bash
node ./src/cli.js verify-archive-log \
  --input ./examples/aidlc-template/.aof/artifacts/verification/verification-archive-index.json \
  --artifact-dir /tmp/aof-verification-archive-log
```

### `verify-archive-dashboard`

archive current-state と archive trend を 1 つの operator-facing rollup に束ねる。

```bash
node ./src/cli.js verify-archive-dashboard \
  --index-input ./examples/aidlc-template/.aof/artifacts/verification/verification-archive-index.json \
  --log-input ./examples/aidlc-template/.aof/artifacts/verification/archive-log/verification-archive-log.json \
  --artifact-dir /tmp/aof-verification-archive-dashboard
```
