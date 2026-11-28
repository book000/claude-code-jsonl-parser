import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseJsonlFile } from '../src/parse'
import { KNOWN_TYPES } from '../src/generated/guards'

const FIX = path.join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures')

describe('integration: fixtures', () => {
  it('parses all 19 lines of all-known-types.jsonl as KnownEntry', async () => {
    const r = await parseJsonlFile(path.join(FIX, 'all-known-types.jsonl'))
    expect(r.isOk).toBe(true)
    if (!r.isOk) return
    expect(r.value).toHaveLength(19)
    const kinds = new Set(r.value.map((l) => (l._kind === 'known' ? l.type : l._kind)))
    for (const t of KNOWN_TYPES) {
      expect(kinds.has(t)).toBe(true)
    }
    expect(r.value.every((l) => l._kind === 'known')).toBe(true)
  })

  it('normalizes content-blocks.jsonl in the hybrid way', async () => {
    const r = await parseJsonlFile(path.join(FIX, 'content-blocks.jsonl'))
    if (!r.isOk) throw new Error('unexpected err')
    const asst = r.value[0]
    if (asst._kind === 'known' && asst.type === 'assistant') {
      expect(asst.message.content).toHaveLength(4)
      expect((asst.message.content[3] as { _kind: string })._kind).toBe('unknown')
    }
    const usr = r.value[1]
    if (
      !(usr._kind === 'known' && usr.type === 'user' && Array.isArray(usr.message.content))
    ) {
      return
    }

    const tr = usr.message.content[0] as { type: string; content: unknown[] }
    expect(tr.type).toBe('tool_result')
    expect((tr.content[3] as { _kind: string })._kind).toBe('unknown')
  })

  it('classifies blank lines, unknown types and shape mismatches in edge-cases.jsonl correctly', async () => {
    const r = await parseJsonlFile(path.join(FIX, 'edge-cases.jsonl'))
    if (!r.isOk) throw new Error('unexpected err')
    expect(r.value).toHaveLength(3)
    expect(r.value[0]._kind).toBe('known')
    expect(r.value[1]._kind).toBe('unknown')
    if (r.value[1]._kind === 'unknown') expect(r.value[1].typeHint).toBeUndefined()
    expect(r.value[2]._kind).toBe('unknown')
    if (r.value[2]._kind === 'unknown') expect(r.value[2].typeHint).toBe('mode')
  })

  it('turns only the bad lines of malformed.jsonl into LineParseError and continues', async () => {
    const r = await parseJsonlFile(path.join(FIX, 'malformed.jsonl'))
    if (!r.isOk) throw new Error('unexpected err')
    expect(r.value).toHaveLength(3)
    expect(r.value[1]._kind).toBe('error')
    expect(r.value[0]._kind).toBe('known')
    expect(r.value[2]._kind).toBe('known')
  })
})
