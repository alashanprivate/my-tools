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

const STORAGE_KEY = 'website-nav-sites'

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

const CUSTOM_CATEGORIES_KEY = 'website-nav-custom-categories'

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
 * 读取自定义分类列表。旧版分类跟随站点存储，这里会把
 * 站点中出现但未登记的分类合并进来（迁移），去重后返回。
 */
export function loadCategories(sites: WebsiteItem[]): string[] {
  let stored: string[]
  try {
    stored = sanitizeCategories(JSON.parse(localStorage.getItem(CUSTOM_CATEGORIES_KEY) ?? '[]'))
  } catch {
    stored = []
  }
  for (const derived of getCustomCategories(sites)) {
    if (!stored.includes(derived)) stored.push(derived)
  }
  return stored
}

/** 保存自定义分类列表，localStorage 不可用时静默失败（仅影响记忆） */
export function saveCategories(categories: string[]): void {
  try {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories))
  } catch {
    // localStorage 不可用时仅影响记忆
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

/**
 * 读取网站列表。首次使用（无存储记录）或数据损坏时返回预设；
 * 存储为空数组视为用户清空了所有网站，予以保留。
 */
export function loadWebsites(): WebsiteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return getPresetWebsites()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return getPresetWebsites()
    return parsed.filter(isWebsiteItem)
  } catch {
    return getPresetWebsites()
  }
}

/** 保存网站列表，localStorage 不可用时静默失败（仅影响记忆） */
export function saveWebsites(items: WebsiteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage 不可用时仅影响记忆
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
