/** ファイル読み込み (I/O) 起因のエラー。JSON 構文エラーや未知 type は含まない。 */
export interface FileReadError {
  _tag: 'FileReadError'
  path: string
  /** Node.js のエラーコード (ENOENT / EACCES など)。取得できなければ undefined。 */
  code?: string
  message: string
}

/**
 * FileReadError を生成する。
 *
 * @param path - 対象パス
 * @param error - 捕捉した例外
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
