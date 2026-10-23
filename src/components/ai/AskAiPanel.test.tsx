import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AskAiPanel } from './AskAiPanel'
import { askAiPanel } from './askAi'

const { streamCalls } = vi.hoisted(() => ({
  streamCalls: [] as import('@/lib/ai').ChatMessage[][],
}))

vi.mock('@/lib/ai', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/ai')>()
  return {
    ...original,
    loadAiSettings: () =>
      Promise.resolve({ baseUrl: 'http://localhost:11434/v1', apiKey: '', model: 'test-model' }),
    streamChatCompletion: (
      _settings: unknown,
      messages: import('@/lib/ai').ChatMessage[],
      options: { onDelta: (delta: string) => void },
    ) => {
      streamCalls.push(messages)
      options.onDelta('你好，我是 AI 助手')
      return Promise.resolve()
    },
  }
})

/** 浏览器降级实现的会话存储键 */
const TURNS_STORE_KEY = 'json-store:ask-ai-panel.json#turns'

function renderPanel() {
  return render(
    <MemoryRouter>
      <AskAiPanel />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  streamCalls.length = 0
  askAiPanel.setOpen(false)
})

describe('AskAiPanel', () => {
  it('默认不渲染，展开后显示面板', () => {
    const { container } = renderPanel()
    expect(container.querySelector('aside')).toBeNull()

    act(() => askAiPanel.setOpen(true))
    expect(screen.getByText('问 AI')).toBeTruthy()
  })

  it('点击关闭按钮收起面板', () => {
    askAiPanel.setOpen(true)
    renderPanel()
    fireEvent.click(screen.getByTitle('关闭面板'))
    expect(document.querySelector('aside')).toBeNull()
  })

  it('连续对话保留历史，第二次提问携带完整轮次，新建会话后清空', async () => {
    askAiPanel.setOpen(true)
    renderPanel()
    // 等待存储恢复完成，避免异步恢复覆盖交互产生的轮次
    await act(async () => {})

    const input = screen.getByPlaceholderText('输入你的问题…')
    fireEvent.change(input, { target: { value: '你是谁' } })
    fireEvent.click(screen.getByTitle('发送（Enter）'))

    // 用户问题与 AI 回答同屏可见（右问左答）
    expect(await screen.findByText('你是谁')).toBeTruthy()
    expect(await screen.findByText('你好，我是 AI 助手')).toBeTruthy()
    expect(screen.getByText('你是谁')).toBeTruthy()
    expect(streamCalls[0]).toHaveLength(2)

    // 第二次提问时携带完整历史
    fireEvent.change(input, { target: { value: '继续' } })
    fireEvent.click(screen.getByTitle('发送（Enter）'))
    await waitFor(() => expect(streamCalls[1]).toHaveLength(4))
    expect(streamCalls[1][0].role).toBe('system')
    expect(streamCalls[1].slice(1).map((m) => m.content)).toEqual([
      '你是谁',
      '你好，我是 AI 助手',
      '继续',
    ])

    // 新建会话清空对话
    fireEvent.click(screen.getByTitle('新建会话'))
    expect(screen.queryByText('你是谁')).toBeNull()
    expect(screen.queryByText('你好，我是 AI 助手')).toBeNull()
  })

  it('会话轮次持久化到本地存储', async () => {
    askAiPanel.setOpen(true)
    renderPanel()
    await act(async () => {})

    const input = screen.getByPlaceholderText('输入你的问题…')
    fireEvent.change(input, { target: { value: '记下来' } })
    fireEvent.click(screen.getByTitle('发送（Enter）'))
    await screen.findByText('你好，我是 AI 助手')

    await waitFor(() => {
      const raw = localStorage.getItem(TURNS_STORE_KEY)
      expect(raw).toContain('记下来')
      expect(raw).toContain('你好，我是 AI 助手')
    })
  })
})
