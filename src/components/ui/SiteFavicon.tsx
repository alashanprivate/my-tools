import { useEffect, useState } from 'react'
import { cn, hostnameOf } from '@/lib/utils'
import {
  fetchFaviconDataUrl,
  isFaviconFailure,
  loadCachedFavicon,
  markFaviconFailure,
  saveFavicon,
} from '@/lib/favicon'

interface SiteFaviconProps {
  /** 站点网址 */
  url: string
  /** 图标加载失败时回退显示的首字母 */
  letter: string
  /** 首字母回退时的底色类（如 bg-blue-500） */
  fallbackClassName?: string
  /** 外框尺寸/圆角等类，两种模式共用 */
  className?: string
  /** 上传的 Logo（data URL），存在时跳过 favicon 抓取直接渲染 */
  dataUrl?: string
}

type FaviconState =
  /** 命中持久缓存，渲染 data URL，零请求 */
  | { kind: 'cached'; dataUrl: string }
  /** 直连 <img>（首次访问或站点不开放 CORS 读权限），展示依赖 HTTP 缓存 */
  | { kind: 'direct' }
  /** 已知拿不到图标，回退首字母色块 */
  | { kind: 'failed' }

/**
 * 站点图标，按下面的顺序取用：
 * 1. 先直连 /favicon.ico 展示（HTTP 缓存生效），同时后台查持久缓存；
 * 2. 持久缓存（data URL）命中则切换为离线零请求渲染；
 * 3. 都失败（无 favicon / 不可达 / 防盗链）——回退首字母色块并记入失败名单，7 天内不再请求。
 */
export function SiteFavicon({ url, letter, fallbackClassName, className, dataUrl }: SiteFaviconProps) {
  const hostname = hostnameOf(url)
  const [state, setState] = useState<FaviconState>(() =>
    hostname ? { kind: 'direct' } : { kind: 'failed' },
  )

  useEffect(() => {
    if (!hostname) {
      setState({ kind: 'failed' })
      return
    }
    let cancelled = false
    void (async () => {
      const cached = await loadCachedFavicon(hostname)
      if (cancelled) return
      if (cached) {
        setState({ kind: 'cached', dataUrl: cached })
        return
      }
      if (await isFaviconFailure(hostname)) {
        if (!cancelled) setState({ kind: 'failed' })
        return
      }
      const dataUrl = await fetchFaviconDataUrl(hostname)
      if (cancelled || !dataUrl) return // 拿不到读权限时维持 direct，交给 <img> + HTTP 缓存
      void saveFavicon(hostname, dataUrl)
      setState({ kind: 'cached', dataUrl })
    })()
    return () => {
      cancelled = true
    }
  }, [hostname])

  // 上传的 Logo 优先：跳过抓取链路，整幅铺满渲染（hooks 之后早返回，保持钩子顺序稳定）
  if (dataUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden border border-border/60 bg-white dark:bg-muted',
          className,
        )}
      >
        <img src={dataUrl} alt="" className="h-full w-full object-cover" />
      </div>
    )
  }

  if (state.kind === 'failed') {
    return (
      <div className={cn('flex items-center justify-center', className, fallbackClassName)}>
        {letter}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden border border-border/60 bg-white dark:bg-muted',
        className,
      )}
    >
      <img
        src={state.kind === 'cached' ? state.dataUrl : `https://${hostname}/favicon.ico`}
        alt=""
        loading="lazy"
        className="h-3/5 w-3/5 object-contain"
        onError={() => {
          if (hostname) {
            void markFaviconFailure(hostname)
            setState((prev) => (prev.kind === 'direct' ? { kind: 'failed' } : prev))
          }
        }}
      />
    </div>
  )
}
