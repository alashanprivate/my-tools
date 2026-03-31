import { describe, it, expect } from 'vitest'
import { validate } from './validator'

describe('Cron Validator', () => {
  it('应该验证有效的6段表达式', () => {
    const result = validate('0 0 12 * * ?')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('应该验证有效的5段表达式', () => {
    const result = validate('0 12 * * *')
    expect(result.valid).toBe(true)
  })

  it('应该拒绝空表达式', () => {
    const result = validate('')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('不能为空')
  })

  it('应该拒绝错误段数的表达式', () => {
    const result = validate('0 0')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('段数')
  })

  it('应该拒绝超出范围的小时值', () => {
    const result = validate('0 0 25 * * ?')
    expect(result.valid).toBe(false)
    expect(result.field).toBe('hour')
  })

  it('应该拒绝超出范围的月份', () => {
    const result = validate('0 0 12 * 13 ?')
    expect(result.valid).toBe(false)
    expect(result.field).toBe('month')
  })

  it('应该拒绝无效的字符', () => {
    const result = validate('0 0 12 x * ?')
    expect(result.valid).toBe(false)
  })

  it('应该接受通配符 *', () => {
    const result = validate('* * * * *')
    expect(result.valid).toBe(true)
  })

  it('应该接受列表值', () => {
    const result = validate('0 1,2,3 * * *')
    expect(result.valid).toBe(true)
  })

  it('应该接受范围值', () => {
    const result = validate('0 0 9-17 * * *')
    expect(result.valid).toBe(true)
  })

  it('应该接受步长', () => {
    const result = validate('*/5 * * * *')
    expect(result.valid).toBe(true)
  })

  it('应该拒绝反向范围', () => {
    const result = validate('0 0 17-9 * * *')
    expect(result.valid).toBe(false)
  })
})
