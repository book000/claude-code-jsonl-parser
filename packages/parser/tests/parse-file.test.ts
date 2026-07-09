import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parseJsonlFile, parseJsonlFileStream } from '../src/parse'

let dir: string
let goodPath: string

const lineA = JSON.stringify({ type: 'mode', mode: 'normal', sessionId: 's' })
const lineB = JSON.stringify({ type: 'ai-title', aiTitle: 'T', sessionId: 's' })

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'ccjsonl-'))
  goodPath = path.join(dir, 'good.jsonl')
  await writeFile(goodPath, `${lineA}\n{bad\n${lineB}\n`, 'utf8')
})
afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('parseJsonlFile', () => {
  it('正常ファイルを Ok(配列) で返す', async () => {
    const r = await parseJsonlFile(goodPath)
    expect(r.isOk).toBe(true)
    if (r.isOk) {
      expect(r.value).toHaveLength(3)
      expect(r.value[1]._kind).toBe('error')
    }
  })

  it('存在しないファイルは Err(FileReadError, ENOENT)', async () => {
    const r = await parseJsonlFile(path.join(dir, 'nope.jsonl'))
    expect(r.isErr).toBe(true)
    if (r.isErr) {
      expect(r.error._tag).toBe('FileReadError')
      expect(r.error.code).toBe('ENOENT')
    }
  })
})

describe('parseJsonlFileStream', () => {
  it('行単位で逐次 yield する', async () => {
    const out = []
    for await (const line of parseJsonlFileStream(goodPath)) out.push(line)
    expect(out).toHaveLength(3)
    expect(out[0]._kind).toBe('known')
  })

  it('存在しないファイルは反復時に FileReadError を throw する', async () => {
    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 反復を発火させるだけ
      for await (const _ of parseJsonlFileStream(path.join(dir, 'nope.jsonl'))) {
        /* noop */
      }
    }).rejects.toMatchObject({ _tag: 'FileReadError', code: 'ENOENT' })
  })
})
