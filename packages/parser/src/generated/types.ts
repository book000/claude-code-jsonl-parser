/**
 * Claude Code JSONL の各エントリ型定義。
 * 形状の根拠は実サンプルコーパスの調査結果。
 *
 * claude-code-jsonl-generator でコーパスから再生成できるが、
 * content-block guards / message shapes は手動でキュレーションしているため、
 * 生成結果をそのまま上書きするのではなく差分を確認して反映すること。
 */

// ---------------------------------------------------------------------------
// 判別子タグ
// ---------------------------------------------------------------------------

/** parser が付与する内部判別子。`type` フィールドとは別。 */
export type ParsedKind = 'known' | 'unknown' | 'error'

// ---------------------------------------------------------------------------
// 共通ベース (フルメタデータ系エントリが共有するフィールド)
// ---------------------------------------------------------------------------

/** assistant / user / attachment / system が共有する必須メタデータ。 */
export interface EntryBase {
  cwd: string
  entrypoint: string
  gitBranch: string
  isSidechain: boolean
  parentUuid: string | null
  sessionId: string
  timestamp: string
  userType: string
  uuid: string
  version: string
  /** サイドチェーン/サブエージェント関連の任意フィールド群 (観測されたもの) */
  agentId?: string
  agentName?: string
  teamName?: string
  slug?: string
  sessionKind?: string
  session_id?: string
}

// ---------------------------------------------------------------------------
// フルメタデータ系エントリ
// ---------------------------------------------------------------------------

/** `type: "assistant"` — アシスタント応答 (Anthropic API メッセージを内包)。 */
export interface AssistantEntry extends EntryBase {
  _kind: 'known'
  type: 'assistant'
  message: AssistantMessage
  requestId?: string
  isApiErrorMessage?: boolean
  apiErrorStatus?: number
  error?: unknown
  attributionAgent?: string
  attributionSkill?: string
  attributionPlugin?: string
  attributionMcpServer?: string
  attributionMcpTool?: string
}

/** `type: "user"` — ユーザ入力 / ツール結果を内包。 */
export interface UserEntry extends EntryBase {
  _kind: 'known'
  type: 'user'
  message: UserMessage
  isMeta?: boolean
  promptId?: string
  promptSource?: string
  origin?: string
  permissionMode?: string
  queuePriority?: number
  planContent?: string
  interruptedMessageId?: string
  isCompactSummary?: boolean
  isVisibleInTranscriptOnly?: boolean
  mcpMeta?: unknown
  sourceToolUseID?: string
  sourceToolAssistantUUID?: string
  toolUseResult?: unknown
  toolDenialKind?: string
}

/** `type: "attachment"` — 添付データ。 */
export interface AttachmentEntry extends EntryBase {
  _kind: 'known'
  type: 'attachment'
  attachment: Record<string, unknown>
}

/** `type: "system"` — システムイベント (subtype で細分化)。 */
export interface SystemEntry extends EntryBase {
  _kind: 'known'
  type: 'system'
  subtype: string
  isMeta?: boolean
  level?: string
  content?: unknown
  logicalParentUuid?: string
  compactMetadata?: unknown
  durationMs?: number
  messageCount?: number
  pendingBackgroundAgentCount?: number
  pendingWorkflowCount?: number
  toolUseID?: string
  stopReason?: string
  preventedContinuation?: boolean
  hasOutput?: boolean
  hookCount?: number
  hookErrors?: unknown
  hookInfos?: unknown
  hookAdditionalContext?: unknown
  error?: unknown
  maxRetries?: number
  retryAttempt?: number
  retryInMs?: number
}

// ---------------------------------------------------------------------------
// sessionId ベースの軽量エントリ
// ---------------------------------------------------------------------------

/** `type: "mode"`。 */
export interface ModeEntry {
  _kind: 'known'
  type: 'mode'
  mode: string
  sessionId: string
}

/** `type: "permission-mode"`。 */
export interface PermissionModeEntry {
  _kind: 'known'
  type: 'permission-mode'
  permissionMode: string
  sessionId: string
}

/** `type: "ai-title"`。 */
export interface AiTitleEntry {
  _kind: 'known'
  type: 'ai-title'
  aiTitle: string
  sessionId: string
}

/** `type: "agent-name"`。 */
export interface AgentNameEntry {
  _kind: 'known'
  type: 'agent-name'
  agentName: string
  sessionId: string
}

/** `type: "agent-setting"` — `agentSetting` は文字列。 */
export interface AgentSettingEntry {
  _kind: 'known'
  type: 'agent-setting'
  agentSetting: string
  sessionId: string
}

/** `type: "relocated"`。 */
export interface RelocatedEntry {
  _kind: 'known'
  type: 'relocated'
  relocatedCwd: string
  sessionId: string
}

/** `type: "last-prompt"` — `lastPrompt` は任意。 */
export interface LastPromptEntry {
  _kind: 'known'
  type: 'last-prompt'
  leafUuid: string
  sessionId: string
  lastPrompt?: string
}

/** `type: "worktree-state"` — `worktreeSession` は object または null。 */
export interface WorktreeStateEntry {
  _kind: 'known'
  type: 'worktree-state'
  worktreeSession: Record<string, unknown> | null
  sessionId: string
}

/** `type: "bridge-session"`。 */
export interface BridgeSessionEntry {
  _kind: 'known'
  type: 'bridge-session'
  bridgeSessionId: string
  lastSequenceNum: number
  sessionId: string
}

/** `type: "queue-operation"` — `content` は任意。 */
export interface QueueOperationEntry {
  _kind: 'known'
  type: 'queue-operation'
  operation: string
  sessionId: string
  timestamp: string
  content?: unknown
}

/** `type: "pr-link"`。 */
export interface PrLinkEntry {
  _kind: 'known'
  type: 'pr-link'
  prNumber: number
  prRepository: string
  prUrl: string
  sessionId: string
  timestamp: string
}

/** `type: "frame-link"`。 */
export interface FrameLinkEntry {
  _kind: 'known'
  type: 'frame-link'
  frameUrl: string
  path: string
  sessionId: string
  timestamp: string
}

/** `type: "file-history-snapshot"` — sessionId を持たない。 */
export interface FileHistorySnapshotEntry {
  _kind: 'known'
  type: 'file-history-snapshot'
  isSnapshotUpdate: boolean
  messageId: string
  snapshot: Record<string, unknown>
}

/** `type: "started"` — workflow journal 由来。sessionId を持たない。 */
export interface StartedEntry {
  _kind: 'known'
  type: 'started'
  key: string
  agentId: string
}

/** `type: "result"` — workflow journal 由来。`result` は任意形状。 */
export interface ResultEntry {
  _kind: 'known'
  type: 'result'
  key: string
  agentId: string
  result: unknown
}

// ---------------------------------------------------------------------------
// KnownEntry union / フォールバック / ParsedLine
// ---------------------------------------------------------------------------

/** 既知 type のエントリ全種。 */
export type KnownEntry =
  | AssistantEntry
  | UserEntry
  | AttachmentEntry
  | SystemEntry
  | ModeEntry
  | PermissionModeEntry
  | AiTitleEntry
  | AgentNameEntry
  | AgentSettingEntry
  | RelocatedEntry
  | LastPromptEntry
  | WorktreeStateEntry
  | BridgeSessionEntry
  | QueueOperationEntry
  | PrLinkEntry
  | FrameLinkEntry
  | FileHistorySnapshotEntry
  | StartedEntry
  | ResultEntry

/** type 不明、または既知 type だが shape 不一致だった行。生の JSON を保持。 */
export interface UnknownEntry {
  _kind: 'unknown'
  lineNumber: number
  raw: unknown
  /** ガードが存在する既知 type だが shape 不一致だった場合の type 値。存在しない type なら undefined。 */
  typeHint?: string
}

/** JSON 構文エラー行。 */
export interface LineParseError {
  _kind: 'error'
  lineNumber: number
  rawLine: string
  message: string
}

/** パース結果 1 行分。 */
export type ParsedLine = KnownEntry | UnknownEntry | LineParseError

// ---------------------------------------------------------------------------
// content ブロック (assistant / user メッセージ内)
// ---------------------------------------------------------------------------

/** `{ type: "text", text }`。 */
export interface TextBlock {
  type: 'text'
  text: string
}

/** `{ type: "thinking", thinking, signature }`。 */
export interface ThinkingBlock {
  type: 'thinking'
  thinking: string
  signature: string
}

/** `{ type: "tool_use", id, name, input, caller? }`。 */
export interface ToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: unknown
  caller?: unknown
}

/** tool_result 内 `{ type: "image", source }`。 */
export interface ImageBlock {
  type: 'image'
  source: {
    type: string
    media_type: string
    data: string
  }
}

/** tool_result 内 `{ type: "tool_reference", tool_name }`。 */
export interface ToolReferenceBlock {
  type: 'tool_reference'
  tool_name: string
}

/** tool_result の content 配列要素 union。 */
export type ToolResultContentBlock =
  | TextBlock
  | ImageBlock
  | ToolReferenceBlock
  | UnknownContentBlock

/** `{ type: "tool_result", tool_use_id, content, is_error? }`。 */
export interface ToolResultBlock {
  type: 'tool_result'
  tool_use_id: string
  content: string | ToolResultContentBlock[]
  is_error?: boolean
}

/** content ブロックがどの既知形状にも一致しなかった場合の部分フォールバック。 */
export interface UnknownContentBlock {
  _kind: 'unknown'
  raw: unknown
}

/** assistant `message.content[]` の要素 union。 */
export type AssistantContentBlock =
  | TextBlock
  | ThinkingBlock
  | ToolUseBlock
  | UnknownContentBlock

/** user `message.content[]` の要素 union (content が配列のとき)。 */
export type UserContentBlock = TextBlock | ToolResultBlock | UnknownContentBlock

// ---------------------------------------------------------------------------
// message 本体
// ---------------------------------------------------------------------------

/** assistant の Anthropic API メッセージ。 */
export interface AssistantMessage {
  id: string
  type: string
  role: string
  model: string
  content: AssistantContentBlock[]
  stop_reason: string | null
  stop_sequence: string | null
  stop_details: unknown
  usage: unknown
  diagnostics?: unknown
  container?: unknown
  context_management?: unknown
}

/** user メッセージ。content は string または配列。 */
export interface UserMessage {
  role: string
  content: string | UserContentBlock[]
}
