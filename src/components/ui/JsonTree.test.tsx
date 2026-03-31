import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JsonTree } from './JsonTree'

describe('JsonTree', () => {
  it('应该渲染简单的 JSON 对象', () => {
    const data = { name: 'John', age: 30, active: true }
    render(<JsonTree data={data} />)

    // 简单对象应该直接显示所有键值（因为只有一层）
    expect(screen.getByText('"name"')).toBeDefined()
    expect(screen.getByText('"John"')).toBeDefined()
    expect(screen.getByText('"age"')).toBeDefined()
    expect(screen.getByText('30')).toBeDefined()
  })

  it('应该渲染嵌套的 JSON 对象', () => {
    const data = {
      user: {
        name: 'John',
        address: {
          city: 'New York',
        },
      },
    }
    render(<JsonTree data={data} />)

    // 先点击全部展开
    const expandAllBtn = screen.getByText('全部展开')
    fireEvent.click(expandAllBtn)

    expect(screen.getByText('"user"')).toBeDefined()
    expect(screen.getByText('"name"')).toBeDefined()
    expect(screen.getByText('"address"')).toBeDefined()
    expect(screen.getByText('"city"')).toBeDefined()
  })

  it('应该渲染 JSON 数组', () => {
    const data = [1, 2, 3]
    render(<JsonTree data={data} />)

    // 数组索引会被渲染为带引号的字符串
    expect(screen.getByText('"0"')).toBeDefined()
    expect(screen.getByText('"1"')).toBeDefined()
    expect(screen.getByText('"2"')).toBeDefined()
    // 数字值
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
  })

  it('应该支持展开和折叠节点', () => {
    const data = {
      user: {
        name: 'John',
        age: 30,
      },
    }
    render(<JsonTree data={data} />)

    // 默认全部展开，应该能看到所有节点
    expect(screen.getByText('"user"')).toBeDefined()
    expect(screen.getByText('"name"')).toBeDefined()
    expect(screen.getByText('"age"')).toBeDefined()

    // 点击 "user" 节点来折叠它
    const userNode = screen.getByText('"user"').closest('div')
    if (userNode) {
      fireEvent.click(userNode)
    }

    // 折叠后子节点应该不可见
    expect(screen.queryByText('"name"')).toBeNull()

    // 再次点击 "user" 节点来展开它
    if (userNode) {
      fireEvent.click(userNode)
    }

    // 展开后应该显示子内容
    expect(screen.getByText('"name"')).toBeDefined()
  })

  it('应该渲染 null 值', () => {
    const data = { value: null }
    render(<JsonTree data={data} />)

    expect(screen.getByText('"value"')).toBeDefined()
    expect(screen.getByText('null')).toBeDefined()
  })

  it('应该支持全部展开按钮', () => {
    const data = {
      level1: {
        level2: {
          level3: 'deep',
        },
      },
    }
    render(<JsonTree data={data} />)

    const expandAllBtn = screen.getByText('全部展开')
    expect(expandAllBtn).toBeDefined()

    fireEvent.click(expandAllBtn)
    expect(screen.getByText('"deep"')).toBeDefined()
  })

  it('应该支持全部折叠按钮', () => {
    const data = {
      user: {
        name: 'John',
      },
    }
    render(<JsonTree data={data} />)

    // 先展开所有
    const expandAllBtn = screen.getByText('全部展开')
    fireEvent.click(expandAllBtn)
    expect(screen.getByText('"John"')).toBeDefined()

    // 再折叠所有
    const collapseAllBtn = screen.getByText('全部折叠')
    expect(collapseAllBtn).toBeDefined()
    fireEvent.click(collapseAllBtn)

    // 折叠后不应该显示具体的值
    expect(screen.queryByText('"John"')).toBeNull()
  })

  it('应该正确渲染不同类型的值', () => {
    const data = {
      string: 'value',
      number: 42,
      boolean: true,
      null: null,
    }
    render(<JsonTree data={data} />)

    expect(screen.getByText('"string"')).toBeDefined()
    expect(screen.getByText('"value"')).toBeDefined()
    expect(screen.getByText('"number"')).toBeDefined()
    expect(screen.getByText('42')).toBeDefined()
    expect(screen.getByText('"boolean"')).toBeDefined()
    expect(screen.getByText('true')).toBeDefined()
    expect(screen.getByText('"null"')).toBeDefined()
    expect(screen.getByText('null')).toBeDefined()
  })

  it('应该渲染空对象和空数组', () => {
    const data = {
      emptyObj: {},
      emptyArray: [],
    }
    render(<JsonTree data={data} />)

    expect(screen.getByText('"emptyObj"')).toBeDefined()
    expect(screen.getByText('"emptyArray"')).toBeDefined()
  })
})
