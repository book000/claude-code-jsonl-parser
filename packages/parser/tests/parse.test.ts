import { describe, it, expect } from 'vitest'
import { parseJsonl, parseJsonlLines } from '../src/parse'

const lineA = JSON.stringify({ type: 'mode', mode: 'normal', sessionId: 's' })
const lineB = JSON.stringify({ type: 'ai-title', aiTitle: 'T', sessionId: 's' })

describe('parseJsonlLines / parseJsonl', () => {
  it('複数行を順に ParsedLine 化する', () => {
    const out = [...parseJsonlLines(`${lineA}\n${lineB}`)]
    expect(out).toHaveLength(2)
    expect(out[0]._kind).toBe('known')
    expect(out[1]._kind).toBe('known')
  })

  it('末尾改行は空要素を生まない', () => {
    const out = [...parseJsonlLines(`${lineA}\n`)]
    expect(out).toHaveLength(1)
  })

  it('空文字列は 0 要素', () => {
    expect([...parseJsonlLines('')]).toHaveLength(0)
  })

  it('空行 (空白のみ) はスキップする', () => {
    const out = [...parseJsonlLines(`${lineA}\n   \n${lineB}`)]
    expect(out).toHaveLength(2)
  })

  it('不正行は LineParseError として継続する (全体は失敗しない)', () => {
    const out = [...parseJsonlLines(`${lineA}\n{bad\n${lineB}`)]
    expect(out).toHaveLength(3)
    expect(out[1]._kind).toBe('error')
  })

  it('行番号は 1 始まりで正しく振られる', () => {
    const out = [...parseJsonlLines(`${lineA}\n{bad`)]
    if (out[1]._kind === 'error') expect(out[1].lineNumber).toBe(2)
  })

  it('parseJsonl は Ok の配列を返し never を Err にしない', () => {
    const r = parseJsonl(`${lineA}\n${lineB}`)
    expect(r.isOk).toBe(true)
    if (r.isOk) expect(r.value).toHaveLength(2)
  })

  it('CRLF 改行も扱える', () => {
    const out = [...parseJsonlLines(`${lineA}\r\n${lineB}`)]
    expect(out).toHaveLength(2)
    expect(out[0]._kind).toBe('known')
  })
})
