import { useEffect } from 'react'

/** 工具页注册给全局「问 AI」的上下文 */
export interface ToolAiContext {
  /** 工具名，如「正则表达式」 */
  toolName: string
  /** 工具当前的关键上下文文本 */
  content: string
}

/** 上下文长度上限，避免提示词过大 */
export const MAX_TOOL_CONTEXT_CHARS = 4000

let current: ToolAiContext | null = null

export function setToolAiContext(ctx: ToolAiContext): void {
  current = ctx
}

export function clearToolAiContext(): void {
  current = null
}

export function getToolAiContext(): ToolAiContext | null {
  return current
}

/** 超长上下文截断 */
export function truncateForContext(text: string, max = MAX_TOOL_CONTEXT_CHARS): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n…（已截断，原文共 ${text.length} 字符）`
}

/**
 * 工具页注册当前上下文（如正则表达式、JSON 内容），供全局「问 AI」携带。
 * 不设依赖数组：每次渲染后重新注册以拿到最新值，卸载时清除（路由切换即失效）。
 */
export function useToolAiContext(toolName: string, getContent: () => string): void {
  useEffect(() => {
    setToolAiContext({ toolName, content: truncateForContext(getContent()) })
    return () => clearToolAiContext()
  })
}
