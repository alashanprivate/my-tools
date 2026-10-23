import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_AI_SETTINGS,
  createDefaultStore,
  getActiveAiSettings,
  getActiveProfile,
  loadAiSettings,
  loadAiSettingsStore,
  saveAiSettings,
  saveAiSettingsStore,
  validateAiSettings,
} from './settings'
import type { AiSettings, AiSettingsStore } from './types'

const LEGACY_V1_KEY = 'my-tools.ai.settings'
const LEGACY_V2_KEY = 'my-tools.ai.profiles'

beforeEach(() => {
  localStorage.clear()
})

describe('loadAiSettings', () => {
  it('无存储时返回默认配置（Ollama 本地端点）', async () => {
    expect(await loadAiSettings()).toEqual(DEFAULT_AI_SETTINGS)
    expect(DEFAULT_AI_SETTINGS.baseUrl).toBe('http://localhost:11434/v1')
  })

  it('保存后能原样读回', async () => {
    const settings: AiSettings = {
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: 'sk-abc',
      model: 'deepseek-chat',
    }
    await saveAiSettings(settings)
    expect(await loadAiSettings()).toEqual(settings)
  })

  it('v1 存储损坏时回退默认值', async () => {
    localStorage.setItem(LEGACY_V1_KEY, '{oops')
    expect(await loadAiSettings()).toEqual(DEFAULT_AI_SETTINGS)
  })

  it('v1 字段缺失或类型错误时逐项回退默认值', async () => {
    localStorage.setItem(
      LEGACY_V1_KEY,
      JSON.stringify({ baseUrl: 'https://api.openai.com/v1', apiKey: 42 }),
    )
    expect(await loadAiSettings()).toEqual({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: DEFAULT_AI_SETTINGS.apiKey,
      model: DEFAULT_AI_SETTINGS.model,
    })
  })
})

describe('validateAiSettings', () => {
  it('空地址报错', () => {
    expect(validateAiSettings({ ...DEFAULT_AI_SETTINGS, baseUrl: '  ' })).toBe('请填写接口地址')
  })

  it('非 URL 格式报错', () => {
    expect(validateAiSettings({ ...DEFAULT_AI_SETTINGS, baseUrl: 'not a url' })).toBeTruthy()
  })

  it('非 http(s) 协议报错', () => {
    expect(
      validateAiSettings({ ...DEFAULT_AI_SETTINGS, baseUrl: 'ftp://localhost:11434/v1' }),
    ).toContain('http')
  })

  it('合法配置返回 null', () => {
    expect(validateAiSettings(DEFAULT_AI_SETTINGS)).toBeNull()
  })
})

function twoProfileStore(): AiSettingsStore {
  return {
    profiles: [
      {
        id: 'p1',
        name: '公司模型',
        settings: { baseUrl: 'https://ai.company.com/v1', apiKey: 'k1', model: 'gpt-x' },
      },
      {
        id: 'p2',
        name: 'Ollama',
        settings: { baseUrl: 'http://localhost:11434/v1', apiKey: '', model: 'qwen2.5:7b' },
      },
    ],
    activeId: 'p2',
  }
}

describe('loadAiSettingsStore', () => {
  it('无任何存储时返回默认 store（单个「默认」档案）', async () => {
    expect(await loadAiSettingsStore()).toEqual(createDefaultStore())
  })

  it('v2 旧数据自动迁入 store 并删除旧键，二次读取稳定', async () => {
    localStorage.setItem(LEGACY_V2_KEY, JSON.stringify(twoProfileStore()))
    const store = await loadAiSettingsStore()
    expect(store.profiles).toHaveLength(2)
    expect(localStorage.getItem(LEGACY_V2_KEY)).toBeNull()

    const reloaded = await loadAiSettingsStore()
    expect(reloaded).toEqual(store)
  })

  it('v1 旧版单配置自动迁移为「默认」档案并删除旧键', async () => {
    localStorage.setItem(
      LEGACY_V1_KEY,
      JSON.stringify({
        baseUrl: 'https://ai.company.com/v1',
        apiKey: 'sk-x',
        model: 'company-model',
      }),
    )
    const store = await loadAiSettingsStore()
    expect(store.profiles).toHaveLength(1)
    expect(store.activeId).toBe('default')
    expect(store.profiles[0]).toMatchObject({
      id: 'default',
      name: '默认',
      settings: { baseUrl: 'https://ai.company.com/v1', apiKey: 'sk-x', model: 'company-model' },
    })
    expect(localStorage.getItem(LEGACY_V1_KEY)).toBeNull()
  })

  it('v2 优先于 v1：v2 迁入后忽略 v1', async () => {
    localStorage.setItem(LEGACY_V1_KEY, JSON.stringify({ baseUrl: 'https://old/v1' }))
    localStorage.setItem(LEGACY_V2_KEY, JSON.stringify(twoProfileStore()))
    const store = await loadAiSettingsStore()
    expect(store.profiles).toHaveLength(2)
    expect(store.profiles[0].name).toBe('公司模型')
  })

  it('v2 数据损坏时删除并回退到 v1 迁移/默认逻辑', async () => {
    localStorage.setItem(LEGACY_V1_KEY, JSON.stringify({ baseUrl: 'https://legacy/v1' }))
    localStorage.setItem(LEGACY_V2_KEY, '{oops')
    const store = await loadAiSettingsStore()
    expect(store.profiles).toHaveLength(1)
    expect(store.profiles[0].settings.baseUrl).toBe('https://legacy/v1')
  })

  it('activeId 不在档案列表中时回退第一个', async () => {
    const store = twoProfileStore()
    await saveAiSettingsStore({ ...store, activeId: 'no-such-id' })
    expect((await loadAiSettingsStore()).activeId).toBe('p1')
  })

  it('profiles 为空时视为损坏', async () => {
    await saveAiSettingsStore({ profiles: [], activeId: '' })
    expect(await loadAiSettingsStore()).toEqual(createDefaultStore())
  })

  it('档案字段类型异常时逐项回退默认值', async () => {
    localStorage.setItem(
      LEGACY_V2_KEY,
      JSON.stringify({
        activeId: 'p1',
        profiles: [{ id: 'p1', name: 'X', settings: { baseUrl: 42, model: 'm' } }],
      }),
    )
    const store = await loadAiSettingsStore()
    expect(store.profiles[0].settings.baseUrl).toBe(DEFAULT_AI_SETTINGS.baseUrl)
    expect(store.profiles[0].settings.model).toBe('m')
  })

  it('保存后能原样读回', async () => {
    const store = twoProfileStore()
    await saveAiSettingsStore(store)
    expect(await loadAiSettingsStore()).toEqual(store)
  })
})

describe('激活档案便捷读写', () => {
  it('saveAiSettings 只更新激活档案，不影响其他档案', async () => {
    await saveAiSettingsStore(twoProfileStore())
    await saveAiSettings({ baseUrl: 'http://127.0.0.1:1234/v1', apiKey: 'k2', model: 'changed' })

    const store = await loadAiSettingsStore()
    expect(store.profiles[0].settings.model).toBe('gpt-x')
    expect(store.profiles[1].settings.model).toBe('changed')
    expect(await getActiveAiSettings().then((s) => s.model)).toBe('changed')
  })

  it('getActiveProfile 在 activeId 失效时回退第一个档案', () => {
    const store = twoProfileStore()
    expect(getActiveProfile(store).id).toBe('p2')
    expect(getActiveProfile({ ...store, activeId: 'gone' }).id).toBe('p1')
  })

  it('loadAiSettings 返回激活档案配置', async () => {
    await saveAiSettingsStore(twoProfileStore())
    expect((await loadAiSettings()).baseUrl).toBe('http://localhost:11434/v1')
  })
})
