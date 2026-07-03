# AI Organization Framework

AI Organization Framework は、人間と AI の混成チームが、曖昧な要求から再現可能に判断し、成果物を作り、その結果を次の判断へ還流させるための組織設計規格である。

これは「AI エージェントをどう動かすか」の規格ではない。  
「要求をどう解釈し、誰が何を根拠に決め、何を成果物とみなし、何を結果として追うか」を扱う規格である。

## Status

この repo は、AOF の spec と local runtime prototype をまとめた repo である。  
現在の stable release は `v6.6.0` である。
この release で、self-hosting runtime は次の状態に到達した。

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
- current release definition: [docs/v6.6-release-definition.md](docs/v6.6-release-definition.md)
- current release checklist: [docs/v6.6-release-checklist.md](docs/v6.6-release-checklist.md)
- current release notes: [docs/v6.6.0-release-notes.md](docs/v6.6.0-release-notes.md)
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
