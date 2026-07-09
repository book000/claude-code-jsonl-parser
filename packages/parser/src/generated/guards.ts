/**
 * Claude Code JSONL の各エントリ型に対する zod 非依存の純粋な型ガード。
 * トップレベル必須フィールドの最小検査のみ行う。
 *
 * claude-code-jsonl-generator でコーパスから再生成できるが、
 * content-block guards は手動でキュレーションしているため、
 * 生成結果をそのまま上書きするのではなく差分を確認して反映すること。
 */
import type {
  AssistantEntry, UserEntry, AttachmentEntry, SystemEntry, ModeEntry,
  PermissionModeEntry, AiTitleEntry, AgentNameEntry, AgentSettingEntry,
  RelocatedEntry, LastPromptEntry, WorktreeStateEntry, BridgeSessionEntry,
  QueueOperationEntry, PrLinkEntry, FrameLinkEntry, FileHistorySnapshotEntry,
  StartedEntry, ResultEntry,
  AssistantContentBlock, UserContentBlock, ToolResultBlock,
  ToolResultContentBlock, UnknownContentBlock,
} from './types'

// ---------------------------------------------------------------------------
// プリミティブ検査ヘルパ
// ---------------------------------------------------------------------------

/** 配列でも null でもないプレーンオブジェクトかどうかを判定する。 */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
/** `string` かどうかを判定する。 */
function isString(v: unknown): v is string {
  return typeof v === 'string'
}
/** `number` かどうかを判定する。 */
function isNumber(v: unknown): v is number {
  return typeof v === 'number'
}
/** `boolean` かどうかを判定する。 */
function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean'
}

/** フルメタデータ系の共通必須フィールドを検査する。 */
function hasEntryBase(o: Record<string, unknown>): boolean {
  return (
    isString(o.cwd) &&
    isString(o.entrypoint) &&
    isString(o.gitBranch) &&
    isBoolean(o.isSidechain) &&
    (o.parentUuid === null || isString(o.parentUuid)) &&
    isString(o.sessionId) &&
    isString(o.timestamp) &&
    isString(o.userType) &&
    isString(o.uuid) &&
    isString(o.version)
  )
}

// ---------------------------------------------------------------------------
// 個別ガード (raw: unknown を受け、型述語を返す)
// ---------------------------------------------------------------------------

/** `AssistantMessage`/`UserMessage` に共通する必須文字列フィールド `role` を検査する。 */
function hasMessageRole(message: Record<string, unknown>): boolean {
  return isString(message.role)
}

function isAssistant(v: unknown): v is Omit<AssistantEntry, '_kind'> {
  return (
    isObject(v) &&
    v.type === 'assistant' &&
    hasEntryBase(v) &&
    isObject(v.message) &&
    hasMessageRole(v.message) &&
    isString(v.message.id) &&
    isString(v.message.model)
  )
}
function isUser(v: unknown): v is Omit<UserEntry, '_kind'> {
  return (
    isObject(v) &&
    v.type === 'user' &&
    hasEntryBase(v) &&
    isObject(v.message) &&
    hasMessageRole(v.message)
  )
}
function isAttachment(v: unknown): v is Omit<AttachmentEntry, '_kind'> {
  return isObject(v) && v.type === 'attachment' && hasEntryBase(v) && isObject(v.attachment)
}
function isSystem(v: unknown): v is Omit<SystemEntry, '_kind'> {
  return isObject(v) && v.type === 'system' && hasEntryBase(v) && isString(v.subtype)
}
function isMode(v: unknown): v is Omit<ModeEntry, '_kind'> {
  return isObject(v) && v.type === 'mode' && isString(v.mode) && isString(v.sessionId)
}
function isPermissionMode(v: unknown): v is Omit<PermissionModeEntry, '_kind'> {
  return isObject(v) && v.type === 'permission-mode' && isString(v.permissionMode) && isString(v.sessionId)
}
function isAiTitle(v: unknown): v is Omit<AiTitleEntry, '_kind'> {
  return isObject(v) && v.type === 'ai-title' && isString(v.aiTitle) && isString(v.sessionId)
}
function isAgentName(v: unknown): v is Omit<AgentNameEntry, '_kind'> {
  return isObject(v) && v.type === 'agent-name' && isString(v.agentName) && isString(v.sessionId)
}
function isAgentSetting(v: unknown): v is Omit<AgentSettingEntry, '_kind'> {
  return isObject(v) && v.type === 'agent-setting' && isString(v.agentSetting) && isString(v.sessionId)
}
function isRelocated(v: unknown): v is Omit<RelocatedEntry, '_kind'> {
  return isObject(v) && v.type === 'relocated' && isString(v.relocatedCwd) && isString(v.sessionId)
}
function isLastPrompt(v: unknown): v is Omit<LastPromptEntry, '_kind'> {
  return isObject(v) && v.type === 'last-prompt' && isString(v.leafUuid) && isString(v.sessionId)
}
function isWorktreeState(v: unknown): v is Omit<WorktreeStateEntry, '_kind'> {
  return (
    isObject(v) && v.type === 'worktree-state' && isString(v.sessionId) &&
    (v.worktreeSession === null || isObject(v.worktreeSession))
  )
}
function isBridgeSession(v: unknown): v is Omit<BridgeSessionEntry, '_kind'> {
  return (
    isObject(v) && v.type === 'bridge-session' && isString(v.bridgeSessionId) &&
    isNumber(v.lastSequenceNum) && isString(v.sessionId)
  )
}
function isQueueOperation(v: unknown): v is Omit<QueueOperationEntry, '_kind'> {
  return (
    isObject(v) && v.type === 'queue-operation' && isString(v.operation) &&
    isString(v.sessionId) && isString(v.timestamp)
  )
}
function isPrLink(v: unknown): v is Omit<PrLinkEntry, '_kind'> {
  return (
    isObject(v) && v.type === 'pr-link' && isNumber(v.prNumber) &&
    isString(v.prRepository) && isString(v.prUrl) && isString(v.sessionId) && isString(v.timestamp)
  )
}
function isFrameLink(v: unknown): v is Omit<FrameLinkEntry, '_kind'> {
  return (
    isObject(v) && v.type === 'frame-link' && isString(v.frameUrl) &&
    isString(v.path) && isString(v.sessionId) && isString(v.timestamp)
  )
}
function isFileHistorySnapshot(v: unknown): v is Omit<FileHistorySnapshotEntry, '_kind'> {
  return (
    isObject(v) && v.type === 'file-history-snapshot' && isBoolean(v.isSnapshotUpdate) &&
    isString(v.messageId) && isObject(v.snapshot)
  )
}
function isStarted(v: unknown): v is Omit<StartedEntry, '_kind'> {
  return isObject(v) && v.type === 'started' && isString(v.key) && isString(v.agentId)
}
function isResult(v: unknown): v is Omit<ResultEntry, '_kind'> {
  return isObject(v) && v.type === 'result' && isString(v.key) && isString(v.agentId) && 'result' in v
}

// ---------------------------------------------------------------------------
// レジストリ
// ---------------------------------------------------------------------------

/** type 文字列 → ガード関数のマップ。 */
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
} as const satisfies Record<string, (v: unknown) => boolean>

/** 既知 type 名の配列。 */
export const KNOWN_TYPES = Object.keys(guards) as (keyof typeof guards)[]

/**
 * 指定 type のガードを適用する。ガードが存在しない type なら undefined。
 *
 * @param type - 判別子
 * @param v - 検査対象の生 JSON
 * @returns 一致すれば true / 不一致 false / 未知 type なら undefined
 */
export function guardByType(type: string, v: unknown): boolean | undefined {
  const g = (guards as Record<string, (x: unknown) => boolean>)[type]
  if (g === undefined) return undefined
  return g(v)
}

// ---------------------------------------------------------------------------
// content ブロックガード
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

/** tool_result の inner content 配列を正規化する。 */
function normalizeToolResultContent(
  content: unknown
): string | ToolResultContentBlock[] {
  if (isString(content)) return content
  if (!Array.isArray(content)) return [unknownBlock(content)]
  return content.map((el): ToolResultContentBlock => {
    if (!isObject(el)) return unknownBlock(el)
    if (isTextBlock(el) || isImageBlock(el) || isToolReferenceBlock(el)) {
      return el as unknown as ToolResultContentBlock
    }
    return unknownBlock(el)
  })
}

/** tool_result ブロック全体を検査・正規化する。 */
function normalizeToolResultBlock(v: Record<string, unknown>): UserContentBlock {
  if (v.type !== 'tool_result' || !isString(v.tool_use_id)) return unknownBlock(v)
  const block: ToolResultBlock = {
    type: 'tool_result',
    tool_use_id: v.tool_use_id,
    content: normalizeToolResultContent(v.content),
  }
  if (isBoolean(v.is_error)) block.is_error = v.is_error
  return block
}

/**
 * assistant の message.content 配列を正規化する。
 * 既知ブロックはそのまま、未知は UnknownContentBlock に降格する。
 *
 * @param content - 生の content 配列
 */
export function normalizeAssistantContent(
  content: unknown
): AssistantContentBlock[] {
  if (!Array.isArray(content)) return [unknownBlock(content)]
  return content.map((el): AssistantContentBlock => {
    if (!isObject(el)) return unknownBlock(el)
    if (isTextBlock(el) || isThinkingBlock(el) || isToolUseBlock(el)) {
      return el as unknown as AssistantContentBlock
    }
    return unknownBlock(el)
  })
}

/**
 * user の message.content を正規化する。string ならそのまま、配列なら要素ごとに正規化。
 *
 * @param content - 生の content (string または配列)
 */
export function normalizeUserContent(
  content: unknown
): string | UserContentBlock[] {
  if (isString(content)) return content
  if (!Array.isArray(content)) return [unknownBlock(content)]
  return content.map((el): UserContentBlock => {
    if (!isObject(el)) return unknownBlock(el)
    if (isTextBlock(el)) return el as unknown as UserContentBlock
    if (el.type === 'tool_result') return normalizeToolResultBlock(el)
    return unknownBlock(el)
  })
}
