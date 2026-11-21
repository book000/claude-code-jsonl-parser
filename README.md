# claude-code-jsonl-parser

A TypeScript monorepo for handling [Claude Code](https://claude.com/claude-code) JSONL conversation logs (such as `~/.claude/projects/**/*.jsonl`) in a type-safe way.
It consists of three packages: a parser, a schema-generation CLI and a regression-check CLI.

## ✨ Features

- **Zero-dependency parser**: parses JSONL in a type-safe way with no runtime dependencies, and never throws on malformed lines; each line is classified as `known` / `unknown` / `error`
- **Corpus-driven type generation**: scans real `.jsonl` corpora instead of relying on hand-written schemas, and emits type definitions and type guards
- **Regression-check CLI**: validates a real corpus against the known schemas, so schema drift can be caught in CI
- **ESM and CJS**: every package can be used from both Node.js module systems

## 📦 Packages

| Package | Description |
| --- | --- |
| [`claude-code-jsonl-parser`](packages/parser) | Zero-dependency Claude Code JSONL parser (based on Result / ResultAsync) |
| [`claude-code-jsonl-generator`](packages/generator) | CLI that generates type definitions and type guards from a real corpus |
| [`claude-code-jsonl-validator`](packages/validator) | CLI that checks a real corpus against the known schemas |

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

See each package's README for the full API.

## 📖 Documentation

- **[claude-code-jsonl-parser](packages/parser/README.md)**: parse API, narrowing `ParsedLine` and content blocks, type guards
- **[claude-code-jsonl-generator](packages/generator/README.md)**: CLI that generates type definitions and type guards
- **[claude-code-jsonl-validator](packages/validator/README.md)**: regression-check CLI

## 🛠️ Development

Requires the Node.js version in `.node-version` and pnpm (version pinned by `packageManager` in `package.json`).

```bash
pnpm install
pnpm -r build   # build all packages
pnpm test       # run the tests of all packages
pnpm lint       # type check + ESLint
```

The files under `packages/parser/src/generated/` are maintained by hand; they are not overwritten by `claude-code-jsonl-generator`, which writes `types.generated.ts` and `guards.generated.ts` to the directory given by `--out`.
After `pnpm -r build`, `pnpm check:generated-sync` (`scripts/check-generated-sync.mjs`) checks locally that the fields the generator infers from the fixture corpus are declared in the parser's `generated/types.ts`. It is not run in CI.
See [AGENTS.md](AGENTS.md) for the repository conventions.

## 📑 License

This project is released under the [MIT License](LICENSE).
