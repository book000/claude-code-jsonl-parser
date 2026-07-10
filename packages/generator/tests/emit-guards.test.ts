import { describe, it, expect } from 'vitest'
import { emitGuardFunction } from '../src/emit-guards'
import { inferShape } from '../src/infer'

describe('emitGuardFunction', () => {
  it('required スカラーの検査を含むガード関数文字列を出す', () => {
    const shape = inferShape([
      { type: 'mode', mode: 'normal', sessionId: 's' },
      { type: 'mode', mode: 'plan', sessionId: 's2' },
    ])
    const out = emitGuardFunction('isMode', 'mode', shape)
    expect(out).toContain("v.type === 'mode'")
    expect(out).toContain('isString(v.mode)')
    expect(out).toContain('isString(v.sessionId)')
  })

  it('optional フィールドは検査に含めない', () => {
    const shape = inferShape([
      { type: 'last-prompt', leafUuid: 'u', sessionId: 's', lastPrompt: 'p' },
      { type: 'last-prompt', leafUuid: 'u2', sessionId: 's2' },
    ])
    const out = emitGuardFunction('isLastPrompt', 'last-prompt', shape)
    expect(out).toContain('isString(v.leafUuid)')
    expect(out).not.toContain('v.lastPrompt')
  })

  it('number/boolean/null 併記を適切な検査に写像する', () => {
    const shape = inferShape([
      { type: 'bridge-session', bridgeSessionId: 'b', lastSequenceNum: 1, sessionId: 's' },
    ])
    const out = emitGuardFunction('isBridgeSession', 'bridge-session', shape)
    expect(out).toContain('isNumber(v.lastSequenceNum)')
  })
})
