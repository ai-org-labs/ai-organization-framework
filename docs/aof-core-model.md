# AOF Core Model

AI Organization Framework は、人間と AI の混成組織が、曖昧な要求を判断可能な形に変え、組織を編成し、成果物と結果を追跡し、その結果を次の判断へ還流させるための operating model である。

AOF は Agent Framework ではなく、AI Organization Operating System である。

AOF Core の中核概念は `Work Governance` である。AOF はソフトウェア開発専用の task runner ではなく、人間・AI・Tool が混在する仕事を、目的、優先度、割り込み、承認、証拠、品質、外部参照、可視化によって統治する Work Governance OS である。

## Core Position

AOF は次の立場を取る。

- request はそのまま実行しない
- 先に `Need / Intent / Context` を分ける
- raw need を project に直結させず、先に Need Validation を通す
- `Artifact` と `Outcome` を分けて追う
- 完成像と次の value slice を同時に持つ
- governance を必須とする
- agent ではなく organization を中心に置く
- `task` より広い `work item` を扱う
- work item ごとに goal / skill / actor / evidence / Go-No-Go / downstream handoff を明示する
- canonical artifact を人間が理解できる自然言語へ変換する
- role と agent を分離する
- 運用 state は `.aof/` に残す

## Minimal Loop

最小ループは次である。

1. request を受ける
2. raw need を `Need / Intent / Context` と前提に分ける
3. Need Validation で need を validate / reframe / reject / defer / experiment-required のいずれかに判定する
4. validated need がある場合だけ project charter を作る
5. council approval の後に project creation と organization / council / team / role 編成へ進む
6. `Decision / Action / Artifact / Outcome` を記録する
7. 結果を次の判断に還流する

## Pre-Project Gate

project creation 前の必須フローは次である。

```text
Need
  -> Need Validation
  -> Validated Need
  -> Project Charter
  -> Council Approval
  -> Project Creation
  -> Organization Formation
  -> Execution
```

validated need が存在しない project は non-compliant である。

## Core Objects

### Work Governance

Work Governance は、Human + AI + Tool work を統治する runtime layer である。

最低限、次を扱う。

- work intake
- work triage
- priority management
- interrupt handling
- frontier protection
- human approval queue
- actor / role / tool assignment
- operational map maintenance
- council-ready output
- context compression
- external reference management

PMO は AOF Core の中心概念ではなく、project-oriented teams 向けの view または alias として扱う。

### Work Item

`work item` は `task` より広い上位概念である。

例:

- software: issue / task / PR / release work
- sales: opportunity / proposal preparation / customer research
- manufacturing: improvement theme / defect investigation / process change
- legal: contract review / risk classification / approval judgment
- education: material creation / review / outcome validation
- retail: store initiative / promotion / customer satisfaction improvement

Each governed work item should define:

- objective
- reason for work
- expected output
- consumer
- downstream dependency
- success criteria
- Go / No-Go criteria
- required visualization
- human-readable recognition summary
- required skills
- required actor roles
- council review need

### Human-Readable Recognition Output

AOF の runtime output は、machine-readable artifact だけでは完了しない。

各重要 checkpoint は、初見の人間が読んで理解できる自然言語の recognition output を持つべきである。

最低限、次を説明する。

- いま何の仕事をしているのか
- なぜその仕事が重要なのか
- 誰が実行し、誰が検証し、誰が判断するのか
- どの evidence に基づいているのか
- 何が blocked なのか
- 次に何をするべきなのか

この自然言語出力は、after-the-fact documentation ではない。canonical artifact から導出される runtime responsibility である。

正しい JSON が存在しても、人間が状況を認識できない場合、AOF の Work Governance は incomplete とみなす。

### Request Framing

- `Need`
- `Intent`
- `Context`
- `Validated Need`
- `Project Charter`

### Goal Layer

- `North Star Goal`
- `Current Operating Goal`
- `Next Value Slice`

### Execution Trace

- `Decision`
- `Action`
- `Artifact`
- `Outcome`

### Governance

最低限、次の観点が必要である。

- value / intent
- feasibility / execution
- risk / quality / safety

既定の shorthand としては `Visionary / Builder / Guardian` を使う。

### Organization Layer

- `Mission`
- `Project`
- `Organization`
- `Council`
- `Team`
- `Role`
- `Assignment`
- `Agent / Human / Tool`
- `Work Item`
- `Work Item Goal`
- `Actor Composition`
- `Council-ready Output`
- `Go / No-Go Visualization`
- `Operational Map`
- `Context Pack`
- `External Reference`
- `Contract`
- `Dependency`
- `Knowledge`
- `Metrics`
- `Lifecycle`

Agent は末端実行者または resource であり、AOF の中心概念ではない。

## Work Item Governance Contract

AOF が大きな依頼を複数の work item に分解するとき、各 work item は次を明確にしなければならない。

- 何を達成するのか
- なぜその work item が必要なのか
- 後続 work item に何を渡すのか
- Go / No-Go を何で判断するのか
- 判断に必要な可視化は何か
- どの専門 role / actor が必要か
- Builder は何を作るべきか
- Guardian は何を検証すべきか
- Council は何を見て判断できるのか
- Mission Control で一目で状態を理解できるか

Builder は作業だけでなく、仕事がどう流れるかの Operational Map impact も確認する。Guardian は goal 達成、actor selection、evidence、visualization、Operational Map が現実と一致しているかを検証する。Council は Council-ready output を使って Go / No-Go を判断する。

## Operational Map

Operational Map は、仕事がどのように流れ、誰が関与し、どこで判断され、どの証拠に基づき、どの外部システムと接続されるかを表す構造図である。

Operational Map includes:

- work-flow-map
- information-flow-map
- decision-approval-flow-map
- evidence-flow-map
- actor-role-tool-interaction-map
- external-reference-map
- system-architecture-map

ソフトウェア開発では data-flow diagram / architecture diagram / API flow / deployment flow は Operational Map の一部である。他業種では業務フロー、承認フロー、情報フロー、証拠フロー、責任分界図などとして扱う。

## Context Compression

AOF preserves audit history, but operates from a compressed current context.

通常の AI 実行では Hot State と必要な Warm State だけを渡し、Cold / Archive は参照 ID として保持する。

Context Pack should include:

- current mission
- current frontier
- active work item summary
- open blockers
- pending human approvals
- latest decisions
- applicable QIF quality intents
- Work Governance priority summary
- relevant Operational Map refs
- Go / No-Go status summary
- actor composition summary
- next recommended action
- evidence refs
- external refs

Context Pack は raw artifact 本文を大量に含めてはならない。

## Mission Control Authority Boundary

Mission Control is a projection layer, not a source of truth.

Mission Control may display AOF artifacts, help execute AOF commands, show external references, and project Operational Map / Go-No-Go state.

Mission Control must not hold independent:

- work status
- priority
- approval state
- QIF verdict
- runtime truth
- Operational Map truth
- Go / No-Go judgment

## Runtime State

AOF の current operating state は `.aof/` に置く。

重要な領域は次である。

```text
.aof/
  goals/
  organization.json
  tasks/
  context/active/
  decisions/
  sessions/
  prompts/
```

特に AI が最初に読むべき current packet は次である。

- `.aof/project-bootstrap.json`
- `.aof/organization.json`
- `.aof/context/active/project-orientation.json`
- `.aof/goals/*.json`
- `.aof/tasks/open/*.json`
- `.aof/context/active/recent-confirmation-window.json`

## Current AI Orchestration Model

現行 Codex 仕様を前提にした current model は次である。

- Human starts parent Codex
- parent Codex reads and writes `.aof/`
- parent Codex may spawn role-scoped child work
- parent aggregates results
- parent updates runtime state

ここで重要なのは、

- cadence runtime
- Codex orchestration

を混同しないことである。

GitHub Actions や deterministic runtime は current state を更新できるが、それ自体が Codex parent ではない。

## Managed Project Default

外部プロジェクトに AOF を入れる場合の default は `managed-project` topology である。

- product `main` remains human-governed
- cadence automation must not write `.aof/` directly to product `main`
- default write target should be `aof/state`

## Current Entry Point

現在の最短入口は次である。

```bash
aof init --topology managed-project
```

この command は `.aof/` skeleton と project bootstrap packet を生成する。
