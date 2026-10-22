import { describe, it, expect } from 'vitest'
import {
  timestampToDatetime,
  datetimeToTimestamp,
  getCurrentTimestamp,
  convertTimeZone,
  calculateDate,
  calculateDateFromDate,
  dateDiff,
  convertTimeUnits,
  getTimeZoneOffset,
  formatTimeZoneOffset,
  TIME_ZONES,
} from './index'

/** 用本地时区构造时间，保证断言与时区无关 */
const localDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
) => new Date(year, month - 1, day, hour, minute, second).getTime()

describe('timestampToDatetime', () => {
  it('转换时间戳为各格式字符串', () => {
    const ts = localDate(2024, 1, 15, 10, 30, 45)
    const result = timestampToDatetime(ts)
    expect(result.timestamp).toBe(ts)
    expect(result.datetime).toBe('2024-01-15 10:30:45')
    expect(result.date).toBe('2024-01-15')
    expect(result.time).toBe('10:30:45')
  })

  it('单位数月/日/时分秒补零', () => {
    const ts = localDate(2024, 3, 5, 8, 5, 3)
    const result = timestampToDatetime(ts)
    expect(result.datetime).toBe('2024-03-05 08:05:03')
  })

  it('iso 为标准 UTC 格式', () => {
    const ts = localDate(2024, 1, 15, 10, 30, 45)
    const result = timestampToDatetime(ts)
    expect(result.iso).toBe(new Date(ts).toISOString())
  })
})

describe('datetimeToTimestamp', () => {
  it('解析本地日期时间字符串', () => {
    const ts = localDate(2024, 6, 1, 12, 0, 0)
    expect(datetimeToTimestamp('2024-06-01T12:00:00')).toBe(Math.floor(ts / 1000))
  })

  it('与 timestampToDatetime 互逆', () => {
    const original = localDate(2024, 9, 20, 18, 45, 30)
    const converted = timestampToDatetime(original)
    const back = datetimeToTimestamp(converted.iso)
    expect(back).toBe(Math.floor(original / 1000))
  })
})

describe('getCurrentTimestamp', () => {
  it('返回当前秒级时间戳', () => {
    const before = Math.floor(Date.now() / 1000)
    const result = getCurrentTimestamp()
    const after = Math.floor(Date.now() / 1000)
    expect(result).toBeGreaterThanOrEqual(before)
    expect(result).toBeLessThanOrEqual(after)
  })
})

describe('convertTimeZone', () => {
  it('返回目标时区的格式化时间', () => {
    const result = convertTimeZone(0, 'UTC', 'UTC')
    expect(typeof result.datetime).toBe('string')
    expect(result.datetime.length).toBeGreaterThan(0)
    expect(typeof result.timestamp).toBe('number')
    expect(Number.isFinite(result.timestamp)).toBe(true)
  })
})

describe('calculateDateFromDate', () => {
  const base = '2024-01-15T10:30:45'

  it('加天数', () => {
    expect(calculateDateFromDate(base, { value: 1, unit: 'day', operation: 'add' })).toBe(
      '2024-01-16 10:30:45'
    )
  })

  it('减天数', () => {
    expect(calculateDateFromDate(base, { value: 20, unit: 'day', operation: 'subtract' })).toBe(
      '2023-12-26 10:30:45'
    )
  })

  it('加周', () => {
    expect(calculateDateFromDate(base, { value: 2, unit: 'week', operation: 'add' })).toBe(
      '2024-01-29 10:30:45'
    )
  })

  it('加月（跨月）', () => {
    expect(calculateDateFromDate(base, { value: 1, unit: 'month', operation: 'add' })).toBe(
      '2024-02-15 10:30:45'
    )
  })

  it('加年', () => {
    expect(calculateDateFromDate(base, { value: 1, unit: 'year', operation: 'add' })).toBe(
      '2025-01-15 10:30:45'
    )
  })

  it('加小时/分钟/秒', () => {
    expect(calculateDateFromDate(base, { value: 2, unit: 'hour', operation: 'add' })).toBe(
      '2024-01-15 12:30:45'
    )
    expect(calculateDateFromDate(base, { value: 30, unit: 'minute', operation: 'add' })).toBe(
      '2024-01-15 11:00:45'
    )
    expect(calculateDateFromDate(base, { value: 15, unit: 'second', operation: 'add' })).toBe(
      '2024-01-15 10:31:00'
    )
  })
})

describe('calculateDate', () => {
  it('基于当前时间加减天数，返回格式化字符串', () => {
    const now = new Date()
    const result = calculateDate({ value: 1, unit: 'day', operation: 'add' })
    // 解析回 Date，与 now+1day 比较，容忍跨秒抖动
    const parsed = new Date(result.replace(' ', 'T'))
    const expected = now.getTime() + 24 * 3600 * 1000
    expect(Math.abs(parsed.getTime() - expected)).toBeLessThan(5000)
  })
})

describe('dateDiff', () => {
  it('计算两个日期的差值', () => {
    const result = dateDiff('2024-01-15T00:00:00', '2024-01-16T12:30:45')
    expect(result.days).toBe(1)
    expect(result.hours).toBe(12)
    expect(result.minutes).toBe(30)
    expect(result.seconds).toBe(45)
    expect(result.totalDays).toBe(1)
    expect(result.totalHours).toBe(36)
    expect(result.totalMinutes).toBe(2190)
    expect(result.totalSeconds).toBe(131445)
  })

  it('参数顺序不影响结果（取绝对值）', () => {
    const a = dateDiff('2024-01-20T00:00:00', '2024-01-15T00:00:00')
    const b = dateDiff('2024-01-15T00:00:00', '2024-01-20T00:00:00')
    expect(a).toEqual(b)
    expect(a.days).toBe(5)
  })

  it('相同日期差值为 0', () => {
    const result = dateDiff('2024-01-15T08:00:00', '2024-01-15T08:00:00')
    expect(result.totalSeconds).toBe(0)
  })
})

describe('convertTimeUnits', () => {
  it('将秒数换算为各单位', () => {
    const result = convertTimeUnits(86400)
    expect(result.seconds).toBe(86400)
    expect(result.minutes).toBe(1440)
    expect(result.hours).toBe(24)
    expect(result.days).toBe(1)
    expect(result.weeks).toBeCloseTo(1 / 7)
  })

  it('0 秒全部为 0', () => {
    const result = convertTimeUnits(0)
    expect(Object.values(result).every((v) => v === 0)).toBe(true)
  })
})

describe('时区工具', () => {
  it('TIME_ZONES 包含常用时区', () => {
    expect(TIME_ZONES.length).toBeGreaterThan(10)
    expect(TIME_ZONES.map((t) => t.value)).toContain('UTC')
    expect(TIME_ZONES.map((t) => t.value)).toContain('Asia/Shanghai')
  })

  it('getTimeZoneOffset 返回配置的偏移量', () => {
    expect(getTimeZoneOffset('UTC')).toBe(0)
    expect(getTimeZoneOffset('Asia/Shanghai')).toBe(8)
    expect(getTimeZoneOffset('America/Los_Angeles')).toBe(-8)
    expect(getTimeZoneOffset('Not/AZone')).toBe(0)
  })

  it('formatTimeZoneOffset 格式化', () => {
    expect(formatTimeZoneOffset(8)).toBe('UTC+8')
    expect(formatTimeZoneOffset(-5)).toBe('UTC-5')
    expect(formatTimeZoneOffset(0)).toBe('UTC+0')
  })
})
