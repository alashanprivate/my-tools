/** OpenAI 兼容接口的流结束哨兵 */
export const SSE_DONE = '[DONE]'

/**
 * 创建增量 SSE 解析器：每次喂入一段解码后的文本，
 * 每凑齐一个事件（空行分隔）就把其 data 负载回调一次。
 * 只关心 data 字段；event/id/retry 与冒号开头的注释行（心跳）一律忽略。
 */
export function createSseParser(onData: (data: string) => void): (chunk: string) => void {
  let buffer = ''
  let dataLines: string[] = []

  const dispatch = () => {
    if (dataLines.length > 0) {
      onData(dataLines.join('\n'))
      dataLines = []
    }
  }

  return (chunk) => {
    buffer += chunk
    // SSE 行分隔符兼容 \r\n、\r、\n；最后一段可能是半行，留待下个 chunk
    const lines = buffer.split(/\r\n|\r|\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line === '') {
        dispatch()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).replace(/^ /, ''))
      }
    }
  }
}
