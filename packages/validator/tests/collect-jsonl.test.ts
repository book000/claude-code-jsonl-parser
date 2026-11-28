import { expect, it } from 'vitest'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { collectJsonl } from '../src/collect-jsonl'

it('collects nested files without following symlinks', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'validator-links-'))
  try {
    const corpus = path.join(root, 'corpus')
    const outside = path.join(root, 'outside')
    await mkdir(path.join(corpus, 'nested'), { recursive: true })
    await mkdir(outside)
    const nested = path.join(corpus, 'nested', 'valid.jsonl')
    const external = path.join(outside, 'external.jsonl')
    await writeFile(nested, '{}\n')
    await writeFile(external, '{}\n')
    await symlink('.', path.join(corpus, 'loop'))
    await symlink(outside, path.join(corpus, 'external'))
    await symlink(external, path.join(corpus, 'linked.jsonl'))
    await symlink('missing', path.join(corpus, 'broken.jsonl'))
    expect(await collectJsonl(corpus)).toEqual([nested])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
