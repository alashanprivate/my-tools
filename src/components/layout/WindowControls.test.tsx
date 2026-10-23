import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { WindowControls } from './WindowControls'

const { mockWindow } = vi.hoisted(() => ({
  mockWindow: {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    isMaximized: vi.fn(),
    onResized: vi.fn(async () => () => {}),
  },
}))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => mockWindow,
}))

function setTauriEnv(on: boolean) {
  if (on) {
    ;(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {}
  } else {
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__
  }
}

beforeEach(() => {
  setTauriEnv(false)
  vi.clearAllMocks()
  mockWindow.isMaximized.mockResolvedValue(false)
})

describe('WindowControls', () => {
  it('浏览器环境不渲染', () => {
    const { container } = render(<WindowControls />)
    expect(container.childElementCount).toBe(0)
  })

  it('桌面端渲染最小化/最大化/关闭三个按钮', async () => {
    setTauriEnv(true)
    render(<WindowControls />)
    expect(await screen.findByTitle('最小化')).toBeTruthy()
    expect(screen.getByTitle('最大化')).toBeTruthy()
    expect(screen.getByTitle('关闭')).toBeTruthy()
  })

  it('点击按钮触发对应窗口操作', async () => {
    setTauriEnv(true)
    render(<WindowControls />)
    fireEvent.click(await screen.findByTitle('最小化'))
    expect(mockWindow.minimize).toHaveBeenCalled()
    fireEvent.click(screen.getByTitle('最大化'))
    expect(mockWindow.toggleMaximize).toHaveBeenCalled()
    fireEvent.click(screen.getByTitle('关闭'))
    expect(mockWindow.close).toHaveBeenCalled()
  })

  it('窗口最大化时按钮切换为还原', async () => {
    setTauriEnv(true)
    mockWindow.isMaximized.mockResolvedValue(true)
    render(<WindowControls />)
    expect(await screen.findByTitle('还原')).toBeTruthy()
  })
})
