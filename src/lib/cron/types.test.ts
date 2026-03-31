import { describe, it, expect } from 'vitest'
import { FIELD_RANGES, type CronField } from './types'

describe('Cron Types', () => {
  it('应该定义所有字段的正确范围', () => {
    expect(FIELD_RANGES.second).toEqual({ min: 0, max: 59 })
    expect(FIELD_RANGES.minute).toEqual({ min: 0, max: 59 })
    expect(FIELD_RANGES.hour).toEqual({ min: 0, max: 23 })
    expect(FIELD_RANGES.day).toEqual({ min: 1, max: 31 })
    expect(FIELD_RANGES.month).toEqual({ min: 1, max: 12 })
    expect(FIELD_RANGES.weekday).toEqual({ min: 0, max: 6 })
  })

  it('应该导出所有必要的类型', () => {
    // 这个测试确保类型定义存在且可用
    const field: CronField = 'minute'
    expect(field).toBe('minute')
  })
})
