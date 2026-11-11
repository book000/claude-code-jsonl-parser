import { describe, it, expect } from 'vitest'
import { entrySchemas, knownTypeSchema } from '../src/schemas'

describe('public zod schemas', () => {
  it('the mode schema accepts a valid line and rejects a missing field', () => {
    expect(entrySchemas.mode.safeParse({ type: 'mode', mode: 'normal', sessionId: 's' }).success).toBe(true)
    expect(entrySchemas.mode.safeParse({ type: 'mode', sessionId: 's' }).success).toBe(false)
  })

  it('pr-link requires prNumber as a number', () => {
    const ok = { type: 'pr-link', prNumber: 1, prRepository: 'r', prUrl: 'u', sessionId: 's', timestamp: 't' }
    expect(entrySchemas['pr-link'].safeParse(ok).success).toBe(true)
    expect(entrySchemas['pr-link'].safeParse({ ...ok, prNumber: '1' }).success).toBe(false)
  })

  it('knownTypeSchema returns the schema for the type', () => {
    expect(knownTypeSchema('mode')).toBe(entrySchemas.mode)
    expect(knownTypeSchema('no-such')).toBeUndefined()
  })

  it('assistant requires a message object and the required metadata', () => {
    const ok = {
      type: 'assistant', cwd: '/x', entrypoint: 'cli', gitBranch: 'm',
      isSidechain: false, parentUuid: null, sessionId: 's', timestamp: 't',
      userType: 'external', uuid: 'u', version: '1', message: { role: 'assistant', content: [] },
    }
    expect(entrySchemas.assistant.safeParse(ok).success).toBe(true)
  })

  it('result accepts any value when the result key exists and rejects a missing key', () => {
    const base = { type: 'result', key: 'k', agentId: 'a' }
    expect(entrySchemas.result.safeParse({ ...base, result: null }).success).toBe(true)
    expect(entrySchemas.result.safeParse({ ...base, result: { ok: true } }).success).toBe(true)
    expect(entrySchemas.result.safeParse(base).success).toBe(false)
  })
})
