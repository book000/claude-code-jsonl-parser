import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'generator',
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: { provider: 'v8', include: ['src/**/*.ts'], exclude: ['src/index.ts', 'src/cli.ts'] },
  },
})
