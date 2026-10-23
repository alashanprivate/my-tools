import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi'
import { applyChatWebviewsTheme } from '@/lib/theme'
import { isTauri } from '@/lib/environment'
import type { AiChatTool } from './index'

type WebviewInstance = import('@tauri-apps/api/webview').Webview

/** 子 webview 的窗口内标签前缀 */
const LABEL_PREFIX = 'ai-chat-embed-'

export interface LogicalRect {
  /** 逻辑像素（CSS px），相对窗口客户区左上角 */
  x: number
  y: number
  width: number
  height: number
}

export interface PhysicalRect {
  /** 物理像素，相对窗口客户区左上角 */
  x: number
  y: number
  width: number
  height: number
}

/** 已创建的内嵌聊天 webview（离开页面后隐藏但保留，登录态与页面状态不丢） */
const webviews = new Map<string, WebviewInstance>()
/** 创建中的防并发守卫（StrictMode 双挂载/快速连点时复用同一次创建） */
const creating = new Map<string, Promise<WebviewInstance | null>>()

async function ensureChatWebview(tool: AiChatTool, rect: LogicalRect): Promise<WebviewInstance | null> {
  const cached = webviews.get(tool.id)
  if (cached) return cached
  const pending = creating.get(tool.id)
  if (pending) return pending
  const task = (async () => {
    try {
      const { Webview } = await import('@tauri-apps/api/webview')
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const label = LABEL_PREFIX + tool.id
      const existing = await Webview.getByLabel(label)
      if (existing) {
        webviews.set(tool.id, existing)
        return existing
      }
      const created = new Webview(getCurrentWindow(), label, {
        url: tool.url,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      })
      const createdOk = await new Promise<boolean>((resolve) => {
        created.once('tauri://created', () => resolve(true))
        created.once('tauri://error', () => resolve(false))
      })
      if (!createdOk) return null
      webviews.set(tool.id, created)
      return created
    } catch {
      return null
    } finally {
      creating.delete(tool.id)
    }
  })()
  creating.set(tool.id, task)
  return task
}

/**
 * 在主窗口功能区内显示（或首次创建）某个 AI 对话的子 webview：
 * 按逻辑矩形换算物理边界后定位、显示并聚焦。
 * 失败（未开启 unstable / 无权限等）返回 false，由调用方提示。
 */
export async function showChatEmbed(tool: AiChatTool, rect: LogicalRect): Promise<boolean> {
  if (!isTauri()) return false
  const webview = await ensureChatWebview(tool, rect)
  if (!webview) return false
  try {
    // setPosition/setSize 的参数是 untagged 序列化，整数值会被当作物理像素，因此这里显式换算物理坐标
    const scale = window.devicePixelRatio || 1
    await webview.setPosition(
      new PhysicalPosition(Math.round(rect.x * scale), Math.round(rect.y * scale)),
    )
    await webview.setSize(
      new PhysicalSize(Math.round(rect.width * scale), Math.round(rect.height * scale)),
    )
    await webview.show()
    await webview.setFocus()
    // 新创建或复用的子 webview 套用外壳当前主题（命令对全部对话 webview 幂等）
    void applyChatWebviewsTheme()
    return true
  } catch {
    return false
  }
}

/** 隐藏内嵌聊天 webview（保留实例），未创建过则忽略 */
export function hideChatEmbed(id: string): void {
  const webview = webviews.get(id)
  if (!webview) return
  void webview.hide().catch(() => {
    // 窗口正在关闭等场景下隐藏失败可忽略
  })
}

/** 跟随布局变化同步 webview 边界（窗口缩放、侧边栏折叠等），静默忽略瞬时失败 */
export function syncChatEmbedBounds(id: string, rect: PhysicalRect): void {
  const webview = webviews.get(id)
  if (!webview) return
  void webview
    .setPosition(new PhysicalPosition(rect.x, rect.y))
    .then(() => webview.setSize(new PhysicalSize(rect.width, rect.height)))
    .catch(() => {
      // 窗口最小化等瞬时状态下同步失败无影响
    })
}
