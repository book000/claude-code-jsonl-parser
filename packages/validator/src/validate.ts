import { entrySchemas, knownTypeSchema } from 'claude-code-jsonl-generator'

/** 検出種別。 */
export type FindingKind =
  | 'no-type'
  | 'unknown-type'
  | 'schema-mismatch'
  | 'unknown-field'

/** 1 件の検出。 */
export interface Finding {
  /** 対象 type (type 無しの場合は '<no-type>')。 */
  type: string
  kind: FindingKind
  /** unknown-field のときのフィールド名。 */
  field?: string
  message: string
}

/** 既知 type のスキーマが宣言しているトップレベルキー集合を取り出す。 */
function knownKeysOf(type: string): Set<string> | undefined {
  const schema = (
    entrySchemas as Record<string, { shape?: Record<string, unknown> } | undefined>
  )[type]
  if (!schema?.shape) return undefined
  return new Set(Object.keys(schema.shape))
}

/**
 * 1 行 (パース済み JSON) を検証して findings を返す。
 *
 * @param obj - パース済みの生 JSON
 */
export function validateLine(obj: unknown): Finding[] {
  const findings: Finding[] = []
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return [{ type: '<no-type>', kind: 'no-type', message: 'not a JSON object' }]
  }
  const record = obj as Record<string, unknown>
  const type = record.type
  if (typeof type !== 'string') {
    return [{ type: '<no-type>', kind: 'no-type', message: 'missing string "type"' }]
  }

  const schema = knownTypeSchema(type)
  if (schema === undefined) {
    return [{ type, kind: 'unknown-type', message: `unknown type "${type}"` }]
  }

  // スキーマ検証 (必須欠落・型不一致)
  const parsed = schema.safeParse(record)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      findings.push({
        type,
        kind: 'schema-mismatch',
        field: issue.path.join('.') || undefined,
        message: `${issue.path.join('.')}: ${issue.message}`,
      })
    }
  }

  // 未知フィールド検出 (スキーマが列挙するキー以外)
  const known = knownKeysOf(type)
  if (known) {
    for (const key of Object.keys(record)) {
      if (!known.has(key)) {
        findings.push({
          type,
          kind: 'unknown-field',
          field: key,
          message: `unknown field "${key}" on type "${type}"`,
        })
      }
    }
  }

  return findings
}

/**
 * findings を type ごとに集計する。
 *
 * @param findings - 全 findings
 */
export function aggregateReport(findings: Finding[]): Map<string, Finding[]> {
  const report = new Map<string, Finding[]>()
  for (const f of findings) {
    const bucket = report.get(f.type) ?? []
    bucket.push(f)
    report.set(f.type, bucket)
  }
  return report
}

/**
 * レポートに 1 件でも finding があれば true。
 *
 * @param report - 集計済みレポート
 */
export function hasFindings(report: Map<string, Finding[]>): boolean {
  for (const bucket of report.values()) {
    if (bucket.length > 0) return true
  }
  return false
}
