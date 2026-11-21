import type { JsonKind, Shape } from './infer'

/** Matches names that are safe to use as a JS identifier. */
const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/

/** Escapes `'` so the value is safe inside a single-quoted string literal. */
function escapeSingleQuote(s: string): string {
  return s.replaceAll('\'', String.raw`\'`)
}

/**
 * Returns the check expression for a required field.
 * A field without exactly one non-null kind (mixed kinds, or only `null`) gets only a presence check (`'name' in v`).
 */
function checkExpr(name: string, kinds: Set<JsonKind>): string | undefined {
  const access = `v.${IDENTIFIER_RE.test(name) ? name : `['${escapeSingleQuote(name)}']`}`
  const hasNull = kinds.has('null')
  const nonNull = [...kinds].filter((k) => k !== 'null')
  if (nonNull.length !== 1) {
    // Mixed kinds or only null: check presence only (avoid being overly strict)
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
 * Generates the source of the guard function for one type. Only required fields are checked.
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
