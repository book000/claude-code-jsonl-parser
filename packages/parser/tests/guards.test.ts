import { describe, it, expect } from 'vitest'
import {
  guards, guardByType, KNOWN_TYPES,
  normalizeAssistantContent, normalizeUserContent,
} from '../src/generated/guards'

describe('generated/guards - top level', () => {
  it('KNOWN_TYPES contains 19 types', () => {
    expect(KNOWN_TYPES).toHaveLength(19)
    expect(KNOWN_TYPES).toContain('assistant')
    expect(KNOWN_TYPES).toContain('result')
  })

  it('accepts a valid mode line', () => {
    expect(guards.mode({ type: 'mode', mode: 'normal', sessionId: 's' })).toEqual({ ok: true })
  })

  it('rejects a mode line with a missing required field and returns the reason', () => {
    expect(guards.mode({ type: 'mode', sessionId: 's' }).ok).toBe(false)
    expect(guards.mode({ type: 'mode', sessionId: 's' }).reason).toContain('mode')
    expect(guards.mode({ type: 'mode', mode: 123, sessionId: 's' }).ok).toBe(false)
  })

  it('pr-link requires prNumber to be a number', () => {
    const base = { type: 'pr-link', prRepository: 'r', prUrl: 'u', sessionId: 's', timestamp: 't' }
    expect(guardByType('pr-link', { ...base, prNumber: 42 })).toEqual({ ok: true })
    expect(guardByType('pr-link', { ...base, prNumber: '42' })?.ok).toBe(false)
  })

  it('assistant requires a message object and the required metadata', () => {
    const ok = {
      type: 'assistant', cwd: '/x', entrypoint: 'cli', gitBranch: 'm',
      isSidechain: false, parentUuid: null, sessionId: 's', timestamp: 't',
      userType: 'external', uuid: 'u', version: '1',
      message: { role: 'assistant', content: [], id: 'msg_1', model: 'claude-x' },
    }
    expect(guardByType('assistant', ok)).toEqual({ ok: true })
    expect(guardByType('assistant', { ...ok, message: 'not-object' })?.ok).toBe(false)
    expect(guardByType('assistant', { ...ok, uuid: undefined })?.ok).toBe(false)
    expect(guardByType('assistant', { ...ok, uuid: undefined })?.reason).toContain('uuid')
  })

  it('assistant rejects a line missing message.role / id / model', () => {
    const base = {
      type: 'assistant', cwd: '/x', entrypoint: 'cli', gitBranch: 'm',
      isSidechain: false, parentUuid: null, sessionId: 's', timestamp: 't',
      userType: 'external', uuid: 'u', version: '1',
    }
    expect(
      guardByType('assistant', {
        ...base,
        message: { content: [], id: 'msg_1', model: 'claude-x' },
      })?.ok
    ).toBe(false)
    expect(
      guardByType('assistant', {
        ...base,
        message: { role: 'assistant', content: [], model: 'claude-x' },
      })?.ok
    ).toBe(false)
    expect(
      guardByType('assistant', {
        ...base,
        message: { role: 'assistant', content: [], id: 'msg_1' },
      })?.ok
    ).toBe(false)
  })

  it('user requires message.role', () => {
    const base = {
      type: 'user', cwd: '/x', entrypoint: 'cli', gitBranch: 'm',
      isSidechain: false, parentUuid: null, sessionId: 's', timestamp: 't',
      userType: 'external', uuid: 'u', version: '1',
    }
    expect(guardByType('user', { ...base, message: { role: 'user', content: 'hi' } })).toEqual({ ok: true })
    expect(guardByType('user', { ...base, message: { content: 'hi' } })?.ok).toBe(false)
  })

  it('started passes without a sessionId (workflow journal)', () => {
    expect(guardByType('started', { type: 'started', key: 'k', agentId: 'a' })).toEqual({ ok: true })
  })

  it('guardByType returns undefined for an unknown type', () => {
    expect(guardByType('no-such-type', {})).toBeUndefined()
  })
})

describe('generated/guards - content blocks (hybrid)', () => {
  it('assistant content keeps known blocks and demotes unknown ones to UnknownContentBlock', () => {
    const out = normalizeAssistantContent([
      { type: 'text', text: 'hi' },
      { type: 'thinking', thinking: 'x', signature: 's' },
      { type: 'tool_use', id: 'i', name: 'n', input: {} },
      { type: 'bogus', foo: 1 },
      { type: 'text' }, // text missing: demoted
    ])
    expect(out[0]).toEqual({ _kind: 'known', type: 'text', text: 'hi' })
    expect((out[1] as { type: string }).type).toBe('thinking')
    expect((out[2] as { type: string }).type).toBe('tool_use')
    expect(out[3]).toEqual({ _kind: 'unknown', raw: { type: 'bogus', foo: 1 } })
    expect(out[4]).toEqual({ _kind: 'unknown', raw: { type: 'text' } })
  })

  it('returns user content as is when it is a string', () => {
    expect(normalizeUserContent('plain')).toBe('plain')
  })

  it('normalizes the inner blocks of a user tool_result', () => {
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

  it('keeps tool_result.content as is when it is a string', () => {
    const out = normalizeUserContent([
      { type: 'tool_result', tool_use_id: 'x', content: 'stringy', is_error: true },
    ]) as unknown[]
    expect((out[0] as { content: string }).content).toBe('stringy')
  })

  it('demotes non-array assistant content (null / object) to a single UnknownContentBlock', () => {
    expect(normalizeAssistantContent(null)).toEqual([
      { _kind: 'unknown', raw: null },
    ])
    expect(normalizeAssistantContent({ not: 'array' })).toEqual([
      { _kind: 'unknown', raw: { not: 'array' } },
    ])
  })

  it('demotes user content that is neither an array nor a string (null / object) to a single UnknownContentBlock', () => {
    expect(normalizeUserContent(null)).toEqual([
      { _kind: 'unknown', raw: null },
    ])
    expect(normalizeUserContent({ not: 'array' })).toEqual([
      { _kind: 'unknown', raw: { not: 'array' } },
    ])
  })
})
