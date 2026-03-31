import { describe, it, expect } from 'vitest'
import { sm3Hash } from './sm3'

describe('SM3 哈希算法', () => {
  it('应该对空字符串计算正确的SM3哈希值', () => {
    const result = sm3Hash('')
    // SM3标准测试向量：空字符串的哈希值
    expect(result).toBe('1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b')
  })

  it('应该对中文字符串计算正确的SM3哈希值', () => {
    const result = sm3Hash('你好世界')
    expect(result).toMatch(/^[a-f0-9]{64}$/i)
    expect(result.length).toBe(64)
  })

  it('应该对英文字符串计算正确的SM3哈希值', () => {
    const result = sm3Hash('Hello World')
    expect(result).toMatch(/^[a-f0-9]{64}$/i)
    expect(result.length).toBe(64)
  })

  it('相同输入应该产生相同的哈希值', () => {
    const input = 'test data'
    const result1 = sm3Hash(input)
    const result2 = sm3Hash(input)
    expect(result1).toBe(result2)
  })

  it('不同输入应该产生不同的哈希值', () => {
    const result1 = sm3Hash('test data 1')
    const result2 = sm3Hash('test data 2')
    expect(result1).not.toBe(result2)
  })
})
