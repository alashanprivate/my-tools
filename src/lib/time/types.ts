/**
 * 时间单位类型
 */
export type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

/**
 * 时间戳转换结果
 */
export interface TimestampConvertResult {
  timestamp: number
  datetime: string
  iso: string
  date: string
  time: string
}

/**
 * 日期计算选项
 */
export interface DateCalculateOptions {
  value: number
  unit: TimeUnit
  operation: 'add' | 'subtract'
}

/**
 * 日期差值结果
 */
export interface DateDiffResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalDays: number
  totalHours: number
  totalMinutes: number
  totalSeconds: number
}

/**
 * 时间单位换算结果
 */
export interface TimeConvertResult {
  seconds: number
  minutes: number
  hours: number
  days: number
  weeks: number
}
