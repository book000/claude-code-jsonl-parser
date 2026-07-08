import { describe, it, expect } from 'vitest'
import { ok, err, ResultAsync } from '../src/result'

describe('Result', () => {
  it('ok は isOk=true / value を保持する', () => {
    const r = ok(42)
    expect(r.isOk).toBe(true)
    expect(r.isErr).toBe(false)
    if (r.isOk) expect(r.value).toBe(42)
  })

  it('err は isErr=true / error を保持する', () => {
    const r = err('boom')
    expect(r.isErr).toBe(true)
    if (r.isErr) expect(r.error).toBe('boom')
  })

  it('map は Ok の値のみ変換する', () => {
    expect(ok(2).map((n) => n * 3).unwrapOr(0)).toBe(6)
    expect(err<string>('e').map((n: number) => n * 3).unwrapOr(0)).toBe(0)
  })

  it('mapErr は Err の値のみ変換する', () => {
    const r = err('a').mapErr((e) => e + 'b')
    if (r.isErr) expect(r.error).toBe('ab')
  })

  it('andThen は Ok を連鎖する', () => {
    const r = ok(2).andThen((n) => ok(n + 1))
    expect(r.unwrapOr(0)).toBe(3)
  })

  it('match は分岐する', () => {
    expect(ok(1).match((v) => `ok${v}`, () => 'err')).toBe('ok1')
    expect(err('x').match(() => 'ok', (e) => `err${e}`)).toBe('errx')
  })
})

describe('ResultAsync', () => {
  it('fromPromise は成功を Ok に包む', async () => {
    const r = await ResultAsync.fromPromise(Promise.resolve(1), () => 'e')
    expect(r.isOk).toBe(true)
  })

  it('fromPromise は失敗を onError で Err に包む', async () => {
    const r = await ResultAsync.fromPromise(
      Promise.reject(new Error('x')),
      (e) => `mapped:${(e as Error).message}`
    )
    expect(r.isErr).toBe(true)
    if (r.isErr) expect(r.error).toBe('mapped:x')
  })

  it('map / andThen / unwrapOr が連鎖する', async () => {
    const v = await ResultAsync.fromPromise(Promise.resolve(2), () => 'e')
      .map((n) => n + 1)
      .andThen((n) => ResultAsync.fromResult(ok(n * 2)))
      .unwrapOr(0)
    expect(v).toBe(6)
  })
})
