import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const script = path.resolve('scripts/restore-beta-note.sh')
const tag = 'v0.1.4-beta.28'
const ref = `refs/notes/semantic-release-${tag}`
const expected = 'e946f95cd5c828c13f590c119ec17f27c3b7bce1'
let dir = ''

const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim()

const run = () => spawnSync('bash', [script], { cwd: dir, encoding: 'utf8' })

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
})

describe('beta channel recovery', () => {
  it('refuses an unexpected tag target', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'release-note-'))
    git('init', '-q')
    git('remote', 'add', 'origin', '.')
    git(
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '--allow-empty',
      '-qm',
      'test'
    )
    git('tag', tag)
    const result = run()
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Unexpected')
    expect(git('rev-parse', tag)).not.toBe(expected)
    expect(
      spawnSync('git', ['show-ref', '--verify', '--quiet', ref], { cwd: dir })
        .status
    ).not.toBe(0)
  })

  it('restores beta metadata locally for the known orphan', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'release-note-'))
    git('init', '-q')
    git('remote', 'add', 'origin', '.')
    git(
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '--allow-empty',
      '-qm',
      'test'
    )
    git('tag', tag)
    const gitPath = execFileSync('which', ['git'], { encoding: 'utf8' }).trim()
    const wrapper = path.join(dir, 'git')
    const tagRef = ['refs/tags/', tag, '^{commit}'].join('')
    writeFileSync(
      wrapper,
      `#!/bin/sh\nif [ "$1" = rev-parse ] && [ "$2" = "${tagRef}" ]; then\n  echo ${expected}\nelse\n  exec "${gitPath}" "$@"\nfi\n`
    )
    chmodSync(wrapper, 0o755)
    const result = spawnSync('bash', [script], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
    })
    expect(result.status).toBe(0)
    expect(JSON.parse(git('notes', `--ref=${ref}`, 'show', tag))).toEqual({
      channels: ['beta'],
    })
  })

  it('preserves an existing remote note', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'release-note-'))
    git('init', '-q')
    git('remote', 'add', 'origin', '.')
    git(
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '--allow-empty',
      '-qm',
      'test'
    )
    git('tag', tag)
    git(
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      'notes',
      `--ref=${ref}`,
      'add',
      '-m',
      '{"channels":["other"]}',
      tag
    )
    const before = git('rev-parse', ref)
    expect(run().status).toBe(0)
    expect(git('rev-parse', ref)).toBe(before)
  })
})
