import { readdir, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import path from 'node:path'

/** スキャン結果。 */
export interface ScanResult {
  /** type 文字列 → その type の生 JSON オブジェクト配列。 */
  samplesByType: Map<string, Record<string, unknown>[]>
  /** 走査した有効行数 (パース成功)。 */
  totalLines: number
  /** JSON 構文エラー行数。 */
  malformedLines: number
  /** type フィールドを持たない/文字列でない行数。 */
  typelessLines: number
}

/**
 * `.jsonl` ファイルを再帰収集する。
 *
 * @param dir - 起点ディレクトリ
 * @returns 絶対パス配列
 */
async function collectJsonlFiles(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir)) {
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
 * コーパスを走査し type ごとに生サンプルを集約する。
 *
 * @param corpusDir - コーパスのルートディレクトリ
 * @param maxSamplesPerType - type ごとの保持上限 (メモリ保護、既定 5000)
 */
export async function scanCorpus(
  corpusDir: string,
  maxSamplesPerType = 5000
): Promise<ScanResult> {
  const samplesByType = new Map<string, Record<string, unknown>[]>()
  let totalLines = 0
  let malformedLines = 0
  let typelessLines = 0

  for (const file of await collectJsonlFiles(corpusDir)) {
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
      if (bucket.length < maxSamplesPerType) {
        bucket.push(record)
        samplesByType.set(type, bucket)
      }
    }
  }

  return { samplesByType, totalLines, malformedLines, typelessLines }
}
