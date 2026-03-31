import { describe, it, expect } from 'vitest'
import { explain } from './explainer'

describe('Cron Explainer', () => {
  it('应该解释每天执行', () => {
    const result = explain('0 0 12 * * ?')
    expect(result.description).toContain('每天')
  })

  it('应该解释每小时执行', () => {
    const result = explain('0 0 * * * ?')
    expect(result.description).toContain('每小时')
  })

  it('应该解释每5分钟执行', () => {
    const result = explain('0 */5 * * * ?')
    expect(result.description).toContain('每 5 分钟')
  })

  it('应该解释工作日执行', () => {
    const result = explain('0 0 9 * * 1-5')
    expect(result.description).toContain('工作日')
  })

  it('应该处理无效的表达式', () => {
    const result = explain('invalid cron')
    expect(result.description).toContain('无效')
  })

  it('应该解释每周执行', () => {
    const result = explain('0 0 12 ? * 1')
    expect(result.description).toContain('周一')
  })

  it('应该解释每月执行', () => {
    const result = explain('0 0 0 1 * ?')
    expect(result.description).toContain('每月1日')
  })

  it('应该解释特定时间执行', () => {
    const result = explain('0 30 14 * * ?')
    expect(result.description).toContain('14:30')
  })
})
