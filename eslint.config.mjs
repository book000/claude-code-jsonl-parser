import nodePath from 'node:path'
import { fileURLToPath } from 'node:url'
import eslintConfig from '@book000/eslint-config'

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url))

export default [
  ...eslintConfig,
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/generated/**'],
  },
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parserOptions: {
        project: false,
        projectService: {
          allowDefaultProject: ['packages/*/*.config.ts', '*.mjs'],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 30,
        },
        tsconfigRootDir: __dirname,
      },
    },
  },
]
