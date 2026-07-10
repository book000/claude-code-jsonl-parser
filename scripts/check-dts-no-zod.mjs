#!/usr/bin/env node
/**
 * CI ガード: parser の dist/*.d.ts に zod 参照が漏れていないか検証する。
 * claude-code-jsonl-parser は依存ゼロ。zod を含む一切の外部ランタイム依存を持たない。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import nodePath from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PARSER_DIST = nodePath.join(__dirname, '..', 'packages', 'parser', 'dist')

/**
 * .d.ts / .d.cts を再帰収集する。
 *
 * @param {string} directory - 探索対象
 * @returns {string[]} 絶対パス配列
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

// zod v4 は 'zod' 本体に加え 'zod/v4' 'zod/v3' 'zod/v4-mini' 等の subpath も
// 公開しているため、bare specifier だけでなくそれらも検出対象にする。
const ZOD_PATTERNS = [
  /from\s+['"]zod(?:\/[^'"]*)?['"]/,
  /import\(['"]zod(?:\/[^'"]*)?['"]\)/,
  /require\(['"]zod(?:\/[^'"]*)?['"]\)/,
]

let hadError = false
for (const file of collectDts(PARSER_DIST)) {
  const content = readFileSync(file, 'utf8')
  for (const pattern of ZOD_PATTERNS) {
    if (pattern.test(content)) {
      console.error(`ERROR: zod reference found in ${nodePath.relative(process.cwd(), file)}`)
      hadError = true
    }
  }
}
if (hadError) {
  process.exit(1)
}
console.log('OK: no zod reference in parser dist .d.ts')
