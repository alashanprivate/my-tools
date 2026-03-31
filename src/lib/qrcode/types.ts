/**
 * 二维码颜色选项
 */
export interface QRCodeColor {
  dark?: string      // 前景色（默认: #000000）
  light?: string     // 背景色（默认: #ffffff）
}

/**
 * 二维码生成选项
 */
export interface QRCodeOptions {
  width?: number          // 二维码宽度（默认: 300）
  margin?: number         // 边距（默认: 4）
  color?: QRCodeColor     // 颜色配置
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'  // 容错级别（默认: M）
}

/**
 * 二维码生成结果
 */
export interface QRCodeResult {
  success: boolean
  dataUrl?: string       // Base64 图片数据
  error?: string
}
