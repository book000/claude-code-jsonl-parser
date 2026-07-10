import type { JsonKind, Shape } from './infer'

/** JS 識別子として安全な名前かどうかを判定する正規表現。 */
const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/

/** シングルクォート文字列リテラルとして安全になるよう `'` をエスケープする。 */
function escapeSingleQuote(s: string): string {
  return s.replaceAll('\'', String.raw`\'`)
}

/**
 * 観測種別集合 (と任意のリテラル集合) を TypeScript 型文字列に写像する。
 *
 * @param kinds - 観測された JSON 種別
 * @param literals - 文字列リテラル集合 (あれば)
 */
export function tsTypeOf(kinds: Set<JsonKind>, literals?: Set<string>): string {
  const parts: string[] = []
  const mapped: Record<JsonKind, string> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    null: 'null',
    array: 'unknown[]',
    object: 'Record<string, unknown>',
  }
  // 文字列リテラルが与えられていれば開いた union にする
  if (literals && literals.size > 0 && kinds.has('string')) {
    const lits = [...literals].toSorted().map((s) => `'${escapeSingleQuote(s)}'`)
    parts.push(`${lits.join(' | ')} | (string & {})`)
  } else if (kinds.has('string')) {
    parts.push('string')
  }
  for (const k of ['number', 'boolean', 'array', 'object', 'null'] as JsonKind[]) {
    if (kinds.has(k)) parts.push(mapped[k])
  }
  // 重複除去して結合
  return [...new Set(parts)].join(' | ')
}

/** JS 識別子として安全ならそのまま、そうでなければクォートする。 */
function propKey(name: string): string {
  return IDENTIFIER_RE.test(name) ? name : `'${escapeSingleQuote(name)}'`
}

/** interface 名として使うため type 文字列を PascalCase 化する (エミッタ内部用)。 */
export function pascalCase(type: string): string {
  return type
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

/**
 * 1 type の interface 文字列を生成する。
 *
 * @param interfaceName - 出力する interface 名 (例 LastPromptEntry)
 * @param type - 判別子文字列 (例 last-prompt)
 * @param shape - 推論結果
 */
export function emitInterface(
  interfaceName: string,
  type: string,
  shape: Shape
): string {
  const lines: string[] = [
    `export interface ${interfaceName} {`,
    `  _kind: 'known'`,
    `  type: '${escapeSingleQuote(type)}'`,
  ]
  for (const [name, field] of shape.fields) {
    if (name === 'type') continue
    const opt = field.required ? '' : '?'
    const tsType = tsTypeOf(field.kinds, field.literals)
    lines.push(`  ${propKey(name)}${opt}: ${tsType}`)
  }
  lines.push('}')
  return lines.join('\n')
}
