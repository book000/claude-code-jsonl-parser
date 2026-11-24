import type { JsonKind, Shape } from './infer'
import { IDENTIFIER_RE, stringLiteral } from './source'

/**
 * Maps the observed kinds (and an optional literal set) to a TypeScript type string.
 *
 * @param kinds - Observed JSON kinds
 * @param literals - String literal set, if any
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
  // With string literals, emit an open union (`'a' | 'b' | (string & {})`)
  if (literals && literals.size > 0 && kinds.has('string')) {
    const lits = [...literals].toSorted((a, b) => a.localeCompare(b)).map((s) => stringLiteral(s))
    parts.push(`${lits.join(' | ')} | (string & {})`)
  } else if (kinds.has('string')) {
    parts.push('string')
  }
  for (const k of ['number', 'boolean', 'array', 'object', 'null'] as JsonKind[]) {
    if (kinds.has(k)) parts.push(mapped[k])
  }
  return [...new Set(parts)].join(' | ')
}

/** Returns the name as is if it is a safe identifier, otherwise quotes it. */
function propKey(name: string): string {
  return IDENTIFIER_RE.test(name) ? name : stringLiteral(name)
}

/** Converts a type string (split on `-` and `_`) to PascalCase for use as an interface name. */
export function pascalCase(type: string): string {
  const name = type
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
    .replaceAll(/[^A-Za-z0-9$]/gu, (c) => `$${c.codePointAt(0)?.toString(16)}$`)
  return /^[0-9]/.test(name) ? `$${name}` : name
}

/**
 * Generates the source of the interface for one type.
 *
 * @param interfaceName - Interface name to emit (e.g. `LastPromptEntry`)
 * @param type - Discriminator string (e.g. `last-prompt`)
 * @param shape - Inference result
 */
export function emitInterface(
  interfaceName: string,
  type: string,
  shape: Shape
): string {
  if (shape.fields.has('_kind')) throw new Error('Cannot generate an interface for a field named "_kind"')
  const lines: string[] = [
    `export interface ${interfaceName} {`,
    `  _kind: 'known'`,
    `  type: ${stringLiteral(type)}`,
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
