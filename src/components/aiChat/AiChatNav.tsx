import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, MessagesSquare, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react'
import { SiteFavicon } from '@/components/ui/SiteFavicon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/useToast'
import { type AiChatTool } from '@/lib/aiChat'
import {
  addCustomEntry,
  fileToLogoDataUrl,
  hideBuiltinEntry,
  isValidChatUrl,
  removeCustomEntry,
  restoreBuiltinEntries,
  setChatEntryPinned,
  useAiEntries,
} from '@/lib/aiChat/entries'
import { isTauri } from '@/lib/environment'

function ChatTile({
  tool,
  onOpen,
  onRemove,
}: {
  tool: AiChatTool
  onOpen: (tool: AiChatTool) => void
  onRemove?: (tool: AiChatTool, x: number, y: number) => void
}) {
  const letter = tool.name.trim().charAt(0).toUpperCase() || '?'
  return (
    <button
      type="button"
      title={tool.custom ? `${tool.name}（应用内打开，右键可删除）` : `${tool.name}（应用内打开）`}
      onClick={() => onOpen(tool)}
      onContextMenu={
        onRemove
          ? (event) => {
              event.preventDefault()
              onRemove(tool, event.clientX, event.clientY)
            }
          : undefined
      }
      className="group flex w-16 flex-col items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SiteFavicon
        url={tool.url}
        letter={letter}
        dataUrl={tool.logo}
        fallbackClassName={tool.color}
        className="h-11 w-11 rounded-lg text-base font-bold text-white shadow-sm transition-all group-hover:shadow-md"
      />
      <p className="mt-1.5 w-16 truncate text-center text-sm">{tool.name}</p>
    </button>
  )
}

function AddTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="添加自定义入口"
      className="group flex w-20 flex-col items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 text-muted-foreground transition-colors group-hover:border-primary/60 group-hover:text-primary">
        <Plus className="h-5 w-5" />
      </span>
      <p className="mt-1.5 w-16 truncate text-center text-sm">添加</p>
    </button>
  )
}

/** 添加自定义入口对话框：Logo（可选）+ 名称 + 网址，回车提交，Esc 取消 */
function AddChatDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [logoError, setLogoError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setUrl('')
      setLogo(null)
      setError('')
      setLogoError('')
      setTimeout(() => nameRef.current?.focus(), 0)
    }
  }, [open])

  if (!open) return null

  const submit = () => {
    if (!name.trim()) {
      setError('请填写名称')
      return
    }
    if (!isValidChatUrl(url)) {
      setError('网址需为合法的 http(s) 地址')
      return
    }
    void addCustomEntry(name, url, logo ?? undefined)
    onClose()
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      submit()
    } else if (event.key === 'Escape') {
      onClose()
    }
  }

  // 选完即压缩成 data URL 供预览；清空 value 允许重复选择同一文件
  const handleLogoChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    fileToLogoDataUrl(file)
      .then((dataUrl) => {
        setLogo(dataUrl)
        setLogoError('')
      })
      .catch((err) => {
        setLogoError(err instanceof Error ? err.message : '图片处理失败')
      })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-card p-5 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">添加自定义入口</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          任意可网页访问的 AI 对话站点均可，桌面端同样内嵌在功能区打开
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <span className="block text-sm font-medium">
              Logo
              <span className="font-normal text-muted-foreground">
                （可选，不上传则自动抓取站点图标）
              </span>
            </span>
            <div className="flex items-center gap-3">
              {logo ? (
                <img
                  src={logo}
                  alt="Logo 预览"
                  className="h-12 w-12 rounded-lg border border-border/60 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 text-muted-foreground">
                  <ImagePlus className="h-5 w-5" />
                </div>
              )}
              <div className="flex flex-col items-start gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  选择图片
                </Button>
                {logo && (
                  <Button variant="ghost" size="sm" onClick={() => setLogo(null)}>
                    移除
                  </Button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            {logoError && <p className="text-xs text-destructive">{logoError}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="chat-entry-name" className="text-sm font-medium">
              名称
            </label>
            <Input
              ref={nameRef}
              id="chat-entry-name"
              value={name}
              placeholder="如：Kimi 探索版"
              onChange={(event) => {
                setName(event.target.value)
                setError('')
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="chat-entry-url" className="text-sm font-medium">
              网址
            </label>
            <Input
              id="chat-entry-url"
              value={url}
              placeholder="https://example.com"
              onChange={(event) => {
                setUrl(event.target.value)
                setError('')
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit}>添加</Button>
        </div>
      </div>
    </div>
  )
}

export function AiChatNav() {
  const [keyword, setKeyword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menu, setMenu] = useState<{ tool: AiChatTool; x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { tools: allTools, hiddenBuiltinIds } = useAiEntries()

  const filtered = allTools.filter((tool) =>
    `${tool.name} ${tool.url}`.toLowerCase().includes(keyword.trim().toLowerCase()),
  )

  // 右键菜单：点击菜单外、按 Esc 或窗口失焦时关闭（菜单内的点击不关闭，保证删除项可点）
  useEffect(() => {
    if (!menu) return
    const handleMouseDown = (event: globalThis.MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setMenu(null)
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(null)
    }
    const handleBlur = () => setMenu(null)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', handleBlur)
    }
  }, [menu])

  const handleOpen = (tool: AiChatTool) => {
    if (!isTauri()) {
      window.open(tool.url, '_blank', 'noopener,noreferrer')
      return
    }
    // 桌面端进入内嵌页：左侧菜单与「问 AI」面板自动收起，聊天站点在功能区展示
    navigate(`/ai-chat/${tool.id}`)
  }

  const handleRemove = (tool: AiChatTool, x: number, y: number) => {
    setMenu({ tool, x, y })
  }

  const confirmRemove = (tool: AiChatTool) => {
    setMenu(null)
    // 自定义入口彻底删除；内置入口移除即 enabled=0，可在列表下方整体恢复
    if (tool.custom) {
      void removeCustomEntry(tool.id)
      showToast(`已删除「${tool.name}」`)
    } else {
      void hideBuiltinEntry(tool.id)
      showToast(`已移除「${tool.name}」，需要时可恢复`)
    }
  }

  const togglePinned = (tool: AiChatTool) => {
    setMenu(null)
    const pinned = !tool.pinned
    void setChatEntryPinned(tool.id, pinned)
    showToast(pinned ? `已固定「${tool.name}」到顶部标签栏` : `已取消固定「${tool.name}」`)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">AI 对话</h1>
        <p className="text-sm text-muted-foreground">
          常用 AI 聊天入口，桌面端点击后内嵌在功能区打开
        </p>
        <div className="relative ml-auto min-w-52 sm:max-w-md sm:flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            aria-label="搜索 AI 对话"
            placeholder="搜索..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-5">
        {filtered.map((tool) => (
          <ChatTile key={tool.id} tool={tool} onOpen={handleOpen} onRemove={handleRemove} />
        ))}
        <AddTile onClick={() => setDialogOpen(true)} />
      </div>
      {filtered.length === 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">没有匹配的 AI 对话</div>
      )}

      {hiddenBuiltinIds.length > 0 && (
        <p className="mt-6 text-xs text-muted-foreground">
          已移除 {hiddenBuiltinIds.length} 个内置入口，点击
          <button
            type="button"
            onClick={() => void restoreBuiltinEntries()}
            className="text-primary underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            恢复全部
          </button>
        </p>
      )}

      <p className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <MessagesSquare className="h-3.5 w-3.5" />
        需要登录的服务直接在内嵌页面里登录即可；浏览器环境下点击将以新标签页打开，右键图标可固定或删除入口
      </p>

      <AddChatDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      {menu && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-50 min-w-[150px] rounded-md border bg-popover p-1 shadow-lg"
          style={{
            left: Math.min(menu.x, window.innerWidth - 170),
            top: Math.min(menu.y, window.innerHeight - 90),
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => togglePinned(menu.tool)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {menu.tool.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            {menu.tool.pinned ? '取消固定' : '固定到顶部标签栏'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => confirmRemove(menu.tool)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {menu.tool.custom ? `删除「${menu.tool.name}」` : `移除「${menu.tool.name}」`}
          </button>
        </div>
      )}
    </div>
  )
}
