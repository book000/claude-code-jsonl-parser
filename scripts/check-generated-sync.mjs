#!/usr/bin/env node
/**
 * Local-only deterministic sync check.
 * Verifies that every top-level field name per type, as inferred by the generator (inferShape) from the fixed corpus
 * packages/parser/tests/fixtures/all-known-types.jsonl, is declared in packages/parser/src/generated/types.ts.
 *
 * Scope:
 * - Only field presence is checked. Message and content-block shapes are curated by hand on purpose and are out of scope.
 * - Types and fields absent from the fixed corpus are not checked: it is a small fixture and does not cover real corpora.
 * - Not run in CI. Requires `pnpm -r build` first because it loads the generator's dist.
 *
 * Usage: node scripts/check-generated-sync.mjs
 */
import { readFileSync } from 'node:fs'
import nodePath from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = nodePath.join(__dirname, '..')
const GENERATOR_DIST = nodePath.join(ROOT, 'packages', 'generator', 'dist', 'index.js')
// Use all-known-types.jsonl only. edge-cases.jsonl and malformed.jsonl
// deliberately contain unknown types and broken lines; they are test data, not a canonical known corpus.
const FIXTURES_DIR = nodePath.join(ROOT, 'packages', 'parser', 'tests', 'fixtures')
const CORPUS_FILE = nodePath.join(FIXTURES_DIR, 'all-known-types.jsonl')
const TYPES_FILE = nodePath.join(ROOT, 'packages', 'parser', 'src', 'generated', 'types.ts')

let inferShape
try {
  ;({ inferShape } = await import(GENERATOR_DIST))
} catch {
  console.error(
    `ERROR: failed to load ${nodePath.relative(ROOT, GENERATOR_DIST)}. Run "pnpm -r build" first.`
  )
  process.exit(2)
}

/**
 * Groups the raw samples of a single `.jsonl` file by type.
 * (The generator's `scanCorpus` walks directories, so it is not used for a single
 * canonical corpus file; the same grouping is done directly here. The field
 * inference itself reuses the generator's `inferShape`.)
 *
 * @param {string} filePath - Target `.jsonl` file
 * @returns {Map<string, Record<string, unknown>[]>} Raw samples per type
 */
function groupByType(filePath) {
  const samplesByType = new Map()
  const lines = readFileSync(filePath, 'utf8').split('\n')
  for (const raw of lines) {
    if (raw.trim() === '') continue
    const object = JSON.parse(raw)
    const type = object.type
    if (typeof type !== 'string') continue
    const bucket = samplesByType.get(type) ?? []
    bucket.push(object)
    samplesByType.set(type, bucket)
  }
  return samplesByType
}

/**
 * Parses `types.ts` and returns a map from type literal to the set of declared top-level field names.
 *
 * @param {string} filePath - File to parse
 * @returns {Map<string, Set<string>>} Type literal string to field name set
 */
function parseDeclaredFields(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)

  /** @type {Map<string, {members: Set<string>, heritage: string[]}>} */
  const interfaces = new Map()
  /** @type {Map<string, string>} type literal to interface name */
  const typeLiteralToInterface = new Map()

  for (const statement of sourceFile.statements) {
    if (!ts.isInterfaceDeclaration(statement)) continue
    const name = statement.name.text
    const members = new Set()
    let literalType

    for (const member of statement.members) {
      if (!ts.isPropertySignature(member) || member.name === undefined) continue
      const memberName = member.name.getText(sourceFile)
      members.add(memberName)
      if (
        memberName === 'type' &&
        member.type !== undefined &&
        ts.isLiteralTypeNode(member.type) &&
        ts.isStringLiteral(member.type.literal)
      ) {
        literalType = member.type.literal.text
      }
    }

    const heritage = []
    const clauses = statement.heritageClauses ?? []
    for (const clause of clauses) {
      for (const t of clause.types) {
        heritage.push(t.expression.getText(sourceFile))
      }
    }

    interfaces.set(name, { members, heritage })
    if (literalType !== undefined) typeLiteralToInterface.set(literalType, name)
  }

  /**
   * Recursively collects the field names of an interface and the interfaces it extends.
   *
   * @param {string} name - Interface name
   * @param {Set<string>} [seen] - Guards against cycles
   * @returns {Set<string>} Collected field names
   */
  function resolveFields(name, seen = new Set()) {
    if (seen.has(name)) return new Set()
    seen.add(name)
    const entry = interfaces.get(name)
    if (entry === undefined) return new Set()
    const result = new Set(entry.members)
    for (const parent of entry.heritage) {
      const parentFields = resolveFields(parent, seen)
      for (const f of parentFields) result.add(f)
    }
    return result
  }

  /** @type {Map<string, Set<string>>} */
  const declaredByType = new Map()
  for (const [literalType, interfaceName] of typeLiteralToInterface) {
    declaredByType.set(literalType, resolveFields(interfaceName))
  }
  return declaredByType
}

const declaredByType = parseDeclaredFields(TYPES_FILE)
const samplesByType = groupByType(CORPUS_FILE)

let failures = 0
let checked = 0
for (const [type, samples] of samplesByType) {
  const declared = declaredByType.get(type)
  if (declared === undefined) {
    console.error(`FAIL: type "${type}" observed in fixtures but not declared in ${nodePath.relative(ROOT, TYPES_FILE)}`)
    failures += 1
    continue
  }
  const observed = inferShape(samples).fields.keys().toArray()
  const missing = observed.filter((f) => !declared.has(f))
  checked += 1
  if (missing.length === 0) {
    continue
  }

  console.error(`FAIL: type "${type}" is missing field(s) in parser types.ts: ${missing.join(', ')}`)
  failures += 1
}

if (failures > 0) {
  console.error(`\n${failures} sync issue(s) found (checked ${checked} type(s)).`)
  process.exit(1)
}
console.log(`OK: generator-observed fields match parser types.ts for all ${checked} type(s) in fixtures.`)
