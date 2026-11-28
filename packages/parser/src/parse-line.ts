import type { ParsedLine, KnownEntry } from './generated/types'
import {
  guardByType, normalizeAssistantContent, normalizeUserContent,
} from './generated/guards'

/**
 * Converts one JSONL line into a `ParsedLine`.
 *
 * - JSON syntax error: `LineParseError`
 * - Known type with a matching shape: `KnownEntry` (`_kind: 'known'` is added and content is normalized)
 * - Known type with a mismatched shape: `UnknownEntry` (`typeHint` holds the type)
 * - Unknown type or no type: `UnknownEntry` (no `typeHint`)
 *
 * @param rawLine - One line of text (without the line break)
 * @param lineNumber - 1-based line number
 */
export function parseLine(rawLine: string, lineNumber: number): ParsedLine {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawLine)
  } catch (error) {
    return {
      _kind: 'error',
      lineNumber,
      rawLine,
      message: error instanceof Error ? error.message : String(error),
    }
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed) ||
    typeof (parsed as Record<string, unknown>).type !== 'string'
  ) {
    return { _kind: 'unknown', lineNumber, raw: parsed }
  }

  const obj = parsed as Record<string, unknown>
  const type = obj.type as string
  const matched = guardByType(type, obj)

  if (matched === undefined) {
    return { _kind: 'unknown', lineNumber, raw: parsed }
  }
  if (!matched.ok) {
    return { _kind: 'unknown', lineNumber, raw: parsed, typeHint: type, reason: matched.reason }
  }

  // Shape matches: add `_kind` and normalize content (known blocks kept, others demoted to `UnknownContentBlock`)
  const entry = { ...obj, _kind: 'known' } as unknown as KnownEntry

  if (entry.type === 'assistant') {
    entry.message = {
      ...entry.message,
      content: normalizeAssistantContent(entry.message.content),
    }
  } else if (entry.type === 'user') {
    entry.message = {
      ...entry.message,
      content: normalizeUserContent(entry.message.content),
    }
  }

  return entry
}
