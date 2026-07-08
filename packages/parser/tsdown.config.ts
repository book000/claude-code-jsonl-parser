import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  dts: true,
  clean: true,
  // node platform は既定で index.mjs を出すため、index.js を保つよう false にする
  fixedExtension: false,
  outDir: 'dist',
})
