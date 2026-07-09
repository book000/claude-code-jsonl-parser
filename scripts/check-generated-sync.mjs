#!/usr/bin/env node
/**
 * ローカル専用の決定論的同期チェック:
 * claude-code-jsonl-generator の推論ロジック (inferShape) が固定サンプルコーパス
 * (packages/parser/tests/fixtures/all-known-types.jsonl) から観測した
 * 「type ごとのトップレベルフィールド名」が、
 * packages/parser/src/generated/types.ts の手書きインターフェースに
 * すべて宣言されているかを検証する。
 *
 * スコープ:
 * - 検証するのはフィールドの「存在」のみ。message / content-block の詳細形状は
 *   意図的に手動キュレーションされているため対象外 (トップレベルに
 *   `message` フィールドさえ宣言されていれば良い)。
 * - 固定コーパスに出現しない type / フィールドは検証対象外 (小規模なダミー
 *   fixture のため、実コーパス全体のカバレッジは保証しない)。
 * - CI では実行しない (ローカルでの手動同期確認用)。事前に `pnpm -r build` が
 *   必要 (generator の dist を読み込むため)。
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
// all-known-types.jsonl のみを対象にする。edge-cases.jsonl / malformed.jsonl は
// 未知 type や壊れた行をわざと含むテスト用データであり、正規の既知コーパスではない。
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
 * 単一の `.jsonl` ファイルを type ごとの生サンプルへグループ化する。
 * (generator の `scanCorpus` はディレクトリ走査用のため、単一の正規コーパス
 * ファイルを対象にするここでは使わず、同じ「type ごとに集約する」処理を
 * 直接行う。実際のフィールド推論ロジックは generator の `inferShape` を再利用する。)
 *
 * @param {string} filePath - 対象 `.jsonl` ファイル
 * @returns {Map<string, Record<string, unknown>[]>} type ごとの生サンプル
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
 * `types.ts` を解析し、type リテラル → 宣言済みトップレベルフィールド名集合、を返す。
 *
 * @param {string} filePath - 解析対象ファイル
 * @returns {Map<string, Set<string>>} type リテラル文字列 → フィールド名集合
 */
function parseDeclaredFields(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)

  /** @type {Map<string, {members: Set<string>, heritage: string[]}>} */
  const interfaces = new Map()
  /** @type {Map<string, string>} type リテラル → インターフェース名 */
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
    for (const clause of statement.heritageClauses ?? []) {
      for (const t of clause.types) {
        heritage.push(t.expression.getText(sourceFile))
      }
    }

    interfaces.set(name, { members, heritage })
    if (literalType !== undefined) typeLiteralToInterface.set(literalType, name)
  }

  /**
   * インターフェース自身 + 継承元のフィールド名を再帰的に集約する。
   *
   * @param {string} name - インターフェース名
   * @param {Set<string>} [seen] - 循環防止用
   * @returns {Set<string>} 集約済みフィールド名集合
   */
  function resolveFields(name, seen = new Set()) {
    if (seen.has(name)) return new Set()
    seen.add(name)
    const entry = interfaces.get(name)
    if (entry === undefined) return new Set()
    const result = new Set(entry.members)
    for (const parent of entry.heritage) {
      for (const f of resolveFields(parent, seen)) result.add(f)
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
  const observed = [...inferShape(samples).fields.keys()]
  const missing = observed.filter((f) => !declared.has(f))
  checked += 1
  if (missing.length > 0) {
    console.error(`FAIL: type "${type}" is missing field(s) in parser types.ts: ${missing.join(', ')}`)
    failures += 1
  }
}

if (failures > 0) {
  console.error(`\n${failures} sync issue(s) found (checked ${checked} type(s)).`)
  process.exit(1)
}
console.log(`OK: generator-observed fields match parser types.ts for all ${checked} type(s) in fixtures.`)
