import type { RegexTestResult, RegexMatch, RegexTemplate, CodeSnippet, CodeLanguage } from './types'

/**
 * 常用正则表达式模板
 */
export const REGEX_TEMPLATES: RegexTemplate[] = [
  {
    name: '邮箱地址',
    description: '验证电子邮件地址格式',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    flags: 'm',
    example: 'example@email.com',
  },
  {
    name: '手机号（中国）',
    description: '验证中国大陆手机号',
    pattern: '^1[3-9]\\d{9}$',
    flags: 'm',
    example: '13800138000',
  },
  {
    name: 'URL',
    description: '匹配 HTTP/HTTPS URL',
    pattern: '^https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?$',
    flags: 'i',
    example: 'https://example.com',
  },
  {
    name: 'IP地址',
    description: '验证 IPv4 地址',
    pattern: '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$',
    flags: 'm',
    example: '192.168.1.1',
  },
  {
    name: '身份证号',
    description: '验证18位身份证号',
    pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$',
    flags: 'm',
    example: '110101199001011234',
  },
  {
    name: '日期（YYYY-MM-DD）',
    description: '验证日期格式',
    pattern: '^(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
    flags: 'm',
    example: '2024-01-01',
  },
  {
    name: '时间（HH:MM:SS）',
    description: '验证时间格式',
    pattern: '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
    flags: 'm',
    example: '23:59:59',
  },
  {
    name: '邮政编码',
    description: '验证中国邮政编码',
    pattern: '^[1-9]\\d{5}$',
    flags: 'm',
    example: '100000',
  },
  {
    name: '十六进制颜色',
    description: '验证十六进制颜色代码',
    pattern: '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$',
    flags: 'm',
    example: '#FF0000',
  },
  {
    name: '用户名',
    description: '4-16位字母、数字、下划线',
    pattern: '^[a-zA-Z0-9_]{4,16}$',
    flags: 'm',
    example: 'user_123',
  },
  {
    name: '密码强度',
    description: '至少8位，包含字母和数字',
    pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$',
    flags: 'm',
    example: 'Password123',
  },
  {
    name: '中文字符',
    description: '匹配中文字符',
    pattern: '^[\\u4e00-\\u9fa5]+$',
    flags: 'm',
    example: '中文',
  },
]

/**
 * 测试正则表达式
 */
export function testRegex(
  pattern: string,
  flags: string,
  text: string
): RegexTestResult {
  try {
    // 创建正则表达式对象
    const regex = new RegExp(pattern, flags)

    // 查找所有匹配
    const matches: RegexMatch[] = []
    let match: RegExpExecArray | null

    // 重置 lastIndex
    regex.lastIndex = 0

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        match: match[0],
        index: match.index,
        groups: match.slice(1),
      })

      // 防止无限循环（如匹配空字符串）
      if (match.index === regex.lastIndex) {
        regex.lastIndex++
      }
    }

    return {
      matches,
      isValid: true,
    }
  } catch (error) {
    return {
      matches: [],
      isValid: false,
      error: error instanceof Error ? error.message : '正则表达式错误',
    }
  }
}

/**
 * 获取正则表达式匹配信息
 */
export function getRegexInfo(pattern: string, flags: string): {
  global: boolean
  ignoreCase: boolean
  multiline: boolean
  hasIndices: boolean
  sticky: boolean
  dotAll: boolean
  unicode: boolean
} {
  try {
    const regex = new RegExp(pattern, flags)
    return {
      global: regex.global,
      ignoreCase: regex.ignoreCase,
      multiline: regex.multiline,
      hasIndices: flags.includes('d'), // TypeScript 类型定义可能不包含 hasIndices
      sticky: regex.sticky,
      dotAll: regex.dotAll,
      unicode: regex.unicode,
    }
  } catch {
    return {
      global: flags.includes('g'),
      ignoreCase: flags.includes('i'),
      multiline: flags.includes('m'),
      hasIndices: flags.includes('d'),
      sticky: flags.includes('y'),
      dotAll: flags.includes('s'),
      unicode: flags.includes('u'),
    }
  }
}

/**
 * 生成代码片段
 */
export function generateCode(
  pattern: string,
  flags: string,
  language: CodeLanguage
): CodeSnippet {
  let code = ''

  switch (language) {
    case 'javascript':
      code = `const regex = /${pattern}/${flags};
const text = "your text here";
const matches = text.match(regex);

// 或使用 test 方法
const isValid = regex.test(text);

// 循环匹配（需要 g 标志）
if (regex.global) {
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log(match[0], match.index);
  }
}`
      break

    case 'python':
      code = `import re

pattern = r"${pattern}"
flags = 0${flags.includes('i') ? ' | re.IGNORECASE' : ''}${flags.includes('m') ? ' | re.MULTILINE' : ''}${flags.includes('s') ? ' | re.DOTALL' : ''}
regex = re.compile(pattern, flags)

text = "your text here"

# 查找所有匹配
matches = regex.findall(text)

# 查找第一个匹配
match = regex.search(text)

# 测试是否匹配
is_valid = bool(regex.match(text))`
      break

    case 'java':
      code = `import java.util.regex.*;

String pattern = "${pattern}";
String text = "your text here";

// 创建 Pattern 对象
Pattern regex = Pattern.compile(pattern${flags.length > 0 ? ', Pattern.' + flags.toUpperCase().split('').map(f => {
  const flagMap: Record<string, string> = {
    'i': 'CASE_INSENSITIVE',
    'm': 'MULTILINE',
    's': 'DOTALL',
    'g': '',
  }
  return flagMap[f] || ''
}).filter(Boolean).join(' | ') : ''});

// 创建 Matcher 对象
Matcher matcher = regex.matcher(text);

// 查找所有匹配
while (matcher.find()) {
    String match = matcher.group();
    int start = matcher.start();
    int end = matcher.end();
}

// 测试是否匹配
boolean isValid = matcher.matches();`
      break

    case 'php':
      code = `<?php
$pattern = '/${pattern}/${flags}';
$text = 'your text here';

// 查找所有匹配
preg_match_all($pattern, $text, $matches, PREG_OFFSET_ERROR);

// 查找第一个匹配
preg_match($pattern, $text, $match, PREG_OFFSET_ERROR);

// 测试是否匹配
$is_valid = preg_match($pattern, $text) === 1;

// 替换
$result = preg_replace($pattern, 'replacement', $text);
?>`
      break

    case 'go':
      code = `package main

import (
    "regexp"
)

func main() {
    pattern := \`${pattern}\`
    text := "your text here"

    // 编译正则表达式
    regex, err := regexp.Compile(pattern)
    if err != nil {
        panic(err)
    }

    // 查找所有匹配
    matches := regex.FindAllString(text, -1)

    // 查找第一个匹配
    match := regex.FindString(text)

    // 测试是否匹配
    isMatch := regex.MatchString(text)

    // 查找匹配位置和分组
    submatches := regex.FindStringSubmatch(text)
}`
      break
  }

  return {
    language,
    code,
  }
}

/**
 * 标志位说明
 */
export const FLAG_DESCRIPTIONS = [
  { flag: 'g', name: 'Global', description: '全局匹配，查找所有匹配项' },
  { flag: 'i', name: 'Ignore Case', description: '忽略大小写' },
  { flag: 'm', name: 'Multiline', description: '多行模式，^ 和 $ 匹配每行的开始和结束' },
  { flag: 's', name: 'Dot All', description: '让 . 匹配包括换行符在内的所有字符' },
  { flag: 'u', name: 'Unicode', description: 'Unicode 模式' },
  { flag: 'y', name: 'Sticky', description: '粘性匹配，从 lastIndex 开始匹配' },
  { flag: 'd', name: 'Indices', description: '返回匹配位置信息' },
]

// 导出类型
export type { RegexTestResult, RegexMatch, RegexTemplate, CodeSnippet, CodeLanguage } from './types'
