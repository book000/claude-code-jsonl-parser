#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { scanCorpus } from './scanner'
import { generateFiles } from './generate'

/**
 * Parses the arguments: `--corpus <dir> --out <dir>`.
 * Prints the usage and exits with code 2 when either is missing.
 *
 * @param argv - `process.argv.slice(2)`
 */
function parseArgs(argv: string[]): { corpus: string; out: string } {
  let corpus = ''
  let out = ''
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--corpus') corpus = argv[i + 1] ?? ''
    else if (argv[i] === '--out') out = argv[i + 1] ?? ''
  }
  if (!corpus || !out) {
    console.error('Usage: claude-code-jsonl-generator --corpus <dir> --out <parser/src/generated>')
    process.exit(2)
  }
  return { corpus, out }
}

async function main(): Promise<void> {
  const { corpus, out } = parseArgs(process.argv.slice(2))
  const scan = await scanCorpus(corpus)
  console.error(`scanned: ${scan.totalLines} lines, ${scan.samplesByType.size} types, ${scan.malformedLines} malformed`)

  const { typesOut, guardsOut } = generateFiles(scan.samplesByType)

  await mkdir(out, { recursive: true })
  await writeFile(path.join(out,'types.generated.ts'), typesOut, 'utf8')
  await writeFile(path.join(out,'guards.generated.ts'), guardsOut, 'utf8')
  console.error(`written: ${path.join(out,'types.generated.ts')}, ${path.join(out,'guards.generated.ts')}`)
  console.error('NOTE: review the diff before committing. content-block guards / message shapes are curated manually and are not overwritten by this generator.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
