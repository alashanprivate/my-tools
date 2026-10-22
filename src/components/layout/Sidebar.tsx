import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  Code2,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
} from 'lucide-react'
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

const COLLAPSED_KEY = 'sidebar-collapsed'
const SECTIONS_KEY = 'sidebar-collapsed-sections'

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

/** 已折叠分区的 key 列表（一级分区用 toolsSection.key，二级分组用 label） */
function getInitialCollapsedSections(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SECTIONS_KEY) ?? '[]')
    if (Array.isArray(parsed)) {
      return parsed.filter((k): k is string => typeof k === 'string')
    }
  } catch {
    // 解析失败时按全部展开处理
  }
  return []
}

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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)
  const [collapsedSections, setCollapsedSections] = useState(getInitialCollapsedSections)
  const { pathname, search } = useLocation()
  const activeItem = allNavItems.find((item) => isNavItemActive(item, pathname, search))

  // 保证活动工具所在的一级/二级分区处于展开状态（挂载和路由切换时生效；
  // 之后手动折叠当前分组不会被立即顶开，直到下次切换路由）
  useEffect(() => {
    if (!activeItem) return
    const groupLabel = navGroups.find((group) =>
      group.items.some((item) => item.path === activeItem.path),
    )?.label
    const keys = [toolsSection.key, groupLabel].filter((key): key is string => Boolean(key))
    setCollapsedSections((prev) => {
      const missing = keys.filter((key) => prev.includes(key))
      if (missing.length === 0) return prev
      const next = prev.filter((key) => !missing.includes(key))
      try {
        localStorage.setItem(SECTIONS_KEY, JSON.stringify(next))
      } catch {
        // localStorage 不可用时仅影响记忆折叠状态
      }
      return next
    })
  }, [activeItem])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(COLLAPSED_KEY, String(next))
      } catch {
        // localStorage 不可用时仅影响记忆折叠状态
      }
      return next
    })
  }

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
      try {
        localStorage.setItem(SECTIONS_KEY, JSON.stringify(next))
      } catch {
        // localStorage 不可用时仅影响记忆折叠状态
      }
      return next
    })
  }

  const toolsOpen = !collapsedSections.includes(toolsSection.key)

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r bg-muted/40 transition-[width] duration-200 ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      <div className="flex h-14 shrink-0 items-center border-b px-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg" title="My-tools">
          <Code2 className="h-6 w-6 shrink-0" />
          {!collapsed && <span>My-tools</span>}
        </Link>
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
              active={isNavItemActive(aiChatNavItem, pathname, search)}
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
              active={isNavItemActive(aiChatNavItem, pathname, search)}
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
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? '展开菜单' : '收起菜单'}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? (
            <PanelLeftOpen className="mx-auto h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
