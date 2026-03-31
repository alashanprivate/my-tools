/**
 * 加解密工具函数集合
 * 实现遵循 TDD 原则
 */

import CryptoJS from 'crypto-js'
import { Base64 } from 'js-base64'
import type { AesOptions, CryptoResult, HashAlgorithm } from './types'

/**
 * Base64 编码
 */
export function base64Encode(input: string): CryptoResult {
  try {
    const result = Base64.encode(input)
    return {
      success: true,
      result,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Base64 编码失败',
    }
  }
}

/**
 * Base64 解码
 */
export function base64Decode(input: string): CryptoResult {
  try {
    // 验证 Base64 格式（js-base64 不会抛出错误，需要手动验证）
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/

    if (!base64Regex.test(input)) {
      return {
        success: false,
        error: '无效的 Base64 字符串',
      }
    }

    const result = Base64.decode(input)
    return {
      success: true,
      result,
    }
  } catch (error) {
    return {
      success: false,
      error: '无效的 Base64 字符串',
    }
  }
}

/**
 * 哈希函数
 */
export function hash(input: string, algorithm: HashAlgorithm): CryptoResult {
  try {
    let result: string

    switch (algorithm) {
      case 'md5':
        result = CryptoJS.MD5(input).toString()
        break
      case 'sha1':
        result = CryptoJS.SHA1(input).toString()
        break
      case 'sha256':
        result = CryptoJS.SHA256(input).toString()
        break
      case 'sha512':
        result = CryptoJS.SHA512(input).toString()
        break
      default:
        return {
          success: false,
          error: `不支持的哈希算法: ${algorithm}`,
        }
    }

    return {
      success: true,
      result,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '哈希计算失败',
    }
  }
}

/**
 * AES 加密
 */
export function aesEncrypt(plaintext: string, options: AesOptions): CryptoResult {
  const { key, iv, mode = 'CBC', padding = 'Pkcs7' } = options

  // 验证密钥
  if (!key || key.trim().length === 0) {
    return {
      success: false,
      error: '密钥不能为空',
    }
  }

  try {
    // 配置加密选项
    const cryptoOptions: Record<string, any> = {}

    // 设置模式
    switch (mode) {
      case 'CBC':
        cryptoOptions.mode = CryptoJS.mode.CBC
        break
      case 'CTR':
        cryptoOptions.mode = CryptoJS.mode.CTR
        break
      case 'OFB':
        cryptoOptions.mode = CryptoJS.mode.OFB
        break
      case 'ECB':
        cryptoOptions.mode = CryptoJS.mode.ECB
        break
    }

    // 设置填充
    switch (padding) {
      case 'Pkcs7':
        cryptoOptions.padding = CryptoJS.pad.Pkcs7
        break
      case 'ZeroPadding':
        cryptoOptions.padding = CryptoJS.pad.ZeroPadding
        break
      case 'Iso10126':
        cryptoOptions.padding = CryptoJS.pad.Iso10126
        break
    }

    // 加密 - 使用字符串密钥（CryptoJS 会自动处理）
    const encrypted = iv
      ? CryptoJS.AES.encrypt(plaintext, key, {
          ...cryptoOptions,
          iv: CryptoJS.enc.Utf8.parse(iv),
        })
      : CryptoJS.AES.encrypt(plaintext, key, cryptoOptions)

    return {
      success: true,
      result: encrypted.toString(),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AES 加密失败',
    }
  }
}

/**
 * AES 解密
 */
export function aesDecrypt(ciphertext: string, options: AesOptions): CryptoResult {
  const { key, iv, mode = 'CBC', padding = 'Pkcs7' } = options

  // 验证密钥
  if (!key || key.trim().length === 0) {
    return {
      success: false,
      error: '密钥不能为空',
    }
  }

  // 验证密文
  if (!ciphertext || ciphertext.trim().length === 0) {
    return {
      success: false,
      error: '密文不能为空',
    }
  }

  try {
    // 配置解密选项
    const cryptoOptions: Record<string, any> = {}

    // 设置模式
    switch (mode) {
      case 'CBC':
        cryptoOptions.mode = CryptoJS.mode.CBC
        break
      case 'CTR':
        cryptoOptions.mode = CryptoJS.mode.CTR
        break
      case 'OFB':
        cryptoOptions.mode = CryptoJS.mode.OFB
        break
      case 'ECB':
        cryptoOptions.mode = CryptoJS.mode.ECB
        break
    }

    // 设置填充
    switch (padding) {
      case 'Pkcs7':
        cryptoOptions.padding = CryptoJS.pad.Pkcs7
        break
      case 'ZeroPadding':
        cryptoOptions.padding = CryptoJS.pad.ZeroPadding
        break
      case 'Iso10126':
        cryptoOptions.padding = CryptoJS.pad.Iso10126
        break
    }

    // 解密 - 使用字符串密钥
    const decrypted = iv
      ? CryptoJS.AES.decrypt(ciphertext, key, {
          ...cryptoOptions,
          iv: CryptoJS.enc.Utf8.parse(iv),
        })
      : CryptoJS.AES.decrypt(ciphertext, key, cryptoOptions)

    const result = decrypted.toString(CryptoJS.enc.Utf8)

    // 检查解密结果（空字符串表示解密失败）
    if (!result && ciphertext !== '') {
      return {
        success: false,
        error: '解密失败，请检查密钥和密文是否正确',
      }
    }

    return {
      success: true,
      result,
    }
  } catch (error) {
    return {
      success: false,
      error: '解密失败，请检查密钥和密文是否正确',
    }
  }
}

// ==================== 国密算法 SM2/SM3/SM4 ====================

import { sm2, sm3, sm4 } from 'sm-crypto'
import type {
  Sm2KeyPair,
  Sm2EncryptOptions,
  Sm2DecryptOptions,
  Sm2SignOptions,
  Sm2VerifyOptions,
  Sm4Options,
} from './types'

/**
 * 生成 SM2 密钥对
 */
export function sm2GenerateKeyPair(): Sm2KeyPair {
  const keypair = sm2.generateKeyPairHex()
  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey,
  }
}

/**
 * SM2 加密
 */
export function sm2Encrypt(plaintext: string, options: Sm2EncryptOptions): CryptoResult {
  const { publicKey, mode = 1 } = options

  if (!publicKey || publicKey.trim().length === 0) {
    return {
      success: false,
      error: '公钥不能为空',
    }
  }

  if (!plaintext) {
    return {
      success: false,
      error: '明文不能为空',
    }
  }

  try {
    // 验证公钥格式（应该是64字符的十六进制字符串）
    const hexRegex = /^[0-9a-fA-F]{64}$/
    if (!hexRegex.test(publicKey)) {
      return {
        success: false,
        error: '公钥格式不正确，应为64字符的十六进制字符串',
      }
    }

    // SM2 加密返回的是十六进制字符串
    const ciphertext = sm2.doEncrypt(plaintext, publicKey, mode)
    return {
      success: true,
      result: ciphertext,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SM2 加密失败',
    }
  }
}

/**
 * SM2 解密
 */
export function sm2Decrypt(ciphertext: string, options: Sm2DecryptOptions): CryptoResult {
  const { privateKey, mode = 1 } = options

  if (!privateKey || privateKey.trim().length === 0) {
    return {
      success: false,
      error: '私钥不能为空',
    }
  }

  if (!ciphertext || ciphertext.trim().length === 0) {
    return {
      success: false,
      error: '密文不能为空',
    }
  }

  try {
    // 验证私钥格式（应该是64字符的十六进制字符串）
    const hexRegex = /^[0-9a-fA-F]{64}$/
    if (!hexRegex.test(privateKey)) {
      return {
        success: false,
        error: '私钥格式不正确，应为64字符的十六进制字符串',
      }
    }

    // SM2 解密
    const plaintext = sm2.doDecrypt(ciphertext, privateKey, mode)
    return {
      success: true,
      result: plaintext,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SM2 解密失败',
    }
  }
}

/**
 * SM2 签名
 */
export function sm2Sign(message: string, options: Sm2SignOptions): CryptoResult {
  const { privateKey, userId = '1234567812345678' } = options

  if (!privateKey || privateKey.trim().length === 0) {
    return {
      success: false,
      error: '私钥不能为空',
    }
  }

  if (!message) {
    return {
      success: false,
      error: '消息不能为空',
    }
  }

  try {
    // 验证私钥格式
    const hexRegex = /^[0-9a-fA-F]{64}$/
    if (!hexRegex.test(privateKey)) {
      return {
        success: false,
        error: '私钥格式不正确，应为64字符的十六进制字符串',
      }
    }

    // SM2 签名
    const signature = sm2.doSignature(message, privateKey, { userId })
    return {
      success: true,
      result: signature,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SM2 签名失败',
    }
  }
}

/**
 * SM2 验签
 */
export function sm2Verify(
  message: string,
  signature: string,
  options: Sm2VerifyOptions
): CryptoResult {
  const { publicKey, userId = '1234567812345678' } = options

  if (!publicKey || publicKey.trim().length === 0) {
    return {
      success: false,
      error: '公钥不能为空',
    }
  }

  if (!message) {
    return {
      success: false,
      error: '消息不能为空',
    }
  }

  if (!signature) {
    return {
      success: false,
      error: '签名不能为空',
    }
  }

  try {
    // 验证公钥格式
    const hexRegex = /^[0-9a-fA-F]{64}$/
    if (!hexRegex.test(publicKey)) {
      return {
        success: false,
        error: '公钥格式不正确，应为64字符的十六进制字符串',
      }
    }

    // SM2 验签
    const result = sm2.doVerifySignature(message, signature, publicKey, { userId })
    return {
      success: true,
      result: result ? '验证成功' : '验证失败',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SM2 验签失败',
    }
  }
}

/**
 * SM3 哈希计算
 */
export function sm3Hash(input: string): CryptoResult {
  if (!input) {
    return {
      success: false,
      error: '输入不能为空',
    }
  }

  try {
    // SM3 返回十六进制字符串
    const hash = sm3(input)
    return {
      success: true,
      result: hash,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SM3 哈希计算失败',
    }
  }
}

/**
 * SM4 加密
 */
export function sm4Encrypt(plaintext: string, options: Sm4Options): CryptoResult {
  const { key, mode = 'ecb', iv } = options

  if (!key || key.trim().length === 0) {
    return {
      success: false,
      error: '密钥不能为空',
    }
  }

  if (!plaintext) {
    return {
      success: false,
      error: '明文不能为空',
    }
  }

  try {
    // 验证密钥格式（应该是32字符的十六进制字符串，即128位）
    const hexRegex = /^[0-9a-fA-F]{32}$/
    if (!hexRegex.test(key)) {
      return {
        success: false,
        error: '密钥格式不正确，应为32字符的十六进制字符串（128位）',
      }
    }

    // CBC 模式需要 IV
    if (mode === 'cbc') {
      if (!iv) {
        return {
          success: false,
          error: 'CBC 模式需要提供 IV',
        }
      }
      if (!hexRegex.test(iv)) {
        return {
          success: false,
          error: 'IV 格式不正确，应为32字符的十六进制字符串（128位）',
        }
      }
    }

    // SM4 加密
    let ciphertext: string
    if (mode === 'cbc') {
      ciphertext = sm4.encrypt(plaintext, key, { mode: 'cbc', iv })
    } else {
      ciphertext = sm4.encrypt(plaintext, key)
    }

    return {
      success: true,
      result: ciphertext,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SM4 加密失败',
    }
  }
}

/**
 * SM4 解密
 */
export function sm4Decrypt(ciphertext: string, options: Sm4Options): CryptoResult {
  const { key, mode = 'ecb', iv } = options

  if (!key || key.trim().length === 0) {
    return {
      success: false,
      error: '密钥不能为空',
    }
  }

  if (!ciphertext || ciphertext.trim().length === 0) {
    return {
      success: false,
      error: '密文不能为空',
    }
  }

  try {
    // 验证密钥格式
    const hexRegex = /^[0-9a-fA-F]{32}$/
    if (!hexRegex.test(key)) {
      return {
        success: false,
        error: '密钥格式不正确，应为32字符的十六进制字符串（128位）',
      }
    }

    // CBC 模式需要 IV
    if (mode === 'cbc') {
      if (!iv) {
        return {
          success: false,
          error: 'CBC 模式需要提供 IV',
        }
      }
      if (!hexRegex.test(iv)) {
        return {
          success: false,
          error: 'IV 格式不正确，应为32字符的十六进制字符串（128位）',
        }
      }
    }

    // SM4 解密
    let plaintext: string
    if (mode === 'cbc') {
      plaintext = sm4.decrypt(ciphertext, key, { mode: 'cbc', iv })
    } else {
      plaintext = sm4.decrypt(ciphertext, key)
    }

    return {
      success: true,
      result: plaintext,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SM4 解密失败',
    }
  }
}
