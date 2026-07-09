# claude-code-jsonl-parser

Claude Code の JSONL 会話ログ (`~/.claude/projects/**/*.jsonl` など) を型安全にパースする、依存ゼロの TypeScript ライブラリ。

- 依存パッケージなし (実行時 dependencies は空)
- ESM / CJS 両対応
- 1 行ずつのパース結果を `known` / `unknown` / `error` の 3 値で判別 (例外を投げない)
- ファイル全体を一括で読む API と、定数メモリで逐次処理するストリーミング API の両方を提供

## インストール

```bash
npm install claude-code-jsonl-parser
```

## クイックスタート

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

`parseJsonlFile` はファイル I/O エラー (存在しない、権限がない等) のみ `Err` を返す。
JSON 構文エラーや未知の形状の行は例外にはならず、各行の `ParsedLine` 自体が
`_kind: 'error'` / `_kind: 'unknown'` として表現される (後述)。

## 一括 API とストリーミング API

| 関数 | 用途 |
| --- | --- |
| `parseJsonl(text)` | 文字列全体を一括パース (`Result<ParsedLine[], never>`) |
| `parseJsonlLines(text)` | 文字列全体を行単位の同期イテレータでパース |
| `parseJsonlFile(path)` | ファイルを一括読み込み・一括パース (`ResultAsync<ParsedLine[], FileReadError>`) |
| `parseJsonlFileStream(path)` | ファイルを 1 行ずつ非同期イテレータでパース (定数メモリ) |

数十 MB 以上の大きなログファイルを扱う場合は `parseJsonlFileStream` を使うと、
全行を配列に保持しないぶんメモリ使用量を抑えられる。

```ts
import { parseJsonlFileStream } from 'claude-code-jsonl-parser'

for await (const line of parseJsonlFileStream('/path/to/large-session.jsonl')) {
  if (line._kind === 'known' && line.type === 'user') {
    // ...
  }
}
```

## ParsedLine の 3 値判別

行ごとのパース結果は `_kind` で判別する。

```ts
import type { ParsedLine } from 'claude-code-jsonl-parser'

function handle(line: ParsedLine) {
  switch (line._kind) {
    case 'known': {
      // line.type で assistant / user / system / ... にさらに絞り込める
      break
    }
    case 'unknown': {
      // 未知 type、または既知 type だが形状不一致。
      // line.typeHint: 形状不一致なら元の type 値 (未知 type なら undefined)
      // line.reason: 形状不一致の場合、どのフィールドが原因かの診断メッセージ
      break
    }
    case 'error': {
      // JSON 構文エラー行。line.message に構文エラーメッセージ
      break
    }
  }
}
```

`known` かつ既知 type だがガードの必須フィールドを満たさない行は、データを失わず
`unknown` (`typeHint` に元の type、`reason` に不一致理由) として表現される。
例外は投げない。

## content ブロックの絞り込み

`assistant`/`user` の `message.content` 配列の要素 (`AssistantContentBlock` /
`UserContentBlock`) も、既知ブロックと `UnknownContentBlock` の判別 union になっている。
先に `_kind` で `'unknown'` かどうかを判定してから `.type` で絞り込む。

```ts
import type { AssistantContentBlock } from 'claude-code-jsonl-parser'

function describe(block: AssistantContentBlock): string {
  if (block._kind === 'unknown') return '(未知ブロック)'
  if (block.type === 'text') return block.text
  if (block.type === 'thinking') return block.thinking
  return `tool_use: ${block.name}`
}
```

## 公開されている型ガード (上級者向け)

`guards` / `guardByType` / `KNOWN_TYPES` / `normalizeAssistantContent` /
`normalizeUserContent` は、独自のパースパイプラインを組みたい場合のために
公開されている。通常の利用では `parseJsonlFile` 系の API で十分。

```ts
import { guardByType } from 'claude-code-jsonl-parser'

const result = guardByType('assistant', someRawObject)
// result === undefined          → 'assistant' というガード自体が存在しない
// result.ok === true            → 形状一致
// result.ok === false, result.reason → 形状不一致とその理由
```

## ライセンス

MIT
