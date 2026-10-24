import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Resolve the workspace generator from source so tests do not depend on its
    // build output (CI runs lint and test in parallel, before dist/ exists).
    alias: {
      'claude-code-jsonl-generator': fileURLToPath(
        new URL('packages/generator/src/index.ts', import.meta.url)
      ),
    },
  },
})
