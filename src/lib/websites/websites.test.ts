import { describe, expect, it, beforeEach } from 'vitest'
import {
  WEBSITE_CATEGORIES,
  addCategory,
  createWebsite,
  getCustomCategories,
  getPresetWebsites,
  isCategoryInUse,
  isDuplicateUrl,
  loadCategories,
  loadWebsites,
  normalizeUrl,
  saveCategories,
  saveWebsites,
  type WebsiteItem,
} from './index'

/** 门面的浏览器降级实现走 localStorage 命名空间；legacy 键为迁移通道入口 */
const LEGACY_SITES_KEY = 'website-nav-sites'
const LEGACY_CATEGORIES_KEY = 'website-nav-custom-categories'

beforeEach(() => {
  localStorage.clear()
})

describe('normalizeUrl', () => {
  it('为缺协议的网址补全 https://', () => {
    expect(normalizeUrl('github.com')).toBe('https://github.com/')
    expect(normalizeUrl('  www.zhihu.com  ')).toBe('https://www.zhihu.com/')
  })

  it('保留已有的 http/https 协议', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/')
    expect(normalizeUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1')
  })

  it('拒绝空值、非法值和非 http(s) 协议', () => {
    expect(normalizeUrl('')).toBeNull()
    expect(normalizeUrl('   ')).toBeNull()
    expect(normalizeUrl('not a url')).toBeNull()
    expect(normalizeUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeUrl('ftp://example.com')).toBeNull()
    // 没有域名分隔点的输入不像站点地址（含中文裸词被当作 IDN 主机名的情况）
    expect(normalizeUrl('不是网址')).toBeNull()
  })

  it('本机地址缺协议时补 http://，其余补 https://', () => {
    expect(normalizeUrl('localhost:3000')).toBe('http://localhost:3000/')
    expect(normalizeUrl('127.0.0.1:8080/api')).toBe('http://127.0.0.1:8080/api')
    expect(normalizeUrl('github.com')).toBe('https://github.com/')
  })

  it('接受 localhost 和 IPv6 回环地址', () => {
    expect(normalizeUrl('http://localhost')).toBe('http://localhost/')
    expect(normalizeUrl('http://[::1]:8080')).toBe('http://[::1]:8080/')
  })
})

describe('预设与存储', () => {
  it('预设网站字段完整、分类合法、网址可用', () => {
    const presets = getPresetWebsites()
    expect(presets.length).toBeGreaterThan(0)
    for (const site of presets) {
      expect(site.id).toMatch(/^preset-/)
      expect(site.name.trim()).not.toBe('')
      expect(WEBSITE_CATEGORIES).toContain(site.category as never)
      // 预设网址必须是可解析的有效站点（normalizeUrl 幂等）
      expect(normalizeUrl(site.url)).toBeTruthy()
      expect(normalizeUrl(site.url)).toBe(normalizeUrl(normalizeUrl(site.url)!))
    }
    // 每个分类下都有预设
    for (const category of WEBSITE_CATEGORIES) {
      expect(presets.some((site) => site.category === category)).toBe(true)
    }
  })

  it('无存储记录时 loadWebsites 返回预设', async () => {
    expect(await loadWebsites()).toEqual(getPresetWebsites())
  })

  it('保存后能读回相同数据，损坏数据返回预设', async () => {
    const items: WebsiteItem[] = [
      { id: 'a1', name: '示例', url: 'https://example.com', category: '工具' },
    ]
    await saveWebsites(items)
    expect(await loadWebsites()).toEqual(items)

    // 模拟 store 数据损坏：直接写坏命名空间键
    localStorage.setItem('json-store:websites.json#sites', '{broken json')
    expect(await loadWebsites()).toEqual(getPresetWebsites())

    localStorage.setItem('json-store:websites.json#sites', '[{"id":"x"}]')
    expect(await loadWebsites()).toEqual([])

    // 显式空数组视为用户清空，不回退预设
    await saveWebsites([])
    expect(await loadWebsites()).toEqual([])
  })

  it('localStorage 旧数据自动迁入 store 并删除旧键', async () => {
    const legacy: WebsiteItem[] = [
      { id: 'a1', name: '示例', url: 'https://example.com', category: '工具' },
    ]
    localStorage.setItem(LEGACY_SITES_KEY, JSON.stringify(legacy))
    expect(await loadWebsites()).toEqual(legacy)
    expect(localStorage.getItem(LEGACY_SITES_KEY)).toBeNull()
  })

  it('保留自定义分类的存储项，只过滤缺字段或空分类的项', async () => {
    localStorage.setItem(
      LEGACY_SITES_KEY,
      JSON.stringify([
        { id: 'ok', name: '内置', url: 'https://a.com', category: 'AI' },
        { id: 'custom', name: '自定义', url: 'https://b.com', category: '学术' },
        { id: 'empty', name: '空分类', url: 'https://c.com', category: '  ' },
        { id: 'missing', name: '缺分类', url: 'https://d.com' },
      ]),
    )
    expect((await loadWebsites()).map((item) => item.id)).toEqual(['ok', 'custom'])
  })
})

describe('自定义分类', () => {
  it('getCustomCategories 按首次出现顺序提取，去重且不含内置分类', () => {
    const items: WebsiteItem[] = [
      { id: '1', name: 'A', url: 'https://a.com', category: '学习' },
      { id: '2', name: 'B', url: 'https://b.com', category: 'AI' },
      { id: '3', name: 'C', url: 'https://c.com', category: '学习' },
      { id: '4', name: 'D', url: 'https://d.com', category: '资讯' },
    ]
    expect(getCustomCategories(items)).toEqual(['学习', '资讯'])
    expect(getCustomCategories([])).toEqual([])
  })

  it('createWebsite 支持自定义分类，校验空分类和超长分类', () => {
    const result = createWebsite([], { name: 'X', url: 'x.com', category: ' 学习 ' })
    expect(result).toMatchObject({ category: '学习' })

    expect(createWebsite([], { name: 'X', url: 'x.com', category: '   ' })).toEqual({
      error: '请选择或输入分类',
    })
    expect(createWebsite([], { name: 'X', url: 'x.com', category: 'a'.repeat(21) })).toEqual({
      error: '分类名不能超过 20 个字符',
    })
  })
})

describe('独立分类管理', () => {
  const sites: WebsiteItem[] = [
    { id: '1', name: 'A', url: 'https://a.com', category: 'AI' },
    { id: '2', name: 'B', url: 'https://b.com', category: '学习' },
  ]

  it('addCategory 校验空值、超长和重复（含内置分类）', () => {
    expect(addCategory([], '  ')).toEqual({ error: '请输入分类名称' })
    expect(addCategory([], 'a'.repeat(21))).toEqual({ error: '分类名不能超过 20 个字符' })
    expect(addCategory([], 'AI')).toEqual({ error: '该分类已存在' })
    expect(addCategory(['学习'], '学习')).toEqual({ error: '该分类已存在' })
  })

  it('addCategory 成功时去除首尾空格并追加到末尾', () => {
    expect(addCategory(['学习'], ' 资讯 ')).toEqual({ categories: ['学习', '资讯'] })
  })

  it('isCategoryInUse 判断分类是否被站点引用', () => {
    expect(isCategoryInUse(sites, 'AI')).toBe(true)
    expect(isCategoryInUse(sites, '资讯')).toBe(false)
  })

  it('loadCategories 合并已存储分类与站点中出现的历史分类并去重', async () => {
    localStorage.setItem(LEGACY_CATEGORIES_KEY, JSON.stringify(['学习', '资讯']))
    // 站点里的「学习」已登记，「学术」是历史遗留的自定义分类（非内置），需合并进来
    expect(await loadCategories([{ ...sites[1], category: '学术' }])).toEqual([
      '学习',
      '资讯',
      '学术',
    ])
  })

  it('损坏的旧数据迁入时被清除且不抛错，仅保留站点派生部分', async () => {
    localStorage.setItem(LEGACY_CATEGORIES_KEY, '{broken')
    expect(await loadCategories([])).toEqual([])
    expect(localStorage.getItem(LEGACY_CATEGORIES_KEY)).toBeNull()
  })

  it('saveCategories 保存后 loadCategories 可读回', async () => {
    await saveCategories(['学习'])
    expect(await loadCategories([])).toEqual(['学习'])
  })
})

describe('createWebsite 与 isDuplicateUrl', () => {
  const items: WebsiteItem[] = [{ id: 'a1', name: 'GitHub', url: 'https://github.com/', category: '开发' }]

  it('创建时校验名称、网址和重复项', () => {
    expect(createWebsite(items, { name: '  ', url: 'a.com', category: 'AI' })).toEqual({
      error: '请输入网站名称',
    })
    expect(createWebsite(items, { name: '坏网址', url: '不是网址', category: 'AI' })).toEqual({
      error: '网址格式不正确',
    })
    expect(createWebsite(items, { name: '重复', url: 'github.com', category: 'AI' })).toEqual({
      error: '该网址已存在',
    })
  })

  it('创建成功时规范化网址并补全 id', () => {
    const result = createWebsite(items, { name: ' 示例 ', url: 'example.com', category: 'AI' })
    expect(result).toMatchObject({ name: '示例', url: 'https://example.com/', category: 'AI' })
    expect((result as WebsiteItem).id).toBeTruthy()
  })

  it('isDuplicateUrl 按规范化地址比较', () => {
    expect(isDuplicateUrl(items, 'https://github.com')).toBe(true)
    expect(isDuplicateUrl(items, 'github.com')).toBe(true)
    expect(isDuplicateUrl(items, 'https://gitlab.com')).toBe(false)
  })
})
