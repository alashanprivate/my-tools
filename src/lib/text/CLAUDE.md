# 文本处理工具模块

[根目录](../../../CLAUDE.md) > [src](../../) > [lib](../) > **text**

> 最后更新：2026-02-28 17:46:07

## 模块职责

提供常见的文本处理工具函数。包括大小写转换、命名风格转换、去重、统计、排序等功能。严格遵循 SOLID 原则，每个函数单一职责。

## 入口与启动

**主文件：** `src/lib/text/index.ts`

```typescript
import {
  // 大小写转换
  toUpperCase,
  toLowerCase,
  capitalize,
  capitalizeWords,
  toCamelCase,
  toKebabCase,
  toSnakeCase,

  // 去重
  removeDuplicateLines,
  removeDuplicateChars,

  // 统计
  countWords,
  countLines,
  countChars,
  countCharsNoSpaces,

  // 其他工具
  reverseText,
  sortLines,
  trimLines
} from '@/lib/text'
```

## 对外接口

### 大小写转换工具

#### `toUpperCase(text: string): string`

将文本转换为大写。

**参数：**
- `text: string` - 输入文本

**返回：** 大写文本

**示例：**
```typescript
toUpperCase('hello world')  // 'HELLO WORLD'
toUpperCase('你好')         // '你好'（中文不变）
```

#### `toLowerCase(text: string): string`

将文本转换为小写。

**参数：**
- `text: string` - 输入文本

**返回：** 小写文本

**示例：**
```typescript
toLowerCase('HELLO WORLD')  // 'hello world'
toLowerCase('Hello World')  // 'hello world'
```

#### `capitalize(text: string): string`

将首字母大写，其余小写。

**参数：**
- `text: string` - 输入文本

**返回：** 首字母大写的文本

**示例：**
```typescript
capitalize('hello')      // 'Hello'
capitalize('HELLO')      // 'Hello'
capitalize('hELLO')      // 'Hello'
```

#### `capitalizeWords(text: string): string`

将每个单词首字母大写。

**参数：**
- `text: string` - 输入文本

**返回：** 每个单词首字母大写的文本

**示例：**
```typescript
capitalizeWords('hello world')        // 'Hello World'
capitalizeWords('the quick brown fox') // 'The Quick Brown Fox'
```

### 命名风格转换工具

#### `toCamelCase(text: string): string`

转换为驼峰命名 (camelCase)。

**参数：**
- `text: string` - 输入文本

**返回：** 驼峰命名的文本

**示例：**
```typescript
toCamelCase('hello-world')   // 'helloWorld'
toCamelCase('hello_world')   // 'helloWorld'
toCamelCase('Hello World')   // 'helloWorld'
toCamelCase('hello--world')  // 'helloWorld'（连续分隔符）
```

#### `toKebabCase(text: string): string`

转换为短横线命名 (kebab-case)。

**参数：**
- `text: string` - 输入文本

**返回：** 短横线命名的文本

**示例：**
```typescript
toKebabCase('helloWorld')    // 'hello-world'
toKebabCase('hello_world')   // 'hello-world'
toKebabCase('HelloWorld')    // 'hello-world'
```

#### `toSnakeCase(text: string): string`

转换为下划线命名 (snake_case)。

**参数：**
- `text: string` - 输入文本

**返回：** 下划线命名的文本

**示例：**
```typescript
toSnakeCase('helloWorld')    // 'hello_world'
toSnakeCase('hello-world')   // 'hello_world'
toSnakeCase('HelloWorld')    // 'hello_world'
```

### 去重工具

#### `removeDuplicateLines(text: string): string`

移除重复行，保留首次出现的行。

**参数：**
- `text: string` - 输入文本

**返回：** 去重后的文本

**示例：**
```typescript
removeDuplicateLines('hello\nworld\nhello\nfoo')
// 'hello\nworld\nfoo'

removeDuplicateLines('a\nb\na\nc')
// 'a\nb\nc'
```

**特性：**
- 保留首次出现的行
- 保留空行（多个空行去重后保留一个）
- 使用 Set 去重，时间复杂度 O(n)

#### `removeDuplicateChars(text: string): string`

移除重复字符，保留首次出现的字符。

**参数：**
- `text: string` - 输入文本

**返回：** 去重后的文本

**示例：**
```typescript
removeDuplicateChars('hello')  // 'helo'
removeDuplicateChars('aabbcc') // 'abc'
removeDuplicateChars('bacab')  // 'bac'（保留顺序）
```

### 统计工具

#### `countWords(text: string): number`

统计单词数量。

**参数：**
- `text: string` - 输入文本

**返回：** 单词数量

**示例：**
```typescript
countWords('hello world')       // 2
countWords('the quick brown')   // 3
countWords('hello   world')     // 2（多个空格）
countWords('你好 世界')         // 2（支持中文）
```

#### `countLines(text: string): number`

统计行数。

**参数：**
- `text: string` - 输入文本

**返回：** 行数

**示例：**
```typescript
countLines('hello\nworld\nfoo')  // 3
countLines('hello')              // 1
countLines('hello\n')            // 1（末尾换行不计）
countLines('hello\nworld\n')     // 2
```

**特性：**
- 末尾换行符不计为额外一行
- 空字符串返回 0

#### `countChars(text: string): number`

统计字符数量（包含空格）。

**参数：**
- `text: string` - 输入文本

**返回：** 字符数量

**示例：**
```typescript
countChars('hello')          // 5
countChars('hello world')    // 11（含空格）
countChars('hello\nworld')   // 11（含换行符）
```

#### `countCharsNoSpaces(text: string): number`

统计字符数量（不包含空格）。

**参数：**
- `text: string` - 输入文本

**返回：** 字符数量

**示例：**
```typescript
countCharsNoSpaces('hello')          // 5
countCharsNoSpaces('hello world')    // 10（不含空格）
countCharsNoSpaces('hello   world')  // 10（多个空格）
countCharsNoSpaces('hello\nworld')   // 10（不含换行符）
```

**特性：**
- 移除所有空白字符（空格、制表符、换行符等）

### 其他工具

#### `reverseText(text: string): string`

反转文本。

**参数：**
- `text: string` - 输入文本

**返回：** 反转后的文本

**示例：**
```typescript
reverseText('hello')          // 'olleh'
reverseText('hello world')    // 'dlrow olleh'
```

#### `sortLines(text: string, order?: 'asc' | 'desc'): string`

对行进行排序。

**参数：**
- `text: string` - 输入文本
- `order?: 'asc' | 'desc'` - 排序顺序，默认 'asc'

**返回：** 排序后的文本

**示例：**
```typescript
sortLines('zebra\napple\nbanana')     // 'apple\nbanana\nzebra'
sortLines('zebra\napple\nbanana', 'desc') // 'zebra\nbanana\napple'
sortLines('3\n1\n2')                  // '1\n2\n3'（数字排序）
```

**特性：**
- 使用 `localeCompare` 支持国际化
- `numeric: true` 选项支持自然排序（1, 2, 10 而非 1, 10, 2）

#### `trimLines(text: string): string`

移除每行首尾空格。

**参数：**
- `text: string` - 输入文本

**返回：** 处理后的文本

**示例：**
```typescript
trimLines('  hello  \n  world  ')  // 'hello\nworld'
trimLines('hello\n\n  world  ')    // 'hello\n\nworld'（保留空行）
```

## 关键依赖与配置

**无外部依赖。** 纯原生 JavaScript 实现。

**无配置文件。**

## 数据模型

**无复杂数据模型。** 所有函数均为简单的字符串输入输出。

**设计原则：**
- **S**ingle Responsibility：每个函数只做一件事
- **O**pen/Closed：通过函数组合扩展功能
- **L**iskov Substitution：函数可替换
- **I**nterface Segregation：函数接口专一
- **D**ependency Inversion：依赖抽象（字符串操作）

## 测试与质量

**测试文件：** `src/lib/text/text.test.ts`

**测试覆盖率：** 有完整测试

**测试用例数：** 约 30+ 个

**测试内容：**
- 大小写转换（8 个函数）
- 去重功能（行去重、字符去重）
- 统计功能（单词、行数、字符数）
- 其他工具（反转、排序、修剪）

**运行测试：**
```bash
npm test -- text.test.ts
```

## 实现细节

### 命名风格转换算法

**驼峰命名 (camelCase)：**
```typescript
export function toCamelCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^[A-Z]/, char => char.toLowerCase())
}
```

**正则说明：**
- `[-_\s]+(.)?` - 匹配分隔符及其后的字符
- `char.toUpperCase()` - 将分隔符后的字符大写
- `/^[A-Z]/` - 首字符小写

### 去重算法

**行去重：**
```typescript
export function removeDuplicateLines(text: string): string {
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
```

**时间复杂度：** O(n)（使用 Set）

**空间复杂度：** O(n)

### 统计算法

**单词统计：**
```typescript
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0
  const words = text.trim().split(/\s+/)
  return words.length
}
```

**特性：**
- 支持中英文单词统计
- 使用 `\s+` 匹配多个空白字符
- `trim()` 移除首尾空白

### 排序算法

**行排序：**
```typescript
export function sortLines(text: string, order: 'asc' | 'desc' = 'asc'): string {
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
```

**localeCompare 选项：**
- `numeric: true` - 自然排序（1, 2, 10 而非 1, 10, 2）
- `sensitivity: 'base'` - 忽略大小写和重音

## 使用场景

### 编程场景

**变量命名转换：**
```typescript
toCamelCase('my-variable-name')    // 'myVariableName'
toKebabCase('myVariableName')      // 'my-variable-name'
toSnakeCase('myVariableName')      // 'my_variable_name'
```

### 数据清洗

**去重：**
```typescript
const log = `
ERROR: File not found
WARNING: Deprecated API
ERROR: File not found
INFO: Process completed
`
removeDuplicateLines(log)
// 只保留第一个 "ERROR: File not found"
```

**统计：**
```typescript
const code = 'const x = 1;\nconst y = 2;\n// comment'
countLines(code)     // 3
countChars(code)     // 39
countCharsNoSpaces(code) // 30
```

### 文本处理

**大小写转换：**
```typescript
const title = 'the greatgatsby'
capitalize(title)  // 'The greatgatsby'
capitalizeWords(title)  // 'The Greatgatsby'
```

**格式化：**
```typescript
const messyText = '  hello  \n  world  \n  foo  '
trimLines(messyText)  // 'hello\nworld\nfoo'
sortLines(messyText)  // '  foo  \n  hello  \n  world  '
```

## 常见问题 (FAQ)

### Q: 中文文本如何处理？

大小写转换函数对中文文本无影响（保持原样）：
```typescript
toUpperCase('hello你好')  // 'HELLO你好'
toLowerCase('HELLO你好')  // 'hello你好'
```

统计函数支持中文：
```typescript
countWords('你好 世界')  // 2（按空格分词）
```

### Q: 为什么 `countLines('hello\n')` 返回 1？

末尾换行符不计为额外一行，这是文本处理的通用约定：
```javascript
'hello\n'.split('\n')     // ['hello', '']
'hello\nworld\n'.split('\n') // ['hello', 'world', '']
```

如果需要计为两行，可以使用 `text.split('\n').length`。

### Q: 去重后顺序会变吗？

**不会。** 去重函数保留首次出现的顺序：
```typescript
removeDuplicateChars('bacab')  // 'bac'（非 'abc'）
removeDuplicateLines('b\na\nb') // 'b\na'（非 'a\nb'）
```

### Q: 排序是否支持中文？

**支持。** `localeCompare` 自动处理中文排序：
```typescript
sortLines('香蕉\n苹果\n橙子')  // '橙子\n苹果\n香蕉'（拼音排序）
```

### Q: 如何组合使用这些函数？

通过函数组合构建复杂功能：
```typescript
// 清理和格式化文本
const cleanText = (text: string) => {
  return sortLines(
    removeDuplicateLines(
      trimLines(text)
    )
  )
}
```

## 相关文件清单

```
src/lib/text/
├── index.ts           # 主文件，包含所有文本处理函数
└── text.test.ts       # 测试文件
```

## 变更记录

### 2026-02-28 17:46:07
- 初始化模块文档
- 记录所有文本处理接口
- 添加使用场景和 FAQ
