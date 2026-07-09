import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import type { ParsedLine } from './generated/types'
import { ok, ResultAsync, type Result } from './result'
import { parseLine } from './parse-line'
import { fileReadError, type FileReadError } from './errors'

/**
 * JSONL 文字列を行単位で逐次パースする同期イテレータ。
 * `text.split('\n')` で全行配列を作らず、`indexOf` で 1 行ずつ切り出すため、
 * 追加メモリは 1 行分にとどまる (全行配列分の追加確保が発生しない)。
 *
 * 空行 (トリム後に空) はスキップし、行番号カウントには含めない。
 *
 * @param text - JSONL テキスト全体
 */
export function* parseJsonlLines(text: string): Iterable<ParsedLine> {
  let lineNumber = 0
  let start = 0
  while (start <= text.length) {
    const nlIndex = text.indexOf('\n', start)
    const end = nlIndex === -1 ? text.length : nlIndex
    // CRLF の \r を除去
    const rawEnd = end > start && text[end - 1] === '\r' ? end - 1 : end
    const line = text.slice(start, rawEnd)
    if (line.trim() !== '') {
      lineNumber += 1
      yield parseLine(line, lineNumber)
    }
    if (nlIndex === -1) break
    start = end + 1
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

/**
 * ファイルを行単位で逐次読み込み・パースする非同期イテレータ (定数メモリ)。
 * I/O エラーは反復時に FileReadError を throw する。
 *
 * @param path - JSONL ファイルパス
 */
export async function* parseJsonlFileStream(
  path: string
): AsyncIterable<ParsedLine> {
  const stream = createReadStream(path, { encoding: 'utf8' })
  // 'error' を Promise 化して throw に載せるためのハンドリング
  const rl = createInterface({ input: stream, crlfDelay: Infinity })
  let lineNumber = 0
  try {
    for await (const raw of rl) {
      if (raw.trim() === '') continue
      lineNumber += 1
      yield parseLine(raw, lineNumber)
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- FileReadError は意図的な判別可能 union (Error 継承ではない)
    throw fileReadError(path, error)
  } finally {
    rl.close()
    stream.destroy()
  }
}

/**
 * ファイル全体を読み込み一括パースする。I/O エラーのみ Err になる。
 *
 * @param path - JSONL ファイルパス
 */
export function parseJsonlFile(
  path: string
): ResultAsync<ParsedLine[], FileReadError> {
  return ResultAsync.fromPromise(
    (async () => {
      const out: ParsedLine[] = []
      for await (const line of parseJsonlFileStream(path)) out.push(line)
      return out
    })(),
    (error) => {
      // parseJsonlFileStream が投げた FileReadError はそのまま通す
      if (
        typeof error === 'object' &&
        error !== null &&
        (error as { _tag?: string })._tag === 'FileReadError'
      ) {
        return error as FileReadError
      }
      return fileReadError(path, error)
    }
  )
}
