export const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/

export function stringLiteral(value: string): string {
  return JSON.stringify(value).replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')
}
