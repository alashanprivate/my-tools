import { describe, it, expect } from 'vitest'
import { streamChatCompletion, listModels } from './client'
import { AiError, type AiFetch, type AiResponse, type AiSettings } from './types'

const settings: AiSettings = {
  baseUrl: 'http://localhost:11434/v1/',
  apiKey: 'sk-test',
  model: 'qwen2.5:7b',
}

const encoder = new TextEncoder()

function sseResponse(events: string[]): AiResponse {
  const queue = events.map((e) => encoder.encode(e))
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    body: {
      getReader: () => ({
        read: async () =>
          queue.length > 0
            ? { done: false, value: queue.shift() }
            : { done: true, value: undefined },
      }),
    },
    text: async () => '',
    json: async () => ({}),
  }
}

function errorResponse(status: number, body: string): AiResponse {
  return {
    ok: false,
    status,
    statusText: 'Error',
    body: null,
    text: async () => body,
    json: async () => JSON.parse(body),
  }
}

function jsonResponse(payload: unknown): AiResponse {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    body: null,
    text: async () => JSON.stringify(payload),
    json: async () => payload,
  }
}

function deltaEvent(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`
}

describe('streamChatCompletion', () => {
  it('按 OpenAI 兼容格式构造请求（URL 归一化、鉴权头、请求体）', async () => {
    let capturedUrl = ''
    let capturedInit: Parameters<AiFetch>[1] | undefined
    const fetchImpl: AiFetch = async (url, init) => {
      capturedUrl = url
      capturedInit = init
      return sseResponse(['data: [DONE]\n\n'])
    }

    await streamChatCompletion(
      settings,
      [{ role: 'user', content: '你好' }],
      { onDelta: () => {} },
      { fetchImpl }
    )

    expect(capturedUrl).toBe('http://localhost:11434/v1/chat/completions')
    expect(capturedInit?.method).toBe('POST')
    expect(capturedInit?.headers.Authorization).toBe('Bearer sk-test')
    const body = JSON.parse(capturedInit?.body ?? '{}')
    expect(body).toMatchObject({
      model: 'qwen2.5:7b',
      messages: [{ role: 'user', content: '你好' }],
      stream: true,
    })
  })

  it('apiKey 为空时不携带 Authorization 头', async () => {
    let capturedInit: Parameters<AiFetch>[1] | undefined
    const fetchImpl: AiFetch = async (_url, init) => {
      capturedInit = init
      return sseResponse(['data: [DONE]\n\n'])
    }

    await streamChatCompletion(
      { ...settings, apiKey: '' },
      [{ role: 'user', content: 'hi' }],
      { onDelta: () => {} },
      { fetchImpl }
    )

    expect(capturedInit?.headers.Authorization).toBeUndefined()
  })

  it('流式增量按序回调并返回完整文本', async () => {
    const fetchImpl: AiFetch = async () =>
      sseResponse([deltaEvent('he'), `${deltaEvent('llo')}data: [DONE]\n\n`])

    const deltas: string[] = []
    const full = await streamChatCompletion(settings, [{ role: 'user', content: 'hi' }], {
      onDelta: (delta) => deltas.push(delta),
    }, { fetchImpl })

    expect(deltas).toEqual(['he', 'llo'])
    expect(full).toBe('hello')
  })

  it('未发送 [DONE] 时以流结束为准', async () => {
    const fetchImpl: AiFetch = async () => sseResponse([deltaEvent('ok')])

    const full = await streamChatCompletion(settings, [{ role: 'user', content: 'hi' }], {
      onDelta: () => {},
    }, { fetchImpl })

    expect(full).toBe('ok')
  })

  it('流片段含空增量（如仅 role 字段）不产生回调', async () => {
    const fetchImpl: AiFetch = async () =>
      sseResponse(['data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n', deltaEvent('a')])

    const deltas: string[] = []
    await streamChatCompletion(settings, [{ role: 'user', content: 'hi' }], {
      onDelta: (delta) => deltas.push(delta),
    }, { fetchImpl })

    expect(deltas).toEqual(['a'])
  })

  it('HTTP 错误透出后端 message', async () => {
    const fetchImpl: AiFetch = async () =>
      errorResponse(401, '{"error":{"message":"Invalid API key"}}')

    await expect(
      streamChatCompletion(settings, [{ role: 'user', content: 'hi' }], { onDelta: () => {} }, { fetchImpl })
    ).rejects.toMatchObject({ kind: 'http', message: expect.stringContaining('Invalid API key') })
  })

  it('网络异常包装为 network 错误', async () => {
    const fetchImpl: AiFetch = async () => {
      throw new TypeError('fetch failed')
    }

    await expect(
      streamChatCompletion(settings, [{ role: 'user', content: 'hi' }], { onDelta: () => {} }, { fetchImpl })
    ).rejects.toMatchObject({ kind: 'network' })
  })

  it('请求中断返回 aborted 错误', async () => {
    const fetchImpl: AiFetch = async () => {
      throw Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
    }

    await expect(
      streamChatCompletion(settings, [{ role: 'user', content: 'hi' }], { onDelta: () => {} }, { fetchImpl })
    ).rejects.toMatchObject({ kind: 'aborted' })
  })

  it('响应无内容流时报 parse 错误', async () => {
    const fetchImpl: AiFetch = async () => ({ ...sseResponse([]), body: null })

    await expect(
      streamChatCompletion(settings, [{ role: 'user', content: 'hi' }], { onDelta: () => {} }, { fetchImpl })
    ).rejects.toMatchObject({ kind: 'parse' })
  })

  it('无法解析的 data 片段报 parse 错误', async () => {
    const fetchImpl: AiFetch = async () => sseResponse(['data: not-json\n\n'])

    await expect(
      streamChatCompletion(settings, [{ role: 'user', content: 'hi' }], { onDelta: () => {} }, { fetchImpl })
    ).rejects.toMatchObject({ kind: 'parse' })
  })

  it('配置缺失直接报 config 错误，不发起请求', async () => {
    const fetchImpl: AiFetch = async () => {
      throw new Error('should not be called')
    }

    await expect(
      streamChatCompletion(
        { ...settings, model: '' },
        [{ role: 'user', content: 'hi' }],
        { onDelta: () => {} },
        { fetchImpl }
      )
    ).rejects.toMatchObject({ kind: 'config' })
    await expect(
      streamChatCompletion(
        { ...settings, baseUrl: 'ftp://x' },
        [{ role: 'user', content: 'hi' }],
        { onDelta: () => {} },
        { fetchImpl }
      )
    ).rejects.toBeInstanceOf(AiError)
  })
})

describe('listModels', () => {
  it('解析模型 id 列表并拼接 /models 路径', async () => {
    let capturedUrl = ''
    const fetchImpl: AiFetch = async (url) => {
      capturedUrl = url
      return jsonResponse({ data: [{ id: 'qwen2.5:7b' }, { id: 'llama3' }] })
    }

    const models = await listModels(settings, { fetchImpl })
    expect(capturedUrl).toBe('http://localhost:11434/v1/models')
    expect(models).toEqual(['qwen2.5:7b', 'llama3'])
  })

  it('响应格式异常时报 parse 错误', async () => {
    const fetchImpl: AiFetch = async () => jsonResponse({ models: 'oops' })

    await expect(listModels(settings, { fetchImpl })).rejects.toMatchObject({ kind: 'parse' })
  })

  it('HTTP 错误透出状态码', async () => {
    const fetchImpl: AiFetch = async () => errorResponse(500, '{"error":{"message":"boom"}}')

    await expect(listModels(settings, { fetchImpl })).rejects.toMatchObject({
      kind: 'http',
      message: expect.stringContaining('500'),
    })
  })
})
