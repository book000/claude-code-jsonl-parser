/** An error caused by file I/O. JSON syntax errors and unknown types are not included. */
export interface FileReadError {
  _tag: 'FileReadError'
  path: string
  /** Node.js error code (`ENOENT`, `EACCES`, ...). `undefined` if unavailable. */
  code?: string
  message: string
}

/**
 * Creates a `FileReadError`.
 *
 * @param path - Target path
 * @param error - Caught exception
 */
export function fileReadError(path: string, error: unknown): FileReadError {
  const rawCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: unknown }).code
      : undefined
  const code = typeof rawCode === 'string' ? rawCode : undefined
  return {
    _tag: 'FileReadError',
    path,
    code,
    message: error instanceof Error ? error.message : String(error),
  }
}
