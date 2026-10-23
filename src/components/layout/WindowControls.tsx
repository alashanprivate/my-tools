/**
 * 自绘窗口控制按钮（最小化 / 最大化-还原 / 关闭），替代被 decorations: false
 * 去掉的原生标题栏按钮；浏览器环境没有原生窗口，不渲染。
 */
import { useEffect, useState } from 'react'
import { Copy, Minus, Square, X } from 'lucide-react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { isTauri } from '@/lib/environment'

const BUTTON_CLASS =
  'flex w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

export function WindowControls() {
  const [maximized, setMaximized] = useState(false)

  // 跟踪最大化状态以切换按钮图标；拖拽调整大小的过程中会连续触发，isMaximized 为廉价 IPC
  useEffect(() => {
    if (!isTauri()) return
    const win = getCurrentWindow()
    let unlisten: (() => void) | null = null
    let cancelled = false
    void (async () => {
      setMaximized((await win.isMaximized()) === true)
      const off = await win.onResized(async () => {
        setMaximized((await win.isMaximized()) === true)
      })
      if (cancelled) off()
      else unlisten = off
    })()
    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [])

  if (!isTauri()) return null
  const win = getCurrentWindow()

  return (
    <div className="flex h-full shrink-0 items-stretch">
      <button type="button" title="最小化" onClick={() => void win.minimize()} className={BUTTON_CLASS}>
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        title={maximized ? '还原' : '最大化'}
        onClick={() => void win.toggleMaximize()}
        className={BUTTON_CLASS}
      >
        {maximized ? <Copy className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        title="关闭"
        onClick={() => void win.close()}
        className={`${BUTTON_CLASS} hover:bg-destructive hover:text-destructive-foreground`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
