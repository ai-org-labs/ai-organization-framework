# AI Organization Framework

AI Organization Framework は、人間と AI の混成チームが、曖昧な要求から再現可能に判断し、成果物を作り、その結果を次の判断へ還流させるための組織設計規格である。

これは「AI エージェントをどう動かすか」の規格ではない。  
「要求をどう解釈し、誰が何を根拠に決め、何を成果物とみなし、何を結果として追うか」を扱う規格である。

## Status

この repo は、AOF の spec と local runtime prototype をまとめた repo である。  
現在の stable release は `v9.1.0` である。
この release で、self-hosting runtime は次の状態に到達した。

- Product Value Comprehension Gate を release-state governance gate として扱えること
- `product-value-evidence-record` によって、release の価値を record/audit/schema ではなく、利用者が今日からできる capability、before/after、5分デモ、削減される作業、理解結果、governance action に接続できること
- `product-value-evidence-audit` によって、利用者価値説明の欠落、capability matrix 欠落、理解不能なのに改善へ escalte しない状態、release/work/Mission Control/evidence refs の欠落を検査できること
- Mission Control が product value evidence readiness を canonical runtime artifacts から投影できること
- v9.1 は利用者価値理解の governance evidence であり、market adoption、broad user satisfaction、semantic correctness、production provider safety の証明ではないと明示できること
- External Runtime Operator Acceptance and Safety Drill を release-state governance gate として扱えること
- `operator-acceptance-drill-record` によって approval / reproduction / rollback / outcome / learning / Mission Control を operator decision に束ね、accept / stop / rollback / escalate / defer を明示できること
- `operator-acceptance-drill-audit` によって operator drill の参照解決、decision boundary、safety boundary、not-proven boundary、blocked chain を検査できること
- Mission Control が operator acceptance drill readiness を canonical runtime artifacts から投影できること
- v9.0 は operator decision drill evidence であり、production provider execution、provider semantic correctness、market truth、credential/billing safety、actual rollback execution の証明ではないと明示できること
- External Runtime Outcome Evidence and Learning Loop を release-state governance gate として扱えること
- `provider-outcome-evidence-record` によって approved / reproduced / rollback-ready な provider path を expected outcome、observed result、outcome status、verification refs、semantic truth boundary、not-proven boundary に接続できること
- `provider-outcome-evidence-audit` によって approval / reproduction / rollback / target / session / evidence / verification / outcome / semantic boundary 欠落を検査できること
- `provider-learning-loop-record` によって outcome evidence から accept / correct / rollback / escalate / defer の learning decision と next action を記録できること
- `provider-learning-loop-audit` によって learning update が usable outcome evidence に接続され、blocked state や not-proven boundary を隠していないことを検査できること
- Mission Control が provider outcome evidence と provider learning-loop readiness を canonical runtime artifacts から投影できること
- v8.9 は bounded outcome traceability と learning-loop update evidence であり、production provider execution、provider semantic correctness、market truth、credential/billing safety、real rollback execution の証明ではないと明示できること
- Provider Execution Approval Bridge の過大claimを訂正し、external write authorization が adapter capability / independent human approval / concrete target operation / credential scope / budget / rollback / stop condition と整合しなければ green にならないこと
- `provider-operation-target-record` によって provider / resource / operation / endpoint / payload hash / maximum calls / expiry を concrete target として記録できること
- `human-approval-record` によって Council review ではなく human approval evidence を独立した artifact として記録できること
- `provider-execution-approval-audit` によって read-only adapter に対する external-write overclaim、human approval 欠落、target operation 欠落、payload scope mismatch、credential/budget/rollback boundary 欠落を検査できること
- v8.7 は approval authenticity / adapter capability alignment の preflight governance proof であり、live provider execution、provider output correctness、rollback execution success、production safety の証明ではないと明示できること
- Provider Execution Approval Bridge を release-state governance gate として扱えること
- `provider-execution-approval-record` によって provider side-effect preflight approval を pilot / adapter / human approval / scope / redaction / rollback / credential / budget / provenance / verification / stop condition / not-proven boundary 付きで記録できること
- `provider-execution-approval-audit` によって missing approval、missing human approval evidence、unbounded external write、dangerous operation denial欠落、production execution overclaimを検査できること
- Mission Control が provider execution approval bridge readiness を canonical runtime artifacts から投影できること
- provider execution approval bridge は preflight governance evidence であり、production external execution safety、credential safety、billing safety、provider output correctness、自律外部実行許可の証明ではないと明示できること
- Provider Adapter Execution Pilot Boundary を release-state governance gate として扱えること
- `provider-adapter-pilot-record` によって provider adapter pilot を dry-run / default-deny / approval boundary / redaction / rollback / provenance / stop condition / not-proven boundary 付きで記録できること
- `provider-adapter-pilot-audit` によって missing pilot、write-mode approval欠落、production/billing/secret/deploy/irreversible actionのdefault-deny欠落、unresolved refsを検査できること
- Mission Control が provider adapter pilot readiness を canonical runtime artifacts から投影できること
- provider adapter pilot は governance/preflight evidence であり、production external execution safety、credential safety、billing safety、provider output correctness、自律外部実行許可の証明ではないと明示できること
- Externalized Organization Runtime の最初の bounded slice を release-state governance gate として扱えること
- `external-runtime-resource-record` によって external actor/tool/provider/reference を source-of-truth、permission、freshness、availability、approval、side-effect、provenance、not-proven boundary 付きのruntime resourceとして記録できること
- `external-resource-use-record` によって external resource use を task、session、operation、approval status、outputs、risk、decision、not-proven boundary に紐づけられること
- `external-resource-audit` によって missing boundary、unresolved ref、unapproved write-class operation、provenance欠落を検査できること
- `release-state-audit` が `8.6.0` 以降の release で `provider-execution-approval-audit` を release gate として実行できること
- `release-state-audit` が `8.5.0` 以降の release で `provider-adapter-pilot-audit` を release gate として実行できること
- `release-state-audit` が `8.2.0` 以降の release で `operator-validation-audit` を release gate として実行できること
- v8.2 operator validation は structural/runtime feedback evidence であり、market truth、semantic truth、operator value、production safety の証明ではないと明示できること
- Externalization Readiness Boundary を release-state governance gate として扱えること
- `externalization-readiness-audit` によって external actor/tool/provider/reference claim の source-of-truth、permission、freshness、availability、approval、runtime provenance、not-proven boundary を検査できること
- `release-state-audit` が `7.9.0` 以降の release で `externalization-readiness-audit` を release gate として実行できること
- externalization readiness は v8 に進むための structural/runtime boundary evidence であり、外部 provider 実行、semantic truth、operator acceptance の証明ではないと明示できること
- Mission Control Coverage Forecast Projection を release-state governance gate として扱えること
- Mission Control が requirement coverage、forecast boundary、adoption proof status、evidence completeness を canonical runtime artifacts から投影できること
- `mission-control-projection-audit` によって missing projection sources、missing forecast boundary、unresolved refs、read-only boundary 欠落を検査できること
- `release-state-audit` が `7.8.0` 以降の release で `mission-control-projection-audit` を release gate として実行できること
- Mission Control projection は visibility evidence であり、semantic truth、forecast certainty、operator acceptance の証明ではないと明示できること
- Adoption-Grade v7 Runtime を release-state governance gate として扱えること
- `adoption-proof-benchmark` によって fresh managed-project が work readiness、context integrity、work execution packet、requirement coverage、provider-neutral session export、release-ready boundary を生成できるか検証できること
- AP-007 through AP-011 によって、新規利用者の初回 governed work が docs/examples の存在ではなく runtime evidence chain で説明できること
- `release-state-audit` が `7.7.0` 以降の release で `adoption-proof-benchmark` を release gate として実行できること
- adoption proof は structural/runtime evidence であり、外部市場採用、operator acceptance、semantic success の証明ではないと明示できること
- Provider-Neutral Session Export を release-state governance gate として扱えること
- `session-export-record` によって prompt / response / tool call / artifact write / verification / blocker / stop condition の summary を task / requirement / test evidence / risk candidate / decision candidate / release-ready evidence / redaction boundary / not-proven boundary に束ねられること
- `session-export-audit` によって missing export、必須 event type 欠落、provider/source boundary 欠落、redaction boundary 欠落、release-ready boundary 欠落、unresolved refs、not-proven 欠落を検査できること
- provider-native session stream は input evidence であり、canonical source of truth は AOF の normalized export package であると明示できること
- session export は portability/process evidence であり、semantic correctness、privacy completeness、external provider integration、operator acceptance の証明ではないと明示できること
- Requirements Coverage, Forecasting, And Organization Analytics を release-state governance gate として扱えること
- `requirement-coverage-record` によって functional / non-functional / QIF quality-intent / release-gate requirements を work item、source ref、evidence ref、coverage count、forecast boundary、not-proven boundary に束ねられること
- `requirement-coverage-audit` によって missing coverage、task linkage 欠落、requirement evidence 欠落、unresolved refs、coverage count 不整合、forecast boundary 欠落、not-proven 欠落を検査できること
- requirement coverage と forecast は planning/governance evidence であり、semantic satisfaction、forecast accuracy、delivery certainty、market truth の証明ではないと明示できること
- Governed Parallel Lanes を release-state governance gate として扱えること
- `parallel-lane-record` によって bounded lanes / lane-local input-output-verification evidence / join-conflict semantics / Council decision / Work Execution Packet / upstream Multi-Actor Pilot evidence を 1 つの pilot 証跡に束ねられること
- `parallel-lane-audit` によって missing pilot、lane 数不足、lane-local evidence 欠落、join packet 欠落、Council decision 欠落、Work Execution Packet 欠落、upstream Multi-Actor Pilot 欠落、not-proven 欠落を検査できること
- parallel lane pilot は governance evidence であり、自律 scheduling、speed improvement、semantic correctness の証明ではないと明示できること
- Governed Multi-Actor Pilot を release-state governance gate として扱えること
- `multi-actor-pilot-record` によって Council core roles / actor roster / actor output handoff / Council judgment / Work Execution Packet closure を 1 つの pilot 証跡に束ねられること
- `multi-actor-pilot-audit` によって missing pilot、Visionary / Builder / Guardian 欠落、actor handoff 欠落、Council judgment 欠落、Work Execution Packet 欠落、not-proven 欠落を検査できること
- multi-actor pilot は governance evidence であり、自律 workforce performance や actor judgment の semantic correctness の証明ではないと明示できること
- Work Execution Packet を release-state governance gate として扱えること
- `work-execution-packet-record` によって task / context integrity / actor handoff / execution lineage / verification evidence / stop-continue decision を 1 つの実行証跡に束ねられること
- `work-execution-packet-audit` によって missing packet、unresolved refs、handoff 欠落、verification 欠落、stop/continue decision 欠落、not-proven 欠落を検査できること
- execution packet は process integrity evidence であり、semantic truth / operator acceptance / external adoption の証明ではないと明示できること
- context/reference integrity を release-state governance gate として扱えること
- `context-integrity-record` によって work item が読んだ/要求した/欠落した/証明できない context を記録できること
- `external-reference-integrity-record` によって外部参照の freshness / availability / source-of-truth / not-proven boundary を記録できること
- `context-reference-integrity-audit` によって missing context、unresolved refs、stale/unavailable external refs、blocked context、not-proven 欠落を検査できること
- Mission Control が context/reference integrity projection を canonical artifacts から投影できること
- agent session events を canonical runtime evidence として記録できること
- `agent-session-record` によって prompt / response / tool call / artifact write / decision / verification / blocker / stop condition を local file-backed stream として残せること
- `session-observability-audit` によって implementation-grade work の session stream refs、Council evidence、artifact producer events、tool-call safety metadata を検査できること
- Mission Control が最新 session stream、organization state、audit state、blocker、next action を canonical artifacts から投影できること
- `mission-control` command によって visibility refresh と viewer 起動を 1 つの operator entrypoint から実行できること
- session reconstructability は process evidence であり、semantic truth / market truth / product quality の証明ではないと明示できること
- quality-relevant evidence changes を canonical quality ledger event として記録できること
- `quality-ledger-audit` によって QIF refs、evidence refs、governance escalation、semantic truth claim boundary を検査できること
- `release-state-audit` が `6.8.0` 以降の release で `quality-ledger-audit` を release gate として実行できること
- `release-state-audit` が `6.9.0` 以降の release で `work-readiness-audit` を release gate として実行できること
- ledger entry は traceability evidence であり、semantic truth や market truth の証明ではないと明示できること
- AOF/QIFを実装後の証跡化だけでなく、実装前に止めるpre-implementation quality gateとして扱えること
- solution-shaped taskに対して、problem-before-solution、product assumption review、negative acceptance、corrected assumption loopを要求できること
- user-visible claimにはuser-visible E2E evidenceを要求し、コード読みや対称性推論を低独立性evidenceとして扱えること
- Guardian done-before固定質問によって、隣接経路、同じ前提に依存する面、公開/不可逆リスクを確認する方向性を定義できること
- visual/browser-facing workでは、スクリーンショットやDOM存在だけでなく、grounding / visibility / density / occlusion / responsibility splitを確認するrubricを定義できること
- QIFを一回限りの事後レポートではなく、bug / correction / contradicted assumptionで更新されるliving ledgerとして扱えること
- AI orchestrator が巨大な CLI reference を読まずに `aof --help --json` / `aof <command> --help --json` から command purpose, category, inputs, outputs, failure meaning, QIF boundary を取得できること
- `cli-help-benchmark` によって supported command help coverage を検証できること
- QIF `v0.3.1` provider profile を採用し、QIF Discovery Layer / QIF Core / AOF Integration の層を記録できること
- QIF v0.3.1 guidance はまだ executable verifier replacement ではないと明示できること
- 新規 managed project に AOF を導入し、最初の governed work item まで到達できること
- 最初の governed work item を machine-verifiable な artifact chain と human-readable な recognition summary の両方で説明できること
- Work Governance を、software task だけではなく Human + AI + Tool の cross-domain work item を扱う core concept として表現できること
- work item goal / actor composition / Council-ready output / Go-No-Go visualization / Operational Map change log / Context Pack / External Reference を schema と fixture で検証できること
- Work Governance artifact を narrow CLI writers で作成できること
- `work-governance-benchmark` によって committed software / manufacturing fixture chain を検証できること
- Mission Control が Work Governance chain を canonical artifact から投影でき、独立した source of truth にならないこと
- adoption-facing example によって、software release work と manufacturing quality work の両方を追えること
- historyless public baseline として、個人アカウント由来の repo URL / author identity / historical CI URL を含まない
- public adoption 前に command readiness, examples, viewer status, roadmap, release checklist を明示できること
- runtime command は registry / routing audit / organization verification / decision verification / QIF validation / npm test / smoke によって検証できること
- examples は starter template として何が seed され、何が runtime 実行後に生成されるかを説明できること
- viewer は runtime-backed AOF Mission Control Dashboard として mission / kanban / summary / blocker / workload / evidence を表示できること
- full Human Recognition UX は未完成であり、Mission Control Dashboard は canonical runtime artifacts の read-only projection であることを明示できること
- actor skill packet によって generic role prompt ではなく skillful assignment を開始できること
- capability-fit / resource claim / policy evaluation を actor execution 前に確認できること
- weak assignment / missing skill evidence / policy bypass を benchmark で failure にできること
- Skillful Actor state を Mission Control / Human Recognition surface へ canonical artifact から投影できること
- Execution Hygiene によって、巨大 persistent context、1指示詰め込み、途中 compact、tool sprawl、permission fatigue を抑える運用契約を定義できること
- command registry / help が `safety_level` と `approval_policy` を提示し、safe local runtime work と project/external/dangerous work を区別できること
- `situation-assess` が "After v6.4.0, advance v6.5..." のような表現で shipped release と target frontier を取り違えないこと
- implementation-grade work item が Archmap impact を `archmap_update_required` / `archmap_unaffected` / `archmap_deferred_with_reason` として扱えること
- Archmap source と AOF artifact を source of truth とし、Mission Control は architecture map state の read-only projection に留まること
- Archmap external provider baseline を `v0.1.1` として扱い、optional archmap-icons `v0.1.2` は recognition aid としてのみ利用できること
- Node.js 22 と Node.js 24 を CI-validated runtime lane として扱えること

である。

## Read First

- AI authoring guide: [docs/AI_AUTHORING_GUIDE.md](docs/AI_AUTHORING_GUIDE.md)
- core model: [docs/aof-core-model.md](docs/aof-core-model.md)
- operations model: [docs/aof-operations-model.md](docs/aof-operations-model.md)
- organization model: [docs/aof-organization-model.md](docs/aof-organization-model.md)
- need validation model: [docs/aof-need-validation-model.md](docs/aof-need-validation-model.md)
- project bootstrap model: [docs/aof-project-bootstrap-model.md](docs/aof-project-bootstrap-model.md)
- skill model: [docs/aof-skill-model.md](docs/aof-skill-model.md)
- capability model: [docs/aof-capability-model.md](docs/aof-capability-model.md)
- resource model: [docs/aof-resource-model.md](docs/aof-resource-model.md)
- policy model: [docs/aof-policy-model.md](docs/aof-policy-model.md)
- quickstart: [docs/quickstart.md](docs/quickstart.md)
- CLI reference: [docs/cli-reference.md](docs/cli-reference.md)
- QIF quality definition: [docs/aof-qif-quality-definition.md](docs/aof-qif-quality-definition.md)
- Human Recognition Interface spec: [docs/v4.0-human-recognition-interface-spec.md](docs/v4.0-human-recognition-interface-spec.md)
- public runtime readiness: [docs/v6.0-public-runtime-readiness.md](docs/v6.0-public-runtime-readiness.md)
- Work Governance integration plan: [docs/v6.1-work-governance-integration-plan.md](docs/v6.1-work-governance-integration-plan.md)
- Work Governance examples: [docs/v6.1-work-governance-examples.md](docs/v6.1-work-governance-examples.md)
- current release definition: [docs/v9.1-release-definition.md](docs/v9.1-release-definition.md)
- current release checklist: [docs/v9.1-release-checklist.md](docs/v9.1-release-checklist.md)
- current release notes: [docs/v9.1.0-release-notes.md](docs/v9.1.0-release-notes.md)
- actor skill packet contract: [docs/v5-actor-skill-packet-contract.md](docs/v5-actor-skill-packet-contract.md)
- current roadmap: [docs/vnext-roadmap.md](docs/vnext-roadmap.md)
- v6.7 → v8.0 completion roadmap: [docs/v6.7-v8.0-completion-roadmap.md](docs/v6.7-v8.0-completion-roadmap.md)

## この規格が解決したい問題

AI 活用はしばしば、単発の生成や単純な役割分担で終わる。  
しかし実際の仕事は、次の問題を抱えている。

- request が曖昧なまま実行に流れる
- 「何を本当に解くのか」と「どういう方向で解くのか」が混ざる
- 成果物ができても、それが成功なのかは分からない
- 誰が何を根拠に決めたかが残らない
- 結果や外部変化が次の判断に反映されにくい

AOF はこれを、個別のプロンプト改善ではなく、意思決定組織の設計問題として扱う。

## この規格の立場

AOF は次の立場をとる。

- request はそのまま実行してはいけない
- request に usable な `Need` がない場合は、先に `Discovery` で provisional `Need` を発見する
- raw `Need` はそのまま `Project` にしてはいけず、先に `Need Validation` を通す
- request は `Need / Intent / Context` に分解して初めて判断可能になる
- 最終完成像と、今見せる value slice は両方保持する
- 実行前に governance が必要である
- `Artifact` と `Outcome` は分けて追跡する必要がある
- `Outcome` と `External Signal` は次の `Context` を更新し、必要なら `Need` や `Intent` の再解釈を引き起こす
- loop は `goal + execution + verification + stop condition` を持つ必要があり、verify なしの反復は loop ではない

したがって AOF は、生成フレームワークではなく、判断と運用のフレームワークである。

## 何を標準化するのか

AOF が標準化するのは、ドメインをまたいで再利用したい抽象構造である。

### 1. Request を判断可能な形へ変える最小分解

- request に `Need` が不足している場合は、その前段に `Discovery` を置いてよい
- `Need Validation`
- `Need`
- `Intent`
- `Context`

`Need Validation` とこの 3 つがそろって初めて、組織は request を project 候補として判断可能な単位にできる。  
したがって AOF は、`Need` が既知の task だけでなく、`Need` をまだ発見していない task にも適用できる。

### 2. 判断主体の最小構造

- `Organization`
- `Actor`
- `Policy`

誰が判断し、何を優先し、どの組織責任のもとで動くかを記述可能にする。

### 2.5. Goal と確認の運用単位

- `North Star Goal`
- `Current Operating Goal`
- `Next Value Slice`

AOF は、完成品の goal と、次に見せる動く価値を切り離さずに両方扱う。  
また、同じ core question を短く繰り返し確認する `Value Alignment Loop` を持ち、長い作業でも方向を保つ。

### 3. 実行と結果の最小追跡構造

- `Decision`
- `Action`
- `Artifact`
- `Outcome`

これにより、

- 何を決めたか
- 何をしたか
- 何を作ったか
- 何が起きたか

を分けて追える。

### 4. Governance の必要性

AOF は governance の存在を必須とする。  
ただし `Council of Three` 自体を唯一の mandatory 形にはしない。

必須なのは次である。

- value / intent を代表する観点
- feasibility / execution を代表する観点
- risk / quality / safety を代表する観点
- decision rule
- veto / exception rule
- escalation path

### 5. Completion と Success の分離

AOF は、完成と成功を分ける。

- `Completion Criteria`: Artifact が done とみなせる条件
- `Success Criteria`: Outcome が successful とみなせる条件

この分離はソフトウェアでも建築でもゲームでも必要である。

## 何を標準化しないのか

AOF は上位の組織規格であり、下位の実装や各ドメインの表現までは固定しない。

### 1. 工程名そのもの

AOF は `Need / Intent / Context` 以降の抽象構造を標準化するが、

- AIDLC
- 住宅設計
- ゲーム制作

で使う工程名そのものは固定しない。

例:

- Requirements
- Concept Design
- Dungeon Loop Tuning

のような名称は各ドメインでよい。

### 2. 成果物フォーマットそのもの

AOF は `Artifact` を概念として標準化するが、

- コード差分
- 図面
- ダンジョン定義
- レベルテーブル

の具体フォーマットは標準化しない。

### 3. Outcome 指標そのもの

AOF は `Outcome` を追うことを要求するが、

- 売上
- 安全性
- 学習定着
- 継続率
- 滞在時間

のどれを success とみなすかはドメイン依存である。

### 4. Actor 名の無制限拡張

AOF は Actor を使うが、Actor の語彙を無制限に増やすこと自体は標準化の本体ではない。  
Actor 名は domain shorthand として増やせるが、増やさなくても core 概念が成立することのほうが重要である。

### 5. Policy DSL の完全仕様

Policy は必須概念だが、Policy DSL の完全仕様は現時点で確定しない。  
優先順位軸の共通化は重要だが、表現形式は将来の規格化論点として扱う。

## 最小モデル

AOF の最小モデルは次である。

### Request Framing

- `Need`
- `Intent`
- `Context`

### Organization Structure

- `Organization`
- `Actor`
- `Policy`

### Execution Trace

- `Decision`
- `Action`
- `Artifact`
- `Outcome`

この最小モデルでまず問うべきことは、

- request を解釈できるか
- 誰が決めるかを記述できるか
- 実行と結果を追えるか

である。

## Actor の初期固定

最初の概念固定では、Actor は次の 5 つから増やさない。

- `Visionary`
- `Builder`
- `Guardian`
- `Facilitator`
- `Reviewer`

この制約の狙いは、ドメインごとに役割語彙を増やす前に、最小 Actor 集合で複数ドメインが表現できるかを検証することにある。

## Domain Neutrality

AOF の重要な仮説は、仕事の本質はドメイン固有の工程名よりも、次の構造にあるという点である。

`Need -> Intent -> Context -> Decision -> Action -> Artifact -> Outcome`

ドメインが変わると変わるのは、

- 何を Artifact とみなすか
- 何を Outcome とみなすか
- どこに approval point を置くか
- 誰がどの観点を担うか

であって、core 構造そのものではない。

## Runtime との関係

この README は runtime の手引きではなく、規格の思想文書である。  
runtime, CLI, template, verification の詳細は個別ドキュメントに分離する。

ただし runtime は、概念検証と運用検証の補助として重要である。  
現在の prototype では次を確認できる。

- `Need / Intent / Context` を session として保持できる
- `Decision / Action / Artifact / Outcome` を分けて trace できる
- clarification, reopen, outcome writeback を machine-readable に記録できる
- `framing-only` と `runtime-on` の使い分けを docs で運用できる

runtime の価値は単発 task だけに限られない。  
AOF は、初動を速くする intake/assembly model と、長く続く work を reopen / signal / outcome で運用する loop の両方を持つことを目指す。

ただし AOF loop は無制限反復ではない。
loop には必ず goal、Maker/Checker separation、verification、stop / budget gate が必要である。

また、AOF は未証明の flow をいきなり自動化しない。
標準順序は `manual run -> skill / packet 化 -> loop 化 -> cadence / automation 化` である。

uncertainty が高い案件、探索案件、体験案件では、recent confirmation window と mismatch state を持ち回るために runtime の価値が高い。  
そのため、こうした案件では `runtime mandatory` が標準寄りになる。

## この README の使い方

読む順序の推奨:

1. この README で「何を標準化する規格か」をつかむ
2. [docs/aof-core-model.md](docs/aof-core-model.md) で core 構造を確認する
3. [docs/aof-operations-model.md](docs/aof-operations-model.md) で topology / runtime / orchestration の境界を確認する
4. [docs/aof-project-bootstrap-model.md](docs/aof-project-bootstrap-model.md) と [docs/quickstart.md](docs/quickstart.md) で導入手順を見る
5. 必要なら [docs/cli-reference.md](docs/cli-reference.md) で command surface を確認する

## 現在の規範強度

現時点の AOF は、完成した universal standard ではなく、概念を固めるための設計仕様である。  
したがって現段階では、次を優先する。

- core 概念の固定
- ドメイン横断の表現可能性の検証
- governance 最小保証の確認
- runtime は概念検証の補助として扱う

## 現時点の結論

AOF が標準化したいのは、AI や人間が混在する仕事を「再現可能な意思決定組織」として扱うための最小構造である。  
標準化したいのは、工程名でも実装手段でもなく、要求の分解、判断主体、判断記録、成果物と結果の分離である。

逆に、各ドメイン固有の工程名、成果物形式、KPI、Policy DSL の完全形までは、まだ標準化しない。  
そこを急いで固定するより先に、最小モデルが複数ドメインに耐えるかを検証する。
