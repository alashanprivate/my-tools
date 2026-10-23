/**
 * favicon 持久缓存（经 src/lib/storage 落盘）：
 * - 成功结果存 data URL，30 天有效，容量超限时按最久未更新淘汰；
 * - 失败名单 7 天内不再尝试，到期后自动重试。
 * 缓存 data URL 而非 URL 本身：渲染时零请求、离线可用，
 * 不受各站点缓存头差异的影响。
 */
import { openJsonStore } from '@/lib/storage'

const STORE_FILE = 'favicon-cache'
const ICON_PREFIX = 'icon:'
const FAIL_PREFIX = 'fail:'

/** 缓存有效期 */
export const FAVICON_SUCCESS_TTL = 30 * 24 * 60 * 60 * 1000
/** 失败后间隔多久允许重试 */
export const FAVICON_FAILURE_TTL = 7 * 24 * 60 * 60 * 1000
/** 最多缓存的站点数（每个图标几 KB ~ 几十 KB，控制单文件体积） */
export const FAVICON_MAX_ENTRIES = 100

interface CacheEntry {
  /** data URL */
  d: string
  /** 写入时间戳，同时用作 LRU 依据 */
  t: number
}

/** 取缓存的 data URL；不存在或已过期返回 null（过期条目顺带清除） */
export async function loadCachedFavicon(hostname: string): Promise<string | null> {
  const store = await openJsonStore(STORE_FILE)
  const entry = await store.get<CacheEntry>(ICON_PREFIX + hostname)
  if (!entry) return null
  if (Date.now() - entry.t > FAVICON_SUCCESS_TTL) {
    await store.remove(ICON_PREFIX + hostname)
    return null
  }
  return entry.d
}

/** 写入缓存；超出容量上限时按最久未更新淘汰 */
export async function saveFavicon(hostname: string, dataUrl: string): Promise<void> {
  const store = await openJsonStore(STORE_FILE)
  await store.set<CacheEntry>(ICON_PREFIX + hostname, { d: dataUrl, t: Date.now() })
  const iconEntries = (await store.entries()).filter(([key]) => key.startsWith(ICON_PREFIX))
  if (iconEntries.length <= FAVICON_MAX_ENTRIES) return
  iconEntries.sort(
    (a, b) => (a[1] as CacheEntry).t - (b[1] as CacheEntry).t,
  )
  for (const [key] of iconEntries.slice(0, iconEntries.length - FAVICON_MAX_ENTRIES)) {
    await store.remove(key)
  }
}

/** 该站点近期确认过没有图标（7 天内），跳过尝试直接回退 */
export async function isFaviconFailure(hostname: string): Promise<boolean> {
  const store = await openJsonStore(STORE_FILE)
  const at = await store.get<number>(FAIL_PREFIX + hostname)
  if (at === null) return false
  if (Date.now() - at > FAVICON_FAILURE_TTL) {
    await store.remove(FAIL_PREFIX + hostname)
    return false
  }
  return true
}

/** 记录一次「该站点拿不到图标」，冷却期内不再请求 */
export async function markFaviconFailure(hostname: string): Promise<void> {
  const store = await openJsonStore(STORE_FILE)
  await store.set(FAIL_PREFIX + hostname, Date.now())
}
