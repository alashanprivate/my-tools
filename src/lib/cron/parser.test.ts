import { describe, it, expect } from 'vitest'
import { parse } from './parser'

describe('Cron Parser', () => {
  it('应该解析标准的6段格式', () => {
    const result = parse('0 0 12 * * ?')
    expect(result.format).toBe('6-part')
    expect(result.parts).toHaveLength(6)
    expect(result.raw).toBe('0 0 12 * * ?')
  })

  it('应该解析5段格式', () => {
    const result = parse('0 12 * * *')
    expect(result.format).toBe('5-part')
    // 5段格式在内部会被转换为6段（添加秒字段）
    expect(result.parts).toHaveLength(6)
  })

  it('应该正确解析通配符 *', () => {
    const result = parse('* * * * *')
    const minutePart = result.parts.find(p => p.field === 'minute')
    expect(minutePart?.type).toBe('all')
    expect(minutePart?.raw).toBe('*')
  })

  it('应该正确解析具体值', () => {
    const result = parse('5 10 12 * * *')
    const secondPart = result.parts.find(p => p.field === 'second')
    expect(secondPart?.type).toBe('specific')
    expect(secondPart?.values).toEqual([5])
  })

  it('应该正确解析列表值', () => {
    // 使用6段格式测试：秒 分 时 日 月 周
    const result = parse('0 1,2,3 * * * *')
    const minutePart = result.parts.find(p => p.field === 'minute')
    expect(minutePart?.type).toBe('list')
    expect(minutePart?.values).toEqual([1, 2, 3])
  })

  it('应该正确解析范围', () => {
    const result = parse('0 0 9-17 * * *')
    const hourPart = result.parts.find(p => p.field === 'hour')
    expect(hourPart?.type).toBe('range')
    expect(hourPart?.range).toEqual({ min: 9, max: 17 })
  })

  it('应该正确解析步长', () => {
    const result = parse('*/5 * * * *')
    const minutePart = result.parts.find(p => p.field === 'minute')
    expect(minutePart?.type).toBe('step')
    expect(minutePart?.step).toBe(5)
  })

  it('应该拒绝空字符串', () => {
    expect(() => parse('')).toThrow()
  })

  it('应该拒绝段数不正确的表达式', () => {
    expect(() => parse('0 0')).toThrow()
    expect(() => parse('0 0 12 * * ? extra')).toThrow()
  })
})
