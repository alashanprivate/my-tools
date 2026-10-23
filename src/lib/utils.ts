import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 取网址的主机名；省略协议时按 https 补全，解析失败返回 null
 */
export function hostnameOf(url: string): string | null {
  try {
    return new URL(url.includes('://') ? url : `https://${url}`).hostname
  } catch {
    return null
  }
}
