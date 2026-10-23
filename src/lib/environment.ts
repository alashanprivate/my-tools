/** 是否运行在 Tauri 桌面端（区别于 npm run dev 的纯浏览器环境） */
export function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window
}
