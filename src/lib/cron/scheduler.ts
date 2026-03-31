import { parse } from './parser'
import type { ScheduleResult } from './types'

/**
 * 计算 Cron 表达式的未来执行时间
 * @param expression Cron 表达式
 * @param startDate 起始时间
 * @param count 计算次数
 */
export function schedule(
  expression: string,
  startDate: Date = new Date(),
  count: number = 5
): ScheduleResult {
  const parsed = parse(expression)
  const nextRuns: Date[] = []

  let currentDate = new Date(startDate)
  // 重置秒数为 0，然后前进到下一分钟
  currentDate.setSeconds(0)
  currentDate.setMinutes(currentDate.getMinutes() + 1)

  let maxIterations = count * 10000 // 防止无限循环
  let iterations = 0

  while (nextRuns.length < count && iterations < maxIterations) {
    iterations++

    // 检查当前时间是否匹配所有字段
    if (matchesAllFields(parsed, currentDate)) {
      nextRuns.push(new Date(currentDate))
    }

    // 前进到下一分钟
    currentDate.setMinutes(currentDate.getMinutes() + 1)

    // 处理溢出（Date 对象会自动处理）
    if (currentDate.getMinutes() === 0) {
      // 如果分钟归零，说明可能跨小时、日、月、年
    }
  }

  return {
    expression,
    nextRuns,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

/**
 * 检查给定时间是否匹配所有解析的字段
 */
function matchesAllFields(parsed: ReturnType<typeof parse>, date: Date): boolean {
  const values = {
    second: date.getSeconds(),
    minute: date.getMinutes(),
    hour: date.getHours(),
    day: date.getDate(),
    month: date.getMonth() + 1, // Date.getMonth() 返回 0-11
    weekday: date.getDay()       // 0=周日, 6=周六
  }

  // 检查 day 和 weekday 字段是否为 '?'（互斥）
  const dayPart = parsed.parts.find(p => p.field === 'day')
  const weekdayPart = parsed.parts.find(p => p.field === 'weekday')
  const dayIsIgnored = dayPart?.raw === '?'
  const weekdayIsIgnored = weekdayPart?.raw === '?'

  return parsed.parts.every(part => {
    const fieldValue = values[part.field]

    // 处理 day 和 weekday 的互斥关系
    if (part.field === 'day' && dayIsIgnored) {
      return true
    }
    if (part.field === 'weekday' && weekdayIsIgnored) {
      return true
    }

    switch (part.type) {
      case 'all':
        return true

      case 'specific':
      case 'list':
      case 'range':
        // 这些类型都有 values 数组
        return part.values?.includes(fieldValue) ?? false

      case 'step':
        // 步长类型：如果有 values 数组，直接使用
        if (part.values) {
          return part.values.includes(fieldValue)
        }
        // 如果没有 values 数组（如 */5），检查是否能被步长整除
        if (part.step) {
          return fieldValue % part.step === 0
        }
        return false

      default:
        return false
    }
  })
}
