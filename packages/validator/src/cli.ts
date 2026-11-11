#!/usr/bin/env node
import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import path from 'node:path'
import { validateLine, aggregateReport, hasFindings, type Finding } from './validate'

/** Recursively collects `.jsonl` files. */
async function collectJsonl(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await readdir(dir)
  for (const entry of entries) {
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
  const files = await collectJsonl(corpus)
  for (const file of files) {
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
        continue // Syntax errors are the parser's concern; ignore them here
      }
      findings.push(...validateLine(obj))
    }
  }

  const report = aggregateReport(findings)
  const sortedReport = [...report].toSorted(([a], [b]) => a.localeCompare(b))
  for (const [type, bucket] of sortedReport) {
    console.log(`\n[${type}] ${bucket.length} finding(s)`)
    const byKind = new Map<string, number>()
    for (const f of bucket) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1)
    for (const [kind, n] of byKind) console.log(`  ${kind}: ${n}`)
    // Show a few representative messages
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
