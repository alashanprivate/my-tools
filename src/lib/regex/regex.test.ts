import { describe, it, expect } from 'vitest'
import {
  testRegex,
  getRegexInfo,
  generateCode,
  REGEX_TEMPLATES,
  FLAG_DESCRIPTIONS,
} from './index'

describe('testRegex', () => {
  it('匹配全局模式的所有结果', () => {
    const result = testRegex('\\d+', 'g', 'abc123def456')
    expect(result.isValid).toBe(true)
    expect(result.matches).toHaveLength(2)
    expect(result.matches[0]).toMatchObject({ match: '123', index: 3 })
    expect(result.matches[1]).toMatchObject({ match: '456', index: 9 })
  })

  it('非全局模式只返回第一个匹配，不进入死循环', () => {
    const result = testRegex('a', '', 'aaa')
    expect(result.isValid).toBe(true)
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0]).toMatchObject({ match: 'a', index: 0 })
  })

  it('捕获分组', () => {
    const result = testRegex('(\\d+)-(\\d+)', 'g', '12-34')
    expect(result.isValid).toBe(true)
    expect(result.matches[0].groups).toEqual(['12', '34'])
  })

  it('忽略大小写标志', () => {
    const result = testRegex('abc', 'gi', 'ABC abc')
    expect(result.matches).toHaveLength(2)
  })

  it('空字符串匹配不进入死循环', () => {
    const result = testRegex('a*', 'g', 'bbb')
    expect(result.isValid).toBe(true)
    expect(result.matches).toHaveLength(4)
    expect(result.matches.every((m) => m.match === '')).toBe(true)
  })

  it('无匹配时返回空数组', () => {
    const result = testRegex('\\d+', 'g', 'abc')
    expect(result.isValid).toBe(true)
    expect(result.matches).toHaveLength(0)
  })

  it('非法正则表达式返回错误', () => {
    const result = testRegex('[', 'g', 'abc')
    expect(result.isValid).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.matches).toHaveLength(0)
  })
})

describe('getRegexInfo', () => {
  it('解析合法正则的标志位', () => {
    const info = getRegexInfo('abc', 'gim')
    expect(info.global).toBe(true)
    expect(info.ignoreCase).toBe(true)
    expect(info.multiline).toBe(true)
    expect(info.sticky).toBe(false)
    expect(info.dotAll).toBe(false)
  })

  it('非法正则时按标志字符串回退解析', () => {
    const info = getRegexInfo('(', 'gimsy')
    expect(info.global).toBe(true)
    expect(info.ignoreCase).toBe(true)
    expect(info.multiline).toBe(true)
    expect(info.sticky).toBe(true)
    expect(info.dotAll).toBe(true)
  })
})

describe('generateCode', () => {
  it('生成 JavaScript 代码片段', () => {
    const snippet = generateCode('\\d+', 'g', 'javascript')
    expect(snippet.language).toBe('javascript')
    expect(snippet.code).toContain('/\\d+/g')
  })

  it('生成 Python 代码片段并转换标志', () => {
    const snippet = generateCode('\\d+', 'im', 'python')
    expect(snippet.code).toContain('re.IGNORECASE')
    expect(snippet.code).toContain('re.MULTILINE')
    expect(snippet.code).not.toContain('re.DOTALL')
  })

  it('生成 Java 代码片段', () => {
    const snippet = generateCode('\\d+', 'i', 'java')
    expect(snippet.code).toContain('Pattern.compile')
    expect(snippet.code).toContain('CASE_INSENSITIVE')
  })

  it('生成 PHP 代码片段', () => {
    const snippet = generateCode('\\d+', 'g', 'php')
    expect(snippet.code).toContain('/\\d+/g')
    expect(snippet.code).toContain('preg_match_all')
  })

  it('生成 Go 代码片段', () => {
    const snippet = generateCode('\\d+', 'g', 'go')
    expect(snippet.code).toContain('regexp.Compile')
  })
})

describe('REGEX_TEMPLATES', () => {
  it('每个模板都包含必要字段', () => {
    expect(REGEX_TEMPLATES.length).toBeGreaterThan(0)
    for (const template of REGEX_TEMPLATES) {
      expect(template.name).toBeTruthy()
      expect(template.pattern).toBeTruthy()
      expect(template.example).toBeTruthy()
    }
  })

  it('邮箱模板匹配合法邮箱', () => {
    const email = REGEX_TEMPLATES.find((t) => t.name === '邮箱地址')!
    expect(testRegex(email.pattern, email.flags, 'user@example.com').matches).toHaveLength(1)
    expect(testRegex(email.pattern, email.flags, 'invalid').matches).toHaveLength(0)
  })

  it('手机号模板匹配合法手机号', () => {
    const phone = REGEX_TEMPLATES.find((t) => t.name === '手机号（中国）')!
    expect(testRegex(phone.pattern, phone.flags, '13800138000').matches).toHaveLength(1)
    expect(testRegex(phone.pattern, phone.flags, '12345678901').matches).toHaveLength(0)
  })

  it('IP 模板匹配合法 IPv4', () => {
    const ip = REGEX_TEMPLATES.find((t) => t.name === 'IP地址')!
    expect(testRegex(ip.pattern, ip.flags, '192.168.1.1').matches).toHaveLength(1)
    expect(testRegex(ip.pattern, ip.flags, '999.999.999.999').matches).toHaveLength(0)
  })
})

describe('FLAG_DESCRIPTIONS', () => {
  it('覆盖所有常用标志', () => {
    const flags = FLAG_DESCRIPTIONS.map((f) => f.flag)
    expect(flags).toEqual(expect.arrayContaining(['g', 'i', 'm', 's', 'u', 'y']))
  })
})
