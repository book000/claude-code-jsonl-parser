import { describe, it, expect } from 'vitest'
import {
  guards, guardByType, KNOWN_TYPES,
  normalizeAssistantContent, normalizeUserContent,
} from '../src/generated/guards'

describe('generated/guards — トップレベル', () => {
  it('KNOWN_TYPES は 19 種を含む', () => {
    expect(KNOWN_TYPES).toHaveLength(19)
    expect(KNOWN_TYPES).toContain('assistant')
    expect(KNOWN_TYPES).toContain('result')
  })

  it('mode の正しい行を通す', () => {
    expect(guards.mode({ type: 'mode', mode: 'normal', sessionId: 's' })).toBe(true)
  })

  it('mode で必須フィールド欠落を弾く', () => {
    expect(guards.mode({ type: 'mode', sessionId: 's' })).toBe(false)
    expect(guards.mode({ type: 'mode', mode: 123, sessionId: 's' })).toBe(false)
  })

  it('pr-link は prNumber が number であることを要求する', () => {
    const base = { type: 'pr-link', prRepository: 'r', prUrl: 'u', sessionId: 's', timestamp: 't' }
    expect(guardByType('pr-link', { ...base, prNumber: 42 })).toBe(true)
    expect(guardByType('pr-link', { ...base, prNumber: '42' })).toBe(false)
  })

  it('assistant は message object と必須メタを要求する', () => {
    const ok = {
      type: 'assistant', cwd: '/x', entrypoint: 'cli', gitBranch: 'm',
      isSidechain: false, parentUuid: null, sessionId: 's', timestamp: 't',
      userType: 'external', uuid: 'u', version: '1',
      message: { role: 'assistant', content: [], id: 'msg_1', model: 'claude-x' },
    }
    expect(guardByType('assistant', ok)).toBe(true)
    expect(guardByType('assistant', { ...ok, message: 'not-object' })).toBe(false)
    expect(guardByType('assistant', { ...ok, uuid: undefined })).toBe(false)
  })

  it('assistant は message.role / id / model が欠落した行を弾く', () => {
    const base = {
      type: 'assistant', cwd: '/x', entrypoint: 'cli', gitBranch: 'm',
      isSidechain: false, parentUuid: null, sessionId: 's', timestamp: 't',
      userType: 'external', uuid: 'u', version: '1',
    }
    expect(
      guardByType('assistant', {
        ...base,
        message: { content: [], id: 'msg_1', model: 'claude-x' },
      })
    ).toBe(false)
    expect(
      guardByType('assistant', {
        ...base,
        message: { role: 'assistant', content: [], model: 'claude-x' },
      })
    ).toBe(false)
    expect(
      guardByType('assistant', {
        ...base,
        message: { role: 'assistant', content: [], id: 'msg_1' },
      })
    ).toBe(false)
  })

  it('user は message.role を要求する', () => {
    const base = {
      type: 'user', cwd: '/x', entrypoint: 'cli', gitBranch: 'm',
      isSidechain: false, parentUuid: null, sessionId: 's', timestamp: 't',
      userType: 'external', uuid: 'u', version: '1',
    }
    expect(guardByType('user', { ...base, message: { role: 'user', content: 'hi' } })).toBe(true)
    expect(guardByType('user', { ...base, message: { content: 'hi' } })).toBe(false)
  })

  it('started は sessionId 無しでも通る (workflow journal)', () => {
    expect(guardByType('started', { type: 'started', key: 'k', agentId: 'a' })).toBe(true)
  })

  it('未知 type は guardByType が undefined を返す', () => {
    expect(guardByType('no-such-type', {})).toBeUndefined()
  })
})

describe('generated/guards — content ブロック (ハイブリッド)', () => {
  it('assistant content の既知ブロックはそのまま、未知は UnknownContentBlock に降格', () => {
    const out = normalizeAssistantContent([
      { type: 'text', text: 'hi' },
      { type: 'thinking', thinking: 'x', signature: 's' },
      { type: 'tool_use', id: 'i', name: 'n', input: {} },
      { type: 'bogus', foo: 1 },
      { type: 'text' }, // text 欠落 → 降格
    ])
    expect(out[0]).toEqual({ type: 'text', text: 'hi' })
    expect((out[1] as { type: string }).type).toBe('thinking')
    expect((out[2] as { type: string }).type).toBe('tool_use')
    expect(out[3]).toEqual({ _kind: 'unknown', raw: { type: 'bogus', foo: 1 } })
    expect(out[4]).toEqual({ _kind: 'unknown', raw: { type: 'text' } })
  })

  it('user content が文字列ならそのまま返す', () => {
    expect(normalizeUserContent('plain')).toBe('plain')
  })

  it('user content の tool_result は内部ブロックも正規化する', () => {
    const out = normalizeUserContent([
      { type: 'text', text: 't' },
      {
        type: 'tool_result', tool_use_id: 'x', content: [
          { type: 'text', text: 'r' },
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } },
          { type: 'tool_reference', tool_name: 'grep' },
          { type: 'weird' },
        ],
      },
    ])
    expect(Array.isArray(out)).toBe(true)
    const arr = out as unknown[]
    const tr = arr[1] as { type: string; content: unknown[] }
    expect(tr.type).toBe('tool_result')
    expect((tr.content[3] as { _kind: string })._kind).toBe('unknown')
  })

  it('tool_result.content が文字列ならそのまま', () => {
    const out = normalizeUserContent([
      { type: 'tool_result', tool_use_id: 'x', content: 'stringy', is_error: true },
    ]) as unknown[]
    expect((out[0] as { content: string }).content).toBe('stringy')
  })

  it('assistant content が非配列 (null/object) なら UnknownContentBlock 1 件に降格する', () => {
    expect(normalizeAssistantContent(null)).toEqual([
      { _kind: 'unknown', raw: null },
    ])
    expect(normalizeAssistantContent({ not: 'array' })).toEqual([
      { _kind: 'unknown', raw: { not: 'array' } },
    ])
  })

  it('user content が非配列・非文字列 (null/object) なら UnknownContentBlock 1 件に降格する', () => {
    expect(normalizeUserContent(null)).toEqual([
      { _kind: 'unknown', raw: null },
    ])
    expect(normalizeUserContent({ not: 'array' })).toEqual([
      { _kind: 'unknown', raw: { not: 'array' } },
    ])
  })
})
