#!/usr/bin/env node
import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import path from 'node:path'
import { validateLine, aggregateReport, hasFindings, type Finding } from './validate'

/** `.jsonl` を再帰収集する。 */
async function collectJsonl(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir)) {
    const full = path.join(dir, entry)
    const st = await stat(full)
    if (st.isDirectory()) out.push(...(await collectJsonl(full)))
    else if (entry.endsWith('.jsonl')) out.push(full)
  }
  return out
}

async function main(): Promise<void> {
  const corpus = process.argv[2]
  if (!corpus) {
    console.error('Usage: claude-code-jsonl-validator <corpus-dir>')
    process.exit(2)
  }

  const findings: Finding[] = []
  for (const file of await collectJsonl(corpus)) {
    const rl = createInterface({
      input: createReadStream(file, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    })
    for await (const raw of rl) {
      if (raw.trim() === '') continue
      let obj: unknown
      try {
        obj = JSON.parse(raw)
      } catch {
        continue // 構文エラーは parser 側の責務。ここでは無視
      }
      findings.push(...validateLine(obj))
    }
  }

  const report = aggregateReport(findings)
  for (const [type, bucket] of [...report].toSorted()) {
    console.log(`\n[${type}] ${bucket.length} finding(s)`)
    const byKind = new Map<string, number>()
    for (const f of bucket) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1)
    for (const [kind, n] of byKind) console.log(`  ${kind}: ${n}`)
    // 代表例を数件表示
    for (const f of bucket.slice(0, 5)) console.log(`    - ${f.message}`)
  }

  if (hasFindings(report)) {
    console.error('\nRegression detected. See findings above.')
    process.exit(1)
  }
  console.log('\nNo regressions. All lines match known schemas.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
