import { describe, it, expect } from 'vitest'
import {
  sm2GenerateKeyPair,
  sm2Sign,
  sm2VerifySignature,
  sm2Encrypt,
  sm2Decrypt,
} from './sm2'

describe('SM2 椭圆曲线公钥密码算法 - 签名验签', () => {
  it('应该生成有效的密钥对', () => {
    const keyPair = sm2GenerateKeyPair()

    expect(keyPair).toBeDefined()
    expect(keyPair.publicKey).toBeTruthy()
    expect(keyPair.privateKey).toBeTruthy()
    expect(keyPair.publicKey.length).toBe(130) // 04 + 64字节x + 64字节y (十六进制)
    expect(keyPair.privateKey.length).toBe(64) // 32字节私钥 (十六进制)
  })

  it('应该签名并验证英文字符串', () => {
    const keyPair = sm2GenerateKeyPair()
    const message = 'Hello World'

    const signature = sm2Sign(message, keyPair.privateKey)
    const isValid = sm2VerifySignature(message, signature, keyPair.publicKey)

    expect(signature).toBeTruthy()
    expect(isValid).toBe(true)
  })

  it('应该签名并验证中文字符串', () => {
    const keyPair = sm2GenerateKeyPair()
    const message = '你好世界'

    const signature = sm2Sign(message, keyPair.privateKey)
    const isValid = sm2VerifySignature(message, signature, keyPair.publicKey)

    expect(signature).toBeTruthy()
    expect(isValid).toBe(true)
  })

  it('同一消息的多次签名都应该能被验证', () => {
    const keyPair = sm2GenerateKeyPair()
    const message = 'test message'

    const signature1 = sm2Sign(message, keyPair.privateKey)
    const signature2 = sm2Sign(message, keyPair.privateKey)

    // SM2签名包含随机数，每次签名结果不同，但都应该能验证通过
    expect(signature1).not.toBe(signature2)
    expect(sm2VerifySignature(message, signature1, keyPair.publicKey)).toBe(true)
    expect(sm2VerifySignature(message, signature2, keyPair.publicKey)).toBe(true)
  })

  it('不同消息的签名不能交叉验证', () => {
    const keyPair = sm2GenerateKeyPair()
    const message1 = 'message 1'
    const message2 = 'message 2'

    const signature1 = sm2Sign(message1, keyPair.privateKey)
    const signature2 = sm2Sign(message2, keyPair.privateKey)

    // 每个签名只能验证对应的消息
    expect(sm2VerifySignature(message1, signature1, keyPair.publicKey)).toBe(true)
    expect(sm2VerifySignature(message2, signature2, keyPair.publicKey)).toBe(true)
    expect(sm2VerifySignature(message1, signature2, keyPair.publicKey)).toBe(false)
    expect(sm2VerifySignature(message2, signature1, keyPair.publicKey)).toBe(false)
  })

  it('使用错误公钥验证签名应该失败', () => {
    const keyPair1 = sm2GenerateKeyPair()
    const keyPair2 = sm2GenerateKeyPair()
    const message = 'test message'

    const signature = sm2Sign(message, keyPair1.privateKey)
    const isValid = sm2VerifySignature(message, signature, keyPair2.publicKey)

    expect(isValid).toBe(false)
  })

  it('篡改消息后验证签名应该失败', () => {
    const keyPair = sm2GenerateKeyPair()
    const originalMessage = 'original message'
    const tamperedMessage = 'tampered message'

    const signature = sm2Sign(originalMessage, keyPair.privateKey)
    const isValid = sm2VerifySignature(tamperedMessage, signature, keyPair.publicKey)

    expect(isValid).toBe(false)
  })

  it('应该签名并验证空字符串', () => {
    const keyPair = sm2GenerateKeyPair()
    const message = ''

    const signature = sm2Sign(message, keyPair.privateKey)
    const isValid = sm2VerifySignature(message, signature, keyPair.publicKey)

    expect(signature).toBeTruthy()
    expect(isValid).toBe(true)
  })
})

describe('SM2 椭圆曲线公钥密码算法 - 加密解密', () => {
  it('应该加密并解密英文字符串', () => {
    const keyPair = sm2GenerateKeyPair()
    const plaintext = 'Hello World'

    const encrypted = sm2Encrypt(plaintext, keyPair.publicKey)
    const decrypted = sm2Decrypt(encrypted, keyPair.privateKey)

    expect(encrypted).toBeTruthy()
    expect(encrypted).not.toBe(plaintext)
    expect(decrypted).toBe(plaintext)
  })

  it('应该加密并解密中文字符串', () => {
    const keyPair = sm2GenerateKeyPair()
    const plaintext = '你好世界'

    const encrypted = sm2Encrypt(plaintext, keyPair.publicKey)
    const decrypted = sm2Decrypt(encrypted, keyPair.privateKey)

    expect(encrypted).toBeTruthy()
    expect(encrypted).not.toBe(plaintext)
    expect(decrypted).toBe(plaintext)
  })

  it('应该加密并解密包含特殊字符的字符串', () => {
    const keyPair = sm2GenerateKeyPair()
    const plaintext = 'Test@#123!测试'

    const encrypted = sm2Encrypt(plaintext, keyPair.publicKey)
    const decrypted = sm2Decrypt(encrypted, keyPair.privateKey)

    expect(encrypted).toBeTruthy()
    expect(encrypted).not.toBe(plaintext)
    expect(decrypted).toBe(plaintext)
  })

  it('应该加密并解密空字符串', () => {
    const keyPair = sm2GenerateKeyPair()
    const plaintext = ''

    const encrypted = sm2Encrypt(plaintext, keyPair.publicKey)
    const decrypted = sm2Decrypt(encrypted, keyPair.privateKey)

    expect(encrypted).toBeTruthy()
    expect(decrypted).toBe(plaintext)
  })

  it('相同明文和公钥应该产生不同密文（SM2使用随机数）', () => {
    const keyPair = sm2GenerateKeyPair()
    const plaintext = 'test data'

    const encrypted1 = sm2Encrypt(plaintext, keyPair.publicKey)
    const encrypted2 = sm2Encrypt(plaintext, keyPair.publicKey)

    // SM2加密包含随机数，每次结果不同
    expect(encrypted1).not.toBe(encrypted2)

    // 但都应该能正确解密
    expect(sm2Decrypt(encrypted1, keyPair.privateKey)).toBe(plaintext)
    expect(sm2Decrypt(encrypted2, keyPair.privateKey)).toBe(plaintext)
  })

  it('使用错误的私钥解密应该失败', () => {
    const keyPair1 = sm2GenerateKeyPair()
    const keyPair2 = sm2GenerateKeyPair()
    const plaintext = 'secret data'

    const encrypted = sm2Encrypt(plaintext, keyPair1.publicKey)
    const decrypted = sm2Decrypt(encrypted, keyPair2.privateKey)

    // 使用错误私钥解密应该得到错误的结果
    expect(decrypted).not.toBe(plaintext)
  })

  it('使用正确公钥加密的密文只能用对应私钥解密', () => {
    const keyPair1 = sm2GenerateKeyPair()
    const keyPair2 = sm2GenerateKeyPair()
    const plaintext = 'test message'

    const encrypted1 = sm2Encrypt(plaintext, keyPair1.publicKey)
    const encrypted2 = sm2Encrypt(plaintext, keyPair2.publicKey)

    // 每个密文只能用对应的私钥解密
    expect(sm2Decrypt(encrypted1, keyPair1.privateKey)).toBe(plaintext)
    expect(sm2Decrypt(encrypted2, keyPair2.privateKey)).toBe(plaintext)
  })
})
