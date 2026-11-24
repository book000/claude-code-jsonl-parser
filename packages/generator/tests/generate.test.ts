import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { runInNewContext } from 'node:vm'
import { generateFiles } from '../src/generate'

describe('generated files', () => {
  it('type-checks and preserves unusual keys, discriminators, and literals', () => {
    const type = 'foo.bar\n\\\'"'
    const value = 'line one\nline two\\n\'"\u2028\u2029'
    const sample = { type, 'x-y': value, 'quote\'\\\n': 1, optional: true }
    const samples = new Map([[type, [sample]], ['__proto__', [{ type: '__proto__', normal: 'yes' }]], ['123', [{ type: '123' }]]])
    const files = generateFiles(samples)
    const options: ts.CompilerOptions = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, types: [] }
    const host = ts.createCompilerHost(options)
    const sources: Record<string, string | undefined> = { 'types.generated.ts': files.typesOut, 'guards.generated.ts': files.guardsOut }
    const original = host.getSourceFile.bind(host)
    host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) => sources[name] === undefined
      ? original(name, languageVersion, onError, shouldCreateNewSourceFile)
      : ts.createSourceFile(name, sources[name], languageVersion)
    const program = ts.createProgram(Object.keys(sources), options, host)
    expect(ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([])
    const js = ts.transpileModule(files.guardsOut, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    const exports = {} as { guardByType: (type: string, value: unknown) => boolean | undefined }
    runInNewContext(js, { exports })
    expect(exports.guardByType(type, sample)).toBe(true)
    expect(exports.guardByType(type, { ...sample, 'x-y': 1 })).toBe(false)
    expect(exports.guardByType('__proto__', { type: '__proto__', normal: 'yes' })).toBe(true)
    expect(exports.guardByType('toString', {})).toBeUndefined()
    expect(files.typesOut).toContain(JSON.stringify(value).replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029'))
  }, 60_000)

  it('rejects colliding names and reserved fields', () => {
    expect(() => generateFiles(new Map([['foo-bar', [{ type: 'foo-bar' }]], ['foo_bar', [{ type: 'foo_bar' }]]]))).toThrow(/collision/)
    expect(() => generateFiles(new Map([['object', [{ type: 'object' }]]]))).toThrow(/helper/)
    expect(() => generateFiles(new Map([['example', [{ type: 'example', _kind: 'value' }]]]))).toThrow(/_kind/)
  })
})
