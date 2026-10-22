import type { AiSettings, AiSettingsProfile, AiSettingsStore } from './types'

const STORAGE_KEY = 'my-tools.ai.settings'
/** v2 多档案存储 key；旧版单配置仍留在原 key，迁移时不删除 */
const STORE_STORAGE_KEY = 'my-tools.ai.profiles'

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

function loadLegacySettings(): AiSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
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
 * 读取档案 store：v2 存在则用之；缺失或损坏时从旧版单配置迁移为一个「默认」档案；
 * 都没有则返回默认 store。
 */
export function loadAiSettingsStore(): AiSettingsStore {
  try {
    const raw = localStorage.getItem(STORE_STORAGE_KEY)
    if (raw) {
      const normalized = normalizeStore(JSON.parse(raw))
      if (normalized) return normalized
    }
  } catch {
    // 数据损坏，落到迁移/默认逻辑
  }
  const legacy = loadLegacySettings()
  if (legacy) {
    return {
      profiles: [{ id: 'default', name: '默认', settings: legacy }],
      activeId: 'default',
    }
  }
  return createDefaultStore()
}

export function saveAiSettingsStore(store: AiSettingsStore): void {
  localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(store))
}

/** 取激活档案；activeId 失效时回退第一个 */
export function getActiveProfile(store: AiSettingsStore): AiSettingsProfile {
  return store.profiles.find((p) => p.id === store.activeId) ?? store.profiles[0]
}

/** 便捷读取「当前激活档案」的配置 */
export function getActiveAiSettings(): AiSettings {
  return getActiveProfile(loadAiSettingsStore()).settings
}

/** 只更新激活档案的配置，不影响其他档案 */
export function saveActiveAiSettings(settings: AiSettings): void {
  const store = loadAiSettingsStore()
  const active = getActiveProfile(store)
  saveAiSettingsStore({
    ...store,
    profiles: store.profiles.map((p) => (p.id === active.id ? { ...p, settings } : p)),
  })
}

/** 以下两个别名指向激活档案，供工具页等只关心"当前配置"的调用方使用 */
export function loadAiSettings(): AiSettings {
  return getActiveAiSettings()
}

export function saveAiSettings(settings: AiSettings): void {
  saveActiveAiSettings(settings)
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
