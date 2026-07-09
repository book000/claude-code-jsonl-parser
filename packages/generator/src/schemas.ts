import { z } from 'zod'

// 未知の追加フィールドを許容するため .loose() (passthrough 相当) にする。
// validator は「未知フィールド出現」を別途検出するため、ここでは緩めに定義する。

const entryBase = {
  cwd: z.string(),
  entrypoint: z.string(),
  gitBranch: z.string(),
  isSidechain: z.boolean(),
  parentUuid: z.string().nullable(),
  sessionId: z.string(),
  timestamp: z.string(),
  userType: z.string(),
  uuid: z.string(),
  version: z.string(),
}

const assistant = z.object({
  ...entryBase,
  type: z.literal('assistant'),
  message: z.object({}).loose(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  teamName: z.string().optional(),
  slug: z.string().optional(),
  sessionKind: z.string().optional(),
  session_id: z.string().optional(),
  requestId: z.string().optional(),
  isApiErrorMessage: z.boolean().optional(),
  apiErrorStatus: z.number().optional(),
  error: z.unknown().optional(),
  attributionAgent: z.string().optional(),
  attributionSkill: z.string().optional(),
  attributionPlugin: z.string().optional(),
  attributionMcpServer: z.string().optional(),
  attributionMcpTool: z.string().optional(),
}).loose()
const user = z.object({
  ...entryBase,
  type: z.literal('user'),
  message: z.object({}).loose(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  teamName: z.string().optional(),
  slug: z.string().optional(),
  sessionKind: z.string().optional(),
  session_id: z.string().optional(),
  interruptedMessageId: z.string().optional(),
  isCompactSummary: z.boolean().optional(),
  isMeta: z.boolean().optional(),
  isVisibleInTranscriptOnly: z.boolean().optional(),
  mcpMeta: z.unknown().optional(),
  origin: z.string().optional(),
  permissionMode: z.string().optional(),
  planContent: z.string().optional(),
  promptId: z.string().optional(),
  promptSource: z.string().optional(),
  queuePriority: z.number().optional(),
  sourceToolAssistantUUID: z.string().optional(),
  sourceToolUseID: z.string().optional(),
  toolDenialKind: z.string().optional(),
  toolUseResult: z.unknown().optional(),
}).loose()
const attachment = z.object({
  ...entryBase,
  type: z.literal('attachment'),
  attachment: z.object({}).loose(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  teamName: z.string().optional(),
  slug: z.string().optional(),
  sessionKind: z.string().optional(),
  session_id: z.string().optional(),
}).loose()
const system = z.object({
  ...entryBase,
  type: z.literal('system'),
  subtype: z.string(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  teamName: z.string().optional(),
  slug: z.string().optional(),
  sessionKind: z.string().optional(),
  session_id: z.string().optional(),
  compactMetadata: z.unknown().optional(),
  content: z.unknown().optional(),
  durationMs: z.number().optional(),
  error: z.unknown().optional(),
  hasOutput: z.boolean().optional(),
  hookAdditionalContext: z.unknown().optional(),
  hookCount: z.number().optional(),
  hookErrors: z.unknown().optional(),
  hookInfos: z.unknown().optional(),
  isMeta: z.boolean().optional(),
  level: z.string().optional(),
  logicalParentUuid: z.string().optional(),
  maxRetries: z.number().optional(),
  messageCount: z.number().optional(),
  pendingBackgroundAgentCount: z.number().optional(),
  pendingWorkflowCount: z.number().optional(),
  preventedContinuation: z.boolean().optional(),
  retryAttempt: z.number().optional(),
  retryInMs: z.number().optional(),
  stopReason: z.string().optional(),
  toolUseID: z.string().optional(),
}).loose()
const mode = z.object({ type: z.literal('mode'), mode: z.string(), sessionId: z.string() })
const permissionMode = z.object({ type: z.literal('permission-mode'), permissionMode: z.string(), sessionId: z.string() })
const aiTitle = z.object({ type: z.literal('ai-title'), aiTitle: z.string(), sessionId: z.string() })
const agentName = z.object({ type: z.literal('agent-name'), agentName: z.string(), sessionId: z.string() })
const agentSetting = z.object({ type: z.literal('agent-setting'), agentSetting: z.string(), sessionId: z.string() })
const relocated = z.object({ type: z.literal('relocated'), relocatedCwd: z.string(), sessionId: z.string() })
const lastPrompt = z.object({ type: z.literal('last-prompt'), leafUuid: z.string(), sessionId: z.string(), lastPrompt: z.string().optional() })
const worktreeState = z.object({ type: z.literal('worktree-state'), worktreeSession: z.object({}).loose().nullable(), sessionId: z.string() })
const bridgeSession = z.object({ type: z.literal('bridge-session'), bridgeSessionId: z.string(), lastSequenceNum: z.number(), sessionId: z.string() })
const queueOperation = z.object({ type: z.literal('queue-operation'), operation: z.string(), sessionId: z.string(), timestamp: z.string(), content: z.unknown().optional() })
const prLink = z.object({ type: z.literal('pr-link'), prNumber: z.number(), prRepository: z.string(), prUrl: z.string(), sessionId: z.string(), timestamp: z.string() })
const frameLink = z.object({ type: z.literal('frame-link'), frameUrl: z.string(), path: z.string(), sessionId: z.string(), timestamp: z.string() })
const fileHistorySnapshot = z.object({ type: z.literal('file-history-snapshot'), isSnapshotUpdate: z.boolean(), messageId: z.string(), snapshot: z.object({}).loose() })
const started = z.object({ type: z.literal('started'), key: z.string(), agentId: z.string() })
const result = z.object({
  type: z.literal('result'),
  key: z.string(),
  agentId: z.string(),
  // z.unknown() 単体だと result キー自体が欠落していても undefined として通ってしまう
  // (parser 側の guard は `'result' in v` でキーの実在を要求するため、ここでも合わせる)。
  result: z.unknown().refine((v) => v !== undefined, {
    message: 'result フィールドは必須です',
  }),
})

/** type 文字列 → 公開 zod スキーマ。 */
export const entrySchemas = {
  assistant, user, attachment, system, mode,
  'permission-mode': permissionMode,
  'ai-title': aiTitle,
  'agent-name': agentName,
  'agent-setting': agentSetting,
  relocated,
  'last-prompt': lastPrompt,
  'worktree-state': worktreeState,
  'bridge-session': bridgeSession,
  'queue-operation': queueOperation,
  'pr-link': prLink,
  'frame-link': frameLink,
  'file-history-snapshot': fileHistorySnapshot,
  started, result,
} as const

/** 既知 type 名の配列。 */
export const KNOWN_TYPES = Object.keys(entrySchemas)

/**
 * 指定 type のスキーマを返す。未知なら undefined。
 *
 * @param type - 判別子
 */
export function knownTypeSchema(type: string): z.ZodType | undefined {
  return (entrySchemas as Record<string, z.ZodType>)[type]
}
