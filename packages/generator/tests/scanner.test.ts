import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, writeFile, mkdir, rm, symlink } from 'node:fs/promises'
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

it('skips directory loops and links outside the corpus', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'gen-links-'))
  try {
    const corpus = path.join(root, 'corpus')
    const outside = path.join(root, 'outside')
    await mkdir(path.join(corpus, 'nested'), { recursive: true })
    await mkdir(outside)
    const external = path.join(outside, 'external.jsonl')
    await writeFile(path.join(corpus, 'nested', 'valid.jsonl'), '{"type":"inside"}\n')
    await writeFile(external, '{"type":"outside"}\n')
    await symlink('.', path.join(corpus, 'loop'))
    await symlink(outside, path.join(corpus, 'external'))
    await symlink(external, path.join(corpus, 'linked.jsonl'))
    await symlink('missing', path.join(corpus, 'broken.jsonl'))
    const result = await scanCorpus(corpus)
    expect(result.totalLines).toBe(1)
    expect(result.samplesByType.size).toBe(1)
    expect(result.samplesByType.has('inside')).toBe(true)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
