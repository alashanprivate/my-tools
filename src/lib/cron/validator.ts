import { parse } from './parser'
import type { CronField, ValidationResult } from './types'

/**
 * 验证 Cron 表达式的有效性
 */
export function validate(expression: string): ValidationResult {
  try {
    parse(expression)
    return { valid: true }
  } catch (error) {
    if (error instanceof Error) {
      // 尝试从错误消息中提取字段信息
      const field = extractFieldFromError(error.message)
      return {
        valid: false,
        error: error.message,
        field
      }
    }
    return {
      valid: false,
      error: '未知的验证错误'
    }
  }
}

/**
 * 从错误消息中提取字段信息
 */
function extractFieldFromError(message: string): CronField | undefined {
  const fields: CronField[] = ['second', 'minute', 'hour', 'day', 'month', 'weekday']

  for (const field of fields) {
    // 中文错误消息：${field} 字段...
    if (message.includes(`${field} 字段`)) {
      return field
    }
    // 英文字段名（备用）
    if (message.toLowerCase().includes(field)) {
      return field
    }
  }

  return undefined
}
