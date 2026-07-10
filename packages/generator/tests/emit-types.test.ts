import { describe, it, expect } from 'vitest'
import { emitInterface, tsTypeOf } from '../src/emit-types'
import { inferShape } from '../src/infer'

describe('tsTypeOf', () => {
  it('単一種別を TS 型に写像する', () => {
    expect(tsTypeOf(new Set(['string']))).toBe('string')
    expect(tsTypeOf(new Set(['number']))).toBe('number')
    expect(tsTypeOf(new Set(['boolean']))).toBe('boolean')
    expect(tsTypeOf(new Set(['object']))).toBe('Record<string, unknown>')
    expect(tsTypeOf(new Set(['array']))).toBe('unknown[]')
  })

  it('null との union を書ける', () => {
    expect(tsTypeOf(new Set(['object', 'null']))).toBe('Record<string, unknown> | null')
  })

  it('文字列リテラル集合を開いた union で書く', () => {
    expect(tsTypeOf(new Set(['string']), new Set(['a', 'b']))).toBe("'a' | 'b' | (string & {})")
  })
})

describe('emitInterface', () => {
  it('required/optional を反映した interface 文字列を出す', () => {
    // maxLiterals: 0 で文字列リテラル収集を無効化し、
    // このテストの本来の関心事 (required/optional の反映) だけを検証する。
    // リテラル union 化自体は tsTypeOf の別テストで検証済み。
    const shape = inferShape(
      [
        { type: 'last-prompt', leafUuid: 'u', sessionId: 's', lastPrompt: 'p' },
        { type: 'last-prompt', leafUuid: 'u2', sessionId: 's2' },
      ],
      { maxLiterals: 0 }
    )
    const out = emitInterface('LastPromptEntry', 'last-prompt', shape)
    expect(out).toContain("type: 'last-prompt'")
    expect(out).toContain('leafUuid: string')
    expect(out).toContain('lastPrompt?: string')
    expect(out).toContain("_kind: 'known'")
  })
})
