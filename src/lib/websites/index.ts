import { importLegacyJson, openJsonStore } from '@/lib/storage'
import { getSqliteDb, type SqlDatabase } from '@/lib/storage/sqlite'

export interface WebsiteItem {
  /** 唯一标识 */
  id: string
  /** 显示名称 */
  name: string
  /** 网址（规范化后含协议） */
  url: string
  /** 分类，取值见 WEBSITE_CATEGORIES */
  category: string
}

export const WEBSITE_CATEGORIES = ['AI', '工具', '开发', '社交', '设计'] as const

export type WebsiteCategory = (typeof WEBSITE_CATEGORIES)[number]

/** 「全部」标签的 key，仅用于页面筛选，不存入数据 */
export const ALL_CATEGORY = '全部'

/** 存储文件与键（桌面端落盘 appData/websites.json） */
const STORE_FILE = 'websites'
const SITES_KEY = 'sites'
const CATEGORIES_KEY = 'customCategories'
/** localStorage 时代的历史 key（一次性迁入 store 后删除） */
const STORAGE_KEY = 'website-nav-sites'
const CUSTOM_CATEGORIES_KEY = 'website-nav-custom-categories'

interface PresetSite {
  name: string
  url: string
  category: WebsiteCategory
}

const PRESET_SITES: PresetSite[] = [
  { name: 'ChatGPT', url: 'https://chatgpt.com', category: 'AI' },
  { name: 'Claude', url: 'https://claude.ai', category: 'AI' },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com', category: 'AI' },
  { name: 'Kimi', url: 'https://kimi.moonshot.cn', category: 'AI' },
  { name: 'Midjourney', url: 'https://www.midjourney.com', category: 'AI' },
  { name: '菜鸟教程', url: 'https://www.runoob.com', category: '工具' },
  { name: 'JSON 校验', url: 'https://www.json.cn', category: '工具' },
  { name: 'Tool.lu', url: 'https://tool.lu', category: '工具' },
  { name: 'GitHub', url: 'https://github.com', category: '开发' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', category: '开发' },
  { name: 'MDN', url: 'https://developer.mozilla.org', category: '开发' },
  { name: 'V2EX', url: 'https://www.v2ex.com', category: '开发' },
  { name: '知乎', url: 'https://www.zhihu.com', category: '社交' },
  { name: '微博', url: 'https://weibo.com', category: '社交' },
  { name: 'X', url: 'https://x.com', category: '社交' },
  { name: 'Reddit', url: 'https://www.reddit.com', category: '社交' },
  { name: 'Figma', url: 'https://www.figma.com', category: '设计' },
  { name: 'Dribbble', url: 'https://dribbble.com', category: '设计' },
  { name: 'Behance', url: 'https://www.behance.net', category: '设计' },
  { name: '站酷', url: 'https://www.zcool.com.cn', category: '设计' },
]

/** 列表中出现的自定义分类（按首次出现顺序，不含内置分类） */
export function getCustomCategories(items: WebsiteItem[]): string[] {
  const seen: string[] = []
  for (const item of items) {
    if (
      !(WEBSITE_CATEGORIES as readonly string[]).includes(item.category) &&
      !seen.includes(item.category)
    ) {
      seen.push(item.category)
    }
  }
  return seen
}

function sanitizeCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen: string[] = []
  for (const item of value) {
    if (typeof item === 'string' && item.trim() !== '' && !seen.includes(item)) {
      seen.push(item)
    }
  }
  return seen
}

/**
 * 读取自定义分类列表。桌面端走 SQLite；浏览器调试环境回退 JSON store
 * （一次性迁入 localStorage 旧数据）。同时把站点中出现但未登记的分类
 * 合并进来，去重后返回。
 */
export async function loadCategories(sites: WebsiteItem[]): Promise<string[]> {
  const db = await getSqliteDb().catch(() => null)
  let stored: string[] | null = null
  if (db) {
    try {
      await ensureWebsitesSeed(db)
      const rows = await db.select<Array<{ name: string }>>(
        'SELECT name FROM website_categories ORDER BY sort, name',
      )
      stored = sanitizeCategories(rows.map((row) => row.name))
    } catch {
      // SQLite 读取失败时退回 JSON 路径
      stored = null
    }
  }
  if (stored === null) {
    const store = await openJsonStore(STORE_FILE)
    await importLegacyJson(store, CUSTOM_CATEGORIES_KEY, CATEGORIES_KEY)
    stored = sanitizeCategories(await store.get<unknown>(CATEGORIES_KEY))
  }
  for (const derived of getCustomCategories(sites)) {
    if (!stored.includes(derived)) stored.push(derived)
  }
  return stored
}

/** 保存自定义分类列表，写入失败时静默失败（仅影响记忆） */
export async function saveCategories(categories: string[]): Promise<void> {
  const db = await getSqliteDb().catch(() => null)
  if (db) {
    try {
      await saveCategoriesDb(db, categories)
      return
    } catch {
      // 落库失败退回 JSON 路径
    }
  }
  try {
    const store = await openJsonStore(STORE_FILE)
    await store.set(CATEGORIES_KEY, categories)
  } catch {
    // 存储不可用时仅影响记忆
  }
}

/** 新增自定义分类：校验名称、与内置和已有分类查重 */
export function addCategory(
  existing: string[],
  input: string,
): { categories: string[] } | { error: string } {
  const name = input.trim()
  if (!name) return { error: '请输入分类名称' }
  if (name.length > MAX_CATEGORY_LENGTH) {
    return { error: `分类名不能超过 ${MAX_CATEGORY_LENGTH} 个字符` }
  }
  if ((WEBSITE_CATEGORIES as readonly string[]).includes(name) || existing.includes(name)) {
    return { error: '该分类已存在' }
  }
  return { categories: [...existing, name] }
}

/** 分类是否仍被站点使用（删除前检查） */
export function isCategoryInUse(sites: WebsiteItem[], category: string): boolean {
  return sites.some((site) => site.category === category)
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 预设网站列表（id 固定，多次调用内容一致） */
export function getPresetWebsites(): WebsiteItem[] {
  return PRESET_SITES.map((site, index) => ({ ...site, id: `preset-${index}` }))
}

/**
 * 规范化网址：缺协议时补全前缀（本机地址补 http://，其余补 https://），
 * 仅接受 http/https。无法解析时返回 null。
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
  // 本机地址没有 TLS，缺协议时默认 http://
  const isLocal = /^(localhost|127(\.\d+){3}|\[::1\])(:\d+)?([/?#]|$)/i.test(trimmed)
  const candidate = hasProtocol ? trimmed : `${isLocal ? 'http' : 'https'}://${trimmed}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    // 主机名至少要像个站点：有分隔点（含 IPv4）、localhost 或 IPv6 字面量
    const host = url.hostname
    if (!host.includes('.') && host !== 'localhost' && !host.startsWith('[')) return null
    return url.toString()
  } catch {
    return null
  }
}

/** 判断网址是否已存在于列表（按规范化后的地址比较） */
export function isDuplicateUrl(items: WebsiteItem[], url: string): boolean {
  const normalized = normalizeUrl(url)
  if (!normalized) return false
  return items.some((item) => item.url === normalized)
}

/** 分类名的长度上限 */
export const MAX_CATEGORY_LENGTH = 20

function isWebsiteItem(value: unknown): value is WebsiteItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.url === 'string' &&
    typeof item.category === 'string' &&
    item.category.trim() !== ''
  )
}

// ---------- SQLite（桌面端） ----------

interface SiteRow {
  id: string
  name: string
  url: string
  category: string
  sort: number
}

/** 整表重写站点：先删后插（插件底层是 sqlx 连接池，跨 execute 的事务不可用） */
async function saveSitesDb(db: SqlDatabase, items: WebsiteItem[]): Promise<void> {
  await db.execute('DELETE FROM website_sites')
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    await db.execute(
      'INSERT INTO website_sites (id, name, url, category, sort) VALUES ($1, $2, $3, $4, $5)',
      [item.id, item.name, item.url, item.category, index],
    )
  }
}

async function saveCategoriesDb(db: SqlDatabase, categories: string[]): Promise<void> {
  await db.execute('DELETE FROM website_categories')
  for (let index = 0; index < categories.length; index++) {
    await db.execute('INSERT INTO website_categories (name, sort) VALUES ($1, $2)', [
      categories[index],
      index,
    ])
  }
}

/**
 * 首次接入 SQLite 时初始化站点数据并打标记：优先导入 JSON store 存量
 * （含 localStorage 时代旧键的一次性迁入），没有存量才播种预设。
 * 标记保证只执行一次——用户删除预设后重启不会被重新播种。
 */
async function ensureWebsitesSeed(db: SqlDatabase): Promise<void> {
  const flag = await db.select<Array<{ value: string }>>(
    "SELECT value FROM app_meta WHERE key = 'websites_seeded'",
  )
  if (flag[0]?.value === '1') return
  const store = await openJsonStore(STORE_FILE)
  // 先把 localStorage 时代旧数据迁进 JSON store，再统一切到 SQLite
  await importLegacyJson(store, STORAGE_KEY, SITES_KEY)
  await importLegacyJson(store, CUSTOM_CATEGORIES_KEY, CATEGORIES_KEY)
  const rawSites = await store.get<unknown>(SITES_KEY)
  const rawCategories = await store.get<unknown>(CATEGORIES_KEY)
  if (Array.isArray(rawSites)) {
    await saveSitesDb(db, rawSites.filter(isWebsiteItem))
    await saveCategoriesDb(db, sanitizeCategories(rawCategories))
  } else {
    // 无任何存量记录：播种预设（空数组视为用户清空，原样保留）
    await saveSitesDb(db, getPresetWebsites())
  }
  await db.execute("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('websites_seeded', '1')")
  // 导入成功才清空旧键，中途失败保留、下次启动重试
  if (Array.isArray(rawSites)) {
    await store.remove(SITES_KEY)
    await store.remove(CATEGORIES_KEY)
  }
}

// ---------- 存储（桌面端 SQLite / 浏览器调试回退 JSON store） ----------

/**
 * 读取网站列表。桌面端走 SQLite（首次接入时播种预设或导入 JSON 存量）；
 * 浏览器调试环境回退 JSON store，一次性迁入 localStorage 旧数据。
 * 数据损坏时返回预设；显式空数组视为用户清空了所有网站，予以保留。
 */
export async function loadWebsites(): Promise<WebsiteItem[]> {
  const db = await getSqliteDb().catch(() => null)
  if (db) {
    try {
      await ensureWebsitesSeed(db)
      const rows = await db.select<SiteRow[]>(
        'SELECT id, name, url, category FROM website_sites ORDER BY sort, id',
      )
      return rows.map(({ id, name, url, category }) => ({ id, name, url, category }))
    } catch {
      // SQLite 读取失败时退回 JSON 路径
    }
  }
  const store = await openJsonStore(STORE_FILE)
  await importLegacyJson(store, STORAGE_KEY, SITES_KEY)
  try {
    const raw = await store.get<unknown>(SITES_KEY)
    if (raw !== null) {
      if (Array.isArray(raw)) return raw.filter(isWebsiteItem)
      return getPresetWebsites()
    }
  } catch {
    // 数据损坏时返回预设
  }
  return getPresetWebsites()
}

/** 保存网站列表，写入失败时静默失败（仅影响记忆） */
export async function saveWebsites(items: WebsiteItem[]): Promise<void> {
  const db = await getSqliteDb().catch(() => null)
  if (db) {
    try {
      await saveSitesDb(db, items)
      return
    } catch {
      // 落库失败退回 JSON 路径
    }
  }
  try {
    const store = await openJsonStore(STORE_FILE)
    await store.set(SITES_KEY, items)
  } catch {
    // 存储不可用时仅影响记忆
  }
}

/** 用传入列表构造新网站项（url 需已规范化；分类可为自定义名称） */
export function createWebsite(
  items: WebsiteItem[],
  input: { name: string; url: string; category: string },
): WebsiteItem | { error: string } {
  const name = input.name.trim()
  if (!name) return { error: '请输入网站名称' }
  const category = input.category.trim()
  if (!category) return { error: '请选择或输入分类' }
  if (category.length > MAX_CATEGORY_LENGTH) {
    return { error: `分类名不能超过 ${MAX_CATEGORY_LENGTH} 个字符` }
  }
  const url = normalizeUrl(input.url)
  if (!url) return { error: '网址格式不正确' }
  if (isDuplicateUrl(items, url)) return { error: '该网址已存在' }
  return { id: createId(), name, url, category }
}
