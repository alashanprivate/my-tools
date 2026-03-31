import { describe, it, expect } from 'vitest'
import { sm4Encrypt, sm4Decrypt } from './sm4'

describe('SM4 对称加密算法', () => {
  const key = '0123456789abcdeffedcba9876543210'

  it('应该加密并解密英文字符串', () => {
    const plaintext = 'Hello World'
    const encrypted = sm4Encrypt(plaintext, key)
    const decrypted = sm4Decrypt(encrypted, key)

    expect(encrypted).toBeTruthy()
    expect(encrypted).not.toBe(plaintext)
    expect(decrypted).toBe(plaintext)
  })

  it('应该加密并解密中文字符串', () => {
    const plaintext = '你好世界'
    const encrypted = sm4Encrypt(plaintext, key)
    const decrypted = sm4Decrypt(encrypted, key)

    expect(encrypted).toBeTruthy()
    expect(encrypted).not.toBe(plaintext)
    expect(decrypted).toBe(plaintext)
  })

  it('应该加密并解密包含特殊字符的字符串', () => {
    const plaintext = 'Test@#123!测试'
    const encrypted = sm4Encrypt(plaintext, key)
    const decrypted = sm4Decrypt(encrypted, key)

    expect(encrypted).toBeTruthy()
    expect(encrypted).not.toBe(plaintext)
    expect(decrypted).toBe(plaintext)
  })

  it('应该加密并解密空字符串', () => {
    const plaintext = ''
    const encrypted = sm4Encrypt(plaintext, key)
    const decrypted = sm4Decrypt(encrypted, key)

    expect(encrypted).toBeTruthy()
    expect(decrypted).toBe(plaintext)
  })

  it('相同明文和密钥应该产生相同密文', () => {
    const plaintext = 'test data'
    const encrypted1 = sm4Encrypt(plaintext, key)
    const encrypted2 = sm4Encrypt(plaintext, key)

    expect(encrypted1).toBe(encrypted2)
  })

  it('不同密钥应该产生不同密文', () => {
    const plaintext = 'test data'
    const key1 = '0123456789abcdeffedcba9876543210'
    const key2 = 'fedcba98765432100123456789abcdef'

    const encrypted1 = sm4Encrypt(plaintext, key1)
    const encrypted2 = sm4Encrypt(plaintext, key2)

    expect(encrypted1).not.toBe(encrypted2)
  })

  it('使用错误的密钥解密应该抛出异常', () => {
    const plaintext = 'secret data'
    const correctKey = '0123456789abcdeffedcba9876543210'
    const wrongKey = 'fedcba98765432100123456789abcdef'

    const encrypted = sm4Encrypt(plaintext, correctKey)

    expect(() => sm4Decrypt(encrypted, wrongKey)).toThrow()
  })
})
