import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { validateLine, aggregateReport, hasFindings } from '../src/validate'

describe('validateLine', () => {
  it('a valid line of a known type has no findings', () => {
    const f = validateLine({ type: 'mode', mode: 'normal', sessionId: 's' })
    expect(f).toHaveLength(0)
  })

  it('detects an unknown type', () => {
    const f = validateLine({ type: 'brand-new', x: 1 })
    expect(f.some((x) => x.kind === 'unknown-type')).toBe(true)
  })

  it('detects a missing required field', () => {
    const f = validateLine({ type: 'mode', sessionId: 's' })
    expect(f.some((x) => x.kind === 'schema-mismatch')).toBe(true)
  })

  it('detects a type mismatch', () => {
    const f = validateLine({ type: 'pr-link', prNumber: 'no', prRepository: 'r', prUrl: 'u', sessionId: 's', timestamp: 't' })
    expect(f.some((x) => x.kind === 'schema-mismatch')).toBe(true)
  })

  it('detects an unknown field (known type but a key outside the schema)', () => {
    const f = validateLine({ type: 'mode', mode: 'normal', sessionId: 's', brandNewField: 1 })
    expect(f.some((x) => x.kind === 'unknown-field' && x.field === 'brandNewField')).toBe(true)
  })

  it('detects a line without a type', () => {
    const f = validateLine({ foo: 1 })
    expect(f.some((x) => x.kind === 'no-type')).toBe(true)
  })
})

describe('aggregateReport / hasFindings', () => {
  it('groups findings by type', () => {
    const report = aggregateReport([
      { type: 'mode', kind: 'unknown-field', field: 'x', message: 'm' },
      { type: 'mode', kind: 'unknown-field', field: 'y', message: 'm' },
      { type: 'brand-new', kind: 'unknown-type', message: 'm' },
    ])
    expect(report.get('mode')?.length).toBe(2)
    expect(report.get('brand-new')?.length).toBe(1)
  })

  it('hasFindings is false when empty and true otherwise', () => {
    expect(hasFindings(new Map())).toBe(false)
    expect(hasFindings(new Map([['mode', [{ type: 'mode', kind: 'no-type', message: 'm' }]]]))).toBe(true)
  })
})

it('detects every finding kind from regressions.jsonl', () => {
  const fixturePath = path.join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'regressions.jsonl')
  const findings = readFileSync(fixturePath, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '')
    .flatMap((l) => validateLine(JSON.parse(l)))
  const kinds = new Set(findings.map((f) => f.kind))
  expect(kinds.has('unknown-type')).toBe(true)
  expect(kinds.has('unknown-field')).toBe(true)
  expect(kinds.has('schema-mismatch')).toBe(true)
})
