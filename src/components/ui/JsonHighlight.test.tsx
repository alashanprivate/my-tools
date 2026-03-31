import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { JsonHighlight } from './JsonHighlight'

describe('JsonHighlight', () => {
  it('应该高亮显示 JSON', () => {
    const jsonString = '{"name": "John", "age": 30, "active": true, "city": null}'
    const { container } = render(<JsonHighlight json={jsonString} />)

    expect(container.innerHTML).toContain('class=')
    expect(container.innerHTML).toContain('span')
  })

  it('应该处理无效 JSON', () => {
    const invalidJson = '{invalid json}'
    const { container } = render(<JsonHighlight json={invalidJson} />)

    expect(container.textContent).toContain('{invalid json}')
  })

  it('应该处理空字符串', () => {
    const { container } = render(<JsonHighlight json="" />)

    expect(container.textContent).toBe('')
  })

  it('应该高亮不同类型的值', () => {
    const jsonString = '{"string": "value", "number": 42, "boolean": true, "null": null}'
    const { container } = render(<JsonHighlight json={jsonString} />)

    const html = container.innerHTML
    expect(html).toContain('text-green')  // 字符串（包括键名和值）
    expect(html).toContain('text-blue')   // 数字
    expect(html).toContain('text-red')    // 布尔值
    expect(html).toContain('text-gray')   // null
    expect(html).toContain('span')        // 确保使用了 span 标签
  })

  it('应该正确处理嵌套 JSON', () => {
    const nestedJson = '{"user": {"name": "John", "age": 30}}'
    const { container } = render(<JsonHighlight json={nestedJson} />)

    expect(container.innerHTML).toContain('span')
  })
})
