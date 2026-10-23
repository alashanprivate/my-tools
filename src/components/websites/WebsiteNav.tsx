import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ExternalLink,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SiteFavicon } from '@/components/ui/SiteFavicon'
import { useToast } from '@/components/ui/useToast'
import { cn } from '@/lib/utils'
import {
  ALL_CATEGORY,
  WEBSITE_CATEGORIES,
  addCategory,
  createWebsite,
  getPresetWebsites,
  isCategoryInUse,
  loadCategories,
  loadWebsites,
  saveCategories,
  saveWebsites,
  type WebsiteItem,
} from '@/lib/websites'
import { isTauri } from '@/lib/environment'
import { openExternal } from '@/lib/websites/openExternal'

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-fuchsia-500',
]

/** 按名称散列取色，保证同一网站每次渲染颜色一致 */
function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface SiteContextMenu {
  site: WebsiteItem
  x: number
  y: number
}

function SiteTile({
  site,
  onOpen,
  onContextMenu,
}: {
  site: WebsiteItem
  onOpen: (site: WebsiteItem) => void
  onContextMenu: (menu: SiteContextMenu) => void
}) {
  const letter = site.name.trim().charAt(0).toUpperCase() || '?'
  const lastOpenAt = useRef(0)
  // 桌面端不加 target="_blank"：Tauri 会把新窗口请求转给系统浏览器，
  // 与下面的 shell 插件调用叠加导致一次点击开两个标签页
  const externalProps = isTauri() ? {} : { target: '_blank', rel: 'noopener noreferrer' }
  return (
    <div className="group flex w-16 flex-col items-center">
      <a
        href={site.url}
        {...externalProps}
        title={`${site.url}（右键管理）`}
        onClick={(event) => {
          // 浏览器环境交给原生 <a target="_blank">；桌面端 WebView 会拦截新窗口，走 shell 插件
          if (!isTauri()) return
          event.preventDefault()
          // 节流吸收双击，避免重复打开
          const now = Date.now()
          if (now - lastOpenAt.current < 600) return
          lastOpenAt.current = now
          onOpen(site)
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          onContextMenu({ site, x: event.clientX, y: event.clientY })
        }}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <SiteFavicon
          url={site.url}
          letter={letter}
          fallbackClassName={avatarColor(site.name)}
          className="h-11 w-11 rounded-lg text-base font-bold text-white shadow-sm transition-all group-hover:shadow-md"
        />
        <p className="mt-1.5 w-16 truncate text-center text-sm" title={site.name}>
          {site.name}
        </p>
      </a>
    </div>
  )
}

interface AddSiteDialogProps {
  /** 可选分类：内置分类 + 已创建的自定义分类 */
  categories: string[]
  defaultCategory: string
  onClose: () => void
  onAdd: (input: { name: string; url: string; category: string }) => string | null
}

function AddSiteDialog({ categories, defaultCategory, onClose, onAdd }: AddSiteDialogProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState(defaultCategory)
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const addError = onAdd({ name, url, category })
    if (addError) {
      setError(addError)
      return
    }
    onClose()
  }

  const categoryOptions = categories.map((item) => ({ value: item, label: item }))

  return (
    <Modal title="添加网站" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        <Input
          label="名称"
          placeholder="例如：GitHub"
          value={name}
          autoFocus
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
        />
        <Input
          label="网址"
          placeholder="例如：https://github.com（可省略 https://）"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value)
            setError('')
          }}
        />
        <Select
          label="分类"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value)
            setError('')
          }}
          options={categoryOptions}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit">添加</Button>
        </div>
      </form>
    </Modal>
  )
}

interface AddCategoryDialogProps {
  onClose: () => void
  onAdd: (name: string) => string | null
}

function AddCategoryDialog({ onClose, onAdd }: AddCategoryDialogProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const addError = onAdd(name)
    if (addError) {
      setError(addError)
      return
    }
    onClose()
  }

  return (
    <Modal title="添加分类" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        <Input
          label="分类名称"
          placeholder="例如：学习"
          value={name}
          autoFocus
          maxLength={20}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit">添加</Button>
        </div>
      </form>
    </Modal>
  )
}

interface ConfirmDialogProps {
  title: string
  message: string
  confirmText: string
  onConfirm: () => void
  onClose: () => void
}

function ConfirmDialog({ title, message, confirmText, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

/** 轻量弹窗壳：遮罩点击和 Esc 关闭 */
function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  )
}

interface MenuItem {
  label: string
  icon: LucideIcon
  danger?: boolean
  onSelect: () => void
}

interface MenuState {
  x: number
  y: number
  items: MenuItem[]
}

/** 右键菜单：定位在光标处，点击别处 / Esc / 窗口尺寸变化时关闭 */
function ContextMenu({ menu, onClose }: { menu: MenuState; onClose: () => void }) {
  useEffect(() => {
    const handleMouseDown = () => onClose()
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('resize', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('resize', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const MENU_WIDTH = 150
  const menuHeight = menu.items.length * 34 + 8
  const left = Math.max(4, Math.min(menu.x, window.innerWidth - MENU_WIDTH - 4))
  const top = Math.max(4, Math.min(menu.y, window.innerHeight - menuHeight - 4))

  return (
    <div
      className="fixed z-50 min-w-[150px] rounded-md border bg-popover p-1 shadow-lg"
      style={{ left, top }}
      onMouseDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {menu.items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            onClose()
            item.onSelect()
          }}
          className={cn(
            'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
            item.danger &&
              'text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10',
          )}
        >
          <item.icon className="h-3.5 w-3.5 shrink-0" />
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function WebsiteNav() {
  const [sites, setSites] = useState<WebsiteItem[]>([])
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<string>(ALL_CATEGORY)
  const [addSiteOpen, setAddSiteOpen] = useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<MenuState | null>(null)
  const { showToast } = useToast()

  // 挂载时异步加载（含一次性迁入 localStorage 旧数据）
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const loadedSites = await loadWebsites()
      const loadedCategories = await loadCategories(loadedSites)
      if (cancelled) return
      setSites(loadedSites)
      setCustomCategories(loadedCategories)
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (loaded) void saveWebsites(sites)
  }, [sites, loaded])

  useEffect(() => {
    if (loaded) void saveCategories(customCategories)
  }, [customCategories, loaded])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return sites.filter(
      (site) =>
        (category === ALL_CATEGORY || site.category === category) &&
        (!kw ||
          site.name.toLowerCase().includes(kw) ||
          site.url.toLowerCase().includes(kw)),
    )
  }, [sites, keyword, category])

  /** 标签栏与下拉用的分类：内置分类 + 用户创建的自定义分类 */
  const categories = useMemo(
    () => [...WEBSITE_CATEGORIES, ...customCategories],
    [customCategories],
  )

  // 当前选中的分类被删除后自动退回「全部」，避免出现无选中标签
  useEffect(() => {
    if (category !== ALL_CATEGORY && !categories.includes(category)) {
      setCategory(ALL_CATEGORY)
    }
  }, [categories, category])

  const handleAdd = (input: { name: string; url: string; category: string }): string | null => {
    const result = createWebsite(sites, input)
    if ('error' in result) return result.error
    setSites((prev) => [...prev, result])
    showToast(`已添加「${result.name}」`, 'success')
    return null
  }

  const handleAddCategory = (name: string): string | null => {
    const result = addCategory(customCategories, name)
    if ('error' in result) return result.error
    setCustomCategories(result.categories)
    showToast(`已添加分类「${name.trim()}」`, 'success')
    return null
  }

  const handleDeleteCategory = (name: string) => {
    if (isCategoryInUse(sites, name)) {
      showToast('该分类下仍有网站，请先移除', 'error')
      return
    }
    setCustomCategories((prev) => prev.filter((item) => item !== name))
    showToast(`已删除分类「${name}」`, 'info')
  }

  const handleDelete = (site: WebsiteItem) => {
    setSites((prev) => prev.filter((item) => item.id !== site.id))
    showToast(`已删除「${site.name}」`, 'info')
  }

  /** 打开网站：桌面端走 shell 插件，失败时提示 */
  const openSite = (site: WebsiteItem) => {
    void openExternal(site.url).then((opened) => {
      if (!opened) showToast('打开链接失败，请重启应用后重试', 'error')
    })
  }

  const handleSiteContextMenu = (menu: SiteContextMenu) => {
    setContextMenu({
      x: menu.x,
      y: menu.y,
      items: [
        { label: '打开网站', icon: ExternalLink, onSelect: () => openSite(menu.site) },
        {
          label: '删除网站',
          icon: Trash2,
          danger: true,
          onSelect: () => handleDelete(menu.site),
        },
      ],
    })
  }

  const handleRestore = () => {
    setSites(getPresetWebsites())
    showToast('已恢复预设网站', 'success')
  }

  if (!loaded) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="mt-24 text-center text-sm text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">网站导航</h1>
        <div className="relative min-w-52 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            aria-label="搜索网站"
            placeholder="搜索网站..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="ml-auto flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => setRestoreOpen(true)}>
            <RotateCcw className="h-4 w-4" />
            恢复预设
          </Button>
          <Button variant="outline" onClick={() => setAddCategoryOpen(true)}>
            <Tag className="h-4 w-4" />
            添加分类
          </Button>
          <Button onClick={() => setAddSiteOpen(true)}>
            <Plus className="h-4 w-4" />
            添加网站
          </Button>
        </div>
      </div>

      <div className="scrollbar-none mt-4 flex items-center gap-1 overflow-x-auto border-b pb-3">
        {[ALL_CATEGORY, ...categories].map((item) => {
          const isCustom = customCategories.includes(item)
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              onContextMenu={
                isCustom
                  ? (event) => {
                      event.preventDefault()
                      setContextMenu({
                        x: event.clientX,
                        y: event.clientY,
                        items: [
                          {
                            label: `删除分类「${item}」`,
                            icon: Trash2,
                            danger: true,
                            onSelect: () => handleDeleteCategory(item),
                          },
                        ],
                      })
                    }
                  : undefined
              }
              title={isCustom ? '右键可删除该分类' : undefined}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                category === item
                  ? 'bg-primary font-medium text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {item}
            </button>
          )
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-5">
          {filtered.map((site) => (
            <SiteTile
              key={site.id}
              site={site}
              onOpen={openSite}
              onContextMenu={handleSiteContextMenu}
            />
          ))}
        </div>
      ) : (
        <div className="mt-24 text-center text-sm text-muted-foreground">
          {keyword.trim()
            ? '没有匹配的网站'
            : category !== ALL_CATEGORY
              ? '该分类下暂无网站'
              : '暂无网站，点击右上角「添加网站」开始'}
        </div>
      )}

      {addSiteOpen && (
        <AddSiteDialog
          categories={categories}
          defaultCategory={
            category !== ALL_CATEGORY && categories.includes(category)
              ? category
              : WEBSITE_CATEGORIES[0]
          }
          onClose={() => setAddSiteOpen(false)}
          onAdd={handleAdd}
        />
      )}
      {addCategoryOpen && (
        <AddCategoryDialog
          onClose={() => setAddCategoryOpen(false)}
          onAdd={handleAddCategory}
        />
      )}
      {restoreOpen && (
        <ConfirmDialog
          title="恢复预设"
          message="将移除所有自定义网站并恢复为预设列表，确定继续吗？"
          confirmText="恢复预设"
          onConfirm={handleRestore}
          onClose={() => setRestoreOpen(false)}
        />
      )}
      {contextMenu && (
        <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
      )}
    </div>
  )
}
