import { describe, it, expect } from 'vitest'
import { entrySchemas, knownTypeSchema } from '../src/schemas'

describe('公開 zod スキーマ', () => {
  it('mode スキーマは正しい行を通し、欠落を弾く', () => {
    expect(entrySchemas.mode.safeParse({ type: 'mode', mode: 'normal', sessionId: 's' }).success).toBe(true)
    expect(entrySchemas.mode.safeParse({ type: 'mode', sessionId: 's' }).success).toBe(false)
  })

  it('pr-link は prNumber:number を要求する', () => {
    const ok = { type: 'pr-link', prNumber: 1, prRepository: 'r', prUrl: 'u', sessionId: 's', timestamp: 't' }
    expect(entrySchemas['pr-link'].safeParse(ok).success).toBe(true)
    expect(entrySchemas['pr-link'].safeParse({ ...ok, prNumber: '1' }).success).toBe(false)
  })

  it('knownTypeSchema は type に応じたスキーマを返す', () => {
    expect(knownTypeSchema('mode')).toBe(entrySchemas.mode)
    expect(knownTypeSchema('no-such')).toBeUndefined()
  })

  it('assistant は message object と必須メタを要求する', () => {
    const ok = {
      type: 'assistant', cwd: '/x', entrypoint: 'cli', gitBranch: 'm',
      isSidechain: false, parentUuid: null, sessionId: 's', timestamp: 't',
      userType: 'external', uuid: 'u', version: '1', message: { role: 'assistant', content: [] },
    }
    expect(entrySchemas.assistant.safeParse(ok).success).toBe(true)
  })
})
