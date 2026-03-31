import QRCode from 'qrcode'
import type { QRCodeOptions, QRCodeResult } from './types'

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: QRCodeOptions = {
  width: 300,
  margin: 4,
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
  errorCorrectionLevel: 'M',
}

/**
 * 生成二维码
 */
export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<QRCodeResult> {
  try {
    // 验证输入
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: '请输入要生成二维码的内容',
      }
    }

    // 合并配置
    const config = { ...DEFAULT_OPTIONS, ...options }

    // 生成二维码
    const dataUrl = await QRCode.toDataURL(text, {
      width: config.width,
      margin: config.margin,
      color: config.color,
      errorCorrectionLevel: config.errorCorrectionLevel,
    })

    return {
      success: true,
      dataUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成二维码失败',
    }
  }
}

/**
 * 下载二维码图片
 */
export function downloadQRCode(dataUrl: string, filename: string = 'qrcode.png'): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

/**
 * 容错级别说明
 */
export const ERROR_CORRECTION_LEVELS = [
  { value: 'L', label: 'L - 低 (7%)', description: '约 7% 的容错率，二维码最简单' },
  { value: 'M', label: 'M - 中 (15%)', description: '约 15% 的容错率，推荐使用' },
  { value: 'Q', label: 'Q - 高 (25%)', description: '约 25% 的容错率' },
  { value: 'H', label: 'H - 最高 (30%)', description: '约 30% 的容错率，二维码最复杂' },
] as const

/**
 * 预设尺寸
 */
export const PRESET_SIZES = [
  { value: 200, label: '200 x 200' },
  { value: 300, label: '300 x 300' },
  { value: 400, label: '400 x 400' },
  { value: 500, label: '500 x 500' },
  { value: 600, label: '600 x 600' },
] as const

// 导出类型
export type { QRCodeOptions, QRCodeResult, QRCodeColor } from './types'
