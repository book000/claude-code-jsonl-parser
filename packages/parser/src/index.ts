/**
 * claude-code-jsonl-parser — Claude Code の JSONL 会話ログを型安全にパースする。
 *
 * @example
 * ```ts
 * import { parseJsonlFile } from 'claude-code-jsonl-parser'
 *
 * const result = await parseJsonlFile('/path/to/session.jsonl')
 * if (result.isOk) {
 *   for (const line of result.value) {
 *     if (line._kind === 'known' && line.type === 'assistant') {
 *       console.log(line.message.content)
 *     }
 *   }
 * }
 * ```
 */

// パース API
export {
  parseJsonl,
  parseJsonlLines,
  parseJsonlFile,
  parseJsonlFileStream,
} from './parse'

// Result プリミティブ
export { ok, err, ResultAsync } from './result'
export type { Result, OkResult, ErrResult } from './result'

// エラー型
export { fileReadError } from './errors'
export type { FileReadError } from './errors'

// データモデル (生成物)
export type {
  ParsedLine, ParsedKind, KnownEntry, UnknownEntry, LineParseError,
  EntryBase, AssistantEntry, UserEntry, AttachmentEntry, SystemEntry,
  ModeEntry, PermissionModeEntry, AiTitleEntry, AgentNameEntry,
  AgentSettingEntry, RelocatedEntry, LastPromptEntry, WorktreeStateEntry,
  BridgeSessionEntry, QueueOperationEntry, PrLinkEntry, FrameLinkEntry,
  FileHistorySnapshotEntry, StartedEntry, ResultEntry,
  AssistantMessage, UserMessage,
  AssistantContentBlock, UserContentBlock, ToolResultContentBlock,
  TextBlock, ThinkingBlock, ToolUseBlock, ToolResultBlock,
  ImageBlock, ToolReferenceBlock, UnknownContentBlock,
} from './generated/types'

// 型ガード (上級者向け: 独自パイプラインで再利用可能)
export {
  guards, guardByType, KNOWN_TYPES,
  normalizeAssistantContent, normalizeUserContent,
} from './generated/guards'
export type { GuardResult } from './generated/guards'
