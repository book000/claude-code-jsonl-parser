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
  it('returns Ok(array) for a valid file', async () => {
    const r = await parseJsonlFile(goodPath)
    expect(r.isOk).toBe(true)
    if (!r.isOk) {
      return
    }

    expect(r.value).toHaveLength(3)
    expect(r.value[1]._kind).toBe('error')
  })

  it('returns Err(FileReadError, ENOENT) for a missing file', async () => {
    const r = await parseJsonlFile(path.join(dir, 'nope.jsonl'))
    expect(r.isErr).toBe(true)
    if (!r.isErr) {
      return
    }

    expect(r.error._tag).toBe('FileReadError')
    expect(r.error.code).toBe('ENOENT')
  })
})

describe('parseJsonlFileStream', () => {
  it('yields line by line', async () => {
    const out = []
    // eslint-disable-next-line unicorn/prefer-array-from-async -- Array.fromAsync is ES2024; avoid changing the lib target (ES2023)
    for await (const line of parseJsonlFileStream(goodPath)) out.push(line)
    expect(out).toHaveLength(3)
    expect(out[0]._kind).toBe('known')
  })

  it('throws a FileReadError during iteration for a missing file', async () => {
    await expect(async () => {
      const stream = parseJsonlFileStream(path.join(dir, 'nope.jsonl'))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- only triggers the iteration
      for await (const _ of stream) {
        /* noop */
      }
    }).rejects.toMatchObject({ _tag: 'FileReadError', code: 'ENOENT' })
  })
})
