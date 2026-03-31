/**
 * 文本处理工具库
 * 遵循 SOLID 原则：
 * - S: 每个函数单一职责
 * - O: 通过函数组合扩展功能
 * - L: 类型兼容
 * - I: 函数接口专一
 * - D: 依赖抽象（字符串操作）
 */

/**
 * 大小写转换工具
 */

/**
 * 将文本转换为大写
 * @param text 输入文本
 * @returns 大写文本
 */
export function toUpperCase(text: string): string {
  if (!text) return ''
  return text.toUpperCase()
}

/**
 * 将文本转换为小写
 * @param text 输入文本
 * @returns 小写文本
 */
export function toLowerCase(text: string): string {
  if (!text) return ''
  return text.toLowerCase()
}

/**
 * 将首字母大写，其余小写
 * @param text 输入文本
 * @returns 首字母大写的文本
 */
export function capitalize(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * 将每个单词首字母大写
 * @param text 输入文本
 * @returns 每个单词首字母大写的文本
 */
export function capitalizeWords(text: string): string {
  if (!text) return ''
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ')
}

/**
 * 转换为驼峰命名 (camelCase)
 * @param text 输入文本
 * @returns 驼峰命名的文本
 */
export function toCamelCase(text: string): string {
  if (!text) return ''
  return text
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^[A-Z]/, char => char.toLowerCase())
}

/**
 * 转换为短横线命名 (kebab-case)
 * @param text 输入文本
 * @returns 短横线命名的文本
 */
export function toKebabCase(text: string): string {
  if (!text) return ''
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * 转换为下划线命名 (snake_case)
 * @param text 输入文本
 * @returns 下划线命名的文本
 */
export function toSnakeCase(text: string): string {
  if (!text) return ''
  return text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * 去重工具
 */

/**
 * 移除重复行，保留首次出现的行
 * @param text 输入文本
 * @returns 去重后的文本
 */
export function removeDuplicateLines(text: string): string {
  if (!text) return ''
  const lines = text.split('\n')
  const seen = new Set<string>()
  const result: string[] = []

  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line)
      result.push(line)
    }
  }

  return result.join('\n')
}

/**
 * 移除重复字符，保留首次出现的字符
 * @param text 输入文本
 * @returns 去重后的文本
 */
export function removeDuplicateChars(text: string): string {
  if (!text) return ''
  return Array.from(new Set(text)).join('')
}

/**
 * 统计工具
 */

/**
 * 统计单词数量
 * @param text 输入文本
 * @returns 单词数量
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0
  // 支持中英文单词统计
  const words = text.trim().split(/\s+/)
  return words.length
}

/**
 * 统计行数
 * @param text 输入文本
 * @returns 行数
 */
export function countLines(text: string): number {
  if (!text) return 0
  const lines = text.split('\n')
  // 如果最后一个字符是换行符，不计为额外一行
  if (text.endsWith('\n') && lines.length > 0) {
    return lines.length - 1
  }
  return lines.length
}

/**
 * 统计字符数量（包含空格）
 * @param text 输入文本
 * @returns 字符数量
 */
export function countChars(text: string): number {
  return text.length
}

/**
 * 统计字符数量（不包含空格）
 * @param text 输入文本
 * @returns 字符数量
 */
export function countCharsNoSpaces(text: string): number {
  return text.replace(/\s/g, '').length
}

/**
 * 其他工具
 */

/**
 * 反转文本
 * @param text 输入文本
 * @returns 反转后的文本
 */
export function reverseText(text: string): string {
  if (!text) return ''
  return text.split('').reverse().join('')
}

/**
 * 对行进行排序
 * @param text 输入文本
 * @param order 排序顺序 'asc' | 'desc'
 * @returns 排序后的文本
 */
export function sortLines(
  text: string,
  order: 'asc' | 'desc' = 'asc'
): string {
  if (!text) return ''
  const lines = text.split('\n')

  const sorted = lines.sort((a, b) => {
    const comparison = a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
    return order === 'asc' ? comparison : -comparison
  })

  return sorted.join('\n')
}

/**
 * 移除每行首尾空格
 * @param text 输入文本
 * @returns 处理后的文本
 */
export function trimLines(text: string): string {
  if (!text) return ''
  return text
    .split('\n')
    .map(line => line.trim())
    .join('\n')
}
