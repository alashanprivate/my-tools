import type {
  TimestampConvertResult,
  DateCalculateOptions,
  DateDiffResult,
  TimeConvertResult,
} from './types'

/**
 * 将时间戳转换为日期时间对象
 */
export function timestampToDatetime(timestamp: number): TimestampConvertResult {
  const date = new Date(timestamp)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  const datetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  const iso = date.toISOString()
  const dateStr = `${year}-${month}-${day}`
  const timeStr = `${hours}:${minutes}:${seconds}`

  return {
    timestamp,
    datetime,
    iso,
    date: dateStr,
    time: timeStr,
  }
}

/**
 * 将日期时间字符串转换为时间戳
 */
export function datetimeToTimestamp(datetime: string): number {
  const date = new Date(datetime)
  return Math.floor(date.getTime() / 1000)
}

/**
 * 获取当前时间戳（秒）
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * 时区转换
 */
export function convertTimeZone(
  timestamp: number,
  _fromTimeZone: string,
  toTimeZone: string
): { datetime: string; timestamp: number } {
  const date = new Date(timestamp * 1000)

  // 转换为目标时区
  const toDateTime = date.toLocaleString('en-US', { timeZone: toTimeZone })

  // 计算目标时区的时间戳
  const targetDate = new Date(toDateTime)
  const targetTimestamp = Math.floor(targetDate.getTime() / 1000)

  return {
    datetime: toDateTime,
    timestamp: targetTimestamp,
  }
}

/**
 * 常用时区列表
 */
export const TIME_ZONES = [
  { value: 'UTC', label: 'UTC (协调世界时)', offset: 0 },
  { value: 'Asia/Shanghai', label: '北京 (UTC+8)', offset: 8 },
  { value: 'Asia/Tokyo', label: '东京 (UTC+9)', offset: 9 },
  { value: 'Asia/Seoul', label: '首尔 (UTC+9)', offset: 9 },
  { value: 'Asia/Singapore', label: '新加坡 (UTC+8)', offset: 8 },
  { value: 'Asia/Hong_Kong', label: '香港 (UTC+8)', offset: 8 },
  { value: 'Asia/Taipei', label: '台北 (UTC+8)', offset: 8 },
  { value: 'Europe/London', label: '伦敦 (UTC+0/BST+1)', offset: 0 },
  { value: 'Europe/Paris', label: '巴黎 (UTC+1/CEST+2)', offset: 1 },
  { value: 'Europe/Berlin', label: '柏林 (UTC+1/CEST+2)', offset: 1 },
  { value: 'Europe/Moscow', label: '莫斯科 (UTC+3)', offset: 3 },
  { value: 'America/New_York', label: '纽约 (UTC-5/EST-4)', offset: -5 },
  { value: 'America/Los_Angeles', label: '洛杉矶 (UTC-8/PST-7)', offset: -8 },
  { value: 'America/Chicago', label: '芝加哥 (UTC-6/CST-5)', offset: -6 },
  { value: 'America/Toronto', label: '多伦多 (UTC-5/EST-4)', offset: -5 },
  { value: 'America/Vancouver', label: '温哥华 (UTC-8/PST-7)', offset: -8 },
  { value: 'Australia/Sydney', label: '悉尼 (UTC+10/AEDST+11)', offset: 10 },
] as const

/**
 * 日期计算（加减）
 */
export function calculateDate(options: DateCalculateOptions): string {
  const { value, unit, operation } = options
  const date = new Date()

  const multiplier = operation === 'add' ? 1 : -1

  switch (unit) {
    case 'second':
      date.setSeconds(date.getSeconds() + value * multiplier)
      break
    case 'minute':
      date.setMinutes(date.getMinutes() + value * multiplier)
      break
    case 'hour':
      date.setHours(date.getHours() + value * multiplier)
      break
    case 'day':
      date.setDate(date.getDate() + value * multiplier)
      break
    case 'week':
      date.setDate(date.getDate() + value * 7 * multiplier)
      break
    case 'month':
      date.setMonth(date.getMonth() + value * multiplier)
      break
    case 'year':
      date.setFullYear(date.getFullYear() + value * multiplier)
      break
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 从指定日期开始计算
 */
export function calculateDateFromDate(
  startDate: string,
  options: DateCalculateOptions
): string {
  const date = new Date(startDate)
  const { value, unit, operation } = options

  const multiplier = operation === 'add' ? 1 : -1

  switch (unit) {
    case 'second':
      date.setSeconds(date.getSeconds() + value * multiplier)
      break
    case 'minute':
      date.setMinutes(date.getMinutes() + value * multiplier)
      break
    case 'hour':
      date.setHours(date.getHours() + value * multiplier)
      break
    case 'day':
      date.setDate(date.getDate() + value * multiplier)
      break
    case 'week':
      date.setDate(date.getDate() + value * 7 * multiplier)
      break
    case 'month':
      date.setMonth(date.getMonth() + value * multiplier)
      break
    case 'year':
      date.setFullYear(date.getFullYear() + value * multiplier)
      break
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 计算两个日期之间的差值
 */
export function dateDiff(date1: string, date2: string): DateDiffResult {
  const d1 = new Date(date1)
  const d2 = new Date(date2)

  const diffMs = Math.abs(d2.getTime() - d1.getTime())

  const totalSeconds = Math.floor(diffMs / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalDays = Math.floor(totalHours / 24)

  const days = Math.floor(totalDays)
  const hours = Math.floor(totalHours % 24)
  const minutes = Math.floor(totalMinutes % 60)
  const seconds = Math.floor(totalSeconds % 60)

  return {
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds,
  }
}

/**
 * 时间单位换算（将秒数换算为其他单位）
 */
export function convertTimeUnits(seconds: number): TimeConvertResult {
  return {
    seconds,
    minutes: seconds / 60,
    hours: seconds / 3600,
    days: seconds / 86400,
    weeks: seconds / 604800,
  }
}

/**
 * 获取时区偏移量（小时）
 */
export function getTimeZoneOffset(timeZone: string): number {
  const tz = TIME_ZONES.find(t => t.value === timeZone)
  return tz?.offset || 0
}

/**
 * 格式化时区偏移量为字符串
 */
export function formatTimeZoneOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : ''
  return `UTC${sign}${offset}`
}

// 导出类型
export type {
  TimeUnit,
  TimestampConvertResult,
  DateCalculateOptions,
  DateDiffResult,
  TimeConvertResult,
} from './types'
