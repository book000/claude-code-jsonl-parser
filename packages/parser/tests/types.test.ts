import { describe, it, expect } from 'vitest'
import type { ParsedLine, AssistantEntry } from '../src/generated/types'

/**
 * Takes `line` as a `ParsedLine` (discriminated union) and narrows it.
 * Receiving it through a parameter avoids the type narrowing that the caller's
 * literal initializer would bring, so the runtime narrowing is what gets verified.
 *
 * @param line - Value to narrow
 */
function expectAssistantRole(line: ParsedLine): void {
  if (line._kind === 'known' && line.type === 'assistant') {
    expect(line.message.role).toBe('assistant')
  } else {
    throw new Error('narrowing failed')
  }
}

describe('generated/types (discriminated union)', () => {
  it('can narrow by _kind and type', () => {
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

    expectAssistantRole(line)
  })
})
