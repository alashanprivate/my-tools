import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, Settings, Wrench } from 'lucide-react'
import { importLegacyJson, openJsonStore } from '@/lib/storage'
import type { JsonStore } from '@/lib/storage'
import {
  allNavItems,
  aiChatNavItem,
  homeItem,
  isNavItemActive,
  navGroups,
  toolsSection,
  websiteNavItem,
  type NavItem,
} from './nav'

/** 存储文件与键；LEGACY_* 为 localStorage 时代的历史 key（一次性迁入后删除） */
const STORE_FILE = 'sidebar-ui'
const COLLAPSED_KEY = 'collapsed'
const SECTIONS_KEY = 'collapsedSections'
const LEGACY_COLLAPSED_KEY = 'sidebar-collapsed'
const LEGACY_SECTIONS_KEY = 'sidebar-collapsed-sections'

function SidebarLink({
  item,
  active,
  variant,
}: {
  item: NavItem
  active: boolean
  variant: 'rail' | 'top' | 'sub'
}) {
  const Icon = item.icon
  const isRail = variant === 'rail'
  return (
    <Link
      to={item.path}
      title={isRail ? item.title : undefined}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-md py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        variant === 'sub' ? 'pl-12 pr-3' : 'px-3'
      } ${isRail ? 'justify-center px-0' : ''} ${
        active
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isRail && <span className="truncate">{item.title}</span>}
    </Link>
  )
}

function SectionChevron({ open }: { open: boolean }) {
  const Icon = open ? ChevronDown : ChevronRight
  return <Icon className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
}

/** 活动工具所在的一级分区和二级分组 key（一级用 toolsSection.key，二级用分组 label） */
function activeExpandedKeys(activeItem: NavItem | undefined): string[] {
  if (!activeItem) return []
  const groupLabel = navGroups.find((group) =>
    group.items.some((item) => item.path === activeItem.path),
  )?.label
  return [toolsSection.key, groupLabel].filter((key): key is string => Boolean(key))
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<string[]>([])
  const storeRef = useRef<JsonStore | null>(null)
  const { pathname, search } = useLocation()
  const activeItem = allNavItems.find((item) => isNavItemActive(item, pathname, search))
  const settingsActive = pathname.startsWith('/settings')
  // AI 对话内嵌页（/ai-chat/:id）激活时左侧菜单自动收起，给聊天页让出功能区
  const chatEmbedActive = /^\/ai-chat\/.+/.test(pathname)
  // 初值固定为 false：深链接直接落在内嵌页时也要触发一次自动收起
  const enteringChatEmbedRef = useRef(false)

  const persistCollapsed = (next: boolean) => {
    void storeRef.current?.set(COLLAPSED_KEY, next).catch(() => {
      // 存储不可用时仅影响记忆折叠状态
    })
  }
  const persistSections = (next: string[]) => {
    void storeRef.current?.set(SECTIONS_KEY, next).catch(() => {
      // 存储不可用时仅影响记忆折叠状态
    })
  }

  // 挂载时打开存储、迁入 localStorage 旧数据并恢复折叠状态（仅执行一次）
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    let cancelled = false
    void (async () => {
      const store = await openJsonStore(STORE_FILE)
      await importLegacyJson(store, LEGACY_COLLAPSED_KEY, COLLAPSED_KEY)
      await importLegacyJson(store, LEGACY_SECTIONS_KEY, SECTIONS_KEY)
      const storedCollapsed = await store.get<boolean>(COLLAPSED_KEY)
      const storedSections = await store.get<unknown>(SECTIONS_KEY)
      if (cancelled) return
      storeRef.current = store
      // 深链接直接进入内嵌对话时跳过恢复，保持自动收起状态
      if (typeof storedCollapsed === 'boolean' && !chatEmbedActive) setCollapsed(storedCollapsed)
      if (Array.isArray(storedSections)) {
        const valid = storedSections.filter((k): k is string => typeof k === 'string')
        // 活动工具所在分区保持展开（与路由切换时的自动展开一致）
        const activeKeys = activeExpandedKeys(activeItem)
        setCollapsedSections(valid.filter((key) => !activeKeys.includes(key)))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeItem, chatEmbedActive])

  // 进入内嵌对话时自动收起菜单（仅收起不记忆，离开后不恢复、由用户自行展开）
  useEffect(() => {
    if (chatEmbedActive && !enteringChatEmbedRef.current) setCollapsed(true)
    enteringChatEmbedRef.current = chatEmbedActive
  }, [chatEmbedActive])

  // 保证活动工具所在的一级/二级分区处于展开状态（挂载和路由切换时生效；
  // 之后手动折叠当前分组不会被立即顶开，直到下次切换路由）
  useEffect(() => {
    if (!activeItem) return
    const keys = activeExpandedKeys(activeItem)
    setCollapsedSections((prev) => {
      const missing = keys.filter((key) => prev.includes(key))
      if (missing.length === 0) return prev
      const next = prev.filter((key) => !missing.includes(key))
      persistSections(next)
      return next
    })
  }, [activeItem])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      persistCollapsed(next)
      return next
    })
  }

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      persistSections(next)
      return next
    })
  }

  const toolsOpen = !collapsedSections.includes(toolsSection.key)
  // 侧边栏上的「AI 对话」入口在列表页和内嵌页都视为激活
  const aiChatActive = pathname.startsWith('/ai-chat')

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r bg-muted/40 ${
        collapsed ? 'w-14' : 'w-60'
      } ${chatEmbedActive ? '' : 'transition-[width] duration-200'}`}
    >
      <div data-tauri-drag-region className="flex h-14 shrink-0 items-center border-b px-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? '展开菜单' : '收起菜单'}
          className="flex items-center gap-2 rounded-md font-bold text-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={`${import.meta.env.BASE_URL}favicon-32x32.png`}
            alt=""
            className="h-6 w-6 shrink-0"
          />
          {!collapsed && <span>My-tools</span>}
        </button>
      </div>

      <nav className="scrollbar-none flex-1 overflow-y-auto px-2 py-3">
        {collapsed ? (
          <div className="space-y-0.5">
            <SidebarLink
              item={homeItem}
              variant="rail"
              active={isNavItemActive(homeItem, pathname, search)}
            />
            <SidebarLink
              item={websiteNavItem}
              variant="rail"
              active={isNavItemActive(websiteNavItem, pathname, search)}
            />
            <SidebarLink
              item={aiChatNavItem}
              variant="rail"
              active={aiChatActive}
            />
            {allNavItems.map((item) => (
              <SidebarLink
                key={item.path}
                item={item}
                variant="rail"
                active={isNavItemActive(item, pathname, search)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            <SidebarLink
              item={homeItem}
              variant="top"
              active={isNavItemActive(homeItem, pathname, search)}
            />
            <SidebarLink
              item={websiteNavItem}
              variant="top"
              active={isNavItemActive(websiteNavItem, pathname, search)}
            />
            <SidebarLink
              item={aiChatNavItem}
              variant="top"
              active={aiChatActive}
            />

            <button
              type="button"
              onClick={() => toggleSection(toolsSection.key)}
              aria-expanded={toolsOpen}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Wrench className="h-4 w-4 shrink-0" />
              <span className="truncate">{toolsSection.title}</span>
              <SectionChevron open={toolsOpen} />
            </button>

            {toolsOpen && (
              <div className="space-y-3 pb-2">
                {navGroups.map((group) => {
                  const groupOpen = !collapsedSections.includes(group.label)
                  return (
                    <div key={group.label}>
                      <button
                        type="button"
                        onClick={() => toggleSection(group.label)}
                        aria-expanded={groupOpen}
                        className="flex w-full items-center gap-2 rounded-md py-1.5 pl-8 pr-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="truncate">{group.label}</span>
                        <SectionChevron open={groupOpen} />
                      </button>
                      {groupOpen && (
                        <div className="space-y-0.5">
                          {group.items.map((item) => (
                            <SidebarLink
                              key={item.path}
                              item={item}
                              variant="sub"
                              active={isNavItemActive(item, pathname, search)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t p-2">
        <Link
          to="/settings"
          title="设置"
          aria-current={settingsActive ? 'page' : undefined}
          className={`flex w-full items-center gap-3 rounded-md py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            collapsed ? 'justify-center px-0' : 'px-3'
          } ${
            settingsActive
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>设置</span>}
        </Link>
      </div>
    </aside>
  )
}
