# Copilot code review instructions

Read `AGENTS.md` first: it holds the language rule, the project structure and the constraints. Review against it.

## Language

All deliverables (code comments, docstrings, documentation, commit messages, PR text) are English; runtime messages are English. Flag new non-English text unless it is a quotation, a technical identifier, a generated file, or external source text.

## What to prioritize

- **Parser zero-dependency rule**: flag any runtime dependency added to `packages/parser` and any import of `zod` (or another runtime dependency) under `packages/parser/src`, and any change that makes a `zod` type appear in the parser's emitted `.d.ts`.
- **Never throw on malformed input**: line parsing must return `known` / `unknown` / `error` results; flag code that throws on bad input or assumes a line is `known` without checking `_kind`.
- **Generated directory**: `packages/parser/src/generated/` is hand-maintained; flag a blind overwrite with generator output. Flag changes to the entry types or guards that are not mirrored in `packages/generator/src/schemas.ts`.
- **Type safety**: flag new `any` and unchecked casts; prefer precise types and the existing guards.
- **Tests and docs**: flag new public behavior without tests, and API or command changes without a README update.

## Do not flag

- Formatting that Prettier governs (no semicolons, single quotes, `printWidth` 80).
- `dist/`, `coverage/` and `generated/` are excluded from ESLint by design.
