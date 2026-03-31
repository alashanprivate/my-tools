import { sm3 } from 'sm-crypto'

/**
 * 计算字符串的SM3哈希值
 * @param input 要计算哈希的字符串
 * @returns 64位小写十六进制哈希值
 */
export function sm3Hash(input: string): string {
  return sm3(input)
}
