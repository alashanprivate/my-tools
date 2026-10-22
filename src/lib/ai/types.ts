export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

/** AI 服务配置（OpenAI 兼容接口） */
export interface AiSettings {
  /** 接口基础地址，需包含版本路径，如 http://localhost:11434/v1 */
  baseUrl: string
  /** API Key，本地服务（如 Ollama）可留空 */
  apiKey: string
  /** 模型名称，如 qwen2.5:7b、deepseek-chat */
  model: string
}

/** 命名配置档案：在公司模型 / 本地 Ollama 等多套服务间快速切换 */
export interface AiSettingsProfile {
  id: string
  name: string
  settings: AiSettings
}

export interface AiSettingsStore {
  profiles: AiSettingsProfile[]
  activeId: string
}

export interface StreamChatOptions {
  /** 每收到一段增量文本回调一次 */
  onDelta: (delta: string) => void
  /** 传入 AbortController 的 signal 可中断请求 */
  signal?: AbortSignal
  /** 采样温度 */
  temperature?: number
}

/**
 * 便于测试注入的最小响应结构，真实 Response 天然满足。
 * 不直接依赖 Response 类型，测试无需构造完整流对象。
 */
export interface AiResponse {
  ok: boolean
  status: number
  statusText?: string
  body: {
    getReader(): {
      read(): Promise<{ done: boolean; value?: Uint8Array }>
    }
  } | null
  text(): Promise<string>
  json(): Promise<unknown>
}

export type AiFetch = (
  url: string,
  init: {
    method: string
    headers: Record<string, string>
    body?: string
    signal?: AbortSignal
  }
) => Promise<AiResponse>

export type AiErrorKind = 'config' | 'network' | 'http' | 'parse' | 'aborted'

/** AI 功能相关错误，kind 用于 UI 区分提示方式（如 aborted 静默提示而非报错） */
export class AiError extends Error {
  readonly kind: AiErrorKind

  constructor(kind: AiErrorKind, message: string) {
    super(message)
    this.name = 'AiError'
    this.kind = kind
  }
}
