# claude-code-jsonl-validator

A CLI and library that regression-checks real Claude Code JSONL corpora against the known schemas (the zod schemas exported by `claude-code-jsonl-generator`).

## ✨ Features

- **Regression detection only**: finds lines that deviate from the known schemas and reports them with counts
- **One CLI**: just pass the corpus directory
- **Made for CI**: exits with a non-zero code when a regression is found, so it can gate CI as is
- **Programmatic use**: validate one line and aggregate findings with separate imports

## 📦 Installation

```bash
npm install --save-dev claude-code-jsonl-validator
```

## 🚀 CLI usage

```bash
npx claude-code-jsonl-validator /path/to/jsonl-corpus
```

Reads every `.jsonl` file under the given directory recursively and validates each line.
Lines with a JSON syntax error are ignored, because they are the parser's concern.
Running it without a directory prints a usage message and exits with code 2.

- No regressions: prints `No regressions. All lines match known schemas.` and exits with `0`
- Regressions found: prints the number of findings, the kinds and up to 5 sample messages per `type`, then exits with `1`

A finding has one of four kinds: `no-type` (not an object, or no string `type`), `unknown-type` (no schema for the type), `schema-mismatch` (a required field is missing or has the wrong type), and `unknown-field` (a top-level key the schema does not list).

```
[mode] 2 finding(s)
  schema-mismatch: 1
  unknown-field: 1
    - mode: Invalid input: expected string, received undefined
    - unknown field "brandNewField" on type "mode"

Regression detected. See findings above.
```

## 📖 Programmatic use (advanced)

```ts
import { validateLine, aggregateReport, hasFindings } from 'claude-code-jsonl-validator'

const findings = validateLine(JSON.parse(rawLine))
const report = aggregateReport(findings)
if (hasFindings(report)) {
  // report groups the Finding[] by type
}
```

| Export | Purpose |
| --- | --- |
| `validateLine(obj)` | Validates one parsed object and returns a `Finding[]` |
| `aggregateReport(findings)` | Groups a `Finding[]` by `type` into a `Map` |
| `hasFindings(report)` | Tells whether the aggregated report contains at least one `Finding` |

## 📑 License

This project is released under the [MIT License](./LICENSE).
