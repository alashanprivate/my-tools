/**
 * JSON 工具函数集合
 * 实现遵循 TDD 原则
 */

import type {
  JsonFormatOptions,
  JsonValidateResult,
  JsonMinifyOptions,
  JsonConversionResult,
} from './types'

/**
 * 格式化 JSON 字符串
 */
export function formatJson(
  input: string,
  options: JsonFormatOptions = {}
): JsonConversionResult {
  const { indent = 2, sortKeys = false } = options

  // 处理空输入
  if (!input || input.trim().length === 0) {
    return {
      success: false,
      error: '输入不能为空',
    }
  }

  try {
    const parsed = JSON.parse(input)

    // 如果需要排序键
    const sorted = sortKeys ? sortObjectKeys(parsed) : parsed

    const result = JSON.stringify(sorted, null, indent)

    return {
      success: true,
      result,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '无效的 JSON',
    }
  }
}

/**
 * 验证 JSON 字符串
 */
export function validateJson(input: string): JsonValidateResult {
  // 处理空输入
  if (!input || input.trim().length === 0) {
    return {
      valid: false,
      error: '输入不能为空',
    }
  }

  try {
    JSON.parse(input)
    return {
      valid: true,
    }
  } catch (error) {
    // 解析错误信息以获取行号和列号
    const errorMessage = error instanceof Error ? error.message : '无效的 JSON'
    const parsed = parseJsonError(input, errorMessage)

    return {
      valid: false,
      error: parsed.error,
      line: parsed.line,
      column: parsed.column,
    }
  }
}

/**
 * 压缩 JSON 字符串
 */
export function minifyJson(
  input: string,
  options: JsonMinifyOptions = {}
): JsonConversionResult {
  // options 中的 removeWhitespace 未使用，因为 JSON.stringify 默认移除所有空白
  // 保留参数以保持 API 兼容性
  options

  // 处理空输入
  if (!input || input.trim().length === 0) {
    return {
      success: false,
      error: '输入不能为空',
    }
  }

  try {
    const parsed = JSON.parse(input)
    const result = JSON.stringify(parsed)

    return {
      success: true,
      result,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '无效的 JSON',
    }
  }
}

/**
 * 辅助函数：递归排序对象键
 */
function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }

  if (obj !== null && typeof obj === 'object') {
    const sortedKeys = Object.keys(obj).sort()
    const sortedObj: Record<string, unknown> = {}

    for (const key of sortedKeys) {
      sortedObj[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
    }

    return sortedObj
  }

  return obj
}

/**
 * 辅助函数：解析 JSON 错误信息
 * 从 V8 引擎错误消息中提取行号和列号
 */
function parseJsonError(
  input: string,
  message: string
): { error: string; line?: number; column?: number } {
  // V8 错误格式: "Unexpected token } in JSON at position 10"
  // 或: "Expected ',' after property value in JSON at line 2 column 3"
  // 或: "Unexpected token... is not valid JSON" (无位置信息)

  const positionMatch = message.match(/position (\d+)/)
  const lineColumnMatch = message.match(/line (\d+) column (\d+)/)

  if (lineColumnMatch) {
    return {
      error: message,
      line: parseInt(lineColumnMatch[1], 10),
      column: parseInt(lineColumnMatch[2], 10),
    }
  }

  if (positionMatch) {
    const position = parseInt(positionMatch[1], 10)
    const { line, column } = getLineAndColumn(input, position)
    return {
      error: message,
      line,
      column,
    }
  }

  // 如果没有位置信息，尝试从输入中推断
  // 查找可能的错误位置（通常在最后一个非空字符附近）
  const { line, column } = inferErrorPosition(input)
  return {
    error: message,
    line,
    column,
  }
}

/**
 * 辅助函数：推断错误位置
 * 当错误消息不包含位置信息时使用启发式方法
 */
function inferErrorPosition(input: string): { line: number; column: number } {
  const lines = input.split('\n')
  let lastNonEmptyLine = 1
  let lastNonEmptyColumn = 1

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed.length > 0) {
      lastNonEmptyLine = i + 1
      // 找到该行最后一个非空字符的位置
      lastNonEmptyColumn = lines[i].length
    }
  }

  return {
    line: lastNonEmptyLine,
    column: lastNonEmptyColumn,
  }
}

/**
 * 辅助函数：根据位置计算行号和列号
 */
function getLineAndColumn(input: string, position: number): { line: number; column: number } {
  const lines = input.substring(0, position).split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}
