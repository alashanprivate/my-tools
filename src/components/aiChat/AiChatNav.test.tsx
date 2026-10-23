import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { openJsonStore } from '@/lib/storage'
import { AiChatNav } from './AiChatNav'

function renderNav() {
  return render(
    <MemoryRouter initialEntries={['/ai-chat']}>
      <ToastProvider>
        <AiChatNav />
      </ToastProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('AiChatNav', () => {
  it('渲染内置入口与添加磁贴', async () => {
    renderNav()
    expect(screen.getByTitle('DeepSeek（应用内打开）')).toBeTruthy()
    expect(screen.getByTitle('添加自定义入口')).toBeTruthy()
  })

  it('浏览器环境点击内置入口新标签页打开', async () => {
    renderNav()
    const opened = vi.spyOn(window, 'open').mockReturnValue(null)
    fireEvent.click(screen.getByTitle('DeepSeek（应用内打开）'))
    expect(opened).toHaveBeenCalledWith(
      'https://chat.deepseek.com',
      '_blank',
      'noopener,noreferrer',
    )
    opened.mockRestore()
  })

  it('通过对话框添加自定义入口，右键可删除', async () => {
    renderNav()

    fireEvent.click(screen.getByTitle('添加自定义入口'))
    fireEvent.change(await screen.findByPlaceholderText('如：Kimi 探索版'), {
      target: { value: '测试AI' },
    })
    const urlInput = screen.getByPlaceholderText('https://example.com')
    fireEvent.change(urlInput, { target: { value: 'test.ai' } })
    fireEvent.keyDown(urlInput, { key: 'Enter' })

    const tile = await screen.findByTitle('测试AI（应用内打开，右键可删除）')
    const store = await openJsonStore('ai-chat-entries')
    const persisted = await store.get<Array<{ name: string; url: string }>>('custom')
    expect(persisted).toEqual([{ id: expect.any(String), name: '测试AI', url: 'https://test.ai', color: expect.any(String), custom: true }])

    // 破坏性操作收进右键菜单（无悬停删除按钮）
    fireEvent.contextMenu(tile)
    fireEvent.click(await screen.findByText('删除「测试AI」'))
    await waitFor(() => expect(screen.queryByTitle('测试AI（应用内打开，右键可删除）')).toBeNull())
    expect(await store.get('custom')).toEqual([])
  })

  it('内置入口右键移除后可整体恢复', async () => {
    renderNav()

    fireEvent.contextMenu(screen.getByTitle('DeepSeek（应用内打开）'))
    fireEvent.click(await screen.findByText('移除「DeepSeek」'))
    await waitFor(() => expect(screen.queryByTitle('DeepSeek（应用内打开）')).toBeNull())
    expect(screen.getByText(/已移除 1 个内置入口/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '恢复全部' }))
    expect(await screen.findByTitle('DeepSeek（应用内打开）')).toBeTruthy()
    expect(screen.queryByText(/已移除 1 个内置入口/)).toBeNull()
  })

  it('右键菜单可固定入口到顶部标签栏并可取消', async () => {
    renderNav()

    fireEvent.contextMenu(screen.getByTitle('DeepSeek（应用内打开）'))
    fireEvent.click(await screen.findByText('固定到顶部标签栏'))
    const store = await openJsonStore('ai-chat-entries')
    await waitFor(() => expect(store.get('pinned-ids')).resolves.toEqual(['deepseek']))

    // 再次右键显示「取消固定」
    fireEvent.contextMenu(screen.getByTitle('DeepSeek（应用内打开）'))
    fireEvent.click(await screen.findByText('取消固定'))
    await waitFor(() => expect(store.get('pinned-ids')).resolves.toEqual([]))
  })
})
