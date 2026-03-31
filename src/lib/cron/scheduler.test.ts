import { describe, it, expect } from 'vitest'
import { schedule } from './scheduler'

describe('Cron Scheduler', () => {
  it('应该计算每天的执行时间', () => {
    const baseDate = new Date('2025-03-06T10:00:00')
    const result = schedule('0 0 12 * * ?', baseDate, 5)

    expect(result.nextRuns).toHaveLength(5)
    expect(result.nextRuns[0]).toEqual(new Date('2025-03-06T12:00:00'))
  })

  it('应该计算每小时的执行时间', () => {
    const baseDate = new Date('2025-03-06T10:30:00')
    const result = schedule('0 0 * * * ?', baseDate, 3)

    expect(result.nextRuns[0]).toEqual(new Date('2025-03-06T11:00:00'))
    expect(result.nextRuns[1]).toEqual(new Date('2025-03-06T12:00:00'))
    expect(result.nextRuns[2]).toEqual(new Date('2025-03-06T13:00:00'))
  })

  it('应该计算每5分钟的执行时间', () => {
    const baseDate = new Date('2025-03-06T10:03:00')
    const result = schedule('0 */5 * * * ?', baseDate, 3)

    expect(result.nextRuns[0]).toEqual(new Date('2025-03-06T10:05:00'))
    expect(result.nextRuns[1]).toEqual(new Date('2025-03-06T10:10:00'))
  })

  it('应该正确处理月份跨越', () => {
    const baseDate = new Date('2025-03-31T23:00:00')
    const result = schedule('0 0 0 * * ?', baseDate, 3)

    expect(result.nextRuns[0].getDate()).toBe(1) // 下个月第一天
  })

  it('应该返回时区信息', () => {
    const baseDate = new Date('2025-03-06T10:00:00')
    const result = schedule('0 0 * * * ?', baseDate, 1)

    expect(result.timezone).toBeDefined()
  })
})
