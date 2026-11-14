#!/usr/bin/env node
/**
 * Build guard: verifies that no zod reference leaks into the parser's dist/*.d.ts.
 * claude-code-jsonl-parser is zero-dependency and has no external runtime dependency, zod included.
 * Runs as the last step of the parser `build` script.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import nodePath from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PARSER_DIST = nodePath.join(__dirname, '..', 'packages', 'parser', 'dist')

/**
 * Recursively collects .d.ts / .d.cts files.
 *
 * @param {string} directory - Directory to search
 * @returns {string[]} File paths
 */
function collectDts(directory) {
  /** @type {string[]} */
  const results = []
  for (const entry of readdirSync(directory)) {
    const full = nodePath.join(directory, entry)
    if (statSync(full).isDirectory()) {
      results.push(...collectDts(full))
    } else if (entry.endsWith('.d.ts') || entry.endsWith('.d.cts')) {
      results.push(full)
    }
  }
  return results
}

// zod v4 also exposes subpaths such as 'zod/v4', 'zod/v3' and 'zod/v4-mini',
// so detect those as well as the bare specifier.
const ZOD_PATTERNS = [
  /from\s+['"]zod(?:\/[^'"]*)?['"]/,
  /import\(['"]zod(?:\/[^'"]*)?['"]\)/,
  /require\(['"]zod(?:\/[^'"]*)?['"]\)/,
]

let hadError = false
for (const file of collectDts(PARSER_DIST)) {
  const content = readFileSync(file, 'utf8')
  for (const pattern of ZOD_PATTERNS) {
    if (!pattern.test(content)) {
      continue
    }

    console.error(`ERROR: zod reference found in ${nodePath.relative(process.cwd(), file)}`)
    hadError = true
  }
}
if (hadError) {
  process.exit(1)
}
console.log('OK: no zod reference in parser dist .d.ts')
