import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { TopBar } from './TopBar'
import { allNavItems } from './nav'

const TABS_KEY = 'opened-tabs'

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

describe('TopBar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('访问工具页时自动记录为标签页并持久化', () => {
    renderTopBar('/json')
    expect(screen.getByText('JSON 格式化')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(TABS_KEY)!)).toEqual(['/json'])
  })

  it('深链接带 tab 参数时按完整路径记录', () => {
    renderTopBar('/crypto?tab=sm4')
    expect(screen.getByText('SM4 加解密')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(TABS_KEY)!)).toEqual(['/crypto?tab=sm4'])
  })

  it('加载时过滤掉已失效的旧路径', () => {
    localStorage.setItem(TABS_KEY, JSON.stringify(['/json', '/removed']))
    renderTopBar('/')
    // 有效路径正常渲染标签，失效路径被过滤
    expect(screen.getByText('JSON 格式化')).toBeTruthy()
    expect(screen.getAllByTitle('关闭标签页')).toHaveLength(1)
  })

  it('关闭当前标签页时激活右侧相邻标签', () => {
    localStorage.setItem(TABS_KEY, JSON.stringify(['/json', '/regex', '/cron']))
    renderTopBar('/regex')
    const tab = screen.getByText('正则表达式').closest('div')!
    fireEvent.click(tab.querySelector('button')!)
    expect(screen.getByTestId('location').textContent).toBe('/cron')
    expect(JSON.parse(localStorage.getItem(TABS_KEY)!)).toEqual(['/json', '/cron'])
  })

  it('关闭最后一个标签页时回到首页', () => {
    localStorage.setItem(TABS_KEY, JSON.stringify(['/json']))
    renderTopBar('/json')
    const tab = screen.getByText('JSON 格式化').closest('div')!
    fireEvent.click(tab.querySelector('button')!)
    expect(screen.getByTestId('location').textContent).toBe('/')
    expect(JSON.parse(localStorage.getItem(TABS_KEY)!)).toEqual([])
  })

  it('关闭非活动标签页不改变当前页面', () => {
    localStorage.setItem(TABS_KEY, JSON.stringify(['/json', '/regex']))
    renderTopBar('/json')
    const tab = screen.getByText('正则表达式').closest('div')!
    fireEvent.click(tab.querySelector('button')!)
    expect(screen.getByTestId('location').textContent).toBe('/json')
    expect(JSON.parse(localStorage.getItem(TABS_KEY)!)).toEqual(['/json'])
  })

  it('搜索结果支持回车打开第一个匹配项', () => {
    renderTopBar('/')
    const input = screen.getByLabelText('搜索工具')
    fireEvent.change(input, { target: { value: '哈希' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByTestId('location').textContent).toBe('/crypto?tab=hash')
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
})
