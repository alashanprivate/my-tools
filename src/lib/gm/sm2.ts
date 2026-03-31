import { sm2 } from 'sm-crypto'

/**
 * SM2密钥对
 */
export interface SM2KeyPair {
  /** 公钥（130位十六进制字符串，包含04前缀） */
  publicKey: string
  /** 私钥（64位十六进制字符串） */
  privateKey: string
}

/**
 * 生成SM2密钥对
 * @returns SM2密钥对
 */
export function sm2GenerateKeyPair(): SM2KeyPair {
  const keyPair = sm2.generateKeyPairHex()
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  }
}

/**
 * SM2签名
 * @param message 要签名的消息
 * @param privateKey 私钥（64位十六进制字符串）
 * @returns 签名（128位十六进制字符串）
 */
export function sm2Sign(message: string, privateKey: string): string {
  return sm2.doSignature(message, privateKey)
}

/**
 * SM2验签
 * @param message 原始消息
 * @param signature 签名（128位十六进制字符串）
 * @param publicKey 公钥（130位十六进制字符串）
 * @returns 是否验证通过
 */
export function sm2VerifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  return sm2.doVerifySignature(message, signature, publicKey)
}

/**
 * SM2加密
 * @param plaintext 明文
 * @param publicKey 公钥（130位十六进制字符串）
 * @returns 密文（十六进制字符串）
 */
export function sm2Encrypt(plaintext: string, publicKey: string): string {
  return sm2.doEncrypt(plaintext, publicKey)
}

/**
 * SM2解密
 * @param ciphertext 密文（十六进制字符串）
 * @param privateKey 私钥（64位十六进制字符串）
 * @returns 明文
 */
export function sm2Decrypt(ciphertext: string, privateKey: string): string {
  return sm2.doDecrypt(ciphertext, privateKey)
}
