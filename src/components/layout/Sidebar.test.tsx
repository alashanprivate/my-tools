import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'

function LocationProbe() {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{pathname + search}</div>
}

function renderSidebar(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Sidebar />
      <LocationProbe />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('Sidebar', () => {
  it('点击左上角 logo 切换收起/展开菜单', async () => {
    const { container } = renderSidebar('/')
    const logo = await screen.findByTitle('收起菜单')
    const aside = container.querySelector('aside')!
    expect(aside.className).toContain('w-60')

    fireEvent.click(logo)
    expect(aside.className).toContain('w-14')
    expect(screen.getByTitle('展开菜单')).toBeTruthy()

    fireEvent.click(screen.getByTitle('展开菜单'))
    expect(aside.className).toContain('w-60')
  })

  it('点击左下角设置进入设置页', async () => {
    renderSidebar('/')
    fireEvent.click(await screen.findByTitle('设置'))
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/settings'))
  })

  it('设置页时左下角设置项高亮', async () => {
    renderSidebar('/settings?tab=ai')
    const link = await screen.findByTitle('设置')
    expect(link.className).toContain('text-primary')
  })

  it('深链接直接进入 AI 对话内嵌页时自动收起菜单并高亮 AI 对话入口', async () => {
    const { container } = renderSidebar('/ai-chat/deepseek')
    const aside = container.querySelector('aside')!
    const railLink = await screen.findByTitle('AI 对话')
    expect(aside.className).toContain('w-14')
    expect(railLink.className).toContain('text-primary')
  })
})
