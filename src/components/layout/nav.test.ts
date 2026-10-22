import { describe, expect, it } from 'vitest'
import {
  allNavItems,
  getNavItemByPath,
  homeItem,
  isNavItemActive,
  toolsSection,
  websiteNavItem,
} from './nav'

const topNavItems = [...allNavItems, homeItem, websiteNavItem]

const findItem = (path: string) => {
  const item = topNavItems.find((i) => i.path === path)
  if (!item) throw new Error(`导航配置中不存在路径 ${path}`)
  return item
}

describe('nav 配置', () => {
  it('每个导航项的路径唯一', () => {
    const paths = topNavItems.map((item) => item.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('导航项不与首页路径重复', () => {
    expect(allNavItems.some((item) => item.path === homeItem.path)).toBe(false)
    expect(websiteNavItem.path).not.toBe(homeItem.path)
  })

  it('二级分组标签唯一（用作折叠状态的存储键）', () => {
    const labels = toolsSection.groups.map((group) => group.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('getNavItemByPath 能解析全部工具项，未知路径返回 undefined', () => {
    for (const item of allNavItems) {
      expect(getNavItemByPath(item.path)?.title).toBe(item.title)
    }
    expect(getNavItemByPath('/unknown')).toBeUndefined()
    expect(getNavItemByPath('/')).toBeUndefined()
    // 网站导航是入口页，与首页一样不进标签页
    expect(getNavItemByPath(websiteNavItem.path)).toBeUndefined()
  })
})

describe('isNavItemActive', () => {
  it('普通路径按 pathname 精确匹配', () => {
    const item = findItem('/json')
    expect(isNavItemActive(item, '/json', '')).toBe(true)
    expect(isNavItemActive(item, '/jsonx', '')).toBe(false)
    expect(isNavItemActive(item, '/', '')).toBe(false)
  })

  it('首页仅在根路径高亮', () => {
    const home = findItem('/')
    expect(isNavItemActive(home, '/', '')).toBe(true)
    expect(isNavItemActive(home, '/json', '')).toBe(false)
  })

  it('带 tab 的路径要求当前 tab 参数一致', () => {
    const base64 = findItem('/crypto?tab=base64')
    const hash = findItem('/crypto?tab=hash')
    expect(isNavItemActive(base64, '/crypto', '?tab=base64')).toBe(true)
    expect(isNavItemActive(base64, '/crypto', '?tab=hash')).toBe(false)
    expect(isNavItemActive(hash, '/crypto', '?tab=hash')).toBe(true)
  })

  it('访问 /crypto 不带 tab 参数时加密分组不高亮', () => {
    const base64 = findItem('/crypto?tab=base64')
    expect(isNavItemActive(base64, '/crypto', '')).toBe(false)
  })
})
