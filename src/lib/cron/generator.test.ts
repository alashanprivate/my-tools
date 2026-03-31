import { describe, it, expect } from 'vitest'
import { generate } from './generator'

describe('Cron Generator', () => {
  it('应该生成完整的6段表达式', () => {
    const config = {
      second: '0',
      minute: '0',
      hour: '12',
      day: '*',
      month: '*',
      weekday: '?'
    }
    const result = generate(config)
    expect(result).toBe('0 0 12 * * ?')
  })

  it('应该支持预设：每天', () => {
    const result = generate({ preset: 'daily' })
    expect(result).toContain('0 0')
  })

  it('应该支持预设：每小时', () => {
    const result = generate({ preset: 'hourly' })
    expect(result).toBe('0 0 * * * ?')
  })

  it('应该支持预设：每5分钟', () => {
    const result = generate({ preset: 'every5min' })
    expect(result).toBe('0 */5 * * * ?')
  })
})
