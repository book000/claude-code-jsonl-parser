import { describe, it, expect } from 'vitest'
import { emitGuardFunction } from '../src/emit-guards'
import { inferShape } from '../src/infer'

describe('emitGuardFunction', () => {
  it('emits a guard function source with checks for required scalars', () => {
    const shape = inferShape([
      { type: 'mode', mode: 'normal', sessionId: 's' },
      { type: 'mode', mode: 'plan', sessionId: 's2' },
    ])
    const out = emitGuardFunction('isMode', 'mode', shape)
    expect(out).toContain("v.type === 'mode'")
    expect(out).toContain('isString(v.mode)')
    expect(out).toContain('isString(v.sessionId)')
  })

  it('does not check optional fields', () => {
    const shape = inferShape([
      { type: 'last-prompt', leafUuid: 'u', sessionId: 's', lastPrompt: 'p' },
      { type: 'last-prompt', leafUuid: 'u2', sessionId: 's2' },
    ])
    const out = emitGuardFunction('isLastPrompt', 'last-prompt', shape)
    expect(out).toContain('isString(v.leafUuid)')
    expect(out).not.toContain('v.lastPrompt')
  })

  it('maps number / boolean / null combinations to the right checks', () => {
    const shape = inferShape([
      { type: 'bridge-session', bridgeSessionId: 'b', lastSequenceNum: 1, sessionId: 's' },
    ])
    const out = emitGuardFunction('isBridgeSession', 'bridge-session', shape)
    expect(out).toContain('isNumber(v.lastSequenceNum)')
  })
})
