import { describe, it, expect } from 'vitest'
import { inferShape, jsonKind } from '../src/infer'

describe('jsonKind', () => {
  it('returns the kind of a JSON value', () => {
    expect(jsonKind('x')).toBe('string')
    expect(jsonKind(1)).toBe('number')
    expect(jsonKind(true)).toBe('boolean')
    expect(jsonKind(null)).toBe('null')
    expect(jsonKind([])).toBe('array')
    expect(jsonKind({})).toBe('object')
  })
})

describe('inferShape', () => {
  it('marks fields present in every sample as required', () => {
    const shape = inferShape([
      { type: 'mode', mode: 'normal', sessionId: 's' },
      { type: 'mode', mode: 'plan', sessionId: 's2' },
    ])
    expect(shape.fields.get('mode')?.required).toBe(true)
    expect(shape.fields.get('sessionId')?.required).toBe(true)
  })

  it('marks fields present in only some samples as optional', () => {
    const shape = inferShape([
      { type: 'last-prompt', leafUuid: 'u', sessionId: 's', lastPrompt: 'p' },
      { type: 'last-prompt', leafUuid: 'u2', sessionId: 's2' },
    ])
    expect(shape.fields.get('lastPrompt')?.required).toBe(false)
    expect(shape.fields.get('leafUuid')?.required).toBe(true)
  })

  it('records the observed kinds (e.g. a mix of null and string)', () => {
    const shape = inferShape([
      { type: 'worktree-state', worktreeSession: null, sessionId: 's' },
      { type: 'worktree-state', worktreeSession: { a: 1 }, sessionId: 's2' },
    ])
    const f = shape.fields.get('worktreeSession')
    expect([...(f?.kinds ?? [])].toSorted((a, b) => a.localeCompare(b))).toEqual(['null', 'object'])
  })

  it('keeps a small number of string literals as literals', () => {
    const shape = inferShape([
      { type: 'permission-mode', permissionMode: 'default', sessionId: 's' },
      { type: 'permission-mode', permissionMode: 'plan', sessionId: 's' },
      { type: 'permission-mode', permissionMode: 'auto', sessionId: 's' },
    ])
    const f = shape.fields.get('permissionMode')
    expect(f?.literals && [...f.literals].toSorted((a, b) => a.localeCompare(b))).toEqual(['auto', 'default', 'plan'])
  })

  it('drops literals above the threshold (treated as free-form strings)', () => {
    const samples = Array.from({ length: 60 }, (_, i) => ({
      type: 'ai-title', aiTitle: `title-${i}`, sessionId: 's',
    }))
    const shape = inferShape(samples, { maxLiterals: 20 })
    expect(shape.fields.get('aiTitle')?.literals).toBeUndefined()
  })
})
