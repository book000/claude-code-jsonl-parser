# claude-code-jsonl-parser

A zero-dependency TypeScript library that parses Claude Code JSONL conversation logs (such as `~/.claude/projects/**/*.jsonl`) in a type-safe way.

## ✨ Features

- **Zero dependencies**: no runtime dependencies
- **No exceptions on bad input**: each line is classified as `known` / `unknown` / `error`
- **Diagnosable `unknown`**: a line of a known type with a mismatched shape is represented with `typeHint` and `reason`, so no data is lost
- **Whole-file and streaming APIs**: read a whole file at once, or process it line by line in constant memory
- **ESM and CJS**: usable from both Node.js module systems

## 📦 Installation

```bash
npm install claude-code-jsonl-parser
```

## 🚀 Quick start

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

`parseJsonlFile` returns `Err` only for file I/O errors (the file does not exist, no permission, and so on).
A line with a JSON syntax error or an unknown shape does not cause an exception: the line itself is represented as a `ParsedLine` with `_kind: 'error'` or `_kind: 'unknown'` (see below).

## 📖 API

### Whole-text, whole-file and streaming APIs

| Function | Purpose |
| --- | --- |
| `parseJsonl(text)` | Parses a whole string at once (`Result<ParsedLine[], never>`) |
| `parseJsonlLines(text)` | Parses a whole string with a synchronous line-by-line iterator |
| `parseJsonlFile(path)` | Reads and parses a whole file at once (`ResultAsync<ParsedLine[], FileReadError>`) |
| `parseJsonlFileStream(path)` | Parses a file line by line with an asynchronous iterator (constant memory); a read failure is thrown as a `FileReadError` during iteration |

Blank lines are skipped and do not count towards line numbers.
For large log files (tens of MB or more), `parseJsonlFileStream` keeps memory usage down because it does not hold every line in an array.

```ts
import { parseJsonlFileStream } from 'claude-code-jsonl-parser'

for await (const line of parseJsonlFileStream('/path/to/large-session.jsonl')) {
  if (line._kind === 'known' && line.type === 'user') {
    // ...
  }
}
```

### Discriminating a ParsedLine

Discriminate the result of each line by `_kind`.

```ts
import type { ParsedLine } from 'claude-code-jsonl-parser'

function handle(line: ParsedLine) {
  switch (line._kind) {
    case 'known': {
      // line.type narrows further to assistant / user / system / ...
      break
    }
    case 'unknown': {
      // An unknown type, or a known type with a mismatched shape.
      // line.raw: the parsed JSON value as is
      // line.typeHint: the original type value for a shape mismatch (undefined for an unknown type)
      // line.reason: for a shape mismatch, a diagnostic message naming the offending fields
      break
    }
    case 'error': {
      // A line with a JSON syntax error. line.rawLine is the text and line.message the syntax error message
      break
    }
  }
}
```

A line of a known type that does not satisfy the guard's required fields is not dropped: it is represented as `unknown` (`typeHint` holds the original type and `reason` the cause), and no exception is thrown.

### Narrowing content blocks

The elements of `message.content` in `assistant` / `user` entries (`AssistantContentBlock` / `UserContentBlock`) are also discriminated unions of known blocks and `UnknownContentBlock`.
Check `_kind` for `'unknown'` first, then narrow by `.type`.

```ts
import type { AssistantContentBlock } from 'claude-code-jsonl-parser'

function describe(block: AssistantContentBlock): string {
  if (block._kind === 'unknown') return '(unknown block)'
  if (block.type === 'text') return block.text
  if (block.type === 'thinking') return block.thinking
  return `tool_use: ${block.name}`
}
```

### Result

`parseJsonl` and `parseJsonlFile` return a dependency-free `Result` / `ResultAsync`. Both expose `map`, `mapErr`, `andThen`, `match` and `unwrapOr`; `ok`, `err` and `ResultAsync` are exported.
A `Result` has `isOk` / `isErr` and either `value` or `error`; a `ResultAsync` can be awaited to obtain the `Result`.

### Exported type guards (advanced)

`guards`, `guardByType`, `KNOWN_TYPES`, `normalizeAssistantContent` and `normalizeUserContent` are exported for building your own parsing pipeline.
For normal use, the `parseJsonlFile` family of APIs is enough.

```ts
import { guardByType } from 'claude-code-jsonl-parser'

const result = guardByType('assistant', someRawObject)
// result === undefined          -> there is no guard for 'assistant' (unknown type)
// result.ok === true            -> the shape matches
// result.ok === false, result.reason -> the shape does not match, and why
```

## 📑 License

This project is released under the [MIT License](./LICENSE).
