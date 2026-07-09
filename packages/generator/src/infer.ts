/** JSON 値の種別。 */
export type JsonKind = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'

/**
 * JSON 値の種別を返す。
 *
 * @param v - 対象値
 */
export function jsonKind(v: unknown): JsonKind {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  const t = typeof v
  if (t === 'string' || t === 'number' || t === 'boolean') return t
  return 'object'
}

/** 1 フィールドの推論結果。 */
export interface FieldShape {
  /** 全サンプルに存在したか。 */
  required: boolean
  /** 観測された JSON 種別集合。 */
  kinds: Set<JsonKind>
  /** 観測された文字列リテラル集合 (閾値以下のときのみ)。 */
  literals?: Set<string>
}

/** 1 type (または content ブロック) の推論結果。 */
export interface Shape {
  /** サンプル総数。 */
  count: number
  /** フィールド名 → 推論結果。 */
  fields: Map<string, FieldShape>
}

/** 推論オプション。 */
export interface InferOptions {
  /** 文字列リテラルを列挙として保持する上限。超えたら literals を破棄。既定 20。 */
  maxLiterals?: number
}

/**
 * 同一 type のサンプル群からフィールド形状を推論する。
 *
 * @param samples - 生 JSON オブジェクト配列
 * @param options - 推論オプション
 */
export function inferShape(
  samples: Record<string, unknown>[],
  options: InferOptions = {}
): Shape {
  const maxLiterals = options.maxLiterals ?? 20
  const count = samples.length
  const presence = new Map<string, number>()
  const kinds = new Map<string, Set<JsonKind>>()
  const literals = new Map<string, Set<string> | null>()

  for (const sample of samples) {
    for (const [key, value] of Object.entries(sample)) {
      presence.set(key, (presence.get(key) ?? 0) + 1)

      const kset = kinds.get(key) ?? new Set<JsonKind>()
      const kind = jsonKind(value)
      kset.add(kind)
      kinds.set(key, kset)

      // 文字列リテラル収集 (null は「破棄済み」マーカー)
      const cur = literals.get(key)
      if (cur === null) {
        // すでに破棄済み
      } else if (kind === 'string') {
        const set = cur ?? new Set<string>()
        set.add(value as string)
        if (set.size > maxLiterals) {
          literals.set(key, null)
        } else {
          literals.set(key, set)
        }
      }
    }
  }

  const fields = new Map<string, FieldShape>()
  for (const [key, seen] of presence) {
    const lit = literals.get(key)
    const kindSet = kinds.get(key) ?? new Set<JsonKind>()
    // 全て文字列だった場合のみ literals を採用する
    const allString = kindSet.size === 1 && kindSet.has('string')
    fields.set(key, {
      required: seen === count,
      kinds: kindSet,
      literals: allString && lit ? lit : undefined,
    })
  }

  return { count, fields }
}
