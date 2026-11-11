import { readdir, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import path from 'node:path'

/** Scan result. */
export interface ScanResult {
  /** Type string to the raw JSON objects of that type. */
  samplesByType: Map<string, Record<string, unknown>[]>
  /** Number of lines scanned successfully (valid JSON). */
  totalLines: number
  /** Number of lines with a JSON syntax error. */
  malformedLines: number
  /** Number of valid-JSON lines that are not an object with a string `type`. */
  typelessLines: number
}

/**
 * Recursively collects `.jsonl` files.
 *
 * @param dir - Start directory
 * @returns File paths (built by joining with `dir`)
 */
async function collectJsonlFiles(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await readdir(dir)
  for (const entry of entries) {
    const full = path.join(dir, entry)
    const st = await stat(full)
    if (st.isDirectory()) {
      out.push(...(await collectJsonlFiles(full)))
    } else if (entry.endsWith('.jsonl')) {
      out.push(full)
    }
  }
  return out
}

/**
 * Scans a corpus and groups the raw samples by type.
 *
 * @param corpusDir - Root directory of the corpus
 * @param maxSamplesPerType - Per-type sample cap to bound memory (default 5000)
 */
export async function scanCorpus(
  corpusDir: string,
  maxSamplesPerType = 5000
): Promise<ScanResult> {
  const samplesByType = new Map<string, Record<string, unknown>[]>()
  let totalLines = 0
  let malformedLines = 0
  let typelessLines = 0

  const files = await collectJsonlFiles(corpusDir)
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
        malformedLines += 1
        continue
      }
      totalLines += 1
      if (
        typeof obj !== 'object' || obj === null || Array.isArray(obj) ||
        typeof (obj as Record<string, unknown>).type !== 'string'
      ) {
        typelessLines += 1
        continue
      }
      const record = obj as Record<string, unknown>
      const type = record.type as string
      const bucket = samplesByType.get(type) ?? []
      if (!(bucket.length < maxSamplesPerType)) {
        continue
      }

      bucket.push(record)
      samplesByType.set(type, bucket)
    }
  }

  return { samplesByType, totalLines, malformedLines, typelessLines }
}
