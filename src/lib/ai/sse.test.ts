import { describe, it, expect } from 'vitest'
import { createSseParser, SSE_DONE } from './sse'

function collect(): { parse: (chunk: string) => void; events: string[] } {
  const events: string[] = []
  return { parse: createSseParser((data) => events.push(data)), events }
}

describe('createSseParser', () => {
  it('分发完整事件的 data 负载', () => {
    const { parse, events } = collect()
    parse('data: {"a":1}\n\n')
    expect(events).toEqual(['{"a":1}'])
  })

  it('data: 后无空格也能解析', () => {
    const { parse, events } = collect()
    parse('data:hi\n\n')
    expect(events).toEqual(['hi'])
  })

  it('事件跨 chunk 拆分时能拼回', () => {
    const { parse, events } = collect()
    parse('data: {"a"')
    expect(events).toEqual([])
    parse(':1}\n\n')
    expect(events).toEqual(['{"a":1}'])
  })

  it('一个 chunk 内多个事件依次分发', () => {
    const { parse, events } = collect()
    parse('data: a\n\ndata: b\n\n')
    expect(events).toEqual(['a', 'b'])
  })

  it('兼容 CRLF 分隔符', () => {
    const { parse, events } = collect()
    parse('data: a\r\n\r\ndata: b\r\n\r\n')
    expect(events).toEqual(['a', 'b'])
  })

  it('忽略注释行与 event/id 字段', () => {
    const { parse, events } = collect()
    parse(': ping\n\nevent: message\nid: 1\ndata: hi\n\n')
    expect(events).toEqual(['hi'])
  })

  it('多行 data 合并为一个事件', () => {
    const { parse, events } = collect()
    parse('data: a\ndata: b\n\n')
    expect(events).toEqual(['a\nb'])
  })

  it('[DONE] 哨兵作为普通 data 透传，由调用方判断', () => {
    const { parse, events } = collect()
    parse(`data: ${SSE_DONE}\n\n`)
    expect(events).toEqual([SSE_DONE])
  })

  it('末尾半行留待下个 chunk，不误分发', () => {
    const { parse, events } = collect()
    parse('data: 12')
    expect(events).toEqual([])
    parse('3\n\n')
    expect(events).toEqual(['123'])
  })
})
