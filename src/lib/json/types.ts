/**
 * JSON 格式化选项
 */
export interface JsonFormatOptions {
  /** 缩进空格数，默认为 2 */
  indent?: number
  /** 是否排序键，默认为 false */
  sortKeys?: boolean
}

/**
 * JSON 验证结果
 */
export interface JsonValidateResult {
  /** 是否有效 */
  valid: boolean
  /** 错误信息 */
  error?: string
  /** 错误位置（行号） */
  line?: number
  /** 错误位置（列号） */
  column?: number
}

/**
 * JSON 压缩选项
 */
export interface JsonMinifyOptions {
  /** 移除所有空白字符 */
  removeWhitespace?: boolean
}

/**
 * JSON 转换结果
 */
export type JsonConversionResult = {
  success: boolean
  result?: string
  error?: string
}
