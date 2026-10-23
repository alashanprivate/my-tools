import { isTauri } from '@/lib/environment'

export type SqlDatabase = import('@tauri-apps/plugin-sql').default

/** 应用共享的 SQLite 库（桌面端），建表迁移由 src-tauri 在启动时执行 */
const DB_URL = 'sqlite:my-tools.db'

let dbPromise: Promise<SqlDatabase> | null = null

/**
 * 打开共享 SQLite 库；浏览器调试环境返回 null，调用方走 JSON store 回退。
 * 打开失败时抛错且不缓存，允许下次重试。注意插件底层是 sqlx 连接池，
 * 跨多次 execute 的 BEGIN/COMMIT 不可用，多条写入按顺序执行即可。
 */
export function getSqliteDb(): Promise<SqlDatabase | null> {
  if (!isTauri()) return Promise.resolve(null)
  if (!dbPromise) {
    dbPromise = import('@tauri-apps/plugin-sql').then((mod) => mod.default.load(DB_URL))
  }
  return dbPromise.catch((error) => {
    dbPromise = null
    throw error
  })
}
