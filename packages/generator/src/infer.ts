/** Kind of a JSON value. */
export type JsonKind = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'

/** Returns the kind of a JSON value. */
export function jsonKind(v: unknown): JsonKind {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  const t = typeof v
  return (['string', 'number', 'boolean'] as string[]).includes(t) ? (t as 'string' | 'number' | 'boolean') : 'object'
}

/** Inference result for one field. */
export interface FieldShape {
  /** Whether the field was present in every sample. */
  required: boolean
  /** Set of observed JSON kinds. */
  kinds: Set<JsonKind>
  /** Set of observed string literals (only when within the threshold). */
  literals?: Set<string>
}

/** Inference result for one type (or content block). */
export interface Shape {
  /** Total number of samples. */
  count: number
  /** Field name to inference result. */
  fields: Map<string, FieldShape>
}

/** Default for `InferOptions.maxLiterals`. */
const DEFAULT_MAX_LITERALS = 20

/** Inference options. */
export interface InferOptions {
  /** Maximum number of string literals kept as an enumeration; above it `literals` is dropped. Defaults to `DEFAULT_MAX_LITERALS`. */
  maxLiterals?: number
}

/**
 * Infers the field shapes from samples of the same type.
 *
 * @param samples - Raw JSON objects
 * @param options - Inference options
 */
export function inferShape(
  samples: Record<string, unknown>[],
  options: InferOptions = {}
): Shape {
  const maxLiterals = options.maxLiterals ?? DEFAULT_MAX_LITERALS
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

      // Collect string literals (null marks "dropped")
      const cur = literals.get(key)
      if (cur === null) {
        // Already dropped
      } else if (kind === 'string') {
        const set = cur ?? new Set<string>()
        set.add(value as string)
        literals.set(key, set.size > maxLiterals ? null : set)
      }
    }
  }

  const fields = new Map<string, FieldShape>()
  for (const [key, seen] of presence) {
    const lit = literals.get(key)
    const kindSet = kinds.get(key) ?? new Set<JsonKind>()
    // Use literals only when every observed value was a string
    const allString = kindSet.size === 1 && kindSet.has('string')
    fields.set(key, {
      required: seen === count,
      kinds: kindSet,
      literals: allString && lit ? lit : undefined,
    })
  }

  return { count, fields }
}
