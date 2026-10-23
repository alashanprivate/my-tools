import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Monitor, Moon, PinOff, Plus, Search, Sparkles, Sun, X } from 'lucide-react'
import { askAiPanel, useAskAiOpen } from '@/components/ai/askAi'
import { SiteFavicon } from '@/components/ui/SiteFavicon'
import type { AiChatTool } from '@/lib/aiChat'
import { setChatEntryPinned, useAiEntries } from '@/lib/aiChat/entries'
import { importLegacyJson, openJsonStore } from '@/lib/storage'
import { getThemeMode, setThemeMode, subscribeTheme, type ThemeMode } from '@/lib/theme'
import { allNavItems, getNavItemByPath, homeItem, type NavItem } from './nav'
import { WindowControls } from './WindowControls'

const TABS_STORE_FILE = 'opened-tabs'
const TABS_STORE_KEY = 'tabs'
/** localStorage 时代的历史 key（一次性迁入 store 后删除） */
const LEGACY_TABS_KEY = 'opened-tabs'
const MAX_TABS = 20

/** 读取标签页：一次性迁入 localStorage 旧数据，并过滤掉已不存在的旧路径 */
async function loadTabs(): Promise<string[]> {
  const store = await openJsonStore(TABS_STORE_FILE)
  await importLegacyJson(store, LEGACY_TABS_KEY, TABS_STORE_KEY)
  const parsed = await store.get<unknown>(TABS_STORE_KEY)
  if (Array.isArray(parsed)) {
    return parsed.filter(
      (path): path is string => typeof path === 'string' && !!getNavItemByPath(path),
    )
  }
  return []
}

async function persistTabs(paths: string[]) {
  try {
    const store = await openJsonStore(TABS_STORE_FILE)
    await store.set(TABS_STORE_KEY, paths)
  } catch {
    // 存储不可用时仅影响记忆标签页
  }
}

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

const THEME_LABELS: Record<ThemeMode, string> = { light: '浅色', dark: '深色', system: '跟随系统' }
/** 循环顺序：浅色 → 深色 → 跟随系统 */
const NEXT_THEME: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'system', system: 'light' }
const THEME_ICONS: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }

export function TopBar() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const fullPath = pathname + search
  const [tabs, setTabs] = useState<string[]>([])
  const [tabsLoaded, setTabsLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [pinMenu, setPinMenu] = useState<{ tool: AiChatTool; x: number; y: number } | null>(null)
  const pinMenuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const themeMode = useSyncExternalStore(subscribeTheme, getThemeMode)
  const askAiOpen = useAskAiOpen()
  const { tools: aiTools } = useAiEntries()
  const pinnedChats = aiTools.filter((tool) => tool.pinned)
  const nextThemeMode = NEXT_THEME[themeMode]
  const ThemeIcon = THEME_ICONS[themeMode]

  const keyword = query.trim().toLowerCase()
  const results: NavItem[] = keyword
    ? allNavItems
        .filter(
          (item) =>
            item.title.toLowerCase().includes(keyword) ||
            item.description.toLowerCase().includes(keyword),
        )
        .slice(0, 8)
    : []

  // 挂载时异步加载已记忆的标签页
  useEffect(() => {
    let cancelled = false
    void loadTabs().then((loaded) => {
      if (cancelled) return
      setTabs(loaded)
      setTabsLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 访问工具页时自动记录为标签页（含首次深链接加载）；加载完成前不写入，避免空列表覆盖
  useEffect(() => {
    if (!tabsLoaded || !getNavItemByPath(fullPath)) return
    setTabs((prev) => (prev.includes(fullPath) ? prev : [...prev, fullPath].slice(-MAX_TABS)))
  }, [fullPath, tabsLoaded])

  // 标签页变化时持久化
  useEffect(() => {
    if (tabsLoaded) void persistTabs(tabs)
  }, [tabs, tabsLoaded])

  // Ctrl/Cmd+K 全局聚焦搜索框
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const openTool = (item: NavItem) => {
    navigate(item.path)
    setQuery('')
    setDropdownOpen(false)
    setHighlightIndex(0)
    inputRef.current?.blur()
  }

  const closeTab = (path: string) => {
    const index = tabs.indexOf(path)
    if (index === -1) return
    const next = tabs.filter((tab) => tab !== path)
    setTabs(next) // 持久化由统一 effect 处理
    // 关闭的是当前页时，优先激活右侧相邻标签，否则左侧，否则回首页
    if (path === fullPath) {
      navigate(next[index] ?? next[index - 1] ?? homeItem.path)
    }
  }

  /** 取消固定 AI 对话；正在查看该对话时退回入口列表 */
  const unpinChat = (tool: AiChatTool) => {
    void setChatEntryPinned(tool.id, false)
    setPinMenu(null)
    if (fullPath === `/ai-chat/${tool.id}`) {
      navigate('/ai-chat')
    }
  }

  // 固定图标右键菜单：点击菜单外或按 Esc 时关闭（菜单内的点击不关闭，保证菜单项可点）
  useEffect(() => {
    if (!pinMenu) return
    const handleMouseDown = (event: globalThis.MouseEvent) => {
      if (pinMenuRef.current?.contains(event.target as Node)) return
      setPinMenu(null)
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setPinMenu(null)
    }
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pinMenu])

  const handleSearchBlur = (event: FocusEvent<HTMLDivElement>) => {
    // 焦点仍在搜索框区域内（如点击结果项）时不收起
    if (searchBoxRef.current?.contains(event.relatedTarget)) return
    setDropdownOpen(false)
  }

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      const item = results[highlightIndex]
      if (item) openTool(item)
    } else if (event.key === 'Escape') {
      setDropdownOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <header
      data-tauri-drag-region
      className="flex h-14 shrink-0 items-center gap-3 border-b bg-muted/40 pl-4"
    >
      <div
        ref={searchBoxRef}
        className="relative w-64 shrink-0"
        onBlur={handleSearchBlur}
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          aria-label="搜索工具"
          placeholder="搜索工具"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setDropdownOpen(event.target.value.trim() !== '')
            setHighlightIndex(0)
          }}
          onFocus={() => {
            if (query.trim() !== '') setDropdownOpen(true)
          }}
          onBlur={handleSearchBlur}
          onKeyDown={handleSearchKeyDown}
          className="h-8 w-full rounded-md border bg-background pl-8 pr-14 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>

        {dropdownOpen && results.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-1 w-96 rounded-md border bg-popover p-1 shadow-md">
            {results.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => openTool(item)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                    index === highlightIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="shrink-0 font-medium">{item.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div
        data-tauri-drag-region
        className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
      >
        {tabsLoaded &&
          tabs.map((path) => {
          const item = getNavItemByPath(path)
          if (!item) return null
          const active = path === fullPath
          return (
            <div
              key={path}
              className={`group flex shrink-0 items-center gap-1 rounded-md border py-1 pl-2.5 pr-1 text-sm transition-colors ${
                active
                  ? 'border-border bg-background font-medium'
                  : 'border-transparent text-muted-foreground hover:bg-accent'
              }`}
            >
              <Link to={path} className="max-w-40 truncate">
                {item.title}
              </Link>
              <button
                type="button"
                onClick={() => closeTab(path)}
                title="关闭标签页"
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>

      {/* 固定的 AI 对话：靠右侧仅显示图标，右键取消固定 */}
      {pinnedChats.length > 0 && (
        <div className="flex shrink-0 items-center gap-1 border-l pl-2">
          {pinnedChats.map((tool) => {
            const target = `/ai-chat/${tool.id}`
            const active = fullPath === target
            const letter = tool.name.trim().charAt(0).toUpperCase() || '?'
            return (
              <Link
                key={tool.id}
                to={target}
                title={`${tool.name}（已固定，右键可取消）`}
                aria-current={active ? 'page' : undefined}
                onContextMenu={(event) => {
                  event.preventDefault()
                  setPinMenu({ tool, x: event.clientX, y: event.clientY })
                }}
                className={`rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? 'bg-primary/10' : 'hover:bg-accent'
                }`}
              >
                <SiteFavicon
                  url={tool.url}
                  letter={letter}
                  dataUrl={tool.logo}
                  fallbackClassName={tool.color}
                  className="h-6 w-6 rounded-md text-xs font-bold text-white"
                />
              </Link>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => askAiPanel.toggle()}
        title="问 AI（Ctrl+Shift+K）"
        aria-pressed={askAiOpen}
        className={`shrink-0 rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          askAiOpen
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}
      >
        <Sparkles className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => navigate(homeItem.path)}
        title="新建标签页（回到首页）"
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => void setThemeMode(nextThemeMode)}
        title={`主题：${THEME_LABELS[themeMode]}，点击切换为${THEME_LABELS[nextThemeMode]}`}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ThemeIcon className="h-4 w-4" />
      </button>

      <WindowControls />

      {pinMenu && (
        <div
          ref={pinMenuRef}
          role="menu"
          className="fixed z-50 min-w-[120px] rounded-md border bg-popover p-1 shadow-lg"
          style={{
            left: Math.min(pinMenu.x, window.innerWidth - 140),
            top: Math.min(pinMenu.y, window.innerHeight - 60),
          }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => unpinChat(pinMenu.tool)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PinOff className="h-3.5 w-3.5" />
            取消固定
          </button>
        </div>
      )}
    </header>
  )
}
