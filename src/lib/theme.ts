/**
 * 主题（浅色 / 深色 / 跟随系统）管理。
 *
 * 持久化走 lib/storage 门面（openJsonStore），但主题必须在首帧渲染前生效，
 * 否则深色用户每次启动都会闪一帧白屏。因此在 localStorage 里额外维护一份
 * 引导缓存（THEME_BOOT_KEY，纯字符串值），index.html 的内联脚本在首帧前
 * 用它同步设置 .dark 类；应用启动后 initTheme 再以 store 为准校正。
 *
 * React 侧用 useSyncExternalStore(subscribeTheme, getThemeMode) 订阅当前模式。
 */
import { openJsonStore } from '@/lib/storage'
import { isTauri } from '@/lib/environment'

export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * 配色方案：只切换主题色（primary/ring），与深浅色模式独立组合；blue 为默认。
 * custom 不走 CSS 预置变量，由取色器颜色换算出亮/暗两档主色后内联注入。
 */
export type ThemeScheme =
  | 'blue'
  | 'graphite'
  | 'green'
  | 'violet'
  | 'pure'
  | 'mist'
  | 'titanium'
  | 'cobalt'
  | 'teal'
  | 'amber'
  | 'pink'
  | 'vscode'
  | 'idea'
  | 'xcode'
  | 'jetbrains'
  | 'cursor'
  | 'claude'
  | 'custom'

const THEME_STORE_FILE = 'theme'
const THEME_STORE_KEY = 'mode'
const SCHEME_STORE_KEY = 'scheme'
const CUSTOM_STORE_KEY = 'customColor'
/** 引导缓存键：与 store 同值镜像，仅供 index.html 内联脚本在首帧前读取 */
export const THEME_BOOT_KEY = 'theme'
export const THEME_SCHEME_BOOT_KEY = 'theme-scheme'
export const THEME_CUSTOM_BOOT_KEY = 'theme-custom'

const MEDIA_QUERY = '(prefers-color-scheme: dark)'

const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system']
const THEME_SCHEMES: readonly ThemeScheme[] = [
  'blue',
  'graphite',
  'green',
  'violet',
  'pure',
  'mist',
  'titanium',
  'cobalt',
  'teal',
  'amber',
  'pink',
  'vscode',
  'idea',
  'xcode',
  'jetbrains',
  'cursor',
  'claude',
  'custom',
]

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{6})$/
/** 自定义主色的默认值（未取过色时进入自定义方案显示这个） */
const CUSTOM_COLOR_DEFAULT = '#3b82f6'

let mode: ThemeMode = 'system'
let scheme: ThemeScheme = 'blue'
let customColor = CUSTOM_COLOR_DEFAULT
let media: MediaQueryList | null = null
const listeners = new Set<() => void>()

function getMedia(): MediaQueryList {
  media ??= window.matchMedia(MEDIA_QUERY)
  return media
}

export function getThemeMode(): ThemeMode {
  return mode
}

export function getThemeScheme(): ThemeScheme {
  return scheme
}

export function getCustomSchemeColor(): string {
  return customColor
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 当前实际是否应使用深色（system 模式下跟随系统实时值） */
export function resolveDark(value: ThemeMode): boolean {
  return value === 'dark' || (value === 'system' && getMedia().matches)
}

/**
 * 桌面端把原生窗口（标题栏等系统绘制区域）一并切换到目标主题，
 * system 传 null 交还给系统跟随；浏览器环境无原生窗口，跳过。
 */
async function applyNativeTheme(value: ThemeMode): Promise<void> {
  if (!isTauri()) return
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().setTheme(value === 'system' ? null : value)
  } catch {
    // 权限未授权或平台不支持时忽略，仅影响标题栏配色
  }
  void applyChatWebviewsTheme()
}

/** 把当前解析后的主题同步到 AI 对话子 webview（自定义命令按 label 过滤）；失败静默 */
export async function applyChatWebviewsTheme(): Promise<void> {
  if (!isTauri()) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('set_chat_webviews_theme', { theme: resolveDark(mode) ? 'dark' : 'light' })
  } catch {
    // 后端不可用或平台不支持时忽略，仅影响内嵌页主题
  }
}

function apply(value: ThemeMode) {
  document.documentElement.classList.toggle('dark', resolveDark(value))
  void applyNativeTheme(value)
}

function applyScheme(value: ThemeScheme) {
  // 默认方案不带属性，命中 :root/.dark 基础变量
  if (value === 'blue') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', value)
  if (value === 'custom') applyCustomColor(customColor)
}

/** hex → HSL（s/l 取整为百分比），非法输入返回 null */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  if (!HEX_COLOR_RE.test(hex)) return null
  const int = parseInt(hex.slice(1), 16)
  const r = ((int >> 16) & 255) / 255
  const g = ((int >> 8) & 255) / 255
  const b = (int & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** 把自定义主色换算成亮/暗两档变量内联到根元素：亮档压深保证白字可读，暗档提亮配深字 */
function applyCustomColor(hex: string) {
  const hsl = hexToHsl(hex)
  if (!hsl) return
  customColor = hex
  const { h, s, l } = hsl
  const lightL = clamp(l, 30, 48)
  const darkL = clamp(l + 10, 55, 70)
  const style = document.documentElement.style
  style.setProperty('--custom-primary', `${h} ${s}% ${lightL}%`)
  style.setProperty('--custom-primary-foreground', '0 0% 100%')
  style.setProperty('--custom-ring', `${h} ${s}% ${lightL}%`)
  style.setProperty('--custom-primary-dark', `${h} ${s}% ${darkL}%`)
  style.setProperty('--custom-primary-foreground-dark', '0 0% 10%')
  style.setProperty('--custom-ring-dark', `${h} ${s}% ${darkL}%`)
}

/** 选择自定义配色：任意取色器颜色自动生成亮/暗两档主色 */
export async function setCustomScheme(hex: string): Promise<void> {
  const normalized = hex.trim().startsWith('#') ? hex.trim() : `#${hex.trim()}`
  if (!hexToHsl(normalized)) return
  applyCustomColor(normalized)
  await setThemeScheme('custom')
  try {
    localStorage.setItem(THEME_CUSTOM_BOOT_KEY, customColor)
  } catch {
    // 引导缓存写失败只影响下次启动首帧
  }
  try {
    const store = await openJsonStore(THEME_STORE_FILE)
    await store.set(CUSTOM_STORE_KEY, customColor)
  } catch {
    // 存储不可用时仅影响持久化
  }
}

/** 切换配色方案：立即应用到 DOM，并写入 store 与引导缓存 */
export async function setThemeScheme(next: ThemeScheme): Promise<void> {
  scheme = next
  applyScheme(next)
  emit()
  try {
    localStorage.setItem(THEME_SCHEME_BOOT_KEY, next)
  } catch {
    // 引导缓存写失败只影响下次启动首帧，store 仍是权威来源
  }
  try {
    const store = await openJsonStore(THEME_STORE_FILE)
    await store.set(SCHEME_STORE_KEY, next)
  } catch {
    // 存储不可用时仅影响持久化
  }
}

function emit() {
  for (const listener of listeners) listener()
}

/** 切换主题：立即应用到 DOM，并写入 store 与引导缓存 */
export async function setThemeMode(next: ThemeMode): Promise<void> {
  mode = next
  apply(next)
  emit()
  try {
    localStorage.setItem(THEME_BOOT_KEY, next)
  } catch {
    // 引导缓存写失败只影响下次启动首帧，store 仍是权威来源
  }
  try {
    const store = await openJsonStore(THEME_STORE_FILE)
    await store.set(THEME_STORE_KEY, next)
  } catch {
    // 存储不可用时仅影响持久化
  }
}

/** 应用启动时调用：先用引导缓存对齐模块状态，再以 store 为准校正，并监听系统主题变化 */
export async function initTheme(): Promise<void> {
  // index.html 内联脚本只改了 DOM，这里的模块变量需从引导缓存对齐（缓存损坏时保持默认）
  try {
    const cachedMode = localStorage.getItem(THEME_BOOT_KEY)
    if (cachedMode && THEME_MODES.includes(cachedMode as ThemeMode)) mode = cachedMode as ThemeMode
    const cachedScheme = localStorage.getItem(THEME_SCHEME_BOOT_KEY)
    if (cachedScheme && THEME_SCHEMES.includes(cachedScheme as ThemeScheme)) {
      scheme = cachedScheme as ThemeScheme
    }
    const cachedCustom = localStorage.getItem(THEME_CUSTOM_BOOT_KEY)
    if (cachedCustom && HEX_COLOR_RE.test(cachedCustom)) customColor = cachedCustom
  } catch {
    // localStorage 不可用时保持默认
  }
  apply(mode)
  applyScheme(scheme)
  getMedia().addEventListener('change', () => {
    if (mode !== 'system') return
    apply(mode)
    emit()
  })

  try {
    const store = await openJsonStore(THEME_STORE_FILE)
    const stored = await store.get<ThemeMode>(THEME_STORE_KEY)
    const storedScheme = await store.get<ThemeScheme>(SCHEME_STORE_KEY)
    const storedCustom = await store.get<string>(CUSTOM_STORE_KEY)
    if (typeof storedCustom === 'string' && HEX_COLOR_RE.test(storedCustom)) {
      customColor = storedCustom
    }
    if (storedScheme && THEME_SCHEMES.includes(storedScheme) && storedScheme !== scheme) {
      await setThemeScheme(storedScheme)
    }
    // scheme 就是 custom 时（或与缓存一致未被上面校正），用 store 的颜色重新注入
    if (scheme === 'custom') {
      applyCustomColor(customColor)
      try {
        localStorage.setItem(THEME_CUSTOM_BOOT_KEY, customColor)
      } catch {
        // 引导缓存写失败只影响下次启动首帧
      }
    }
    if (stored && THEME_MODES.includes(stored) && stored !== mode) {
      await setThemeMode(stored)
    }
  } catch {
    // 存储不可用时保持引导缓存的模式
  }
}
