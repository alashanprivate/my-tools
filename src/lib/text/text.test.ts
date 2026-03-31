/**
 * 文本处理工具测试
 * 遵循 TDD 方法论: RED → GREEN → REFACTOR
 */

import { describe, it, expect } from 'vitest'
import {
  toUpperCase,
  toLowerCase,
  capitalize,
  capitalizeWords,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  removeDuplicateLines,
  removeDuplicateChars,
  countWords,
  countLines,
  countChars,
  countCharsNoSpaces,
  reverseText,
  sortLines,
  trimLines,
} from './index'

describe('文本处理工具 - 大小写转换', () => {
  describe('toUpperCase', () => {
    it('应该将文本转换为大写', () => {
      expect(toUpperCase('hello world')).toBe('HELLO WORLD')
      expect(toUpperCase('Hello World')).toBe('HELLO WORLD')
      expect(toUpperCase('')).toBe('')
    })

    it('应该处理中文混合文本', () => {
      expect(toUpperCase('hello你好')).toBe('HELLO你好')
    })
  })

  describe('toLowerCase', () => {
    it('应该将文本转换为小写', () => {
      expect(toLowerCase('HELLO WORLD')).toBe('hello world')
      expect(toLowerCase('Hello World')).toBe('hello world')
      expect(toLowerCase('')).toBe('')
    })

    it('应该处理中文混合文本', () => {
      expect(toLowerCase('HELLO你好')).toBe('hello你好')
    })
  })

  describe('capitalize', () => {
    it('应该将首字母大写', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('Hello')
      expect(capitalize('')).toBe('')
    })

    it('应该只将第一个字符大写，其余小写', () => {
      expect(capitalize('hELLO')).toBe('Hello')
    })
  })

  describe('capitalizeWords', () => {
    it('应该将每个单词首字母大写', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World')
      expect(capitalizeWords('HELLO WORLD')).toBe('Hello World')
      expect(capitalizeWords('')).toBe('')
    })

    it('应该处理多个单词', () => {
      expect(capitalizeWords('the quick brown fox')).toBe(
        'The Quick Brown Fox'
      )
    })
  })

  describe('toCamelCase', () => {
    it('应该转换为驼峰命名', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld')
      expect(toCamelCase('hello_world')).toBe('helloWorld')
      expect(toCamelCase('Hello World')).toBe('helloWorld')
      expect(toCamelCase('')).toBe('')
    })

    it('应该处理连续的分隔符', () => {
      expect(toCamelCase('hello--world')).toBe('helloWorld')
      expect(toCamelCase('hello__world')).toBe('helloWorld')
    })
  })

  describe('toKebabCase', () => {
    it('应该转换为短横线命名', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world')
      expect(toKebabCase('hello_world')).toBe('hello-world')
      expect(toKebabCase('HelloWorld')).toBe('hello-world')
      expect(toKebabCase('')).toBe('')
    })
  })

  describe('toSnakeCase', () => {
    it('应该转换为下划线命名', () => {
      expect(toSnakeCase('helloWorld')).toBe('hello_world')
      expect(toSnakeCase('hello-world')).toBe('hello_world')
      expect(toSnakeCase('HelloWorld')).toBe('hello_world')
      expect(toSnakeCase('')).toBe('')
    })
  })
})

describe('文本处理工具 - 去重', () => {
  describe('removeDuplicateLines', () => {
    it('应该移除重复行', () => {
      const input = 'hello\nworld\nhello\nfoo'
      expect(removeDuplicateLines(input)).toBe('hello\nworld\nfoo')
    })

    it('应该保留首次出现的行', () => {
      const input = 'a\nb\na\nc'
      expect(removeDuplicateLines(input)).toBe('a\nb\nc')
    })

    it('应该处理空行', () => {
      const input = 'hello\n\nworld\n\n'
      expect(removeDuplicateLines(input)).toBe('hello\n\nworld')
    })

    it('应该处理空字符串', () => {
      expect(removeDuplicateLines('')).toBe('')
    })
  })

  describe('removeDuplicateChars', () => {
    it('应该移除重复字符', () => {
      expect(removeDuplicateChars('hello')).toBe('helo')
      expect(removeDuplicateChars('aabbcc')).toBe('abc')
    })

    it('应该保留字符顺序', () => {
      expect(removeDuplicateChars('bacab')).toBe('bac')
    })

    it('应该处理空字符串', () => {
      expect(removeDuplicateChars('')).toBe('')
    })
  })
})

describe('文本处理工具 - 统计', () => {
  describe('countWords', () => {
    it('应该统计单词数量', () => {
      expect(countWords('hello world')).toBe(2)
      expect(countWords('the quick brown fox')).toBe(4)
    })

    it('应该处理多个连续空格', () => {
      expect(countWords('hello   world')).toBe(2)
    })

    it('应该处理空字符串', () => {
      expect(countWords('')).toBe(0)
      expect(countWords('   ')).toBe(0)
    })

    it('应该处理中文文本', () => {
      expect(countWords('你好 世界')).toBe(2)
    })
  })

  describe('countLines', () => {
    it('应该统计行数', () => {
      expect(countLines('hello\nworld\nfoo')).toBe(3)
      expect(countLines('hello')).toBe(1)
    })

    it('应该处理空行', () => {
      expect(countLines('hello\n\nworld')).toBe(3)
    })

    it('应该处理空字符串', () => {
      expect(countLines('')).toBe(0)
    })

    it('应该处理末尾换行', () => {
      expect(countLines('hello\n')).toBe(1)
      expect(countLines('hello\nworld\n')).toBe(2)
    })
  })

  describe('countChars', () => {
    it('应该统计字符数量（包含空格）', () => {
      expect(countChars('hello')).toBe(5)
      expect(countChars('hello world')).toBe(11)
    })

    it('应该包含换行符', () => {
      expect(countChars('hello\nworld')).toBe(11)
    })

    it('应该处理空字符串', () => {
      expect(countChars('')).toBe(0)
    })
  })

  describe('countCharsNoSpaces', () => {
    it('应该统计字符数量（不包含空格）', () => {
      expect(countCharsNoSpaces('hello')).toBe(5)
      expect(countCharsNoSpaces('hello world')).toBe(10)
    })

    it('应该移除所有空白字符', () => {
      expect(countCharsNoSpaces('hello   world')).toBe(10)
      expect(countCharsNoSpaces('hello\nworld')).toBe(10)
    })

    it('应该处理空字符串', () => {
      expect(countCharsNoSpaces('')).toBe(0)
    })
  })
})

describe('文本处理工具 - 其他工具', () => {
  describe('reverseText', () => {
    it('应该反转文本', () => {
      expect(reverseText('hello')).toBe('olleh')
      expect(reverseText('hello world')).toBe('dlrow olleh')
    })

    it('应该处理空字符串', () => {
      expect(reverseText('')).toBe('')
    })
  })

  describe('sortLines', () => {
    it('应该按字母顺序排序行', () => {
      const input = 'zebra\napple\nbanana'
      expect(sortLines(input)).toBe('apple\nbanana\nzebra')
    })

    it('应该支持降序排序', () => {
      const input = 'zebra\napple\nbanana'
      expect(sortLines(input, 'desc')).toBe('zebra\nbanana\napple')
    })

    it('应该处理空字符串', () => {
      expect(sortLines('')).toBe('')
    })

    it('应该处理数字', () => {
      const input = '3\n1\n2'
      expect(sortLines(input)).toBe('1\n2\n3')
    })
  })

  describe('trimLines', () => {
    it('应该移除每行首尾空格', () => {
      const input = '  hello  \n  world  '
      expect(trimLines(input)).toBe('hello\nworld')
    })

    it('应该保留空行', () => {
      const input = 'hello\n\n  world  '
      expect(trimLines(input)).toBe('hello\n\nworld')
    })

    it('应该处理空字符串', () => {
      expect(trimLines('')).toBe('')
    })
  })
})
