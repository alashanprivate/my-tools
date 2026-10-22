import { isTauri } from '@/lib/websites/openExternal'
import type { AiChatTool } from './index'

/**
 * 打开 AI 对话：桌面端在应用内新建独立窗口加载聊天页（重复点击聚焦已有窗口），
 * 浏览器环境回退为新标签页。失败返回 false，由调用方提示。
 */
export async function openAiChatWindow(tool: AiChatTool): Promise<boolean> {
  if (!isTauri()) {
    window.open(tool.url, '_blank', 'noopener,noreferrer')
    return true
  }
  try {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    const label = `ai-chat-${tool.id}`
    const existing = await WebviewWindow.getByLabel(label)
    if (existing) {
      await existing.setFocus()
      return true
    }
    const win = new WebviewWindow(label, {
      url: tool.url,
      title: `${tool.name} · AI 对话`,
      width: 1280,
      height: 860,
      center: true,
    })
    return await new Promise<boolean>((resolve) => {
      win.once('tauri://created', () => resolve(true))
      win.once('tauri://error', () => resolve(false))
    })
  } catch {
    return false
  }
}
