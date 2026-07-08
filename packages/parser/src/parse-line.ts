import type { ParsedLine, KnownEntry } from './generated/types'
import {
  guardByType, normalizeAssistantContent, normalizeUserContent,
} from './generated/guards'

/**
 * JSONL 1 行を ParsedLine に変換する。
 *
 * - JSON 構文エラー: `LineParseError`
 * - 既知 type かつ shape 一致: `KnownEntry` (_kind='known' 付与、content 正規化)
 * - 既知 type だが shape 不一致: `UnknownEntry` (typeHint に type 値)
 * - 未知 type / type 無し: `UnknownEntry` (typeHint 無し)
 *
 * @param rawLine - 1 行分の文字列 (改行を含まない)
 * @param lineNumber - 1 始まりの行番号
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

  // オブジェクトでない、または type が文字列でない場合は未知扱い
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
    // ガードが存在しない = 未知 type
    return { _kind: 'unknown', lineNumber, raw: parsed }
  }
  if (!matched) {
    // 既知 type だが shape 不一致
    return { _kind: 'unknown', lineNumber, raw: parsed, typeHint: type }
  }

  // shape 一致: _kind を付与し、content をハイブリッド正規化する
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
