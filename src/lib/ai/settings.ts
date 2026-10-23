import { importLegacyJson, openJsonStore } from '@/lib/storage'
import type { AiSettings, AiSettingsProfile, AiSettingsStore } from './types'

/** 存储文件与键（桌面端落盘 appData/ai-settings.json） */
const STORE_FILE = 'ai-settings'
const STORE_KEY = 'profiles'

/** localStorage 时代的历史 key：v2 多档案；更早期单配置仍留在 v1 key */
const STORE_STORAGE_KEY = 'my-tools.ai.profiles'
const STORAGE_KEY = 'my-tools.ai.settings'

/** 默认指向 Ollama 的 OpenAI 兼容端点，本地起服务即可用 */
export const DEFAULT_AI_SETTINGS: AiSettings = {
  baseUrl: 'http://localhost:11434/v1',
  apiKey: '',
  model: '',
}

export function createProfileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createDefaultStore(): AiSettingsStore {
  return {
    profiles: [{ id: 'default', name: '默认', settings: { ...DEFAULT_AI_SETTINGS } }],
    activeId: 'default',
  }
}

/** 把未知数据规范化为合法 store；单个档案结构损坏时跳过，全部无效时返回 null */
function normalizeStore(data: unknown): AiSettingsStore | null {
  if (!data || typeof data !== 'object') return null
  const raw = data as { profiles?: unknown; activeId?: unknown }
  if (!Array.isArray(raw.profiles) || raw.profiles.length === 0) return null

  const profiles: AiSettingsProfile[] = []
  for (const item of raw.profiles) {
    if (!item || typeof item !== 'object') continue
    const p = item as { id?: unknown; name?: unknown; settings?: unknown }
    if (typeof p.id !== 'string' || p.id.trim() === '') continue
    if (typeof p.name !== 'string' || typeof p.settings !== 'object' || p.settings === null) continue
    const s = p.settings as Record<string, unknown>
    profiles.push({
      id: p.id,
      name: p.name,
      settings: {
        baseUrl: typeof s.baseUrl === 'string' ? s.baseUrl : DEFAULT_AI_SETTINGS.baseUrl,
        apiKey: typeof s.apiKey === 'string' ? s.apiKey : DEFAULT_AI_SETTINGS.apiKey,
        model: typeof s.model === 'string' ? s.model : DEFAULT_AI_SETTINGS.model,
      },
    })
  }
  if (profiles.length === 0) return null
  const activeId =
    typeof raw.activeId === 'string' && profiles.some((p) => p.id === raw.activeId)
      ? raw.activeId
      : profiles[0].id
  return { profiles, activeId }
}

/** localStorage 时代 v1 单配置；读后即删（已迁入 store） */
function takeLegacySettings(): AiSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    localStorage.removeItem(STORAGE_KEY)
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const s = parsed as Record<string, unknown>
    return {
      baseUrl: typeof s.baseUrl === 'string' ? s.baseUrl : DEFAULT_AI_SETTINGS.baseUrl,
      apiKey: typeof s.apiKey === 'string' ? s.apiKey : DEFAULT_AI_SETTINGS.apiKey,
      model: typeof s.model === 'string' ? s.model : DEFAULT_AI_SETTINGS.model,
    }
  } catch {
    return null
  }
}

/**
 * 读取档案 store：store 有数据则用之；缺失时一次性迁入 localStorage 时代的
 * v2 多档案 / v1 单配置；都没有则返回默认 store。
 */
export async function loadAiSettingsStore(): Promise<AiSettingsStore> {
  const store = await openJsonStore(STORE_FILE)
  await importLegacyJson(store, STORE_STORAGE_KEY, STORE_KEY)
  try {
    const raw = await store.get<unknown>(STORE_KEY)
    if (raw !== null) {
      const normalized = normalizeStore(raw)
      if (normalized) return normalized
    }
  } catch {
    // 数据损坏，落到迁移/默认逻辑
  }
  const legacy = takeLegacySettings()
  const migrated: AiSettingsStore = legacy
    ? { profiles: [{ id: 'default', name: '默认', settings: legacy }], activeId: 'default' }
    : createDefaultStore()
  await saveAiSettingsStore(migrated)
  return migrated
}

export async function saveAiSettingsStore(store: AiSettingsStore): Promise<void> {
  const s = await openJsonStore(STORE_FILE)
  await s.set(STORE_KEY, store)
}

/** 取激活档案；activeId 失效时回退第一个 */
export function getActiveProfile(store: AiSettingsStore): AiSettingsProfile {
  return store.profiles.find((p) => p.id === store.activeId) ?? store.profiles[0]
}

/** 便捷读取「当前激活档案」的配置 */
export async function getActiveAiSettings(): Promise<AiSettings> {
  return getActiveProfile(await loadAiSettingsStore()).settings
}

/** 只更新激活档案的配置，不影响其他档案 */
export async function saveActiveAiSettings(settings: AiSettings): Promise<void> {
  const store = await loadAiSettingsStore()
  const active = getActiveProfile(store)
  await saveAiSettingsStore({
    ...store,
    profiles: store.profiles.map((p) => (p.id === active.id ? { ...p, settings } : p)),
  })
}

/** 以下两个别名指向激活档案，供工具页等只关心"当前配置"的调用方使用 */
export async function loadAiSettings(): Promise<AiSettings> {
  return getActiveAiSettings()
}

export async function saveAiSettings(settings: AiSettings): Promise<void> {
  return saveActiveAiSettings(settings)
}

/** 校验配置，返回错误信息；合法返回 null */
export function validateAiSettings(settings: AiSettings): string | null {
  const baseUrl = settings.baseUrl.trim()
  if (!baseUrl) return '请填写接口地址'
  let url: URL
  try {
    url = new URL(baseUrl)
  } catch {
    return '接口地址格式不正确，需以 http:// 或 https:// 开头'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return '接口地址必须使用 http 或 https 协议'
  }
  return null
}
