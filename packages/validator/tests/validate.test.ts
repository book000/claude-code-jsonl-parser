import { describe, it, expect } from 'vitest'
import { validateLine, aggregateReport, hasFindings } from '../src/validate'

describe('validateLine', () => {
  it('既知 type の正しい行は findings 無し', () => {
    const f = validateLine({ type: 'mode', mode: 'normal', sessionId: 's' })
    expect(f).toHaveLength(0)
  })

  it('未知 type を検出する', () => {
    const f = validateLine({ type: 'brand-new', x: 1 })
    expect(f.some((x) => x.kind === 'unknown-type')).toBe(true)
  })

  it('必須フィールド欠落を検出する', () => {
    const f = validateLine({ type: 'mode', sessionId: 's' })
    expect(f.some((x) => x.kind === 'schema-mismatch')).toBe(true)
  })

  it('型不一致を検出する', () => {
    const f = validateLine({ type: 'pr-link', prNumber: 'no', prRepository: 'r', prUrl: 'u', sessionId: 's', timestamp: 't' })
    expect(f.some((x) => x.kind === 'schema-mismatch')).toBe(true)
  })

  it('未知フィールド出現を検出する (既知 type だがスキーマ外キー)', () => {
    const f = validateLine({ type: 'mode', mode: 'normal', sessionId: 's', brandNewField: 1 })
    expect(f.some((x) => x.kind === 'unknown-field' && x.field === 'brandNewField')).toBe(true)
  })

  it('type 無し行を検出する', () => {
    const f = validateLine({ foo: 1 })
    expect(f.some((x) => x.kind === 'no-type')).toBe(true)
  })
})

describe('aggregateReport / hasFindings', () => {
  it('type ごとに findings を集計する', () => {
    const report = aggregateReport([
      { type: 'mode', kind: 'unknown-field', field: 'x', message: 'm' },
      { type: 'mode', kind: 'unknown-field', field: 'y', message: 'm' },
      { type: 'brand-new', kind: 'unknown-type', message: 'm' },
    ])
    expect(report.get('mode')?.length).toBe(2)
    expect(report.get('brand-new')?.length).toBe(1)
  })

  it('hasFindings は空で false, 非空で true', () => {
    expect(hasFindings(new Map())).toBe(false)
    expect(hasFindings(new Map([['mode', [{ type: 'mode', kind: 'no-type', message: 'm' }]]]))).toBe(true)
  })
})
