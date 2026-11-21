import { describe, it, expect } from 'vitest'
import { emitInterface, tsTypeOf } from '../src/emit-types'
import { inferShape } from '../src/infer'

describe('tsTypeOf', () => {
  it('maps a single kind to a TS type', () => {
    expect(tsTypeOf(new Set(['string']))).toBe('string')
    expect(tsTypeOf(new Set(['number']))).toBe('number')
    expect(tsTypeOf(new Set(['boolean']))).toBe('boolean')
    expect(tsTypeOf(new Set(['object']))).toBe('Record<string, unknown>')
    expect(tsTypeOf(new Set(['array']))).toBe('unknown[]')
  })

  it('can write a union with null', () => {
    expect(tsTypeOf(new Set(['object', 'null']))).toBe('Record<string, unknown> | null')
  })

  it('writes a string literal set as an open union', () => {
    expect(tsTypeOf(new Set(['string']), new Set(['a', 'b']))).toBe("'a' | 'b' | (string & {})")
  })
})

describe('emitInterface', () => {
  it('emits an interface source reflecting required / optional', () => {
    // maxLiterals: 0 disables string literal collection so that this test only
    // verifies its own concern (reflecting required / optional).
    // The literal union itself is covered by the separate tsTypeOf tests.
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
