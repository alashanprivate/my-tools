/**
 * 支持的哈希算法
 */
export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512' | 'sm3'

/**
 * 支持的编码算法
 */
export type EncodingAlgorithm = 'base64'

/**
 * AES 加密选项
 */
export interface AesOptions {
  /** 密钥 */
  key: string
  /** 初始化向量 (IV)，可选 */
  iv?: string
  /** 模式，默认为 CBC */
  mode?: 'CBC' | 'CTR' | 'OFB' | 'ECB'
  /** 填充，默认为 Pkcs7 */
  padding?: 'Pkcs7' | 'ZeroPadding' | 'Iso10126'
}

/**
 * 加解密结果
 */
export interface CryptoResult {
  /** 是否成功 */
  success: boolean
  /** 结果数据 */
  result?: string
  /** 错误信息 */
  error?: string
}

/**
 * SM2 密钥对
 */
export interface Sm2KeyPair {
  /** 公钥（16进制字符串） */
  publicKey: string
  /** 私钥（16进制字符串） */
  privateKey: string
}

/**
 * SM2 加密选项
 */
export interface Sm2EncryptOptions {
  /** 公钥（16进制字符串） */
  publicKey: string
  /** 加密模式：1=C1C3C2（默认），0=C1C2C3 */
  mode?: 0 | 1
}

/**
 * SM2 解密选项
 */
export interface Sm2DecryptOptions {
  /** 私钥（16进制字符串） */
  privateKey: string
  /** 加密模式：1=C1C3C2（默认），0=C1C2C3 */
  mode?: 0 | 1
}

/**
 * SM2 签名选项
 */
export interface Sm2SignOptions {
  /** 私钥（16进制字符串） */
  privateKey: string
  /** 用户ID，可选，默认为 '1234567812345678' */
  userId?: string
}

/**
 * SM2 验签选项
 */
export interface Sm2VerifyOptions {
  /** 公钥（16进制字符串） */
  publicKey: string
  /** 用户ID，可选，默认为 '1234567812345678' */
  userId?: string
}

/**
 * SM4 加密选项
 */
export interface Sm4Options {
  /** 密钥（16进制字符串，长度为32字符/128位） */
  key: string
  /** 模式：'ecb' | 'cbc'，默认为 'ecb' */
  mode?: 'ecb' | 'cbc'
  /** IV（CBC模式需要，16进制字符串，长度为32字符/128位） */
  iv?: string
}
