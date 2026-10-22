import { describe, it, expect } from 'vitest'
import { AI_CHAT_TOOLS, getAiChatById } from './index'

describe('AI_CHAT_TOOLS', () => {
  it('id 唯一且符合窗口 label 字符要求', () => {
    const ids = AI_CHAT_TOOLS.map((tool) => tool.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('所有地址均为 https', () => {
    expect(AI_CHAT_TOOLS.every((tool) => tool.url.startsWith('https://'))).toBe(true)
  })

  it('名称与底色非空', () => {
    expect(AI_CHAT_TOOLS.every((tool) => tool.name.trim() !== '')).toBe(true)
    expect(AI_CHAT_TOOLS.every((tool) => tool.color.startsWith('bg-'))).toBe(true)
  })

  it('涵盖国内外主流对话产品', () => {
    const names = AI_CHAT_TOOLS.map((tool) => tool.name)
    expect(names).toEqual(expect.arrayContaining(['DeepSeek', 'Kimi', 'ChatGPT', 'Claude']))
  })
})

describe('getAiChatById', () => {
  it('按 id 查找', () => {
    expect(getAiChatById('deepseek')?.url).toBe('https://chat.deepseek.com')
  })

  it('未知 id 返回 undefined', () => {
    expect(getAiChatById('nope')).toBeUndefined()
  })
})
