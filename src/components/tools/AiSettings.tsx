import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/useToast'
import {
  DEFAULT_AI_SETTINGS,
  createProfileId,
  getActiveProfile,
  listModels,
  loadAiSettingsStore,
  saveAiSettingsStore,
  validateAiSettings,
  type AiSettings as AiSettingsConfig,
  type AiSettingsStore,
} from '@/lib/ai'
import { Bot, Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'

export function AiSettings() {
  const [store, setStore] = useState<AiSettingsStore>(() => ({
    profiles: [{ id: 'default', name: '默认', settings: { ...DEFAULT_AI_SETTINGS } }],
    activeId: 'default',
  }))
  const [settings, setSettings] = useState<AiSettingsConfig>(DEFAULT_AI_SETTINGS)
  const [profileName, setProfileName] = useState('默认')
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    let cancelled = false
    void loadAiSettingsStore().then((loaded) => {
      if (cancelled) return
      setStore(loaded)
      const active = getActiveProfile(loaded)
      setSettings(active.settings)
      setProfileName(active.name)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const update = (patch: Partial<AiSettingsConfig>) => setSettings((prev) => ({ ...prev, ...patch }))

  const persist = (next: AiSettingsStore) => {
    setStore(next)
    void saveAiSettingsStore(next).catch(() => {
      showToast('保存失败，请重试', 'error')
    })
  }

  const normalized = (): AiSettingsConfig => ({
    baseUrl: settings.baseUrl.trim(),
    apiKey: settings.apiKey.trim(),
    model: settings.model.trim(),
  })

  const handleSwitchProfile = (id: string) => {
    if (id === store.activeId) return
    const next: AiSettingsStore = { ...store, activeId: id }
    persist(next)
    const active = getActiveProfile(next)
    setSettings(active.settings)
    setProfileName(active.name)
    setModels([])
    showToast(`已切换到「${active.name}」`, 'success')
  }

  const handleCreateProfile = () => {
    const profile = {
      id: createProfileId(),
      name: `档案 ${store.profiles.length + 1}`,
      settings: { ...DEFAULT_AI_SETTINGS },
    }
    persist({ profiles: [...store.profiles, profile], activeId: profile.id })
    setSettings({ ...DEFAULT_AI_SETTINGS })
    setProfileName(profile.name)
    setModels([])
    showToast(`已创建「${profile.name}」，填写后点「保存设置」`, 'info')
  }

  const handleDeleteProfile = () => {
    if (store.profiles.length <= 1) return
    const active = getActiveProfile(store)
    if (!window.confirm(`确定删除档案「${active.name}」？`)) return
    const rest = store.profiles.filter((p) => p.id !== active.id)
    persist({ profiles: rest, activeId: rest[0].id })
    setSettings(rest[0].settings)
    setProfileName(rest[0].name)
    setModels([])
    showToast(`已删除「${active.name}」`, 'success')
  }

  const handleSave = () => {
    const error = validateAiSettings(settings)
    if (error) {
      showToast(error, 'error')
      return
    }
    const name = profileName.trim() || getActiveProfile(store).name
    const next: AiSettingsStore = {
      activeId: store.activeId,
      profiles: store.profiles.map((p) =>
        p.id === store.activeId ? { ...p, name, settings: normalized() } : p,
      ),
    }
    persist(next)
    setProfileName(name)
    showToast(`已保存「${name}」`, 'success')
  }

  const handleFetchModels = async () => {
    const error = validateAiSettings(settings)
    if (error) {
      showToast(error, 'error')
      return
    }
    setLoadingModels(true)
    try {
      const ids = await listModels(normalized())
      setModels(ids)
      if (ids.length === 0) {
        showToast('连接成功，但服务未返回任何模型', 'info')
      } else {
        showToast(`连接成功，获取到 ${ids.length} 个模型`, 'success')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setLoadingModels(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Bot className="h-6 w-6 text-fuchsia-500" />
            服务配置
          </CardTitle>
          <CardDescription>
            可保存多套档案（如公司模型、本地 Ollama）随时切换；支持 Ollama、LM Studio、OpenAI、DeepSeek、通义等 OpenAI 兼容服务
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>配置档案</Label>
            <div className="flex gap-2 mt-2">
              <Select
                value={store.activeId}
                onChange={(e) => handleSwitchProfile(e.target.value)}
                options={store.profiles.map((p) => ({ value: p.id, label: p.name }))}
                className="flex-1"
                aria-label="配置档案"
              />
              <Button variant="outline" onClick={handleCreateProfile}>
                <Plus className="h-4 w-4 mr-1" />
                新建
              </Button>
              <Button
                variant="ghost"
                onClick={handleDeleteProfile}
                disabled={store.profiles.length <= 1}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="ai-profile-name">档案名称</Label>
            <Input
              id="ai-profile-name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="公司模型 / Ollama"
            />
          </div>

          <div>
            <Label htmlFor="ai-base-url">接口地址（Base URL）</Label>
            <Input
              id="ai-base-url"
              value={settings.baseUrl}
              onChange={(e) => update({ baseUrl: e.target.value })}
              placeholder="http://localhost:11434/v1"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              需包含版本路径，例如 Ollama 为 http://localhost:11434/v1
            </p>
          </div>

          <div>
            <Label htmlFor="ai-api-key">API Key（本地服务可留空）</Label>
            <Input
              id="ai-api-key"
              type="password"
              value={settings.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              仅保存在本机（桌面端存于应用数据目录），请求由本机直接发往所填服务
            </p>
          </div>

          <div>
            <Label htmlFor="ai-model">模型名称</Label>
            <Input
              id="ai-model"
              list="ai-model-options"
              value={settings.model}
              onChange={(e) => update({ model: e.target.value })}
              placeholder="qwen2.5:7b / deepseek-chat / gpt-4o-mini"
              className="font-mono"
            />
            <datalist id="ai-model-options">
              {models.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
            {models.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                已获取 {models.length} 个模型，输入框中可下拉选择
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              保存设置
            </Button>
            <Button variant="outline" onClick={handleFetchModels} disabled={loadingModels}>
              {loadingModels ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {loadingModels ? '连接中…' : '测试连接并获取模型列表'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">隐私说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• API Key 与配置仅保存在本机浏览器存储中，不会同步到任何服务器</p>
          <p>
            • 使用 AI 功能时，相关输入内容由本机直接发送到当前档案配置的服务地址；选择本地模型（如
            Ollama）可确保数据不出本机
          </p>
          <p>
            • 常见地址：Ollama http://localhost:11434/v1 · LM Studio http://localhost:1234/v1 ·
            OpenAI https://api.openai.com/v1
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
