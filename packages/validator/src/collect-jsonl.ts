import { readdir } from 'node:fs/promises'
import path from 'node:path'

/** Recursively collects `.jsonl` files. */
export async function collectJsonl(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await collectJsonl(full)))
    else if (entry.isFile() && entry.name.endsWith('.jsonl')) out.push(full)
  }
  return out
}
