import { parse } from './parser'
import type { ExplanationResult, ParsedField } from './types'

/**
 * 将 Cron 表达式解释为中文描述
 */
export function explain(expression: string): ExplanationResult {
  try {
    const parsed = parse(expression)
    const description = generateDescription(parsed)

    return {
      expression,
      description,
      nextRuns: []
    }
  } catch (error) {
    return {
      expression,
      description: `无效的 Cron 表达式: ${error instanceof Error ? error.message : '未知错误'}`,
      nextRuns: []
    }
  }
}

/**
 * 生成中文描述
 */
function generateDescription(parsed: ReturnType<typeof parse>): string {
  const parts = parsed.parts
  const minutePart = getPart(parts, 'minute')
  const hourPart = getPart(parts, 'hour')
  const dayPart = getPart(parts, 'day')
  const weekdayPart = getPart(parts, 'weekday')

  let description = ''

  // 处理每分钟执行
  if (minutePart?.type === 'all' && hourPart?.type === 'all') {
    description = '每分钟执行'
    return description
  }

  // 处理每 N 分钟执行
  if (minutePart?.type === 'step' && hourPart?.type === 'all') {
    description = `每 ${minutePart.step} 分钟执行`
    return description
  }

  // 处理每小时执行
  if (minutePart?.type === 'specific' && minutePart.values?.[0] === 0 &&
      hourPart?.type === 'all') {
    description = '每小时执行'
    return description
  }

  // 处理工作日特定时间
  if (weekdayPart?.type === 'range' &&
      weekdayPart.range?.min === 1 &&
      weekdayPart.range?.max === 5) {
    if (hourPart?.type === 'specific' && minutePart?.type === 'specific') {
      const hour = hourPart.values?.[0] || 0
      const minute = minutePart.values?.[0] || 0
      description = `工作日 ${formatTime(hour, minute)} 执行`
      return description
    }
  }

  // 处理每周执行
  if (dayPart?.type === 'all' && weekdayPart?.type === 'specific') {
    const weekday = weekdayPart.values?.[0]
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekdayName = weekdayNames[weekday ?? 0]
    if (hourPart?.type === 'specific' && minutePart?.type === 'specific') {
      const hour = hourPart.values?.[0] || 0
      const minute = minutePart.values?.[0] || 0
      description = `每周${weekdayName} ${formatTime(hour, minute)} 执行`
      return description
    }
  }

  // 处理每月执行
  if (dayPart?.type === 'specific' && dayPart.values?.[0] === 1) {
    if (hourPart?.type === 'specific' && minutePart?.type === 'specific') {
      const hour = hourPart.values?.[0] || 0
      const minute = minutePart.values?.[0] || 0
      description = `每月1日 ${formatTime(hour, minute)} 执行`
      return description
    }
  }

  // 处理每天特定时间
  if (dayPart?.type === 'all' && weekdayPart?.type === 'all') {
    if (hourPart?.type === 'specific' && minutePart?.type === 'specific') {
      const hour = hourPart.values?.[0] || 0
      const minute = minutePart.values?.[0] || 0
      description = `每天 ${formatTime(hour, minute)} 执行`
      return description
    }
  }

  // 默认：通用描述
  return generateGenericDescription(parts)
}

/**
 * 生成通用描述
 */
function generateGenericDescription(parts: ParsedField[]): string {
  const minutePart = getPart(parts, 'minute')
  const hourPart = getPart(parts, 'hour')
  const weekdayPart = getPart(parts, 'weekday')

  let description = ''

  // 小时
  if (hourPart?.type === 'all') {
    description += '每小时'
  } else if (hourPart?.type === 'specific') {
    description += `每天 ${formatTime(hourPart.values?.[0] || 0, 0)}`
  }

  // 分钟步长
  if (minutePart?.type === 'step' && minutePart.step) {
    description = `每 ${minutePart.step} 分钟`
  }

  // 工作日
  if (weekdayPart?.type === 'range' &&
      weekdayPart.range?.min === 1 &&
      weekdayPart.range?.max === 5) {
    description += '（仅工作日）'
  }

  description += '执行'

  return description || '按照指定时间执行'
}

/**
 * 获取指定字段
 */
function getPart(parts: ParsedField[], field: string): ParsedField | undefined {
  return parts.find(p => p.field === field)
}

/**
 * 格式化时间为 HH:MM
 */
function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
