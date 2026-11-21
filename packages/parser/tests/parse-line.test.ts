import { describe, it, expect } from 'vitest'
import { parseLine } from '../src/parse-line'

describe('parseLine', () => {
  it('a JSON syntax error becomes a LineParseError', () => {
    const r = parseLine('{ not json', 3)
    expect(r._kind).toBe('error')
    if (r._kind !== 'error') {
      return
    }

    expect(r.lineNumber).toBe(3)
    expect(r.rawLine).toBe('{ not json')
    expect(r.message).toMatch(/./)
  })

  it('a known type with a matching shape becomes a KnownEntry with _kind=known', () => {
    const r = parseLine(JSON.stringify({ type: 'mode', mode: 'normal', sessionId: 's' }), 1)
    expect(r._kind).toBe('known')
    if (r._kind === 'known') {
      expect(r.type).toBe('mode')
    }
  })

  it('a known type with a mismatched shape becomes an UnknownEntry with typeHint', () => {
    const r = parseLine(JSON.stringify({ type: 'mode', sessionId: 's' }), 5)
    expect(r._kind).toBe('unknown')
    if (r._kind !== 'unknown') {
      return
    }

    expect(r.typeHint).toBe('mode')
    expect(r.lineNumber).toBe(5)
    expect(r.reason).toContain('mode')
  })

  it('a nonexistent type becomes an UnknownEntry without typeHint', () => {
    const r = parseLine(JSON.stringify({ type: 'brand-new', x: 1 }), 2)
    expect(r._kind).toBe('unknown')
    if (r._kind === 'unknown') {
      expect(r.typeHint).toBeUndefined()
    }
  })

  it('an object without a type field is also an UnknownEntry (no typeHint)', () => {
    const r = parseLine(JSON.stringify({ foo: 1 }), 1)
    expect(r._kind).toBe('unknown')
    if (r._kind === 'unknown') expect(r.typeHint).toBeUndefined()
  })

  it('assistant content arrays are normalized in the hybrid way', () => {
    const raw = {
      type: 'assistant', cwd: '/x', entrypoint: 'cli', gitBranch: 'm',
      isSidechain: false, parentUuid: null, sessionId: 's', timestamp: 't',
      userType: 'external', uuid: 'u', version: '1',
      message: {
        id: 'm', type: 'message', role: 'assistant', model: 'c',
        stop_reason: null, stop_sequence: null, stop_details: null, usage: {},
        content: [{ type: 'text', text: 'hi' }, { type: 'bogus' }],
      },
    }
    const r = parseLine(JSON.stringify(raw), 1)
    expect(r._kind).toBe('known')
    if (!(r._kind === 'known' && r.type === 'assistant')) {
      return
    }

    expect(r.message.content[0]).toEqual({ _kind: 'known', type: 'text', text: 'hi' })
    expect((r.message.content[1] as { _kind: string })._kind).toBe('unknown')
  })
})
