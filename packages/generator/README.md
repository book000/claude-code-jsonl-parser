# claude-code-jsonl-generator

A CLI and library that scans real Claude Code JSONL corpora and generates type definitions and type guards for `claude-code-jsonl-parser`.

## ✨ Features

- **Corpus-driven**: infers field shapes by scanning real `.jsonl` files instead of relying on hand-written schemas
- **Types and guards in one scan**: emits TypeScript `interface`s and the matching runtime guard functions from a single scan
- **One CLI**: just pass `--corpus` and `--out`
- **Programmatic use**: the scanner, the inference engine and the emitters can be imported individually

## 📦 Installation

```bash
npm install --save-dev claude-code-jsonl-generator
```

## 🚀 CLI usage

```bash
npx claude-code-jsonl-generator --corpus /path/to/jsonl-corpus --out packages/parser/src/generated
```

- `--corpus <dir>`: directory scanned recursively for `.jsonl` files
- `--out <dir>`: output directory for `types.generated.ts` and `guards.generated.ts`

Both options are required; without them the CLI prints a usage message and exits with code 2.
On success it prints a summary to standard error (total lines, number of types found, number of malformed lines).

The output file names differ from the hand-maintained `types.ts` / `guards.ts` in `claude-code-jsonl-parser`, so nothing there is overwritten.
The emitted guards return a plain `boolean` and cover only the top-level required fields, while the parser's guards return a `GuardResult` and also cover content blocks.
Treat the output as a reference: review it and merge differences into the parser's files intentionally.
In this repository, `scripts/check-generated-sync.mjs` checks locally that the fields the generator infers from the fixture corpus are declared in the parser's `generated/types.ts` (it is not run in CI).

## 📖 Programmatic use (advanced)

```ts
import { scanCorpus, inferShape, emitInterface, emitGuardFunction } from 'claude-code-jsonl-generator'

const scan = await scanCorpus('/path/to/jsonl-corpus')
for (const [type, samples] of scan.samplesByType) {
  const shape = inferShape(samples)
  console.log(emitInterface(`${type}Entry`, type, shape))
  console.log(emitGuardFunction(`is${type}`, type, shape))
}
```

| Export | Purpose |
| --- | --- |
| `scanCorpus(dir, maxSamplesPerType?)` | Scans a directory recursively and collects samples per `type` (at most 5000 per type by default) |
| `inferShape(samples, options?)` | Infers the field shapes (`Shape`) from a set of samples; `jsonKind(value)` returns the kind of one JSON value |
| `entrySchemas` / `knownTypeSchema` / `KNOWN_TYPES` | zod schemas of the known types (used by the validator) |
| `emitInterface(name, type, shape)` | Generates the source of a TypeScript `interface` from an inferred shape |
| `emitGuardFunction(name, type, shape)` | Generates the source of a runtime guard function from an inferred shape |
| `tsTypeOf(kinds, literals?)` / `pascalCase(type)` | Helpers used by the emitters: kinds to TypeScript type string, and type string to PascalCase |

## 📑 License

This project is released under the [MIT License](./LICENSE).
