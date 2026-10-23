import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { Settings } from './Settings'

function renderSettings(initialEntry = '/settings') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ToastProvider>
        <Settings />
      </ToastProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('style')
})

describe('Settings', () => {
  it('默认显示外观分区（主题选择）', () => {
    renderSettings()
    expect(screen.getByRole('radiogroup', { name: '主题' })).toBeTruthy()
    expect(screen.queryByText('服务配置')).toBeNull()
  })

  it('配色方案可选择并立即应用', () => {
    renderSettings()
    expect(screen.getByRole('radiogroup', { name: '配色方案' })).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: '森绿' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('green')
    expect(localStorage.getItem('theme-scheme')).toBe('green')
  })

  it('IDE 品牌配色可选，自定义取色器换色生效', () => {
    renderSettings()
    fireEvent.click(screen.getByRole('radio', { name: 'VS Code' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('vscode')
    fireEvent.change(screen.getByLabelText('自定义主题色'), { target: { value: '#ff0000' } })
    expect(document.documentElement.getAttribute('data-theme')).toBe('custom')
    expect(document.documentElement.style.getPropertyValue('--custom-primary')).toBe('0 100% 48%')
    expect(localStorage.getItem('theme-scheme')).toBe('custom')
  })

  it('页面级菜单可切换到 AI 设置分区', async () => {
    renderSettings()
    fireEvent.click(screen.getByRole('button', { name: 'AI 设置' }))
    expect(await screen.findByText('服务配置')).toBeTruthy()
    expect(screen.queryByRole('radiogroup', { name: '主题' })).toBeNull()
  })

  it('支持 ?tab=ai 直达 AI 设置分区（旧 /ai 重定向场景）', async () => {
    renderSettings('/settings?tab=ai')
    expect(await screen.findByText('服务配置')).toBeTruthy()
    expect(screen.queryByRole('radiogroup', { name: '主题' })).toBeNull()
  })
})
