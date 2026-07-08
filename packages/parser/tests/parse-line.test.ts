import { describe, it, expect } from 'vitest'
import { parseLine } from '../src/parse-line'

describe('parseLine', () => {
  it('JSON 構文エラーは LineParseError になる', () => {
    const r = parseLine('{ not json', 3)
    expect(r._kind).toBe('error')
    if (r._kind === 'error') {
      expect(r.lineNumber).toBe(3)
      expect(r.rawLine).toBe('{ not json')
      expect(r.message).toMatch(/./)
    }
  })

  it('既知 type かつ shape 一致で KnownEntry になり _kind=known が付与される', () => {
    const r = parseLine(JSON.stringify({ type: 'mode', mode: 'normal', sessionId: 's' }), 1)
    expect(r._kind).toBe('known')
    if (r._kind === 'known') {
      expect(r.type).toBe('mode')
    }
  })

  it('既知 type だが shape 不一致なら typeHint 付き UnknownEntry', () => {
    const r = parseLine(JSON.stringify({ type: 'mode', sessionId: 's' }), 5)
    expect(r._kind).toBe('unknown')
    if (r._kind === 'unknown') {
      expect(r.typeHint).toBe('mode')
      expect(r.lineNumber).toBe(5)
    }
  })

  it('存在しない type は typeHint なし UnknownEntry', () => {
    const r = parseLine(JSON.stringify({ type: 'brand-new', x: 1 }), 2)
    expect(r._kind).toBe('unknown')
    if (r._kind === 'unknown') {
      expect(r.typeHint).toBeUndefined()
    }
  })

  it('type フィールドが無いオブジェクトも UnknownEntry (typeHint なし)', () => {
    const r = parseLine(JSON.stringify({ foo: 1 }), 1)
    expect(r._kind).toBe('unknown')
    if (r._kind === 'unknown') expect(r.typeHint).toBeUndefined()
  })

  it('assistant の content 配列はハイブリッド正規化される', () => {
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
    if (r._kind === 'known' && r.type === 'assistant') {
      expect(r.message.content[0]).toEqual({ type: 'text', text: 'hi' })
      expect((r.message.content[1] as { _kind: string })._kind).toBe('unknown')
    }
  })
})
