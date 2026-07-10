# claude-code-jsonl-generator

実際の Claude Code JSONL コーパスをスキャンし、`claude-code-jsonl-parser` の型定義・型ガードを生成する CLI / ライブラリ。

## ✨ Features

- **実コーパス駆動** — 手書きのスキーマではなく、実際の `.jsonl` ファイル群をスキャンしてフィールド形状を推論する
- **型定義 + 型ガードの同時生成** — TypeScript の `interface` と、対応する実行時ガード関数を 1 回のスキャンで生成
- **CLI 1 本で完結** — `--corpus` と `--out` を指定するだけ
- **プログラムからの利用も可能** — スキャナ・推論エンジン・emitter を個別に import できる

## 📦 インストール

```bash
npm install --save-dev claude-code-jsonl-generator
```

## 🚀 CLI の使い方

```bash
npx claude-code-jsonl-generator --corpus /path/to/jsonl-corpus --out packages/parser/src/generated
```

- `--corpus <dir>`: `.jsonl` ファイルを再帰的にスキャンする対象ディレクトリ
- `--out <dir>`: 生成物 (`types.generated.ts` / `guards.generated.ts`) の出力先

実行すると標準エラー出力にスキャン件数のサマリー (総行数・検出した type 数・構文エラー行数) が表示される。
content ブロックのガードなど、手動でキュレーションしている部分は上書きされない。

生成物は必ずレビューしてからコミットすること。本リポジトリでは
`scripts/check-generated-sync.mjs` で `claude-code-jsonl-parser` にコミット済みの
生成物と再生成結果が一致しているかをローカルで手動確認できる (CI では実行しない)。

## 📖 プログラムからの利用 (上級者向け)

```ts
import { scanCorpus, inferShape, emitInterface, emitGuardFunction } from 'claude-code-jsonl-generator'

const scan = await scanCorpus('/path/to/jsonl-corpus')
for (const [type, samples] of scan.samplesByType) {
  const shape = inferShape(samples)
  console.log(emitInterface(`${type}Entry`, type, shape))
  console.log(emitGuardFunction(`is${type}`, type, shape))
}
```

| エクスポート | 用途 |
| --- | --- |
| `scanCorpus(dir)` | ディレクトリを再帰的にスキャンし、`type` ごとのサンプルを収集 |
| `inferShape(samples)` | サンプル群からフィールド形状 (`Shape`) を推論 |
| `entrySchemas` / `knownTypeSchema` / `KNOWN_TYPES` | 既知 type の zod スキーマ (ビルド時検証用) |
| `emitInterface(name, type, shape)` | 推論した形状から TypeScript `interface` のソースを生成 |
| `emitGuardFunction(name, type, shape)` | 推論した形状から実行時ガード関数のソースを生成 |

## 📑 ライセンス

このプロジェクトは [MIT License](./LICENSE) の下で公開されている。
