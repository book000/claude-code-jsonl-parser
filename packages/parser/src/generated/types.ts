/**
 * Type definitions of the Claude Code JSONL entries.
 *
 * This file is maintained by hand.
 * claude-code-jsonl-generator emits `types.generated.ts` for a corpus; diff that output against this file and merge intentionally.
 * Content blocks and message shapes are curated by hand, so never overwrite them wholesale.
 */

// ---------------------------------------------------------------------------
// Discriminator tag
// ---------------------------------------------------------------------------

/** Internal discriminator added by the parser. Separate from the `type` field. */
export type ParsedKind = 'known' | 'unknown' | 'error'

// ---------------------------------------------------------------------------
// Common base (fields shared by the full-metadata entries)
// ---------------------------------------------------------------------------

/** Required metadata shared by assistant / user / attachment / system. */
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
  /** Optional sidechain / sub-agent related fields (as observed) */
  agentId?: string
  agentName?: string
  teamName?: string
  slug?: string
  sessionKind?: string
  session_id?: string
}

// ---------------------------------------------------------------------------
// Full-metadata entries
// ---------------------------------------------------------------------------

/** `type: "assistant"`: assistant response (wraps an Anthropic API message). */
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

/** `user.origin`: kind of origin and accompanying information. */
export interface UserOrigin {
  kind: string
  from?: string
  senderTaskId?: string
}

/** `type: "user"`: wraps user input / tool results. */
export interface UserEntry extends EntryBase {
  _kind: 'known'
  type: 'user'
  message: UserMessage
  isMeta?: boolean
  promptId?: string
  promptSource?: string
  origin?: UserOrigin
  permissionMode?: string
  queuePriority?: string
  planContent?: string
  interruptedMessageId?: string
  isCompactSummary?: boolean
  isVisibleInTranscriptOnly?: boolean
  mcpMeta?: unknown
  sourceToolUseID?: string
  sourceToolAssistantUUID?: string
  toolUseResult?: unknown
  toolDenialKind?: string
  toolEndsTurn?: boolean
}

/** `type: "attachment"`: attached data. */
export interface AttachmentEntry extends EntryBase {
  _kind: 'known'
  type: 'attachment'
  attachment: Record<string, unknown>
}

/** `type: "system"`: system event (refined by `subtype`). */
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
// Lightweight entries keyed by sessionId
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

/** `type: "agent-setting"`: `agentSetting` is a string. */
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

/** `type: "last-prompt"`: `lastPrompt` is optional. */
export interface LastPromptEntry {
  _kind: 'known'
  type: 'last-prompt'
  leafUuid: string
  sessionId: string
  lastPrompt?: string
}

/** `type: "worktree-state"`: `worktreeSession` is an object or null. */
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

/** `type: "queue-operation"`: `content` is optional. */
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

/** `type: "file-history-snapshot"`: has no sessionId. */
export interface FileHistorySnapshotEntry {
  _kind: 'known'
  type: 'file-history-snapshot'
  isSnapshotUpdate: boolean
  messageId: string
  snapshot: Record<string, unknown>
}

/** `type: "started"`: comes from the workflow journal. Has no sessionId. */
export interface StartedEntry {
  _kind: 'known'
  type: 'started'
  key: string
  agentId: string
}

/** `type: "result"`: comes from the workflow journal. `result` has an arbitrary shape. */
export interface ResultEntry {
  _kind: 'known'
  type: 'result'
  key: string
  agentId: string
  result: unknown
}

// ---------------------------------------------------------------------------
// KnownEntry union / fallbacks / ParsedLine
// ---------------------------------------------------------------------------

/** All entries of known types. */
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

/** A line with an unknown type, or a known type whose shape did not match. Keeps the raw JSON. */
export interface UnknownEntry {
  _kind: 'unknown'
  lineNumber: number
  raw: unknown
  /** The type value when a guard exists for it but the shape did not match. `undefined` for an unknown type. */
  typeHint?: string
  /** When `typeHint` is set, a diagnostic message naming the fields that caused the mismatch. */
  reason?: string
}

/** A line with a JSON syntax error. */
export interface LineParseError {
  _kind: 'error'
  lineNumber: number
  rawLine: string
  message: string
}

/** Parse result of one line. */
export type ParsedLine = KnownEntry | UnknownEntry | LineParseError

// ---------------------------------------------------------------------------
// Content blocks (inside assistant / user messages)
// ---------------------------------------------------------------------------

/** `{ type: "text", text }`。 */
export interface TextBlock {
  _kind: 'known'
  type: 'text'
  text: string
}

/** `{ type: "thinking", thinking, signature }`。 */
export interface ThinkingBlock {
  _kind: 'known'
  type: 'thinking'
  thinking: string
  signature: string
}

/** `{ type: "tool_use", id, name, input, caller? }`。 */
export interface ToolUseBlock {
  _kind: 'known'
  type: 'tool_use'
  id: string
  name: string
  input: unknown
  caller?: unknown
}

/** `{ type: "image", source }` inside a tool_result. */
export interface ImageBlock {
  _kind: 'known'
  type: 'image'
  source: {
    type: string
    media_type: string
    data: string
  }
}

/** `{ type: "tool_reference", tool_name }` inside a tool_result. */
export interface ToolReferenceBlock {
  _kind: 'known'
  type: 'tool_reference'
  tool_name: string
}

/** Union of the elements of a tool_result content array. */
export type ToolResultContentBlock =
  | TextBlock
  | ImageBlock
  | ToolReferenceBlock
  | UnknownContentBlock

/** `{ type: "tool_result", tool_use_id, content, is_error? }`。 */
export interface ToolResultBlock {
  _kind: 'known'
  type: 'tool_result'
  tool_use_id: string
  content: string | ToolResultContentBlock[]
  is_error?: boolean
}

/**
 * Partial fallback for a content block that matches no known shape.
 * `_kind` is the same discriminator as on known blocks: check it for `'unknown'`
 * first, and the known side can then be narrowed safely with `.type`
 * (e.g. `if (block._kind === 'unknown') {...} else if (block.type === 'text') {...}`).
 */
export interface UnknownContentBlock {
  _kind: 'unknown'
  raw: unknown
}

/** Union of the elements of assistant `message.content[]`. */
export type AssistantContentBlock =
  | TextBlock
  | ThinkingBlock
  | ToolUseBlock
  | UnknownContentBlock

/** Union of the elements of user `message.content[]` (when content is an array). */
export type UserContentBlock = TextBlock | ToolResultBlock | UnknownContentBlock

// ---------------------------------------------------------------------------
// Message bodies
// ---------------------------------------------------------------------------

/** The Anthropic API message of an assistant entry. */
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

/** User message. `content` is a string or an array. */
export interface UserMessage {
  role: string
  content: string | UserContentBlock[]
}
