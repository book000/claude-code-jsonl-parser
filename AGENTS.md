# AGENTS.md

Guidance for AI coding agents and contributors. `CLAUDE.md` imports this file, and `.github/copilot-instructions.md` adds the review checklist.

## Language

- All deliverables are written in **English**: commit messages, PR/Issue titles and bodies, review comments, code comments and docstrings, and documentation (`README.md`, `AGENTS.md`, etc.).
- Exceptions (keep as is): quotations, technical identifiers, generated files, and external source text.
- Runtime messages (logs, errors) are English.
- Do not rewrite Git history to change the language of past commits.
- `scripts/check-pr-language.mjs` fails when a PR title or body is mostly Japanese (ratio of Japanese characters >= 0.8, code blocks ignored). It is run by the Release PR workflow on the generated release PR, and it matches the rule above.

## Overview

TypeScript monorepo (pnpm workspaces, ESM) for handling [Claude Code](https://claude.com/claude-code) JSONL conversation logs (`~/.claude/projects/**/*.jsonl`) in a type-safe way. Three npm packages share one version, which semantic-release bumps:

- `packages/parser` (`claude-code-jsonl-parser`): zero-dependency parser. A line is classified as `known`, `unknown` or `error` and parsing never throws on malformed input. File I/O failures are separate: `parseJsonlFile()` returns them as a `ResultAsync` error, and the `parseJsonlFileStream()` iterator throws a `FileReadError` (a plain object, not an `Error`).
- `packages/generator` (`claude-code-jsonl-generator`): CLI and library that scan a JSONL corpus, infer field shapes, and emit TypeScript interfaces and guard source. Also exports the zod schemas of the known entry types. Depends on `zod`.
- `packages/validator` (`claude-code-jsonl-validator`): CLI and library that check a corpus against those zod schemas and report schema mismatches, unknown types and unknown fields. Depends on the generator and `zod`.

## Commands

Run from the repository root. Node.js and pnpm versions are pinned in `.node-version` and `package.json` (`engines`, `packageManager`).

```bash
pnpm install                  # install dependencies
pnpm -r build                 # build all packages (tsdown, ESM + CJS)
pnpm test                     # vitest run (all packages; the generator is resolved from source, no build needed)
pnpm lint                     # build the generator, then tsc per package, then eslint .
pnpm check:generated-sync     # local only, needs `pnpm -r build` first
```

`pnpm fix` is defined (`pnpm -r fix && eslint . --fix`) but currently fails because no package defines a `fix` script; use `pnpm exec eslint . --fix` instead.

CI (`.github/workflows/ci.yml`, reusable workflow from `book000/templates`) runs `pnpm run lint` and `pnpm run test`; depcheck is disabled. `release.yml` runs `pnpm -r build` and `semantic-release` on pushes to `develop` and `master`.

## Structure

- `packages/parser/src`: `parse.ts` (public parse API), `parse-line.ts` (one line to `ParsedLine`), `result.ts` (`Result` / `ResultAsync`), `errors.ts` (`FileReadError`), `generated/types.ts` and `generated/guards.ts` (entry types and guards), `index.ts` (public exports).
- `packages/generator/src`: `scanner.ts` (corpus scan), `infer.ts` (shape inference), `emit-types.ts` and `emit-guards.ts` (source emitters), `schemas.ts` (zod schemas for the known entry types), `cli.ts`.
- `packages/validator/src`: `validate.ts` (per-line validation and aggregation), `cli.ts`.
- `scripts/`: `check-dts-no-zod.mjs`, `check-generated-sync.mjs`, `check-pr-language.mjs`.
- Tests live in each package's `tests/` directory (Vitest); JSONL fixtures are in `packages/parser/tests/fixtures` and `packages/validator/tests/fixtures`.

## Constraints

- **Parser stays zero-dependency**: never import `zod` or any other runtime dependency under `packages/parser/src`. `scripts/check-dts-no-zod.mjs` runs as the last step of the parser `build` and fails if a `zod` reference leaks into `dist/*.d.ts` / `*.d.cts`. The PR CI job does not build the parser, so this check effectively runs in the Release workflow and in local builds.
- **`packages/parser/src/generated/` is hand-maintained**, despite the name. The generator writes `types.generated.ts` and `guards.generated.ts` to the directory given by `--out` and never touches `types.ts` / `guards.ts`. Those two files differ from generator output (for example guards return `GuardResult` with a `reason`, and content-block guards and message shapes are written by hand), so treat generator output as a reference to diff against and merge intentionally. The directory is excluded from ESLint.
- `scripts/check-generated-sync.mjs` checks that every top-level field the generator infers from `packages/parser/tests/fixtures/all-known-types.jsonl` is declared in `generated/types.ts`. It is not part of CI; run it after touching schemas or entry types.
- `packages/generator/src/schemas.ts` (zod) and `packages/parser/src/generated/guards.ts` describe the same entry types independently. Keep them in sync when adding or changing a type; the validator uses the zod side and the parser uses the guards.
- Never commit real JSONL corpora (`/corpus/` and `*.local.jsonl` are git-ignored).

## Conventions

- ESM only; standalone scripts are `.mjs`. Prettier (`.prettierrc.yml`): no semicolons, single quotes, `printWidth` 80, `trailingComma: es5`. Linting uses `@book000/eslint-config`.
- Add or update tests for every behavior change, and update `README.md` (root and per-package) when public APIs, packages or commands change.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/); branches follow [Conventional Branch](https://conventional-branch.github.io) short form (`feat/...`, `fix/...`, `docs/...`).
- The default branch is `develop`; releases go `develop` to `master` through a release PR that must be merged with a merge commit. semantic-release publishes a patch release for `fix`, `docs`, `chore`, `perf`, `refactor`, `build`, `ci`, `revert`, `style` and `test`, and a minor release for `feat`, so choose the commit type deliberately.
- Do not commit to Renovate PRs. Never commit secrets.
