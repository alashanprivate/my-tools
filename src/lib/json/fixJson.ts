/**
 * 尝试自动修复常见的 JSON 格式问题
 * 注意：这是一个尽力而为的修复工具，不能保证所有情况下都能成功
 */

export interface JsonFixResult {
  success: boolean
  result?: string
  error?: string
  fixesApplied?: string[]
}

/**
 * 尝试修复 JSON 字符串
 */
export function tryFixJson(input: string): JsonFixResult {
  const fixesApplied: string[] = []
  let fixed = input

  // 1. 移除注释（// 和 /* */）
  const beforeComment = fixed
  fixed = fixed
    .replace(/\/\/.*$/gm, '') // 移除单行注释
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
  if (beforeComment !== fixed) {
    fixesApplied.push('移除注释')
  }

  // 2. 将单引号转换为双引号（小心处理转义）
  const beforeQuotes = fixed
  fixed = fixSingleQuotes(fixed)
  if (beforeQuotes !== fixed) {
    fixesApplied.push('单引号转双引号')
  }

  // 3. 移除尾随逗号
  const beforeTrailing = fixed
  fixed = fixed
    .replace(/,\s*([}\]])/g, '$1') // 对象和数组末尾的逗号
    .replace(/,\s*$/gm, '') // 行尾逗号
  if (beforeTrailing !== fixed) {
    fixesApplied.push('移除尾随逗号')
  }

  // 4. 修复未引用的属性名
  const beforeUnquoted = fixed
  fixed = fixUnquotedKeys(fixed)
  if (beforeUnquoted !== fixed) {
    fixesApplied.push('添加属性名引号')
  }

  // 5. 修复布尔值和 null 的大小写
  const beforeBoolean = fixed
  fixed = fixed
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNull\b/g, 'null')
  if (beforeBoolean !== fixed) {
    fixesApplied.push('修正布尔值/null大小写')
  }

  // 尝试解析修复后的 JSON
  try {
    JSON.parse(fixed)
    return {
      success: true,
      result: fixed,
      fixesApplied,
    }
  } catch (error) {
    // 如果还是失败，返回错误
    return {
      success: false,
      error: error instanceof Error ? error.message : '无法自动修复此 JSON',
      fixesApplied,
    }
  }
}

/**
 * 将单引号转换为双引号（小心处理转义）
 */
function fixSingleQuotes(str: string): string {
  // 这是一个简化的实现，处理大多数常见情况
  // 注意：这不能处理所有边缘情况，比如字符串中包含转义的单引号

  let result = ''
  let inString = false
  let escapeNext = false

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if (escapeNext) {
      result += char
      escapeNext = false
      continue
    }

    if (char === '\\') {
      result += char
      escapeNext = true
      continue
    }

    if (char === '"') {
      result += char
      inString = !inString
      continue
    }

    if (char === "'" && !inString) {
      result += '"'
      continue
    }

    result += char
  }

  return result
}

/**
 * 为未引用的属性名添加引号
 */
function fixUnquotedKeys(str: string): string {
  // 匹配对象中的未引用属性名
  // 例如: {name: "John"} -> {"name": "John"}
  return str.replace(
    /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g,
    '$1"$2"$3'
  )
}
