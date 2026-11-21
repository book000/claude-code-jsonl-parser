import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  dts: true,
  clean: true,
  // The node platform emits index.mjs by default; disable fixedExtension to keep index.js
  fixedExtension: false,
  outDir: 'dist',
})
