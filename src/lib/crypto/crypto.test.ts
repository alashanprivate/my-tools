import { describe, it, expect } from 'vitest'
import {
  base64Encode,
  base64Decode,
  hash,
  aesEncrypt,
  aesDecrypt,
} from './index'

describe('base64Encode', () => {
  it('should encode simple string', () => {
    const result = base64Encode('Hello World')
    expect(result.success).toBe(true)
    expect(result.result).toBe('SGVsbG8gV29ybGQ=')
  })

  it('should encode special characters', () => {
    const result = base64Encode('你好世界 🌍')
    expect(result.success).toBe(true)
    expect(result.result).toBeTruthy()
  })

  it('should encode empty string', () => {
    const result = base64Encode('')
    expect(result.success).toBe(true)
    expect(result.result).toBe('')
  })

  it('should handle unicode correctly', () => {
    const input = '🚀 Rocket'
    const result = base64Encode(input)
    expect(result.success).toBe(true)
    // 解码后应该得到原文
    const decoded = atob(result.result!)
    const bytes = new Uint8Array([...decoded].map((c) => c.charCodeAt(0)))
    const decoder = new TextDecoder()
    expect(decoder.decode(bytes)).toBe(input)
  })
})

describe('base64Decode', () => {
  it('should decode base64 string', () => {
    const result = base64Decode('SGVsbG8gV29ybGQ=')
    expect(result.success).toBe(true)
    expect(result.result).toBe('Hello World')
  })

  it('should decode unicode characters', () => {
    const result = base64Decode('5L2g5aW95LiW55WMIF4vDA==')
    expect(result.success).toBe(true)
    expect(result.result).toBeTruthy()
  })

  it('should return error for invalid base64', () => {
    const result = base64Decode('Invalid!Base64')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should decode empty string', () => {
    const result = base64Decode('')
    expect(result.success).toBe(true)
    expect(result.result).toBe('')
  })

  it('should encode and decode symmetric', () => {
    const original = 'Test string with 特殊字符 🎉'
    const encoded = base64Encode(original)
    const decoded = base64Decode(encoded.result!)
    expect(decoded.success).toBe(true)
    expect(decoded.result).toBe(original)
  })
})

describe('hash', () => {
  describe('md5', () => {
    it('should generate correct md5 hash', () => {
      const result = hash('Hello World', 'md5')
      expect(result.success).toBe(true)
      expect(result.result).toBe('b10a8db164e0754105b7a99be72e3fe5')
    })

    it('should hash empty string', () => {
      const result = hash('', 'md5')
      expect(result.success).toBe(true)
      expect(result.result).toBe('d41d8cd98f00b204e9800998ecf8427e')
    })
  })

  describe('sha1', () => {
    it('should generate correct sha1 hash', () => {
      const result = hash('Hello World', 'sha1')
      expect(result.success).toBe(true)
      expect(result.result).toBe('0a4d55a8d778e5022fab701977c5d840bbc486d0')
    })
  })

  describe('sha256', () => {
    it('should generate correct sha256 hash', () => {
      const result = hash('Hello World', 'sha256')
      expect(result.success).toBe(true)
      expect(result.result).toBe(
        'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
      )
    })
  })

  describe('sha512', () => {
    it('should generate correct sha512 hash', () => {
      const result = hash('Hello World', 'sha512')
      expect(result.success).toBe(true)
      expect(result.result).toBe(
        '2c74fd17edafd80e8447b0d46741ee243b7eb74dd2149a0ab1b9246fb30382f27e853d8585719e0e67cbda0daa8f51671064615d645ae27acb15bfb1447f459b'
      )
    })
  })

  it('should hash different inputs to different values', () => {
    const result1 = hash('Hello', 'md5')
    const result2 = hash('World', 'md5')
    expect(result1.result).not.toBe(result2.result)
  })
})

describe('aesEncrypt', () => {
  it('should encrypt with default options', () => {
    const result = aesEncrypt('Hello World', { key: 'secret123' })
    expect(result.success).toBe(true)
    expect(result.result).toBeTruthy()
    expect(result.result).not.toBe('Hello World')
  })

  it('should decrypt back to original', () => {
    const original = 'Secret message 🤫'
    const key = 'my-secret-key'
    const encrypted = aesEncrypt(original, { key })
    const decrypted = aesDecrypt(encrypted.result!, { key })

    expect(decrypted.success).toBe(true)
    expect(decrypted.result).toBe(original)
  })

  it('should work with custom IV', () => {
    const result = aesEncrypt('Test', {
      key: 'secret123',
      iv: 'initialization',
    })
    expect(result.success).toBe(true)
    expect(result.result).toBeTruthy()
  })

  it('should return error for empty key', () => {
    const result = aesEncrypt('Hello', { key: '' })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should handle empty plaintext', () => {
    const result = aesEncrypt('', { key: 'secret' })
    expect(result.success).toBe(true)
  })
})

describe('aesDecrypt', () => {
  it('should decrypt encrypted data', () => {
    const original = 'Test message'
    const key = 'test-key-123'
    const encrypted = aesEncrypt(original, { key })
    const decrypted = aesDecrypt(encrypted.result!, { key })

    expect(decrypted.success).toBe(true)
    expect(decrypted.result).toBe(original)
  })

  it('should fail with wrong key', () => {
    const encrypted = aesEncrypt('Secret', { key: 'correct-key' })
    const decrypted = aesDecrypt(encrypted.result!, { key: 'wrong-key' })

    // 使用错误的密钥应该解密出乱码或失败
    expect(decrypted.result).not.toBe('Secret')
  })

  it('should fail with invalid ciphertext', () => {
    const result = aesDecrypt('invalid-ciphertext', { key: 'secret' })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should return error for empty key', () => {
    const result = aesDecrypt('some-ciphertext', { key: '' })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should work with custom IV', () => {
    const iv = 'initialization'
    const key = 'secret-key'
    const encrypted = aesEncrypt('Test', { key, iv })
    const decrypted = aesDecrypt(encrypted.result!, { key, iv })

    expect(decrypted.success).toBe(true)
    expect(decrypted.result).toBe('Test')
  })
})
