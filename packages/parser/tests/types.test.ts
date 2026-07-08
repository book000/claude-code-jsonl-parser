import { describe, it, expect } from 'vitest'
import type { ParsedLine, AssistantEntry } from '../src/generated/types'

describe('generated/types (discriminated union)', () => {
  it('_kind と type で narrowing できる', () => {
    const line: ParsedLine = {
      _kind: 'known',
      type: 'assistant',
      cwd: '/x',
      entrypoint: 'cli',
      gitBranch: 'main',
      isSidechain: false,
      parentUuid: null,
      sessionId: 's',
      timestamp: 't',
      userType: 'external',
      uuid: 'u',
      version: '1',
      message: {
        id: 'm',
        type: 'message',
        role: 'assistant',
        model: 'claude',
        content: [],
        stop_reason: null,
        stop_sequence: null,
        stop_details: null,
        usage: {},
      },
    } satisfies AssistantEntry

    if (line._kind === 'known' && line.type === 'assistant') {
      expect(line.message.role).toBe('assistant')
    } else {
      throw new Error('narrowing failed')
    }
  })
})
