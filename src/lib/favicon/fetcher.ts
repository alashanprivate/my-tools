/** 单个 favicon 的大小上限，超过视为异常文件不缓存 */
const MAX_BYTES = 80 * 1024

/**
 * 跨域拉取 favicon 并转为 data URL（可持久缓存）。
 * 站点未开放 CORS（多数如此）、响应异常或离线时返回 null，
 * 展示层此时退回 <img> 直连——显示不受 CORS 限制，且仍能吃到 HTTP 缓存。
 */
export async function fetchFaviconDataUrl(hostname: string): Promise<string | null> {
  try {
    const resp = await fetch(`https://${hostname}/favicon.ico`, { mode: 'cors' })
    if (!resp.ok) return null
    const type = (resp.headers.get('content-type') ?? 'image/x-icon').split(';')[0]
    if (!type.startsWith('image/')) return null
    const buffer = await resp.arrayBuffer()
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) return null

    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    }
    return `data:${type};base64,${btoa(binary)}`
  } catch {
    return null
  }
}
