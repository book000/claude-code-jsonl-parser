/**
 * Pure type guards (no zod) for each Claude Code JSONL entry type.
 * Only the required top-level fields are checked, at a minimum.
 *
 * This file is maintained by hand.
 * claude-code-jsonl-generator emits `guards.generated.ts` for a corpus; diff that output against this file and merge intentionally.
 * The content-block guards are curated by hand, so never overwrite them wholesale.
 */
import type {
  AssistantContentBlock, UserContentBlock, ToolResultBlock,
  ToolResultContentBlock, UnknownContentBlock,
} from './types'

// ---------------------------------------------------------------------------
// Primitive check helpers
// ---------------------------------------------------------------------------

/** Whether the value is a plain object (neither an array nor null). */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
function isString(v: unknown): v is string {
  return typeof v === 'string'
}
function isNumber(v: unknown): v is number {
  return typeof v === 'number'
}
function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean'
}

/**
 * Result of a guard. When `ok` is false, `reason` holds a diagnostic message such
 * as the names of the mismatching fields, so consumers can see what caused the mismatch.
 */
export interface GuardResult {
  ok: boolean
  reason?: string
}

/** Builds a diagnostic message listing the failing field names from `[field name, check result]` pairs. Returns undefined when all pass. */
function fieldCheck(fields: [string, boolean][]): string | undefined {
  const failing = fields.filter(([, ok]) => !ok).map(([name]) => name)
  return failing.length > 0
    ? `missing/invalid field(s): ${failing.join(', ')}`
    : undefined
}

/** Checks the required fields common to the full-metadata entries and returns the reason on mismatch (undefined on match). */
function entryBaseReason(o: Record<string, unknown>): string | undefined {
  return fieldCheck([
    ['cwd', isString(o.cwd)],
    ['entrypoint', isString(o.entrypoint)],
    ['gitBranch', isString(o.gitBranch)],
    ['isSidechain', isBoolean(o.isSidechain)],
    ['parentUuid', o.parentUuid === null || isString(o.parentUuid)],
    ['sessionId', isString(o.sessionId)],
    ['timestamp', isString(o.timestamp)],
    ['userType', isString(o.userType)],
    ['uuid', isString(o.uuid)],
    ['version', isString(o.version)],
  ])
}

// ---------------------------------------------------------------------------
// Individual guards (take a raw unknown, return a GuardResult)
// ---------------------------------------------------------------------------

function isAssistant(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'assistant') return { ok: false, reason: 'type is not "assistant"' }
  const baseReason = entryBaseReason(v)
  if (baseReason !== undefined) return { ok: false, reason: baseReason }
  if (!isObject(v.message)) return { ok: false, reason: 'message is not an object' }
  const reason = fieldCheck([
    ['message.role', isString(v.message.role)],
    ['message.id', isString(v.message.id)],
    ['message.model', isString(v.message.model)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isUser(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'user') return { ok: false, reason: 'type is not "user"' }
  const baseReason = entryBaseReason(v)
  if (baseReason !== undefined) return { ok: false, reason: baseReason }
  if (!isObject(v.message)) return { ok: false, reason: 'message is not an object' }
  const reason = fieldCheck([['message.role', isString(v.message.role)]])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isAttachment(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'attachment') return { ok: false, reason: 'type is not "attachment"' }
  const baseReason = entryBaseReason(v)
  if (baseReason !== undefined) return { ok: false, reason: baseReason }
  const reason = fieldCheck([['attachment', isObject(v.attachment)]])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isSystem(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'system') return { ok: false, reason: 'type is not "system"' }
  const baseReason = entryBaseReason(v)
  if (baseReason !== undefined) return { ok: false, reason: baseReason }
  const reason = fieldCheck([['subtype', isString(v.subtype)]])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isMode(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'mode') return { ok: false, reason: 'type is not "mode"' }
  const reason = fieldCheck([
    ['mode', isString(v.mode)],
    ['sessionId', isString(v.sessionId)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isPermissionMode(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'permission-mode') return { ok: false, reason: 'type is not "permission-mode"' }
  const reason = fieldCheck([
    ['permissionMode', isString(v.permissionMode)],
    ['sessionId', isString(v.sessionId)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isAiTitle(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'ai-title') return { ok: false, reason: 'type is not "ai-title"' }
  const reason = fieldCheck([
    ['aiTitle', isString(v.aiTitle)],
    ['sessionId', isString(v.sessionId)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isAgentName(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'agent-name') return { ok: false, reason: 'type is not "agent-name"' }
  const reason = fieldCheck([
    ['agentName', isString(v.agentName)],
    ['sessionId', isString(v.sessionId)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isAgentSetting(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'agent-setting') return { ok: false, reason: 'type is not "agent-setting"' }
  const reason = fieldCheck([
    ['agentSetting', isString(v.agentSetting)],
    ['sessionId', isString(v.sessionId)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isRelocated(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'relocated') return { ok: false, reason: 'type is not "relocated"' }
  const reason = fieldCheck([
    ['relocatedCwd', isString(v.relocatedCwd)],
    ['sessionId', isString(v.sessionId)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isLastPrompt(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'last-prompt') return { ok: false, reason: 'type is not "last-prompt"' }
  const reason = fieldCheck([
    ['leafUuid', isString(v.leafUuid)],
    ['sessionId', isString(v.sessionId)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isWorktreeState(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'worktree-state') return { ok: false, reason: 'type is not "worktree-state"' }
  const reason = fieldCheck([
    ['sessionId', isString(v.sessionId)],
    ['worktreeSession', v.worktreeSession === null || isObject(v.worktreeSession)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isBridgeSession(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'bridge-session') return { ok: false, reason: 'type is not "bridge-session"' }
  const reason = fieldCheck([
    ['bridgeSessionId', isString(v.bridgeSessionId)],
    ['lastSequenceNum', isNumber(v.lastSequenceNum)],
    ['sessionId', isString(v.sessionId)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isQueueOperation(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'queue-operation') return { ok: false, reason: 'type is not "queue-operation"' }
  const reason = fieldCheck([
    ['operation', isString(v.operation)],
    ['sessionId', isString(v.sessionId)],
    ['timestamp', isString(v.timestamp)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isPrLink(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'pr-link') return { ok: false, reason: 'type is not "pr-link"' }
  const reason = fieldCheck([
    ['prNumber', isNumber(v.prNumber)],
    ['prRepository', isString(v.prRepository)],
    ['prUrl', isString(v.prUrl)],
    ['sessionId', isString(v.sessionId)],
    ['timestamp', isString(v.timestamp)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isFrameLink(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'frame-link') return { ok: false, reason: 'type is not "frame-link"' }
  const reason = fieldCheck([
    ['frameUrl', isString(v.frameUrl)],
    ['path', isString(v.path)],
    ['sessionId', isString(v.sessionId)],
    ['timestamp', isString(v.timestamp)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isFileHistorySnapshot(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'file-history-snapshot') return { ok: false, reason: 'type is not "file-history-snapshot"' }
  const reason = fieldCheck([
    ['isSnapshotUpdate', isBoolean(v.isSnapshotUpdate)],
    ['messageId', isString(v.messageId)],
    ['snapshot', isObject(v.snapshot)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isStarted(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'started') return { ok: false, reason: 'type is not "started"' }
  const reason = fieldCheck([
    ['key', isString(v.key)],
    ['agentId', isString(v.agentId)],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}
function isResult(v: unknown): GuardResult {
  if (!isObject(v)) return { ok: false, reason: 'not an object' }
  if (v.type !== 'result') return { ok: false, reason: 'type is not "result"' }
  const reason = fieldCheck([
    ['key', isString(v.key)],
    ['agentId', isString(v.agentId)],
    ['result', 'result' in v],
  ])
  return reason === undefined ? { ok: true } : { ok: false, reason }
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** Map from type string to guard function. */
export const guards = {
  assistant: isAssistant,
  user: isUser,
  attachment: isAttachment,
  system: isSystem,
  mode: isMode,
  'permission-mode': isPermissionMode,
  'ai-title': isAiTitle,
  'agent-name': isAgentName,
  'agent-setting': isAgentSetting,
  relocated: isRelocated,
  'last-prompt': isLastPrompt,
  'worktree-state': isWorktreeState,
  'bridge-session': isBridgeSession,
  'queue-operation': isQueueOperation,
  'pr-link': isPrLink,
  'frame-link': isFrameLink,
  'file-history-snapshot': isFileHistorySnapshot,
  started: isStarted,
  result: isResult,
} as const satisfies Record<string, (v: unknown) => GuardResult>

/** Names of the known types. */
export const KNOWN_TYPES = Object.keys(guards) as (keyof typeof guards)[]

/**
 * Applies the guard of the given type, or returns undefined if no guard exists for it.
 * Returns `{ ok: true }` on a match and `{ ok: false, reason }` on a mismatch, where
 * `reason` names the fields that caused it.
 *
 * @param type - Discriminator
 * @param v - Raw JSON to check
 */
export function guardByType(type: string, v: unknown): GuardResult | undefined {
  const g = (guards as Record<string, (x: unknown) => GuardResult>)[type]
  if (g === undefined) return undefined
  return g(v)
}

// ---------------------------------------------------------------------------
// Content-block guards
// ---------------------------------------------------------------------------

function unknownBlock(raw: unknown): UnknownContentBlock {
  return { _kind: 'unknown', raw }
}

function isTextBlock(v: Record<string, unknown>): boolean {
  return v.type === 'text' && isString(v.text)
}
function isThinkingBlock(v: Record<string, unknown>): boolean {
  return v.type === 'thinking' && isString(v.thinking) && isString(v.signature)
}
function isToolUseBlock(v: Record<string, unknown>): boolean {
  return v.type === 'tool_use' && isString(v.id) && isString(v.name) && 'input' in v
}
function isImageBlock(v: Record<string, unknown>): boolean {
  return (
    v.type === 'image' && isObject(v.source) &&
    isString((v.source as Record<string, unknown>).media_type) &&
    isString((v.source as Record<string, unknown>).data)
  )
}
function isToolReferenceBlock(v: Record<string, unknown>): boolean {
  return v.type === 'tool_reference' && isString(v.tool_name)
}

/** Normalizes the inner content of a tool_result. */
function normalizeToolResultContent(
  content: unknown
): string | ToolResultContentBlock[] {
  if (isString(content)) return content
  if (!Array.isArray(content)) return [unknownBlock(content)]
  return content.map((el): ToolResultContentBlock => {
    if (!isObject(el)) return unknownBlock(el)
    if (isTextBlock(el) || isImageBlock(el) || isToolReferenceBlock(el)) {
      return { ...el, _kind: 'known' } as unknown as ToolResultContentBlock
    }
    return unknownBlock(el)
  })
}

/** Checks and normalizes a whole tool_result block. */
function normalizeToolResultBlock(v: Record<string, unknown>): UserContentBlock {
  if (v.type !== 'tool_result' || !isString(v.tool_use_id)) return unknownBlock(v)
  const block: ToolResultBlock = {
    _kind: 'known',
    type: 'tool_result',
    tool_use_id: v.tool_use_id,
    content: normalizeToolResultContent(v.content),
  }
  if (isBoolean(v.is_error)) block.is_error = v.is_error
  return block
}

/**
 * Normalizes the message.content of an assistant entry.
 * Known blocks are kept as is; unknown ones are demoted to `UnknownContentBlock`.
 * A non-array value becomes a single `UnknownContentBlock`.
 *
 * @param content - Raw content
 */
export function normalizeAssistantContent(
  content: unknown
): AssistantContentBlock[] {
  if (!Array.isArray(content)) return [unknownBlock(content)]
  return content.map((el): AssistantContentBlock => {
    if (!isObject(el)) return unknownBlock(el)
    if (isTextBlock(el) || isThinkingBlock(el) || isToolUseBlock(el)) {
      return { ...el, _kind: 'known' } as unknown as AssistantContentBlock
    }
    return unknownBlock(el)
  })
}

/**
 * Normalizes the message.content of a user entry. A string is returned as is and an array is normalized per element.
 * Any other value becomes a single `UnknownContentBlock`.
 *
 * @param content - Raw content (string or array)
 */
export function normalizeUserContent(
  content: unknown
): string | UserContentBlock[] {
  if (isString(content)) return content
  if (!Array.isArray(content)) return [unknownBlock(content)]
  return content.map((el): UserContentBlock => {
    if (!isObject(el)) return unknownBlock(el)
    if (isTextBlock(el)) return { ...el, _kind: 'known' } as unknown as UserContentBlock
    if (el.type === 'tool_result') return normalizeToolResultBlock(el)
    return unknownBlock(el)
  })
}
