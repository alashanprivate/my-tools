import { beforeEach, describe, expect, it } from 'vitest'
import { openJsonStore } from '@/lib/storage'
import { AI_CHAT_TOOLS, getAiChatById } from './index'
import {
  addCustomEntry,
  fileToLogoDataUrl,
  getAiEntriesState,
  hideBuiltinEntry,
  isValidChatUrl,
  loadEntries,
  normalizeChatUrl,
  removeCustomEntry,
  restoreBuiltinEntries,
  setChatEntryPinned,
} from './entries'

beforeEach(() => {
  localStorage.clear()
})

describe('网址规范化与校验', () => {
  it('无协议时补 https，已有协议保持不变', () => {
    expect(normalizeChatUrl(' kimi.moonshot.cn ')).toBe('https://kimi.moonshot.cn')
    expect(normalizeChatUrl('http://a.com')).toBe('http://a.com')
    expect(normalizeChatUrl('https://a.com/path?q=1')).toBe('https://a.com/path?q=1')
  })

  it('仅接受 http/https 地址', () => {
    expect(isValidChatUrl('https://a.com')).toBe(true)
    expect(isValidChatUrl('a.com')).toBe(true)
    expect(isValidChatUrl('ftp://a.com')).toBe(false)
    expect(isValidChatUrl('not a url')).toBe(false)
    expect(isValidChatUrl('')).toBe(false)
  })
})

describe('自定义入口增删（浏览器回退路径）', () => {
  it('加载后可见内置入口，新增自定义入口持久化', async () => {
    await loadEntries()
    expect(getAiEntriesState().loaded).toBe(true)
    expect(getAiEntriesState().tools.length).toBe(AI_CHAT_TOOLS.length)

    const tool = await addCustomEntry('  测试AI ', 'test.ai/chat')
    expect(tool.name).toBe('测试AI')
    expect(tool.url).toBe('https://test.ai/chat')
    expect(tool.custom).toBe(true)
    expect(tool.color).toMatch(/^bg-/)
    // id 用作 webview label 后缀，仅限小写字母/数字/连字符
    expect(tool.id).toMatch(/^[a-z0-9-]+$/)

    expect(getAiChatById(tool.id)?.name).toBe('测试AI')
    const store = await openJsonStore('ai-chat-entries')
    expect(await store.get('custom')).toEqual([tool])
  })

  it('上传的 Logo 随入口持久化，不带 Logo 时不写入该字段', async () => {
    const withLogo = await addCustomEntry('有图标', 'a.example.com', 'data:image/png;base64,AAA')
    expect(withLogo.logo).toBe('data:image/png;base64,AAA')
    const plain = await addCustomEntry('无图标', 'b.example.com')
    expect('logo' in plain).toBe(false)

    const store = await openJsonStore('ai-chat-entries')
    const persisted = await store.get<Array<{ name: string; logo?: string }>>('custom')
    expect(persisted?.find((item) => item.name === '有图标')?.logo).toBe('data:image/png;base64,AAA')
    expect(persisted?.find((item) => item.name === '无图标')?.logo).toBeUndefined()
  })

  it('非图片文件与超大图片被拒绝', async () => {
    await expect(
      fileToLogoDataUrl(new File(['x'], 'a.txt', { type: 'text/plain' })),
    ).rejects.toThrow('仅支持图片文件')
    const big = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    await expect(fileToLogoDataUrl(big)).rejects.toThrow('不能超过 5MB')
  })

  it('删除自定义入口后从列表与存储移除，未知 id 静默跳过', async () => {
    // 模块级列表跨用例共享，先清空遗留数据保证断言干净
    for (const item of getAiEntriesState().tools) {
      await removeCustomEntry(item.id)
    }
    const tool = await addCustomEntry('临时AI', 'tmp.ai')
    await removeCustomEntry(tool.id)
    expect(getAiEntriesState().tools.some((item) => item.id === tool.id)).toBe(false)
    const store = await openJsonStore('ai-chat-entries')
    expect(await store.get('custom')).toEqual([])

    await removeCustomEntry('custom-nope')
    expect(await store.get('custom')).toEqual([])
  })
})

describe('内置入口移除与恢复', () => {
  it('移除后从可见列表消失并持久化，重复移除幂等，恢复后清空', async () => {
    await loadEntries()
    await hideBuiltinEntry('deepseek')
    expect(getAiEntriesState().hiddenBuiltinIds).toEqual(['deepseek'])
    expect(getAiEntriesState().tools.some((tool) => tool.id === 'deepseek')).toBe(false)
    const store = await openJsonStore('ai-chat-entries')
    expect(await store.get('hidden-builtins')).toEqual(['deepseek'])

    await hideBuiltinEntry('deepseek')
    expect(getAiEntriesState().hiddenBuiltinIds).toEqual(['deepseek'])

    await restoreBuiltinEntries()
    expect(getAiEntriesState().hiddenBuiltinIds).toEqual([])
    expect(getAiEntriesState().tools.some((tool) => tool.id === 'deepseek')).toBe(true)
    expect(await store.get('hidden-builtins')).toEqual([])
  })

  it('隐藏的内置入口仍可按 id 解析（深链接直达内嵌页不失效）', async () => {
    await hideBuiltinEntry('kimi')
    expect(getAiChatById('kimi')?.name).toBe('Kimi')
    await restoreBuiltinEntries()
  })
})

describe('固定到顶部标签栏', () => {
  it('固定状态持久化并反映在入口上，取消后清除', async () => {
    await loadEntries()
    await setChatEntryPinned('deepseek', true)
    expect(getAiEntriesState().tools.find((tool) => tool.id === 'deepseek')?.pinned).toBe(true)
    const store = await openJsonStore('ai-chat-entries')
    expect(await store.get('pinned-ids')).toEqual(['deepseek'])

    await setChatEntryPinned('deepseek', false)
    expect(getAiEntriesState().tools.find((tool) => tool.id === 'deepseek')?.pinned).toBeUndefined()
    expect(await store.get('pinned-ids')).toEqual([])
  })
})
