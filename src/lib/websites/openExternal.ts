/** 是否运行在 Tauri 桌面端（区别于 npm run dev 的纯浏览器环境） */
export function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window
}

/**
 * 打开外链：桌面端走 shell 插件用系统默认浏览器（target="_blank" 会被 WebView 拦截），
 * 浏览器环境用 window.open。调用失败返回 false，由调用方提示。
 */
export async function openExternal(url: string): Promise<boolean> {
  if (isTauri()) {
    try {
      const { open } = await import('@tauri-apps/plugin-shell')
      await open(url)
      return true
    } catch {
      return false
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
