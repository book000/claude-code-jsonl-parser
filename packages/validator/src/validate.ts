import { entrySchemas, knownTypeSchema } from 'claude-code-jsonl-generator'

/** Kind of finding. */
export type FindingKind =
  | 'no-type'
  | 'unknown-type'
  | 'schema-mismatch'
  | 'unknown-field'

/** One finding. */
export interface Finding {
  /** Target type (`'<no-type>'` if the line has none). */
  type: string
  kind: FindingKind
  /** Field name for `unknown-field` (and the issue path for `schema-mismatch`). */
  field?: string
  message: string
}

/** Returns the top-level keys declared by the schema of a known type. */
function knownKeysOf(type: string): Set<string> | undefined {
  const schema = (
    entrySchemas as Record<string, { shape?: Record<string, unknown> } | undefined>
  )[type]
  return schema?.shape ? new Set(Object.keys(schema.shape)) : undefined
}

/**
 * Validates one line (parsed JSON) and returns its findings.
 *
 * @param obj - Parsed raw JSON
 */
export function validateLine(obj: unknown): Finding[] {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return [{ type: '<no-type>', kind: 'no-type', message: 'not a JSON object' }]
  }
  const record = obj as Record<string, unknown>
  const type = record.type
  if (typeof type !== 'string') {
    return [{ type: '<no-type>', kind: 'no-type', message: 'missing string "type"' }]
  }

  const findings: Finding[] = []
  const schema = knownTypeSchema(type)
  if (schema === undefined) {
    return [{ type, kind: 'unknown-type', message: `unknown type "${type}"` }]
  }

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
 * Groups findings by type.
 *
 * @param findings - All findings
 */
export function aggregateReport(findings: Finding[]): Map<string, Finding[]> {
  const report = new Map<string, Finding[]>()
  // eslint-disable-next-line unicorn/prefer-group-by -- Map.groupBy is ES2024; avoid changing the lib target (ES2023) of the published package
  for (const f of findings) {
    const bucket = report.get(f.type) ?? []
    bucket.push(f)
    report.set(f.type, bucket)
  }
  return report
}

/**
 * Returns true if the report contains at least one finding.
 *
 * @param report - Aggregated report
 */
export function hasFindings(report: Map<string, Finding[]>): boolean {
  for (const bucket of report.values()) {
    if (bucket.length > 0) return true
  }
  return false
}
