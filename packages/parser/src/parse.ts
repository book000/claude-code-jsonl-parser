import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import type { ParsedLine } from './generated/types'
import { ok, ResultAsync, type Result } from './result'
import { parseLine } from './parse-line'
import { fileReadError, type FileReadError } from './errors'

/**
 * Synchronous iterator that parses a JSONL string line by line.
 * It slices one line at a time with `indexOf` instead of building a full line array with `text.split('\n')`, so the extra memory stays at one line.
 *
 * Blank lines (empty after trimming) are skipped and not counted in line numbers.
 *
 * @param text - Whole JSONL text
 */
export function* parseJsonlLines(text: string): Iterable<ParsedLine> {
  let lineNumber = 0
  let start = 0
  while (start <= text.length) {
    const nlIndex = text.indexOf('\n', start)
    const end = nlIndex === -1 ? text.length : nlIndex
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
 * Parses a whole JSONL string and returns the lines as an array.
 * Per-line errors are represented as array elements, so this function never returns `Err`.
 *
 * @param text - Whole JSONL text
 */
export function parseJsonl(text: string): Result<ParsedLine[], never> {
  return ok([...parseJsonlLines(text)])
}

/**
 * Asynchronous iterator that reads and parses a file line by line (constant memory).
 * An I/O error is thrown as a `FileReadError` during iteration.
 *
 * @param path - JSONL file path
 */
export async function* parseJsonlFileStream(
  path: string
): AsyncIterable<ParsedLine> {
  const stream = createReadStream(path, { encoding: 'utf8' })
  // crlfDelay: Infinity treats \r\n as a single line break
  const rl = createInterface({ input: stream, crlfDelay: Infinity })
  let lineNumber = 0
  try {
    for await (const raw of rl) {
      if (raw.trim() === '') continue
      lineNumber += 1
      yield parseLine(raw, lineNumber)
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- FileReadError is an intentional tagged object (does not extend Error)
    throw fileReadError(path, error)
  } finally {
    rl.close()
    stream.destroy()
  }
}

/**
 * Reads a whole file and parses it at once. Only I/O errors become `Err`.
 *
 * @param path - JSONL file path
 */
export function parseJsonlFile(
  path: string
): ResultAsync<ParsedLine[], FileReadError> {
  return ResultAsync.fromPromise(
    (async () => {
      const out: ParsedLine[] = []
      // eslint-disable-next-line unicorn/prefer-array-from-async -- Array.fromAsync is ES2024; avoid changing the lib/runtime target (ES2023) of the published package
      for await (const line of parseJsonlFileStream(path)) out.push(line)
      return out
    })(),
    (error) => {
      // Pass through the FileReadError thrown by parseJsonlFileStream
      return typeof error === 'object' &&
        error !== null &&
        (error as { _tag?: string })._tag === 'FileReadError' ? (error as FileReadError) : fileReadError(path, error)
    }
  )
}
