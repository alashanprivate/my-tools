/**
 * 设置页「外观」分区：主题（浅色 / 深色 / 跟随系统）与配色方案选择。
 * 与顶栏的主题按钮共享 lib/theme 的同一状态源。
 */
import { useSyncExternalStore } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  getCustomSchemeColor,
  getThemeMode,
  getThemeScheme,
  setCustomScheme,
  setThemeMode,
  setThemeScheme,
  subscribeTheme,
  type ThemeMode,
  type ThemeScheme,
} from '@/lib/theme'

const THEME_OPTIONS: {
  value: ThemeMode
  label: string
  description: string
  icon: typeof Sun
}[] = [
  { value: 'light', label: '浅色', description: '明亮主题', icon: Sun },
  { value: 'dark', label: '深色', description: '适合夜间与低光环境', icon: Moon },
  { value: 'system', label: '跟随系统', description: '自动随系统深浅色切换', icon: Monitor },
]

/** 色板：单个圆形用亮/暗两档主色对半拼接，直观展示该配色在两种模式下的样子 */
const SCHEME_OPTIONS: { value: ThemeScheme; label: string; swatch: string }[] = [
  { value: 'blue', label: '默认蓝', swatch: 'linear-gradient(135deg, #3b82f6 50%, #60a5fa 50%)' },
  { value: 'graphite', label: '石墨', swatch: 'linear-gradient(135deg, #26272b 50%, #e3e5e8 50%)' },
  { value: 'green', label: '森绿', swatch: 'linear-gradient(135deg, #15803d 50%, #22c55e 50%)' },
  { value: 'violet', label: '暗紫', swatch: 'linear-gradient(135deg, #6d28d9 50%, #a78bfa 50%)' },
  { value: 'pure', label: '洁白', swatch: 'linear-gradient(135deg, #17181a 50%, #f0f0f0 50%)' },
  { value: 'mist', label: '雾灰', swatch: 'linear-gradient(135deg, #647587 50%, #bcc9da 50%)' },
  { value: 'titanium', label: '钛灰', swatch: 'linear-gradient(135deg, #545149 50%, #d4d2cd 50%)' },
  { value: 'cobalt', label: '钴蓝', swatch: 'linear-gradient(135deg, #0a47cf 50%, #5e96f7 50%)' },
  { value: 'teal', label: '青绿', swatch: 'linear-gradient(135deg, #177963 50%, #27b394 50%)' },
  { value: 'amber', label: '暖黄', swatch: 'linear-gradient(135deg, #dd850a 50%, #fbbf24 50%)' },
  { value: 'pink', label: '樱粉', swatch: 'linear-gradient(135deg, #d61c5f 50%, #fb7e9d 50%)' },
  { value: 'vscode', label: 'VS Code', swatch: 'linear-gradient(135deg, #007acc 50%, #3794ff 50%)' },
  { value: 'idea', label: 'IDEA', swatch: 'linear-gradient(135deg, #3574f0 50%, #6c9af8 50%)' },
  { value: 'xcode', label: 'Xcode', swatch: 'linear-gradient(135deg, #007aff 50%, #3f9aff 50%)' },
  {
    value: 'jetbrains',
    label: 'JetBrains',
    swatch: 'linear-gradient(135deg, #3f49c7 50%, #a48cff 50%)',
  },
  { value: 'cursor', label: 'Cursor', swatch: 'linear-gradient(135deg, #486384 50%, #a7c0e0 50%)' },
  { value: 'claude', label: 'Claude Code', swatch: 'linear-gradient(135deg, #b25b3c 50%, #d97757 50%)' },
]

const OPTION_ACTIVE_CLASS = 'border-primary bg-primary/5'
const OPTION_IDLE_CLASS = 'border-border hover:bg-accent'
const RAINBOW_SWATCH =
  'conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)'

export function AppearanceSettings() {
  const mode = useSyncExternalStore(subscribeTheme, getThemeMode)
  const scheme = useSyncExternalStore(subscribeTheme, getThemeScheme)
  const customColor = useSyncExternalStore(subscribeTheme, getCustomSchemeColor)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>主题</CardTitle>
          <CardDescription>切换应用配色，桌面端原生标题栏会一并跟随</CardDescription>
        </CardHeader>
        <CardContent>
          <div role="radiogroup" aria-label="主题" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = mode === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => void setThemeMode(option.value)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                    active ? OPTION_ACTIVE_CLASS : OPTION_IDLE_CLASS
                  }`}
                >
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <span>
                    <span className={`block text-sm font-medium ${active ? 'text-primary' : ''}`}>
                      {option.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{option.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>配色方案</CardTitle>
          <CardDescription>
            只影响按钮、链接、焦点等主题色，与深浅色模式独立组合；色板左半为浅色、右半为深色下的效果
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="radiogroup"
            aria-label="配色方案"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
          >
            {SCHEME_OPTIONS.map((option) => {
              const active = scheme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => void setThemeScheme(option.value)}
                  className={`relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${
                    active ? OPTION_ACTIVE_CLASS : OPTION_IDLE_CLASS
                  }`}
                >
                  {active && (
                    <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />
                  )}
                  <span
                    aria-hidden
                    className="h-8 w-8 rounded-full border border-border/50"
                    style={{ background: option.swatch }}
                  />
                  <span className={`text-sm font-medium ${active ? 'text-primary' : ''}`}>
                    {option.label}
                  </span>
                </button>
              )
            })}
            <label
              role="radio"
              aria-checked={scheme === 'custom'}
              className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${
                scheme === 'custom' ? OPTION_ACTIVE_CLASS : OPTION_IDLE_CLASS
              }`}
            >
              <input
                type="color"
                value={customColor}
                onChange={(event) => void setCustomScheme(event.target.value)}
                aria-label="自定义主题色"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {scheme === 'custom' && (
                <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />
              )}
              <span
                aria-hidden
                className="h-8 w-8 rounded-full border border-border/50"
                style={{
                  background:
                    scheme === 'custom'
                      ? customColor
                      : RAINBOW_SWATCH,
                }}
              />
              <span className={`text-sm font-medium ${scheme === 'custom' ? 'text-primary' : ''}`}>
                自定义
              </span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
