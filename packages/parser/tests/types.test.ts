import { describe, it, expect } from 'vitest'
import type { ParsedLine, AssistantEntry } from '../src/generated/types'

/**
 * `line` を `ParsedLine` (判別共用体) として受け取り narrowing する。
 * パラメータ経由で受けることで、呼び出し元のリテラル初期化値に基づく
 * 型の絞り込みを持ち込まず、実行時の narrowing を検証する。
 *
 * @param line - narrowing 対象
 */
function expectAssistantRole(line: ParsedLine): void {
  if (line._kind === 'known' && line.type === 'assistant') {
    expect(line.message.role).toBe('assistant')
  } else {
    throw new Error('narrowing failed')
  }
}

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

    expectAssistantRole(line)
  })
})
