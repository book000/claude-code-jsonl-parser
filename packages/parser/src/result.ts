/**
 * Zero-dependency Result / ResultAsync implementation.
 *
 * neverthrow に近い使い勝手を、外部依存なしで提供する。
 */

// ---------------------------------------------------------------------------
// Result<T, E>
// ---------------------------------------------------------------------------

/** 成功を表す。`value` を保持する。 */
export interface OkResult<T> {
  readonly isOk: true
  readonly isErr: false
  readonly value: T
  map<U>(fn: (value: T) => U): OkResult<U>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- ErrResult.mapErr<F> と対称の公開契約
  mapErr<F>(_fn: (error: never) => F): OkResult<T>
  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, F>
  match<U>(onOk: (value: T) => U, _onErr: (error: never) => U): U
  unwrapOr(_fallback: T): T
}

/** 失敗を表す。`error` を保持する。 */
export interface ErrResult<E> {
  readonly isOk: false
  readonly isErr: true
  readonly error: E
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- OkResult.map<U> と対称の公開契約
  map<U>(_fn: (value: never) => U): ErrResult<E>
  mapErr<F>(fn: (error: E) => F): ErrResult<F>
  andThen<U, F>(_fn: (value: never) => Result<U, F>): ErrResult<E>
  match<U>(_onOk: (value: never) => U, onErr: (error: E) => U): U
  unwrapOr<T>(fallback: T): T
}

/** `OkResult<T>` または `ErrResult<E>`。 */
export type Result<T, E> = OkResult<T> | ErrResult<E>

class OkResultImpl<T> implements OkResult<T> {
  readonly isOk = true as const
  readonly isErr = false as const

  constructor(readonly value: T) {}

  map<U>(fn: (value: T) => U): OkResult<U> {
    return new OkResultImpl(fn(this.value))
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters, @typescript-eslint/no-unused-vars -- OkResult.mapErr は no-op
  mapErr<F>(_fn: (error: never) => F): OkResult<T> {
    return this
  }

  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, F> {
    return fn(this.value)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- OkResult.match は常に onOk を呼ぶ
  match<U>(onOk: (value: T) => U, _onErr: (error: never) => U): U {
    return onOk(this.value)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- OkResult.unwrapOr は常に value を返す
  unwrapOr(_fallback: T): T {
    return this.value
  }
}

class ErrResultImpl<E> implements ErrResult<E> {
  readonly isOk = false as const
  readonly isErr = true as const

  // eslint-disable-next-line n/handle-callback-err -- 'error' は格納値であり Node コールバックのエラー引数ではない
  constructor(readonly error: E) {}

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters, @typescript-eslint/no-unused-vars -- ErrResult.map は no-op
  map<U>(_fn: (value: never) => U): ErrResult<E> {
    return this
  }

  mapErr<F>(fn: (error: E) => F): ErrResult<F> {
    return new ErrResultImpl(fn(this.error))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ErrResult.andThen は no-op
  andThen<U, F>(_fn: (value: never) => Result<U, F>): ErrResult<E> {
    return this
  }

  match<U>(_onOk: (value: never) => U, onErr: (error: E) => U): U {
    return onErr(this.error)
  }

  unwrapOr<T>(fallback: T): T {
    return fallback
  }
}

/**
 * 成功 `Result<T, never>` を生成する。
 *
 * @param value - 成功値
 */
export function ok<T>(value: T): OkResult<T> {
  return new OkResultImpl(value)
}

/**
 * 失敗 `Result<never, E>` を生成する。
 *
 * @param error - エラー値
 */
export function err<E>(error: E): ErrResult<E> {
  return new ErrResultImpl(error)
}

// ---------------------------------------------------------------------------
// ResultAsync<T, E>
// ---------------------------------------------------------------------------

/**
 * `await` 可能で `map / mapErr / andThen` を連鎖できる `PromiseLike<Result<T, E>>`。
 */
export class ResultAsync<T, E> implements PromiseLike<Result<T, E>> {
  private readonly _promise: Promise<Result<T, E>>

  constructor(promise: Promise<Result<T, E>>) {
    this._promise = promise
  }

  // eslint-disable-next-line unicorn/no-thenable -- await 可能にするため意図的に PromiseLike を実装する
  then<TResult1 = Result<T, E>, TResult2 = never>(
    onfulfilled?:
      | ((value: Result<T, E>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected as never)
  }

  /**
   * `Promise<T>` を `ResultAsync<T, E>` に包む。reject 時は `onError` で E に写像する。
   *
   * @param promise - 対象 Promise
   * @param onError - エラー写像
   */
  static fromPromise<T, E>(
    promise: Promise<T>,
    onError: (reason: unknown) => E
  ): ResultAsync<T, E> {
    return new ResultAsync(
      promise.then(
        (v) => ok(v) as Result<T, E>,
        (error: unknown) => err(onError(error)) as Result<T, E>
      )
    )
  }

  /**
   * 解決済み `Result<T, E>` を `ResultAsync<T, E>` に包む。
   *
   * @param result - 対象 Result
   */
  static fromResult<T, E>(result: Result<T, E>): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(result))
  }

  /**
   * 成功値を変換する。
   *
   * @param fn - 同期写像
   */
  map<U>(fn: (value: T) => U): ResultAsync<U, E> {
    return new ResultAsync(
      // eslint-disable-next-line unicorn/no-array-callback-reference -- fn は利用者供給の写像であり配列メソッド参照ではない
      this._promise.then((r) => r.map(fn) as Result<U, E>)
    )
  }

  /**
   * エラー値を変換する。
   *
   * @param fn - 同期エラー写像
   */
  mapErr<F>(fn: (error: E) => F): ResultAsync<T, F> {
    return new ResultAsync(
      this._promise.then((r) => r.mapErr(fn) as Result<T, F>)
    )
  }

  /**
   * 失敗しうる非同期処理を連鎖する。
   *
   * @param fn - `ResultAsync<U, F>` または `Result<U, F>` を返す写像
   */
  andThen<U, F>(
    fn: (value: T) => ResultAsync<U, F> | Result<U, F>
  ): ResultAsync<U, E | F> {
    return new ResultAsync(
      this._promise.then(async (r): Promise<Result<U, E | F>> => {
        if (r.isErr) return r
        const next = fn(r.value)
        if (next instanceof ResultAsync) {
          return next._promise
        }
        return next
      })
    )
  }

  /**
   * 成功 / 失敗でパターンマッチする。
   *
   * @param onOk - 成功値ハンドラ
   * @param onErr - エラー値ハンドラ
   */
  async match<U>(
    onOk: (value: T) => U | Promise<U>,
    onErr: (error: E) => U | Promise<U>
  ): Promise<U> {
    const r = await this._promise
    if (r.isOk) return onOk(r.value)
    return onErr(r.error)
  }

  /**
   * 成功なら value、失敗なら fallback を返す。
   *
   * @param fallback - フォールバック値
   */
  async unwrapOr(fallback: T): Promise<T> {
    const r = await this._promise
    if (r.isOk) return r.value
    return fallback
  }
}
