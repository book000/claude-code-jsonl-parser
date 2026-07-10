# Copilot code review instructions

TypeScript monorepo (pnpm workspaces) for parsing Claude Code JSONL logs. Three
packages: `parser` (zero-dependency), `generator` (CLI, uses `zod`), `validator`
(CLI, depends on generator + `zod`). ESM only; Node.js `>=24`.

## What to prioritize in review

- **Parser zero-dependency rule**: flag any new runtime dependency added to
  `packages/parser`, and any `import`/`require` of `zod` (or other runtime deps)
  under `packages/parser/src`. The parser must have no runtime dependencies, and
  `zod` must never leak into its emitted `.d.ts`.
- **Error handling**: the parser must never throw on malformed input. Parsing
  results are discriminated as `known` / `unknown` / `error`; flag code paths that
  throw instead of returning an error result, or that assume a line is `known`
  without checking `_kind`.
- **Generated files**: `packages/parser/src/generated/{types.ts,guards.ts}` are
  partially hand-curated (content-block guards and message shapes). Flag changes
  that appear to be a blind full regeneration overwriting curated shapes.
- **Type safety**: flag new uses of `any` or unchecked casts; prefer precise
  types and the existing type guards.

## Conventions enforced by tooling

- Formatting is handled by Prettier (no semicolons, single quotes, `printWidth`
  80). Do not raise style-only nits that the formatter already governs.
- Linting is `@book000/eslint-config`; `dist/`, `coverage/`, and `generated/` are
  excluded from ESLint.
- Tests use Vitest and live in each package's `tests/` directory. Flag new public
  behavior added without corresponding tests.

## Do not flag

- Japanese-language code comments — this is the established project convention.
- Absence of semicolons — intentional (Prettier config).
- Commit-message language: commit descriptions are Japanese by convention, while
  PR titles/bodies are required to be English (checked by CI).
