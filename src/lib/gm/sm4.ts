import { sm4 } from 'sm-crypto'

/**
 * SM4加密
 * @param plaintext 明文
 * @param key 16字节十六进制密钥（32个十六进制字符）
 * @returns 密文（十六进制字符串）
 */
export function sm4Encrypt(plaintext: string, key: string): string {
  return sm4.encrypt(plaintext, key)
}

/**
 * SM4解密
 * @param ciphertext 密文（十六进制字符串）
 * @param key 16字节十六进制密钥（32个十六进制字符）
 * @returns 明文
 */
export function sm4Decrypt(ciphertext: string, key: string): string {
  return sm4.decrypt(ciphertext, key)
}
