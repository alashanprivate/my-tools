import { useSyncExternalStore } from 'react'
import { openJsonStore } from '@/lib/storage'
import { getSqliteDb, type SqlDatabase } from '@/lib/storage/sqlite'
import { AI_CHAT_TOOLS, type AiChatTool } from './defaults'

/**
 * AI 对话入口存储：桌面端落地 SQLite（tauri-plugin-sql，ai_entries 单表），
 * 浏览器调试环境回退 JSON store。内置入口在每次启动时以 INSERT OR IGNORE 播种，
 * 应用升级新增站点自动补进表中；自定义入口与内置入口的移除状态同表存储。
 */

const STORE_FILE = 'ai-chat-entries'
const CUSTOM_KEY = 'custom'
const HIDDEN_KEY = 'hidden-builtins'
const PINNED_KEY = 'pinned-ids'

/** 上传 Logo 的限制：源文件最大 5MB，缩放到最长边 128px 后内联存储 */
const LOGO_MAX_FILE_SIZE = 5 * 1024 * 1024
const LOGO_MAX_EDGE = 128

/** 自定义入口头像底色候选（tailwind 背景类，按顺序轮转） */
const COLOR_PALETTE = [
  'bg-blue-500',
  'bg-sky-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-600',
  'bg-violet-500',
  'bg-teal-500',
  'bg-rose-500',
] as const

export interface AiEntriesState {
  /** 可见入口（未移除的内置 + 自定义），已按 sort 排序 */
  tools: AiChatTool[]
  /** 被右键移除的内置入口 id（移除即 enabled=0，可整体恢复） */
  hiddenBuiltinIds: string[]
  /** 存储是否已完成首次读取（未读取前不能断定 id 无效） */
  loaded: boolean
}

interface AiEntryRow {
  id: string
  name: string
  url: string
  color: string
  logo: string | null
  sort: number
  enabled: number
  origin: string
  pinned: number
}

let state: AiEntriesState = { tools: AI_CHAT_TOOLS, hiddenBuiltinIds: [], loaded: false }
/** 全量入口缓存（含已移除项），供 getAiChatById 同步解析 */
let allCache: AiChatTool[] = AI_CHAT_TOOLS
const listeners = new Set<() => void>()
let loading: Promise<void> | null = null

const notify = () => listeners.forEach((listener) => listener())

function publish(all: AiChatTool[], visible: AiChatTool[], hiddenBuiltinIds: string[], loaded: boolean) {
  allCache = all
  state = { tools: visible, hiddenBuiltinIds, loaded }
  notify()
}

// ---------- SQLite（桌面端） ----------

function rowToTool(row: AiEntryRow): AiChatTool {
  const tool: AiChatTool = {
    id: row.id,
    name: row.name,
    url: row.url,
    color: row.color,
    custom: row.origin === 'custom',
  }
  if (row.logo) tool.logo = row.logo
  if (row.pinned === 1) tool.pinned = true
  return tool
}

async function refreshFromDb(db: SqlDatabase): Promise<void> {
  const rows = await db.select<AiEntryRow[]>(
    'SELECT id, name, url, color, logo, sort, enabled, origin, pinned FROM ai_entries ORDER BY sort, id',
  )
  const all: AiChatTool[] = []
  const visible: AiChatTool[] = []
  const hiddenBuiltinIds: string[] = []
  for (const row of rows) {
    const tool = rowToTool(row)
    all.push(tool)
    if (row.enabled === 1) visible.push(tool)
    else if (row.origin !== 'custom') hiddenBuiltinIds.push(row.id)
  }
  publish(all, visible, hiddenBuiltinIds, true)
}

async function nextSort(db: SqlDatabase): Promise<number> {
  const rows = await db.select<Array<{ next: number }>>(
    'SELECT COALESCE(MAX(sort), -1) + 1 AS next FROM ai_entries',
  )
  return rows[0]?.next ?? 0
}

async function insertCustomRow(db: SqlDatabase, tool: AiChatTool): Promise<void> {
  const sort = await nextSort(db)
  await db.execute(
    "INSERT OR IGNORE INTO ai_entries (id, name, url, color, logo, sort, enabled, origin) VALUES ($1, $2, $3, $4, $5, $6, 1, 'custom')",
    [tool.id, tool.name, tool.url, tool.color, tool.logo ?? null, sort],
  )
}

/** 内置入口播种：INSERT OR IGNORE 保证幂等，应用升级新增的站点在下次启动自动补进表 */
async function seedBuiltins(db: SqlDatabase): Promise<void> {
  for (let index = 0; index < AI_CHAT_TOOLS.length; index++) {
    const tool = AI_CHAT_TOOLS[index]
    await db.execute(
      "INSERT OR IGNORE INTO ai_entries (id, name, url, color, logo, sort, enabled, origin) VALUES ($1, $2, $3, $4, $5, $6, 1, 'builtin')",
      [tool.id, tool.name, tool.url, tool.color, index],
    )
  }
}

/** 一次性把 JSON store 时代的自定义入口与移除名单导入 SQLite，成功后清空旧键 */
async function importLegacyJson(db: SqlDatabase): Promise<void> {
  const store = await openJsonStore(STORE_FILE)
  const customs = await store.get<unknown[]>(CUSTOM_KEY)
  const hidden = await store.get<unknown[]>(HIDDEN_KEY)
  if (!Array.isArray(customs) && !Array.isArray(hidden)) return
  for (const raw of Array.isArray(customs) ? customs : []) {
    if (!isAiChatTool(raw) || !raw.custom) continue
    await insertCustomRow(db, { ...raw, custom: true })
  }
  for (const id of Array.isArray(hidden) ? hidden : []) {
    if (typeof id !== 'string') continue
    await db.execute("UPDATE ai_entries SET enabled = 0 WHERE id = $1 AND origin = 'builtin'", [id])
  }
  // 全部成功才清空旧键；中途失败则保留，下次启动重试（导入语句均幂等）
  await store.remove(CUSTOM_KEY)
  await store.remove(HIDDEN_KEY)
}

// ---------- JSON store（浏览器调试环境回退） ----------

let jsonCustom: AiChatTool[] = []
let jsonHidden: string[] = []
let jsonPinned: string[] = []

function markPinned(tool: AiChatTool): AiChatTool {
  return jsonPinned.includes(tool.id) ? { ...tool, pinned: true } : tool
}

function jsonPublish(): void {
  const visible = [
    ...AI_CHAT_TOOLS.filter((tool) => !jsonHidden.includes(tool.id)).map(markPinned),
    ...jsonCustom.map(markPinned),
  ]
  const all = [...AI_CHAT_TOOLS, ...jsonCustom].map(markPinned)
  publish(all, visible, [...jsonHidden], true)
}

async function jsonPersist(): Promise<void> {
  try {
    const store = await openJsonStore(STORE_FILE)
    await store.set(CUSTOM_KEY, jsonCustom)
    await store.set(HIDDEN_KEY, jsonHidden)
    await store.set(PINNED_KEY, jsonPinned)
  } catch {
    // 存储不可用时仅影响持久化
  }
}

// ---------- 公共逻辑 ----------

function isAiChatTool(value: unknown): value is AiChatTool {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AiChatTool).id === 'string' &&
    typeof (value as AiChatTool).name === 'string' &&
    typeof (value as AiChatTool).url === 'string' &&
    typeof (value as AiChatTool).color === 'string'
  )
}

/** 补全协议头：已有任意协议（如 ftp://）保持原样交给校验拒绝，无协议时按 https 处理 */
export function normalizeChatUrl(input: string): string {
  const trimmed = input.trim()
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** 校验可作内嵌入口的网址（http/https 且能解析） */
export function isValidChatUrl(input: string): boolean {
  try {
    const url = new URL(normalizeChatUrl(input))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 把用户选择的图片压成可持久化的 Logo data URL：
 * 位图等比缩到最长边 128px 再转 PNG（避免大图撑爆存储）；
 * SVG 矢量图按原文件内联交给浏览器缩放；canvas 不可用时退回原图。
 */
export async function fileToLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('仅支持图片文件')
  }
  if (file.size > LOGO_MAX_FILE_SIZE) {
    throw new Error('图片不能超过 5MB')
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })
  if (file.type === 'image/svg+xml') return dataUrl

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解析失败'))
    img.src = dataUrl
  })
  const edge = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = edge > 0 ? Math.min(1, LOGO_MAX_EDGE / edge) : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) return dataUrl
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

/** 读取入口列表（幂等，重复调用复用首次加载） */
export function loadEntries(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      const db = await getSqliteDb().catch(() => null)
      if (db) {
        await importLegacyJson(db)
        await seedBuiltins(db)
        await refreshFromDb(db)
        return
      }
      try {
        const store = await openJsonStore(STORE_FILE)
        const customs = await store.get<unknown[]>(CUSTOM_KEY)
        const hidden = await store.get<unknown[]>(HIDDEN_KEY)
        const pinned = await store.get<unknown[]>(PINNED_KEY)
        jsonCustom = Array.isArray(customs) ? customs.filter(isAiChatTool) : []
        jsonHidden = Array.isArray(hidden)
          ? hidden.filter((id): id is string => typeof id === 'string')
          : []
        jsonPinned = Array.isArray(pinned)
          ? pinned.filter((id): id is string => typeof id === 'string')
          : []
      } catch {
        // 存储不可用时按空列表处理，仅影响自定义入口
        jsonCustom = []
        jsonHidden = []
      }
      jsonPublish()
    })().catch(() => {
      // 加载失败按内置默认展示，仅影响自定义入口
      publish([...AI_CHAT_TOOLS], [...AI_CHAT_TOOLS], [], true)
    })
  }
  return loading
}

/** 新增自定义入口：规范化网址、生成唯一 id 与轮转底色，先入内存再异步持久化 */
export async function addCustomEntry(name: string, url: string, logo?: string): Promise<AiChatTool> {
  const tool: AiChatTool = {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    url: normalizeChatUrl(url),
    color: COLOR_PALETTE[allCache.length % COLOR_PALETTE.length],
    custom: true,
    ...(logo ? { logo } : {}),
  }
  const db = await getSqliteDb().catch(() => null)
  if (db) {
    try {
      await insertCustomRow(db, tool)
      await refreshFromDb(db)
      return tool
    } catch {
      // 落库失败：继续走内存态（下方回退路径），保证本次会话内可见
    }
  }
  jsonCustom = [...jsonCustom, tool]
  jsonPublish()
  await jsonPersist()
  return tool
}

/** 删除自定义入口（不存在时静默） */
export async function removeCustomEntry(id: string): Promise<void> {
  const db = await getSqliteDb().catch(() => null)
  if (db) {
    try {
      await db.execute("DELETE FROM ai_entries WHERE id = $1 AND origin = 'custom'", [id])
      await refreshFromDb(db)
      return
    } catch {
      // 落库失败：走内存态回退
    }
  }
  if (!jsonCustom.some((tool) => tool.id === id)) return
  jsonCustom = jsonCustom.filter((tool) => tool.id !== id)
  jsonPublish()
  await jsonPersist()
}

/** 右键移除内置入口：置 enabled=0 使其不再展示（可整体恢复） */
export async function hideBuiltinEntry(id: string): Promise<void> {
  const db = await getSqliteDb().catch(() => null)
  if (db) {
    try {
      await db.execute(
        "UPDATE ai_entries SET enabled = 0 WHERE id = $1 AND origin = 'builtin'",
        [id],
      )
      await refreshFromDb(db)
      return
    } catch {
      // 落库失败：走内存态回退
    }
  }
  if (jsonHidden.includes(id)) return
  jsonHidden = [...jsonHidden, id]
  jsonPublish()
  await jsonPersist()
}

/** 恢复全部被移除的内置入口 */
export async function restoreBuiltinEntries(): Promise<void> {
  const db = await getSqliteDb().catch(() => null)
  if (db) {
    try {
      await db.execute("UPDATE ai_entries SET enabled = 1 WHERE origin = 'builtin'", [])
      await refreshFromDb(db)
      return
    } catch {
      // 落库失败：走内存态回退
    }
  }
  if (jsonHidden.length === 0) return
  jsonHidden = []
  jsonPublish()
  await jsonPersist()
}

/** 固定 / 取消固定到顶部标签栏 */
export async function setChatEntryPinned(id: string, pinned: boolean): Promise<void> {
  const db = await getSqliteDb().catch(() => null)
  if (db) {
    try {
      await db.execute('UPDATE ai_entries SET pinned = $1 WHERE id = $2', [pinned ? 1 : 0, id])
      await refreshFromDb(db)
      return
    } catch {
      // 落库失败：走内存态回退
    }
  }
  jsonPinned = pinned
    ? [...new Set([...jsonPinned, id])]
    : jsonPinned.filter((pinnedId) => pinnedId !== id)
  jsonPublish()
  await jsonPersist()
}

function getSnapshot(): AiEntriesState {
  return state
}

/** 当前全量入口（含已移除项），同步读取：getAiChatById 与测试用 */
export function getAllEntries(): AiChatTool[] {
  return allCache
}

/** 按 id 查找入口（含已移除项），同步读取 */
export function getAiChatById(id: string): AiChatTool | undefined {
  return allCache.find((tool) => tool.id === id)
}

/** 当前状态快照（同步读取，测试/非 React 场景用） */
export const getAiEntriesState = getSnapshot

function subscribe(listener: () => void): () => void {
  void loadEntries()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 订阅入口列表（含加载状态），首次订阅时触发懒加载 */
export function useAiEntries(): AiEntriesState {
  return useSyncExternalStore(subscribe, getSnapshot)
}
