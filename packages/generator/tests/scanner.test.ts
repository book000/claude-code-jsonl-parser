import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { scanCorpus } from '../src/scanner'

let dir: string
beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'gen-scan-'))
  await mkdir(path.join(dir, 'sub'), { recursive: true })
  await writeFile(path.join(dir, 'a.jsonl'),
    `${JSON.stringify({ type: 'mode', mode: 'normal', sessionId: 's' })}\n` +
    `${JSON.stringify({ type: 'mode', mode: 'plan', sessionId: 's2' })}\n`, 'utf8')
  await writeFile(path.join(dir, 'sub', 'b.jsonl'),
    `${JSON.stringify({ type: 'ai-title', aiTitle: 'T', sessionId: 's' })}\n` +
    `{bad json\n`, 'utf8')
  await writeFile(path.join(dir, 'ignore.txt'), 'not jsonl\n', 'utf8')
})
afterAll(async () => { await rm(dir, { recursive: true, force: true }) })

describe('scanCorpus', () => {
  it('recursively scans only .jsonl files and groups samples by type', async () => {
    const result = await scanCorpus(dir)
    expect(result.samplesByType.get('mode')?.length).toBe(2)
    expect(result.samplesByType.get('ai-title')?.length).toBe(1)
    expect(result.totalLines).toBe(3)
    expect(result.malformedLines).toBe(1)
  })

  it('also collects unknown types (the key is the type string as is)', async () => {
    await writeFile(path.join(dir, 'c.jsonl'),
      `${JSON.stringify({ type: 'future-type', x: 1 })}\n`, 'utf8')
    const result = await scanCorpus(dir)
    expect(result.samplesByType.has('future-type')).toBe(true)
  })
})
