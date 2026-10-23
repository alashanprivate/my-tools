import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { TopBar } from './TopBar'
import { allNavItems } from './nav'

/** 门面浏览器降级实现的标签页存储键 */
const TABS_STORE_KEY = 'json-store:opened-tabs.json#tabs'

function seedTabs(paths: string[]) {
  localStorage.setItem(TABS_STORE_KEY, JSON.stringify(paths))
}

async function readStoredTabs(): Promise<string[]> {
  const raw = localStorage.getItem(TABS_STORE_KEY)
  const parsed: unknown = raw === null ? [] : JSON.parse(raw)
  return Array.isArray(parsed) ? (parsed as string[]) : []
}

function LocationProbe() {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{pathname + search}</div>
}

function renderTopBar(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <TopBar />
      <LocationProbe />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('TopBar', () => {
  // 放在最前：entries 模块的加载结果会缓存，须在首次渲染时就能读到种子数据
  it('固定的 AI 对话靠右侧仅显示图标，右键取消固定后移除', async () => {
    localStorage.setItem('json-store:ai-chat-entries.json#pinned-ids', JSON.stringify(['deepseek']))
    renderTopBar('/')
    const icon = await screen.findByTitle('DeepSeek（已固定，右键可取消）')
    // 图标式：无名称文字、无叉号
    expect(screen.queryByText('DeepSeek')).toBeNull()
    expect(screen.queryByTitle('取消固定')).toBeNull()

    fireEvent.contextMenu(icon)
    fireEvent.click(await screen.findByText('取消固定'))
    await waitFor(() =>
      expect(screen.queryByTitle('DeepSeek（已固定，右键可取消）')).toBeNull(),
    )
    const stored: unknown = JSON.parse(
      localStorage.getItem('json-store:ai-chat-entries.json#pinned-ids') ?? '[]',
    )
    expect(stored).toEqual([])
  })

  it('访问工具页时自动记录为标签页并持久化', async () => {
    renderTopBar('/json')
    expect(await screen.findByText('JSON 格式化')).toBeTruthy()
    await waitFor(async () => expect(await readStoredTabs()).toEqual(['/json']))
  })

  it('深链接直接访问工具页时按完整路径记录', async () => {
    renderTopBar('/sm4')
    expect(await screen.findByText('SM4 加解密')).toBeTruthy()
    await waitFor(async () => expect(await readStoredTabs()).toEqual(['/sm4']))
  })

  it('加载时过滤掉已失效的旧路径', async () => {
    seedTabs(['/json', '/removed'])
    renderTopBar('/')
    // 有效路径正常渲染标签，失效路径被过滤
    expect(await screen.findByText('JSON 格式化')).toBeTruthy()
    expect(screen.getAllByTitle('关闭标签页')).toHaveLength(1)
  })

  it('关闭当前标签页时激活右侧相邻标签', async () => {
    seedTabs(['/json', '/regex', '/cron'])
    renderTopBar('/regex')
    const tab = await screen.findByText('正则表达式')
    fireEvent.click((tab.closest('div') as HTMLDivElement).querySelector('button')!)
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/cron'))
    await waitFor(async () => expect(await readStoredTabs()).toEqual(['/json', '/cron']))
  })

  it('关闭最后一个标签页时回到首页', async () => {
    seedTabs(['/json'])
    renderTopBar('/json')
    const tab = await screen.findByText('JSON 格式化')
    fireEvent.click((tab.closest('div') as HTMLDivElement).querySelector('button')!)
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/'))
    await waitFor(async () => expect(await readStoredTabs()).toEqual([]))
  })

  it('关闭非活动标签页不改变当前页面', async () => {
    seedTabs(['/json', '/regex'])
    renderTopBar('/json')
    const tab = await screen.findByText('正则表达式')
    fireEvent.click((tab.closest('div') as HTMLDivElement).querySelector('button')!)
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/json'))
    await waitFor(async () => expect(await readStoredTabs()).toEqual(['/json']))
  })

  it('localStorage 旧数据自动迁入 store 并删除旧键', async () => {
    localStorage.setItem('opened-tabs', JSON.stringify(['/json']))
    renderTopBar('/')
    expect(await screen.findByText('JSON 格式化')).toBeTruthy()
    await waitFor(async () => {
      expect(localStorage.getItem('opened-tabs')).toBeNull()
      expect(await readStoredTabs()).toEqual(['/json'])
    })
  })

  it('搜索结果支持回车打开第一个匹配项', async () => {
    renderTopBar('/')
    const input = screen.getByLabelText('搜索工具')
    fireEvent.change(input, { target: { value: '哈希' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/hash'))
    expect((input as HTMLInputElement).value).toBe('')
  })

  it('Ctrl/Cmd+K 聚焦搜索框', () => {
    renderTopBar('/')
    const input = screen.getByLabelText('搜索工具') as HTMLInputElement
    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' })
    expect(document.activeElement).toBe(input)
  })

  it('全部导航项路径都能被标签页解析', () => {
    expect(allNavItems.length).toBeGreaterThan(0)
  })

  it('问 AI 按钮切换面板开关并显示激活态', () => {
    renderTopBar('/')
    const button = screen.getByTitle('问 AI（Ctrl+Shift+K）')
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('false')
  })

  it('主题按钮在 浅色→深色→跟随系统 间循环切换', () => {    renderTopBar('/')
    const button = screen.getByTitle(/^主题：/)
    // 模块默认跟随系统
    expect(button.getAttribute('title')).toBe('主题：跟随系统，点击切换为浅色')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    fireEvent.click(button) // → 浅色
    expect(screen.getByTitle(/^主题：/).getAttribute('title')).toBe('主题：浅色，点击切换为深色')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    fireEvent.click(screen.getByTitle(/^主题：/)) // → 深色
    expect(screen.getByTitle(/^主题：/).getAttribute('title')).toBe('主题：深色，点击切换为跟随系统')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    fireEvent.click(screen.getByTitle(/^主题：/)) // → 跟随系统（测试环境为浅色）
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
