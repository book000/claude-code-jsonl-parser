# claude-code-jsonl-validator

実際の Claude Code JSONL コーパスを、`claude-code-jsonl-parser` が持つ既知スキーマに対して回帰検証する CLI / ライブラリ。

## ✨ Features

- **リグレッション検出専用** — 既知スキーマから外れた行を検出し、集計付きで報告する
- **CLI 1 本で完結** — コーパスのディレクトリを指定するだけ
- **CI との統合を想定** — 検出時は非 0 の終了コードを返すため、そのまま CI のゲートに使える
- **プログラムからの利用も可能** — 1 行分の検証・集計処理を個別に import できる

## 📦 インストール

```bash
npm install --save-dev claude-code-jsonl-validator
```

## 🚀 CLI の使い方

```bash
npx claude-code-jsonl-validator /path/to/jsonl-corpus
```

指定したディレクトリ以下の `.jsonl` ファイルを再帰的に読み込み、各行を検証する。
JSON 構文エラーの行はパーサー側の責務のため無視される。

- リグレッションが無い場合: `No regressions. All lines match known schemas.` を表示し、終了コード `0`
- リグレッションがある場合: `type` ごとに検出件数・種別・代表例を表示し、終了コード `1`

```
[assistant] 3 finding(s)
  schema-mismatch: 3
    - uuid: Required

Regression detected. See findings above.
```

## 📖 プログラムからの利用 (上級者向け)

```ts
import { validateLine, aggregateReport, hasFindings } from 'claude-code-jsonl-validator'

const findings = validateLine(JSON.parse(rawLine))
const report = aggregateReport(findings)
if (hasFindings(report)) {
  // type ごとの Finding[] が report に集約されている
}
```

| エクスポート | 用途 |
| --- | --- |
| `validateLine(obj)` | パース済み 1 行分のオブジェクトを検証し `Finding[]` を返す |
| `aggregateReport(findings)` | `Finding[]` を `type` ごとに集約する |
| `hasFindings(report)` | 集約結果に 1 件でも `Finding` があるかを判定する |

## 📑 ライセンス

このプロジェクトは [MIT License](../../LICENSE) の下で公開されている。
