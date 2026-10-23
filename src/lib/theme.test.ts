import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCustomSchemeColor,
  getThemeMode,
  getThemeScheme,
  initTheme,
  resolveDark,
  setCustomScheme,
  setThemeMode,
  setThemeScheme,
  subscribeTheme,
  THEME_BOOT_KEY,
  THEME_CUSTOM_BOOT_KEY,
  THEME_SCHEME_BOOT_KEY,
} from './theme'

const { tauriSetTheme } = vi.hoisted(() => ({ tauriSetTheme: vi.fn() }))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ setTheme: tauriSetTheme }),
}))

/** 门面浏览器降级实现的主题存储键 */
const THEME_STORE_KEY = 'json-store:theme.json#mode'
const SCHEME_STORE_KEY = 'json-store:theme.json#scheme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.documentElement.removeAttribute('data-theme')
  tauriSetTheme.mockClear()
})

describe('theme', () => {
  it('resolveDark：light 恒为浅色，dark 恒为深色，system 跟随系统', () => {
    expect(resolveDark('light')).toBe(false)
    expect(resolveDark('dark')).toBe(true)
    // 测试环境的 matchMedia mock 恒为不匹配
    expect(resolveDark('system')).toBe(false)
  })

  it('setThemeMode 立即应用类名并写入引导缓存与 store', async () => {
    await setThemeMode('dark')
    expect(getThemeMode()).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_BOOT_KEY)).toBe('dark')
    expect(JSON.parse(localStorage.getItem(THEME_STORE_KEY) ?? 'null')).toBe('dark')

    await setThemeMode('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem(THEME_BOOT_KEY)).toBe('light')
    expect(JSON.parse(localStorage.getItem(THEME_STORE_KEY) ?? 'null')).toBe('light')
  })

  it('切换时通知订阅者，退订后不再通知', async () => {
    await setThemeMode('light')
    const listener = vi.fn()
    const unsubscribe = subscribeTheme(listener)
    await setThemeMode('dark')
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    await setThemeMode('light')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('initTheme 以 store 为准校正引导缓存', async () => {
    localStorage.setItem(THEME_BOOT_KEY, 'light')
    localStorage.setItem(THEME_STORE_KEY, JSON.stringify('dark'))
    await initTheme()
    expect(getThemeMode()).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_BOOT_KEY)).toBe('dark')
  })

  it('initTheme：store 无记录时保持当前模式', async () => {
    await setThemeMode('system')
    localStorage.removeItem(THEME_STORE_KEY) // 模拟从未持久化过
    await initTheme()
    expect(getThemeMode()).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('initTheme：store 值损坏时忽略', async () => {
    await setThemeMode('light')
    localStorage.setItem(THEME_STORE_KEY, JSON.stringify('banana'))
    await initTheme()
    expect(getThemeMode()).toBe('light')
  })

  it('浏览器环境不触碰原生窗口主题', async () => {
    await setThemeMode('dark')
    expect(tauriSetTheme).not.toHaveBeenCalled()
  })

  it('桌面端同步原生窗口主题，system 交还系统（null）', async () => {
    ;(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {}
    try {
      // 原生主题同步是 fire-and-forget，需等待异步调用落地
      await setThemeMode('dark')
      await vi.waitFor(() => expect(tauriSetTheme).toHaveBeenLastCalledWith('dark'))
      await setThemeMode('light')
      await vi.waitFor(() => expect(tauriSetTheme).toHaveBeenLastCalledWith('light'))
      await setThemeMode('system')
      await vi.waitFor(() => expect(tauriSetTheme).toHaveBeenLastCalledWith(null))
    } finally {
      delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__
    }
  })

  it('setThemeScheme 应用 data-theme 并持久化，blue 移除属性', async () => {
    await setThemeScheme('green')
    expect(getThemeScheme()).toBe('green')
    expect(document.documentElement.getAttribute('data-theme')).toBe('green')
    expect(localStorage.getItem(THEME_SCHEME_BOOT_KEY)).toBe('green')
    expect(JSON.parse(localStorage.getItem(SCHEME_STORE_KEY) ?? 'null')).toBe('green')

    await setThemeScheme('blue')
    expect(getThemeScheme()).toBe('blue')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('initTheme 以 store 为准校正配色方案', async () => {
    localStorage.setItem(THEME_SCHEME_BOOT_KEY, 'blue')
    localStorage.setItem(SCHEME_STORE_KEY, JSON.stringify('violet'))
    await initTheme()
    expect(getThemeScheme()).toBe('violet')
    expect(document.documentElement.getAttribute('data-theme')).toBe('violet')
    expect(localStorage.getItem(THEME_SCHEME_BOOT_KEY)).toBe('violet')
  })

  it('initTheme：配色方案 store 值损坏时忽略', async () => {
    await setThemeScheme('graphite')
    localStorage.setItem(SCHEME_STORE_KEY, JSON.stringify('banana'))
    await initTheme()
    expect(getThemeScheme()).toBe('graphite')
  })

  it('setCustomScheme 由取色值生成亮暗主色并持久化', async () => {
    await setCustomScheme('#ff0000')
    expect(getThemeScheme()).toBe('custom')
    expect(getCustomSchemeColor()).toBe('#ff0000')
    expect(document.documentElement.getAttribute('data-theme')).toBe('custom')
    const style = document.documentElement.style
    expect(style.getPropertyValue('--custom-primary')).toBe('0 100% 48%')
    expect(style.getPropertyValue('--custom-primary-foreground')).toBe('0 0% 100%')
    expect(style.getPropertyValue('--custom-primary-dark')).toBe('0 100% 60%')
    expect(style.getPropertyValue('--custom-primary-foreground-dark')).toBe('0 0% 10%')
    expect(localStorage.getItem(THEME_CUSTOM_BOOT_KEY)).toBe('#ff0000')
    expect(JSON.parse(localStorage.getItem(SCHEME_STORE_KEY) ?? 'null')).toBe('custom')
  })

  it('setCustomScheme：非法颜色忽略', async () => {
    await setThemeScheme('green')
    // 前一个用例已把自定义色设为 #ff0000，非法输入后应保持不变
    await setCustomScheme('nothex')
    expect(getThemeScheme()).toBe('green')
    expect(getCustomSchemeColor()).toBe('#ff0000')
  })
})
