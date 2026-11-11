/**
 * Zero-dependency Result / ResultAsync implementation.
 *
 * Offers neverthrow-like ergonomics without any external dependency.
 */

// ---------------------------------------------------------------------------
// Result<T, E>
// ---------------------------------------------------------------------------

/** A success. Holds `value`. */
export interface OkResult<T> {
  readonly isOk: true
  readonly isErr: false
  readonly value: T
  map<U>(fn: (value: T) => U): OkResult<U>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- symmetric public contract with ErrResult.mapErr<F>
  mapErr<F>(_fn: (error: never) => F): OkResult<T>
  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, F>
  match<U>(onOk: (value: T) => U, _onErr: (error: never) => U): U
  unwrapOr(_fallback: T): T
}

/** A failure. Holds `error`. */
export interface ErrResult<E> {
  readonly isOk: false
  readonly isErr: true
  readonly error: E
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- symmetric public contract with OkResult.map<U>
  map<U>(_fn: (value: never) => U): ErrResult<E>
  mapErr<F>(fn: (error: E) => F): ErrResult<F>
  andThen<U, F>(_fn: (value: never) => Result<U, F>): ErrResult<E>
  match<U>(_onOk: (value: never) => U, onErr: (error: E) => U): U
  unwrapOr<T>(fallback: T): T
}

/** Either `OkResult<T>` or `ErrResult<E>`. */
export type Result<T, E> = OkResult<T> | ErrResult<E>

/** Implementation of `OkResult<T>`. */
class OkResultImpl<T> implements OkResult<T> {
  readonly isOk = true as const
  readonly isErr = false as const

  constructor(readonly value: T) {}

  map<U>(fn: (value: T) => U): OkResult<U> {
    return new OkResultImpl(fn(this.value))
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters, @typescript-eslint/no-unused-vars -- OkResult.mapErr is a no-op
  mapErr<F>(_fn: (error: never) => F): OkResult<T> {
    return this
  }

  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, F> {
    return fn(this.value)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- OkResult.match always calls onOk
  match<U>(onOk: (value: T) => U, _onErr: (error: never) => U): U {
    return onOk(this.value)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- OkResult.unwrapOr always returns value
  unwrapOr(_fallback: T): T {
    return this.value
  }
}

/** Implementation of `ErrResult<E>`. */
class ErrResultImpl<E> implements ErrResult<E> {
  readonly isOk = false as const
  readonly isErr = true as const

  constructor(readonly error: E) {}

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters, @typescript-eslint/no-unused-vars -- ErrResult.map is a no-op
  map<U>(_fn: (value: never) => U): ErrResult<E> {
    return this
  }

  mapErr<F>(fn: (error: E) => F): ErrResult<F> {
    return new ErrResultImpl(fn(this.error))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ErrResult.andThen is a no-op
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
 * Creates a success `Result<T, never>`.
 *
 * @param value - Success value
 */
export function ok<T>(value: T): OkResult<T> {
  return new OkResultImpl(value)
}

/**
 * Creates a failure `Result<never, E>`.
 *
 * @param error - Error value
 */
export function err<E>(error: E): ErrResult<E> {
  return new ErrResultImpl(error)
}

// ---------------------------------------------------------------------------
// ResultAsync<T, E>
// ---------------------------------------------------------------------------

/**
 * A `PromiseLike<Result<T, E>>` that can be awaited and chained with `map` / `mapErr` / `andThen`.
 */
export class ResultAsync<T, E> implements PromiseLike<Result<T, E>> {
  private readonly _promise: Promise<Result<T, E>>

  constructor(promise: Promise<Result<T, E>>) {
    this._promise = promise
  }

  // eslint-disable-next-line unicorn/no-thenable -- intentionally implements PromiseLike so that it can be awaited
  then<TResult1 = Result<T, E>, TResult2 = never>(
    onfulfilled?:
      | ((value: Result<T, E>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected as never)
  }

  /**
   * Wraps a `Promise<T>` in a `ResultAsync<T, E>`. A rejection is mapped to `E` with `onError`.
   *
   * @param promise - Target promise
   * @param onError - Error mapper
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
   * Wraps a resolved `Result<T, E>` in a `ResultAsync<T, E>`.
   *
   * @param result - Target result
   */
  static fromResult<T, E>(result: Result<T, E>): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(result))
  }

  /**
   * Transforms the success value.
   *
   * @param fn - Synchronous mapper
   */
  map<U>(fn: (value: T) => U): ResultAsync<U, E> {
    return new ResultAsync(
      this._promise.then((r) => r.map(fn) as Result<U, E>)
    )
  }

  /**
   * Transforms the error value.
   *
   * @param fn - Synchronous error mapper
   */
  mapErr<F>(fn: (error: E) => F): ResultAsync<T, F> {
    return new ResultAsync(
      this._promise.then((r) => r.mapErr(fn) as Result<T, F>)
    )
  }

  /**
   * Chains a step that may fail.
   *
   * @param fn - Mapper returning a `ResultAsync<U, F>` or `Result<U, F>`
   */
  andThen<U, F>(
    fn: (value: T) => ResultAsync<U, F> | Result<U, F>
  ): ResultAsync<U, E | F> {
    return new ResultAsync(
      this._promise.then(async (r): Promise<Result<U, E | F>> => {
        if (r.isErr) return r
        const next = fn(r.value)
        return next instanceof ResultAsync ? next._promise : next
      })
    )
  }

  /**
   * Pattern-matches on success / failure.
   *
   * @param onOk - Success handler
   * @param onErr - Error handler
   */
  async match<U>(
    onOk: (value: T) => U | Promise<U>,
    onErr: (error: E) => U | Promise<U>
  ): Promise<U> {
    const r = await this._promise
    return r.isOk ? onOk(r.value) : onErr(r.error)
  }

  /**
   * Returns the value on success, or `fallback` on failure.
   *
   * @param fallback - Fallback value
   */
  async unwrapOr(fallback: T): Promise<T> {
    const r = await this._promise
    return r.isOk ? r.value : fallback
  }
}
