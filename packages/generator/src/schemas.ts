import { z } from 'zod'

// 未知の追加フィールドを許容するため .passthrough() は使わず、既定 (strip) にする。
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
})
const user = z.object({
  ...entryBase,
  type: z.literal('user'),
  message: z.object({}).loose(),
})
const attachment = z.object({
  ...entryBase,
  type: z.literal('attachment'),
  attachment: z.object({}).loose(),
})
const system = z.object({
  ...entryBase,
  type: z.literal('system'),
  subtype: z.string(),
})
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
const result = z.object({ type: z.literal('result'), key: z.string(), agentId: z.string(), result: z.unknown() })

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
