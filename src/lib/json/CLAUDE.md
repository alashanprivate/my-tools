# JSON 工具模块

[根目录](../../../CLAUDE.md) > [src](../../) > [lib](../) > **json**

> 最后更新：2026-02-28 17:46:07

## 模块职责

提供 JSON 数据的格式化、验证、压缩和自动修复功能。支持错误位置定位、键排序、智能修复常见 JSON 格式问题。

## 入口与启动

**主文件：** `src/lib/json/index.ts`

```typescript
import { formatJson, validateJson, minifyJson } from '@/lib/json'
import { tryFixJson } from '@/lib/json/fixJson'
```

## 对外接口

### `formatJson(input, options?)`

格式化 JSON 字符串，使其易于阅读。

**参数：**
- `input: string` - 输入的 JSON 字符串
- `options?: JsonFormatOptions`
  - `indent?: number` - 缩进空格数，默认 2
  - `sortKeys?: boolean` - 是否按字母排序键，默认 false

**返回：** `JsonConversionResult`
```typescript
{
  success: boolean
  result?: string  // 格式化后的 JSON
  error?: string   // 错误信息
}
```

**示例：**
```typescript
const result = formatJson('{"name":"John","age":30}', { indent: 2, sortKeys: true })
// {
//   "age": 30,
//   "name": "John"
// }
```

### `validateJson(input)`

验证 JSON 字符串的语法正确性。

**参数：**
- `input: string` - 输入的 JSON 字符串

**返回：** `JsonValidateResult`
```typescript
{
  valid: boolean
  error?: string   // 错误信息
  line?: number    // 错误行号
  column?: number  // 错误列号
}
```

**特性：**
- 精确定位错误位置（行号和列号）
- 解析 V8 引擎错误消息
- 启发式推断错误位置

### `minifyJson(input, options?)`

压缩 JSON 字符串，移除所有空白字符。

**参数：**
- `input: string` - 输入的 JSON 字符串
- `options?: JsonMinifyOptions`（当前未使用，保留以备扩展）

**返回：** `JsonConversionResult`

**示例：**
```typescript
const result = minifyJson('{\n  "name": "John"\n}')
// {"name":"John"}
```

### `tryFixJson(input)` (fixJson.ts)

尝试自动修复常见的 JSON 格式问题。

**返回：** `JsonFixResult`
```typescript
{
  success: boolean
  result?: string
  error?: string
  fixesApplied?: string[]  // 应用的修复列表
}
```

**自动修复功能：**
1. 移除注释（`//` 和 `/* */`）
2. 单引号转双引号
3. 移除尾随逗号
4. 添加属性名引号
5. 修正布尔值/null 大小写

**示例：**
```typescript
const result = tryFixJson("{'name': 'John', /* comment */}")
// 成功: {"name": "John"}
// fixesApplied: ['移除注释', '单引号转双引号']
```

## 关键依赖与配置

**无外部依赖。** 纯原生 JavaScript 实现。

**类型定义：** `src/lib/json/types.ts`

**辅助文件：** `src/lib/json/fixJson.ts` - JSON 自动修复

## 数据模型

### `JsonFormatOptions`
```typescript
interface JsonFormatOptions {
  indent?: number      // 缩进空格数，默认 2
  sortKeys?: boolean   // 是否排序键，默认 false
}
```

### `JsonValidateResult`
```typescript
interface JsonValidateResult {
  valid: boolean
  error?: string
  line?: number
  column?: number
}
```

### `JsonConversionResult`
```typescript
type JsonConversionResult = {
  success: boolean
  result?: string
  error?: string
}
```

### `JsonFixResult`
```typescript
interface JsonFixResult {
  success: boolean
  result?: string
  error?: string
  fixesApplied?: string[]
}
```

## 测试与质量

**测试文件：** `src/lib/json/json.test.ts`

**测试覆盖率：** 89.62%
- 语句覆盖：89.62%
- 分支覆盖：80%
- 函数覆盖：85.71%

**测试用例数：** 18 个

**测试内容：**
- 简单 JSON 格式化
- 自定义缩进
- 键排序
- 嵌套对象和数组
- 错误处理和位置定位
- 自动修复功能

**运行测试：**
```bash
npm test -- json.test.ts
```

## 实现细节

### 错误位置解析

使用启发式方法从 V8 引擎错误消息中提取行号和列号：

1. 解析 `line X column Y` 格式
2. 解析 `position X` 格式并转换为行列
3. 如果无位置信息，推断到最后一个非空字符位置

### 键排序算法

递归排序对象的所有键：
```typescript
function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }
  if (obj !== null && typeof obj === 'object') {
    const sortedKeys = Object.keys(obj).sort()
    // 递归排序嵌套对象
  }
  return obj
}
```

### 自动修复策略

**修复顺序（从安全到激进）：**
1. 移除注释（最安全）
2. 单引号转双引号（需小心处理转义）
3. 移除尾随逗号
4. 添加属性名引号（正则匹配）
5. 修正布尔值/null 大小写

**注意：** 自动修复是尽力而为，不能保证 100% 成功。

## 常见问题 (FAQ)

### Q: 为什么格式化后还是报错？

可能原因：
1. JSON 中有 JavaScript 不支持的注释
2. 属性名使用了单引号
3. 有尾随逗号

**解决方案：** 点击"尝试自动修复"按钮。

### Q: 键排序会改变数据吗？

不会改变数据内容，只会调整对象属性的显示顺序。数组元素的顺序不会被改变。

### Q: 支持哪些 JSON 格式扩展？

通过 `tryFixJson` 支持：
- 单引号字符串
- 注释（`//` 和 `/* */`）
- 尾随逗号
- 未引用的属性名
- 大写的 `True`/`False`/`Null`

### Q: 错误位置准确吗？

对于标准 JSON 语法错误，位置定位准确。对于修复后的 JSON，位置可能稍有偏差。

## 相关文件清单

```
src/lib/json/
├── index.ts           # 主文件，包含格式化、验证、压缩
├── types.ts           # TypeScript 类型定义
├── fixJson.ts         # 自动修复功能
└── json.test.ts       # 测试文件
```

## 变更记录

### 2026-02-28 17:46:07
- 初始化模块文档
- 记录所有公开接口和数据模型
- 记录测试覆盖率和实现细节
