import type { JsonKind, Shape } from './infer'

/** JS 識別子として安全な名前かどうかを判定する正規表現。 */
const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/

/** シングルクォート文字列リテラルとして安全になるよう `'` をエスケープする。 */
function escapeSingleQuote(s: string): string {
  return s.replaceAll('\'', String.raw`\'`)
}

/** 単一種別の required フィールドに対する検査式を返す。 */
function checkExpr(name: string, kinds: Set<JsonKind>): string | undefined {
  const access = `v.${IDENTIFIER_RE.test(name) ? name : `['${escapeSingleQuote(name)}']`}`
  // object|null → isObject or null 許容
  const hasNull = kinds.has('null')
  const nonNull = [...kinds].filter((k) => k !== 'null')
  if (nonNull.length !== 1) {
    // 複数種別が混在する場合は存在確認のみ (過剰厳格を避ける)
    return `'${escapeSingleQuote(name)}' in v`
  }
  const kind = nonNull[0]
  const base: Partial<Record<JsonKind, string>> = {
    string: `isString(${access})`,
    number: `isNumber(${access})`,
    boolean: `isBoolean(${access})`,
    object: `isObject(${access})`,
    array: `Array.isArray(${access})`,
  }
  const expr = base[kind]
  if (expr === undefined) return `'${escapeSingleQuote(name)}' in v`
  return hasNull ? `(${access} === null || ${expr})` : expr
}

/**
 * 1 type のガード関数文字列を生成する。required フィールドのみ検査する。
 *
 * @param fnName - 関数名 (例 isMode)
 * @param type - 判別子
 * @param shape - 推論結果
 */
export function emitGuardFunction(
  fnName: string,
  type: string,
  shape: Shape
): string {
  const checks: string[] = [
    `isObject(v)`,
    `v.type === '${escapeSingleQuote(type)}'`,
  ]
  for (const [name, field] of shape.fields) {
    if (name === 'type' || !field.required) continue
    const expr = checkExpr(name, field.kinds)
    if (expr) checks.push(expr)
  }
  return [
    `function ${fnName}(v: unknown): boolean {`,
    `  return ${checks.join(' &&\n    ')}`,
    `}`,
  ].join('\n')
}
