/**
 * 本地存储门面。
 *
 * 桌面端（项目定位平台）：tauri-plugin-store，Rust 侧落盘到应用数据目录的
 * JSON 文件，容量不受 WebView localStorage 限制，清除浏览器缓存不丢数据。
 * 浏览器环境（npm run dev 调试用）：同接口自动退回 localStorage，保证调试可用。
 *
 * 所有需要持久化的功能一律通过本模块存取，不要直接使用 localStorage。
 *
 * 用法：
 *   const store = await openJsonStore('my-feature')
 *   await store.set('key', { any: 'json' })
 *   const value = await store.get<{ any: string }>('key')
 */
import { load } from '@tauri-apps/plugin-store'
import type { Store } from '@tauri-apps/plugin-store'
import { isTauri } from '@/lib/environment'

export interface JsonStore {
  /** 读取一个键，不存在返回 null */
  get<T>(key: string): Promise<T | null>
  /** 写入一个键（桌面端自动保存有 100ms 防抖） */
  set<T>(key: string, value: T): Promise<void>
  /** 删除一个键 */
  remove(key: string): Promise<void>
  /** 当前文件的全部键值对 */
  entries(): Promise<Array<[string, unknown]>>
  /** 立即写盘，绕过自动保存防抖（关键数据可显式调用；浏览器实现为空操作） */
  flush(): Promise<void>
}

/** 打开中的 Store 按文件路径复用，避免同一文件多个实例互相覆盖 */
const opening = new Map<string, Promise<JsonStore>>()

/** 打开（或创建）一个具名 JSON 存储；文件名可省略 .json 后缀 */
export function openJsonStore(fileName: string): Promise<JsonStore> {
  const path = fileName.endsWith('.json') ? fileName : `${fileName}.json`
  let pending = opening.get(path)
  if (!pending) {
    pending = isTauri() ? openTauriStore(path) : openBrowserStore(path)
    opening.set(path, pending)
    pending.catch(() => opening.delete(path)) // 打开失败不缓存，允许重试
  }
  return pending
}

async function openTauriStore(path: string): Promise<JsonStore> {
  const store: Store = await load(path, { autoSave: true })
  return {
    get: async <T,>(key: string) => (await store.get<T>(key)) ?? null,
    set: (key, value) => store.set(key, value),
    remove: (key) => store.delete(key).then(() => undefined),
    entries: () => store.entries(),
    flush: () => store.save(),
  }
}

const BROWSER_PREFIX = 'json-store'

/** 浏览器调试环境的降级实现：键名加前缀写入 localStorage，值统一 JSON 序列化 */
async function openBrowserStore(path: string): Promise<JsonStore> {
  const prefix = `${BROWSER_PREFIX}:${path}#`
  const fullKey = (key: string) => `${prefix}${key}`
  return {
    get: async <T,>(key: string) => {
      try {
        const raw = localStorage.getItem(fullKey(key))
        if (raw === null) return null
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    },
    set: async (key, value) => {
      try {
        localStorage.setItem(fullKey(key), JSON.stringify(value))
      } catch {
        // 容量不足等写入失败时放弃持久化
      }
    },
    remove: async (key) => {
      localStorage.removeItem(fullKey(key))
    },
    entries: async () => {
      const result: Array<[string, unknown]> = []
      for (let i = 0; i < localStorage.length; i++) {
        const full = localStorage.key(i)
        if (full === null || !full.startsWith(prefix)) continue
        try {
          result.push([full.slice(prefix.length), JSON.parse(localStorage.getItem(full) ?? '')])
        } catch {
          // 跳过损坏条目
        }
      }
      return result
    },
    flush: async () => {},
  }
}

/**
 * 一次性把 localStorage 旧键搬进 store（localStorage 时代数据的迁移通道）。
 * store 已有该键时不做任何事；搬迁成功后删除旧键，避免日后覆盖新数据。
 * 旧键内容损坏时同样删除并返回 false。
 */
export async function importLegacyJson(
  store: JsonStore,
  legacyKey: string,
  storeKey: string,
): Promise<boolean> {
  if ((await store.get(storeKey)) !== null) return false
  const raw = localStorage.getItem(legacyKey)
  if (raw === null) return false
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    localStorage.removeItem(legacyKey)
    return false
  }
  await store.set(storeKey, value)
  localStorage.removeItem(legacyKey)
  return true
}
