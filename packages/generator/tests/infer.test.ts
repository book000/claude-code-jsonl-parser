import { describe, it, expect } from 'vitest'
import { inferShape, jsonKind } from '../src/infer'

describe('jsonKind', () => {
  it('JSON 値の種別を返す', () => {
    expect(jsonKind('x')).toBe('string')
    expect(jsonKind(1)).toBe('number')
    expect(jsonKind(true)).toBe('boolean')
    expect(jsonKind(null)).toBe('null')
    expect(jsonKind([])).toBe('array')
    expect(jsonKind({})).toBe('object')
  })
})

describe('inferShape', () => {
  it('全サンプルに存在するフィールドを required にする', () => {
    const shape = inferShape([
      { type: 'mode', mode: 'normal', sessionId: 's' },
      { type: 'mode', mode: 'plan', sessionId: 's2' },
    ])
    expect(shape.fields.get('mode')?.required).toBe(true)
    expect(shape.fields.get('sessionId')?.required).toBe(true)
  })

  it('一部サンプルにのみ存在するフィールドを optional にする', () => {
    const shape = inferShape([
      { type: 'last-prompt', leafUuid: 'u', sessionId: 's', lastPrompt: 'p' },
      { type: 'last-prompt', leafUuid: 'u2', sessionId: 's2' },
    ])
    expect(shape.fields.get('lastPrompt')?.required).toBe(false)
    expect(shape.fields.get('leafUuid')?.required).toBe(true)
  })

  it('観測された型集合を記録する (null と string の混在など)', () => {
    const shape = inferShape([
      { type: 'worktree-state', worktreeSession: null, sessionId: 's' },
      { type: 'worktree-state', worktreeSession: { a: 1 }, sessionId: 's2' },
    ])
    const f = shape.fields.get('worktreeSession')
    expect([...(f?.kinds ?? [])].sort()).toEqual(['null', 'object'])
  })

  it('少数のリテラル文字列は literals として保持する', () => {
    const shape = inferShape([
      { type: 'permission-mode', permissionMode: 'default', sessionId: 's' },
      { type: 'permission-mode', permissionMode: 'plan', sessionId: 's' },
      { type: 'permission-mode', permissionMode: 'auto', sessionId: 's' },
    ])
    const f = shape.fields.get('permissionMode')
    expect(f?.literals && [...f.literals].sort()).toEqual(['auto', 'default', 'plan'])
  })

  it('リテラルが閾値超なら literals を落とす (自由文字列扱い)', () => {
    const samples = Array.from({ length: 60 }, (_, i) => ({
      type: 'ai-title', aiTitle: `title-${i}`, sessionId: 's',
    }))
    const shape = inferShape(samples, { maxLiterals: 20 })
    expect(shape.fields.get('aiTitle')?.literals).toBeUndefined()
  })
})
