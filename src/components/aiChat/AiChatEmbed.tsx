import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { askAiPanel } from '@/components/ai/askAi'
import { SiteFavicon } from '@/components/ui/SiteFavicon'
import { getAiChatById } from '@/lib/aiChat'
import { useAiEntries } from '@/lib/aiChat/entries'
import { hideChatEmbed, showChatEmbed, syncChatEmbedBounds } from '@/lib/aiChat/embeddedChat'
import { isTauri } from '@/lib/environment'

/**
 * AI 对话内嵌页（/ai-chat/:id）：桌面端把聊天站点作为主窗口的子 webview
 * 内嵌在功能区展示（类似 Cherry Studio），进入时左侧菜单与「问 AI」面板自动收起；
 * 离开页面时仅隐藏 webview，登录态与页面状态保留。浏览器环境回退为新标签页打开。
 */
export function AiChatEmbed() {
  const { id } = useParams()
  const navigate = useNavigate()
  const tool = getAiChatById(id ?? '')
  const { loaded: entriesLoaded } = useAiEntries()
  const anchorRef = useRef<HTMLDivElement>(null)
  const [openFailed, setOpenFailed] = useState(false)
  const desktop = isTauri()

  // 进入内嵌对话时收起右侧「问 AI」面板，给聊天页让出完整功能区
  useEffect(() => {
    askAiPanel.setOpen(false)
  }, [])

  // 挂载时创建/显示子 webview，并跟随内容区尺寸变化同步边界；卸载时隐藏
  useEffect(() => {
    if (!tool || !desktop) return
    const anchor = anchorRef.current
    if (!anchor) return
    let cancelled = false
    let raf = 0

    const measure = () => {
      const rect = anchor.getBoundingClientRect()
      const scale = window.devicePixelRatio || 1
      return {
        logical: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        physical: {
          x: Math.round(rect.left * scale),
          y: Math.round(rect.top * scale),
          width: Math.round(rect.width * scale),
          height: Math.round(rect.height * scale),
        },
      }
    }
    // 宽高为 0（窗口最小化等）时跳过，避免把 webview 压成 0 尺寸
    const apply = () => {
      raf = 0
      const { physical } = measure()
      if (physical.width < 1 || physical.height < 1) return
      syncChatEmbedBounds(tool.id, physical)
    }
    const observer = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(apply)
    })
    observer.observe(anchor)

    void (async () => {
      const { logical } = measure()
      const opened = await showChatEmbed(tool, logical)
      if (cancelled) return
      if (!opened) {
        setOpenFailed(true)
        return
      }
      apply() // 创建期间布局可能已变化，显示成功后立即校准一次
    })()

    return () => {
      cancelled = true
      observer.disconnect()
      if (raf) cancelAnimationFrame(raf)
      hideChatEmbed(tool.id)
    }
  }, [tool, desktop])

  // 自定义入口为异步加载，加载完成前不判定重定向（深链接可能指向自定义入口）
  if (entriesLoaded && !tool) return <Navigate to="/ai-chat" replace />
  if (!tool) return null

  // 浏览器环境无法内嵌第三方站点（X-Frame-Options），给出新标签页入口
  if (!desktop) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <SiteFavicon
          url={tool.url}
          letter={tool.name.trim().charAt(0).toUpperCase()}
          dataUrl={tool.logo}
          fallbackClassName={tool.color}
          className="h-12 w-12 rounded-xl text-xl font-bold text-white"
        />
        <p className="text-sm">{tool.name} 需在桌面端应用内打开</p>
        <button
          type="button"
          onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
          className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          在新标签页打开
        </button>
      </div>
    )
  }

  const letter = tool.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 pl-2 pr-3">
        <button
          type="button"
          onClick={() => navigate('/ai-chat')}
          title="返回 AI 对话"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <SiteFavicon
          url={tool.url}
          letter={letter}
          dataUrl={tool.logo}
          fallbackClassName={tool.color}
          className="h-5 w-5 rounded-md text-[10px] font-bold text-white"
        />
        <span className="text-sm font-medium">{tool.name}</span>
        <button
          type="button"
          onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
          title="在系统浏览器打开"
          className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>

      <div ref={anchorRef} className="relative min-h-0 flex-1 bg-background">
        {openFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <p className="text-sm">内嵌「{tool.name}」失败，请重启应用后重试</p>
            <button
              type="button"
              onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
              className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              在新标签页打开
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
