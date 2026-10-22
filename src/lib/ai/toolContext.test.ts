import { describe, it, expect } from 'vitest'
import {
  clearToolAiContext,
  getToolAiContext,
  setToolAiContext,
  truncateForContext,
  MAX_TOOL_CONTEXT_CHARS,
} from './toolContext'

describe('tool context registry', () => {
  it('设置后可读取，清除后为 null', () => {
    setToolAiContext({ toolName: '正则表达式', content: '/\\d+/g' })
    expect(getToolAiContext()).toEqual({ toolName: '正则表达式', content: '/\\d+/g' })
    clearToolAiContext()
    expect(getToolAiContext()).toBeNull()
  })

  it('重复设置以后一次为准', () => {
    setToolAiContext({ toolName: 'A', content: '1' })
    setToolAiContext({ toolName: 'B', content: '2' })
    expect(getToolAiContext()?.toolName).toBe('B')
    clearToolAiContext()
  })
})

describe('truncateForContext', () => {
  it('短文本原样返回', () => {
    expect(truncateForContext('hello')).toBe('hello')
  })

  it('超长文本截断并附加说明', () => {
    const text = 'x'.repeat(MAX_TOOL_CONTEXT_CHARS + 100)
    const result = truncateForContext(text)
    expect(result.startsWith('x'.repeat(MAX_TOOL_CONTEXT_CHARS))).toBe(true)
    expect(result).toContain('已截断')
    expect(result).toContain(String(text.length))
  })

  it('可自定义上限', () => {
    const result = truncateForContext('abcdef', 3)
    expect(result.startsWith('abc')).toBe(true)
    expect(result).toContain('已截断')
  })
})
