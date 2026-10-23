import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FAVICON_FAILURE_TTL,
  FAVICON_MAX_ENTRIES,
  FAVICON_SUCCESS_TTL,
  fetchFaviconDataUrl,
  isFaviconFailure,
  loadCachedFavicon,
  markFaviconFailure,
  saveFavicon,
} from './index'

beforeEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('favicon 持久缓存', () => {
  it('存取往返', async () => {
    expect(await loadCachedFavicon('a.com')).toBeNull()
    await saveFavicon('a.com', 'data:image/png;base64,AAA')
    expect(await loadCachedFavicon('a.com')).toBe('data:image/png;base64,AAA')
  })

  it('超过有效期后返回 null 并清除条目', async () => {
    const expired = Date.now() - FAVICON_SUCCESS_TTL - 1
    localStorage.setItem(
      'json-store:favicon-cache.json#icon:old.com',
      JSON.stringify({ d: 'data:image/png;base64,OLD', t: expired }),
    )
    expect(await loadCachedFavicon('old.com')).toBeNull()
    expect(localStorage.getItem('json-store:favicon-cache.json#icon:old.com')).toBeNull()
  })

  it('容量超限时淘汰最久未更新的条目', async () => {
    for (let i = 0; i < FAVICON_MAX_ENTRIES; i++) {
      await saveFavicon(`host${i}.com`, `data:image/png;base64,${i}`)
    }
    // 刷新首个条目使其变为最新，然后写入一个新条目触发淘汰
    await saveFavicon('host0.com', 'data:image/png;base64,refreshed')
    await saveFavicon('extra.com', 'data:image/png;base64,new')

    expect(await loadCachedFavicon('host0.com')).toBe('data:image/png;base64,refreshed')
    expect(await loadCachedFavicon('extra.com')).toBe('data:image/png;base64,new')
    expect(await loadCachedFavicon('host1.com')).toBeNull()
  })
})

describe('favicon 失败名单', () => {
  it('记录后冷却期内跳过，过期后允许重试', async () => {
    expect(await isFaviconFailure('bad.com')).toBe(false)
    await markFaviconFailure('bad.com')
    expect(await isFaviconFailure('bad.com')).toBe(true)

    localStorage.setItem(
      'json-store:favicon-cache.json#fail:bad.com',
      JSON.stringify(Date.now() - FAVICON_FAILURE_TTL - 1),
    )
    expect(await isFaviconFailure('bad.com')).toBe(false)
  })
})

describe('fetchFaviconDataUrl', () => {
  it('成功响应转为 data URL', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(bytes, {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
    )
    const dataUrl = await fetchFaviconDataUrl('ok.com')
    expect(dataUrl).toBe(`data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`)
  })

  it('非图片内容返回 null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<html>not found</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )
    expect(await fetchFaviconDataUrl('html.com')).toBeNull()
  })

  it('非 2xx / 网络异常（含 CORS 拦截）返回 null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })))
    expect(await fetchFaviconDataUrl('404.com')).toBeNull()

    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('CORS'))))
    expect(await fetchFaviconDataUrl('cors.com')).toBeNull()
  })
})
