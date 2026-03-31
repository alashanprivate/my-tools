/**
 * 正则表达式匹配结果
 */
export interface RegexMatch {
  match: string
  index: number
  groups: string[]
}

/**
 * 正则表达式测试结果
 */
export interface RegexTestResult {
  matches: RegexMatch[]
  isValid: boolean
  error?: string
}

/**
 * 正则表达式模板
 */
export interface RegexTemplate {
  name: string
  description: string
  pattern: string
  flags: string
  example: string
}

/**
 * 代码生成选项
 */
export type CodeLanguage = 'javascript' | 'python' | 'java' | 'php' | 'go'

/**
 * 生成的代码片段
 */
export interface CodeSnippet {
  language: CodeLanguage
  code: string
}
