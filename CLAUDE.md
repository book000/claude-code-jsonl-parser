# CLAUDE.md

## Overview

TypeScript monorepo for handling [Claude Code](https://claude.com/claude-code)
JSONL conversation logs (`~/.claude/projects/**/*.jsonl`) in a type-safe way.
Managed with pnpm workspaces. Three published packages:

- `packages/parser` (`claude-code-jsonl-parser`) — zero-dependency parser. Never
  throws; discriminates each line as `known` / `unknown` / `error`.
- `packages/generator` (`claude-code-jsonl-generator`) — CLI that infers and
  emits type definitions / guards from real JSONL corpora (uses `zod`).
- `packages/validator` (`claude-code-jsonl-validator`) — CLI that regression-checks
  real corpora against known schemas (depends on generator + `zod`).

## Requirements

- Node.js `>=24`.
- pnpm is pinned via `packageManager` (`pnpm@11.10.0`). Use pnpm, not npm/yarn.

## Development commands

Run from the repo root:

- `pnpm install` — install workspace dependencies.
- `pnpm -r build` — build all packages (tsdown). Required before `check:generated-sync`.
- `pnpm test` — run all tests (`vitest run`).
- `pnpm lint` — builds the generator, then runs `tsc` per package plus `eslint .`.
- `pnpm fix` — auto-fix (`eslint --fix` and per-package fixes).
- `pnpm check:generated-sync` — local-only sync check (see below). Not run in CI.

## Architecture and key constraints

### Parser must stay zero-dependency

`packages/parser` has no runtime dependencies and must keep it that way. In
particular, do NOT import `zod` (or anything else runtime) into `parser/src`.
`scripts/check-dts-no-zod.mjs` runs as part of the parser `build` (so it is
enforced in CI) and fails if any `zod` reference leaks into the emitted
`dist/*.d.ts` / `*.d.cts`.

### Generated types are curated, not blindly overwritten

`packages/parser/src/generated/{types.ts,guards.ts}` can be regenerated from a
corpus with `claude-code-jsonl-generator`, but the content-block guards and
message shapes are hand-curated. When regenerating, review the diff and merge
intentionally — do not overwrite the curated shapes wholesale. This directory is
excluded from ESLint (`eslint.config.mjs`).

### Generated-sync check is local-only

`scripts/check-generated-sync.mjs` verifies that fields the generator observes in
`packages/parser/tests/fixtures/all-known-types.jsonl` are all declared in
`generated/types.ts`. It requires `pnpm -r build` first (it imports the
generator's `dist`) and is deliberately NOT part of CI — run it manually when
touching schemas.

## Coding conventions

- ESM only (`"type": "module"` everywhere). Author `.mjs` for standalone scripts.
- Prettier (`.prettierrc.yml`): no semicolons, single quotes, `printWidth` 80,
  `trailingComma: es5`. Do not fight the formatter.
- Code comments are written in Japanese, matching the existing source. Keep this
  consistent when editing.
- Tests live in each package's `tests/` directory and run via Vitest.

## Git, commits, and PRs

- Default branch is `develop`; releases flow `develop → master` via
  semantic-release.
- Commit messages: Conventional Commits. Description defaults to Japanese
  (matching existing history).
- PR title and body MUST be written in English. `scripts/check-pr-language.mjs`
  enforces this (it fails when text is >=80% Japanese, ignoring code blocks).
  This is the opposite of the commit-message convention above — do not confuse them.

## Documentation update rules

- Update `README.md` (root and per-package) when packages, public APIs, or the
  development commands above change.
- When editing `generated/types.ts`, keep its header comment accurate about which
  parts are curated vs. regenerable.
