# claude-code-jsonl-parser

[Claude Code](https://claude.com/claude-code) の JSONL 会話ログ (`~/.claude/projects/**/*.jsonl` など) を
型安全に扱うための TypeScript モノレポ。パーサー・スキーマ生成 CLI・回帰検証 CLI の 3 パッケージで構成される。

## ✨ Features

- **依存ゼロのパーサー** — 実行時 dependencies なしで JSONL を型安全にパース、例外を投げず `known` / `unknown` / `error` の 3 値で判別
- **実コーパス駆動の型生成** — 手書きスキーマではなく、実際の `.jsonl` コーパスをスキャンして型定義・型ガードを生成
- **回帰検証 CLI** — 生成済みスキーマに対して実コーパスを検証し、CI でリグレッションを検知
- **ESM + CJS 両対応** — 各パッケージとも Node.js の ESM/CJS どちらからも利用可能

## 📦 Packages

| パッケージ | 説明 |
| --- | --- |
| [`claude-code-jsonl-parser`](packages/parser) | 依存ゼロの Claude Code JSONL パーサー (Result/ResultAsync ベース) |
| [`claude-code-jsonl-generator`](packages/generator) | 実コーパスから型定義・型ガードを生成する CLI |
| [`claude-code-jsonl-validator`](packages/validator) | 生成済みスキーマに対する回帰検証 CLI |

## 🚀 Quick Start

```bash
npm install claude-code-jsonl-parser
```

```ts
import { parseJsonlFile } from 'claude-code-jsonl-parser'

const result = await parseJsonlFile('/path/to/session.jsonl')
if (result.isOk) {
  for (const line of result.value) {
    if (line._kind === 'known' && line.type === 'assistant') {
      console.log(line.message.content)
    }
  }
}
```

詳しい API は各パッケージの README を参照。

## 📖 Documentation

- **[claude-code-jsonl-parser](packages/parser/README.md)** — パース API、`ParsedLine`/content ブロックの絞り込み、型ガード
- **[claude-code-jsonl-generator](packages/generator/README.md)** — 型定義・型ガードの生成 CLI
- **[claude-code-jsonl-validator](packages/validator/README.md)** — 回帰検証 CLI

## 🛠️ 開発

```bash
pnpm install
pnpm -r build   # 全パッケージをビルド
pnpm test       # 全パッケージのテストを実行
pnpm lint       # 型チェック + ESLint
```

`claude-code-jsonl-parser` の `src/generated/` 配下は `claude-code-jsonl-generator` による生成物であり、
`scripts/check-generated-sync.mjs` で再生成結果との同期を CI で検証している。

## 📑 License

このプロジェクトは [MIT License](LICENSE) の下で公開されている。
