import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AiChatEmbed } from './AiChatEmbed'

function LocationProbe() {
  const { pathname } = useLocation()
  return <div data-testid="location">{pathname}</div>
}

function renderEmbed(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/ai-chat" element={<div>ai-chat-list</div>} />
        <Route path="/ai-chat/:id" element={<AiChatEmbed />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('AiChatEmbed', () => {
  it('未知 id 在自定义入口加载完成后重定向回 AI 对话列表', async () => {
    renderEmbed('/ai-chat/nope')
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/ai-chat'))
    expect(screen.getByText('ai-chat-list')).toBeTruthy()
  })

  it('浏览器环境展示新标签页回退入口', async () => {
    renderEmbed('/ai-chat/deepseek')
    expect(await screen.findByText('DeepSeek 需在桌面端应用内打开')).toBeTruthy()
    expect(screen.getByRole('button', { name: '在新标签页打开' })).toBeTruthy()
  })
})
