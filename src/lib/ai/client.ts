import type { AiFetch, AiResponse, AiSettings, ChatMessage, StreamChatOptions } from './types'
import { AiError } from './types'
import { createSseParser, SSE_DONE } from './sse'
import { validateAiSettings } from './settings'

interface ClientDeps {
  /** 供测试注入；默认使用全局 fetch */
  fetchImpl?: AiFetch
}

function buildUrl(baseUrl: string, path: string): string {
  return `${baseUrl.trim().replace(/\/+$/, '')}${path}`
}

function buildHeaders(settings: AiSettings): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const apiKey = settings.apiKey.trim()
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  return headers
}

function assertConfigured(settings: AiSettings): void {
  const error = validateAiSettings(settings)
  if (error) throw new AiError('config', error)
  if (!settings.model.trim()) throw new AiError('config', '请先配置模型名称')
}

/** 从 OpenAI 风格错误响应中提取可读信息 */
async function extractHttpError(response: AiResponse): Promise<string> {
  let detail = ''
  try {
    const text = await response.text()
    const parsed: unknown = JSON.parse(text)
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      const err = (parsed as { error?: { message?: unknown } }).error
      if (err && typeof err.message === 'string') detail = err.message
    }
    if (!detail) detail = text
  } catch {
    // 非 JSON 错误体，忽略
  }
  detail = detail.trim().slice(0, 200)
  const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`
  return `请求失败 (HTTP ${status})${detail ? `：${detail}` : ''}`
}

function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error
  if (error instanceof Error && error.name === 'AbortError') {
    return new AiError('aborted', '请求已取消')
  }
  const message = error instanceof Error ? error.message : String(error)
  return new AiError('network', `网络请求失败：${message}`)
}

/** 从流式响应片段中提取增量文本 */
function extractDelta(data: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    throw new AiError('parse', `无法解析流式响应片段：${data.slice(0, 100)}`)
  }
  const content = (parsed as { choices?: Array<{ delta?: { content?: unknown } }> })
    .choices?.[0]?.delta?.content
  return typeof content === 'string' ? content : ''
}

/**
 * 调用 OpenAI 兼容的 /chat/completions 接口，流式接收回复。
 * 增量文本依次通过 options.onDelta 回调，结束后返回完整文本。
 */
export async function streamChatCompletion(
  settings: AiSettings,
  messages: ChatMessage[],
  options: StreamChatOptions,
  deps: ClientDeps = {}
): Promise<string> {
  assertConfigured(settings)
  const fetchImpl = deps.fetchImpl ?? ((url, init) => fetch(url, init))

  let response: AiResponse
  try {
    response = await fetchImpl(buildUrl(settings.baseUrl, '/chat/completions'), {
      method: 'POST',
      headers: buildHeaders(settings),
      body: JSON.stringify({
        model: settings.model.trim(),
        messages,
        stream: true,
        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      }),
      signal: options.signal,
    })
  } catch (error) {
    throw toAiError(error)
  }

  if (!response.ok) throw new AiError('http', await extractHttpError(response))
  if (!response.body) throw new AiError('parse', '响应中没有内容流')

  let full = ''
  const parser = createSseParser((data) => {
    if (data === SSE_DONE) return
    const delta = extractDelta(data)
    if (delta) {
      full += delta
      options.onDelta(delta)
    }
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      parser(decoder.decode(value, { stream: true }))
    }
    parser(decoder.decode())
  } catch (error) {
    throw toAiError(error)
  }
  return full
}

/** 获取 /models 模型列表，可用于测试连接和选择模型 */
export async function listModels(settings: AiSettings, deps: ClientDeps = {}): Promise<string[]> {
  const error = validateAiSettings(settings)
  if (error) throw new AiError('config', error)
  const fetchImpl = deps.fetchImpl ?? ((url, init) => fetch(url, init))

  let response: AiResponse
  try {
    response = await fetchImpl(buildUrl(settings.baseUrl, '/models'), {
      method: 'GET',
      headers: buildHeaders(settings),
    })
  } catch (err) {
    throw toAiError(err)
  }
  if (!response.ok) throw new AiError('http', await extractHttpError(response))

  const payload: unknown = await response.json()
  const items = (payload as { data?: unknown }).data
  if (!Array.isArray(items)) throw new AiError('parse', '模型列表响应格式不正确')
  return items
    .map((item) => (item && typeof item === 'object' ? (item as { id?: unknown }).id : undefined))
    .filter((id): id is string => typeof id === 'string')
}
