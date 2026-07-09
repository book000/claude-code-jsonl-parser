import type { ParsedLine } from './generated/types'
import { ok, type Result } from './result'
import { parseLine } from './parse-line'

/**
 * JSONL 文字列を行単位で逐次パースする同期イテレータ。
 * 大きな文字列でも 1 行分の中間メモリで済む。
 *
 * 空行 (トリム後に空) はスキップし、行番号カウントには含めない。
 *
 * @param text - JSONL テキスト全体
 */
export function* parseJsonlLines(text: string): Iterable<ParsedLine> {
  let lineNumber = 0
  for (const raw of text.split('\n')) {
    // CRLF の \r を除去
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw
    if (line.trim() === '') continue
    lineNumber += 1
    yield parseLine(line, lineNumber)
  }
}

/**
 * JSONL 文字列全体を一括パースして配列で返す。
 * 行単位のエラーは配列要素として表現されるため、この関数は Err を返さない。
 *
 * @param text - JSONL テキスト全体
 */
export function parseJsonl(text: string): Result<ParsedLine[], never> {
  return ok([...parseJsonlLines(text)])
}
