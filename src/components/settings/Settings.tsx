/**
 * 设置页：页面级菜单（Tabs）组织各分区。
 * 入口在顶栏齿轮按钮；支持 /settings?tab=ai 直达指定分区（旧 /ai 链接重定向用），
 * 页内切换不回写 URL，与各工具页 Tabs 的非受控约定一致。
 */
import { useLocation } from 'react-router-dom'
import { Bot, Palette } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { AiSettings } from '@/components/tools/AiSettings'
import { AppearanceSettings } from './AppearanceSettings'

const SECTIONS = [
  { value: 'appearance', label: '外观', icon: Palette },
  { value: 'ai', label: 'AI 设置', icon: Bot },
] as const

export function Settings() {
  const { search } = useLocation()
  const requested = new URLSearchParams(search).get('tab')
  const initial = SECTIONS.find((section) => section.value === requested)?.value ?? SECTIONS[0].value

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">设置</h1>
        <p className="text-muted-foreground">应用偏好与 AI 服务配置</p>
      </div>

      <Tabs defaultValue={initial}>
        <TabsList>
          {SECTIONS.map((section) => {
            const Icon = section.icon
            return (
              <TabsTrigger key={section.value} value={section.value}>
                <Icon className="mr-1.5 h-4 w-4" />
                {section.label}
              </TabsTrigger>
            )
          })}
        </TabsList>
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>
        <TabsContent value="ai">
          <AiSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
