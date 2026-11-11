import { describe, it, expect } from 'vitest'
import { parseJsonl, parseJsonlLines } from '../src/parse'

const lineA = JSON.stringify({ type: 'mode', mode: 'normal', sessionId: 's' })
const lineB = JSON.stringify({ type: 'ai-title', aiTitle: 'T', sessionId: 's' })

describe('parseJsonlLines / parseJsonl', () => {
  it('converts multiple lines to ParsedLine in order', () => {
    const out = [...parseJsonlLines(`${lineA}\n${lineB}`)]
    expect(out).toHaveLength(2)
    expect(out[0]._kind).toBe('known')
    expect(out[1]._kind).toBe('known')
  })

  it('a trailing newline does not produce an empty element', () => {
    const out = [...parseJsonlLines(`${lineA}\n`)]
    expect(out).toHaveLength(1)
  })

  it('an empty string yields 0 elements', () => {
    expect([...parseJsonlLines('')]).toHaveLength(0)
  })

  it('skips blank lines (whitespace only)', () => {
    const out = [...parseJsonlLines(`${lineA}\n   \n${lineB}`)]
    expect(out).toHaveLength(2)
  })

  it('a bad line becomes a LineParseError and parsing continues (the whole does not fail)', () => {
    const out = [...parseJsonlLines(`${lineA}\n{bad\n${lineB}`)]
    expect(out).toHaveLength(3)
    expect(out[1]._kind).toBe('error')
  })

  it('assigns 1-based line numbers correctly', () => {
    const out = [...parseJsonlLines(`${lineA}\n{bad`)]
    if (out[1]._kind === 'error') expect(out[1].lineNumber).toBe(2)
  })

  it('parseJsonl returns an Ok array and never an Err', () => {
    const r = parseJsonl(`${lineA}\n${lineB}`)
    expect(r.isOk).toBe(true)
    if (r.isOk) expect(r.value).toHaveLength(2)
  })

  it('handles CRLF line breaks', () => {
    const out = [...parseJsonlLines(`${lineA}\r\n${lineB}`)]
    expect(out).toHaveLength(2)
    expect(out[0]._kind).toBe('known')
  })
})
