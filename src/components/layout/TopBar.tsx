import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, Search, Sparkles, X } from 'lucide-react'
import { openAskAi } from '@/components/ai/askAi'
import { allNavItems, getNavItemByPath, homeItem, type NavItem } from './nav'

const TABS_KEY = 'opened-tabs'
const MAX_TABS = 20

function loadTabs(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(TABS_KEY) ?? '[]')
    if (Array.isArray(parsed)) {
      // 过滤掉已不存在的旧路径
      return parsed.filter(
        (path): path is string => typeof path === 'string' && !!getNavItemByPath(path),
      )
    }
  } catch {
    // 解析失败时按无标签页处理
  }
  return []
}

function persistTabs(paths: string[]) {
  try {
    localStorage.setItem(TABS_KEY, JSON.stringify(paths))
  } catch {
    // localStorage 不可用时仅影响记忆标签页
  }
}

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

export function TopBar() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const fullPath = pathname + search
  const [tabs, setTabs] = useState<string[]>(loadTabs)
  const [query, setQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchBoxRef = useRef<HTMLDivElement>(null)

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

  // 访问工具页时自动记录为标签页（含首次深链接加载）
  useEffect(() => {
    if (!getNavItemByPath(fullPath)) return
    setTabs((prev) => {
      if (prev.includes(fullPath)) return prev
      const next = [...prev, fullPath].slice(-MAX_TABS)
      persistTabs(next)
      return next
    })
  }, [fullPath])

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
    setTabs(next)
    persistTabs(next)
    // 关闭的是当前页时，优先激活右侧相邻标签，否则左侧，否则回首页
    if (path === fullPath) {
      navigate(next[index] ?? next[index - 1] ?? homeItem.path)
    }
  }

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
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-muted/40 px-4">
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

      <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {tabs.map((path) => {
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

      <button
        type="button"
        onClick={openAskAi}
        title="问 AI（Ctrl+Shift+K）"
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    </header>
  )
}
