/**
 * claude-code-jsonl-parser: type-safe parser for Claude Code JSONL conversation logs.
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

// Parse API
export {
  parseJsonl,
  parseJsonlLines,
  parseJsonlFile,
  parseJsonlFileStream,
} from './parse'

// Result primitives
export { ok, err, ResultAsync } from './result'
export type { Result, OkResult, ErrResult } from './result'

// Error type
export { fileReadError } from './errors'
export type { FileReadError } from './errors'

// Data model
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

// Type guards (advanced: reusable in custom pipelines)
export {
  guards, guardByType, KNOWN_TYPES,
  normalizeAssistantContent, normalizeUserContent,
} from './generated/guards'
export type { GuardResult } from './generated/guards'
