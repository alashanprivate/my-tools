# 工具页面组件模块

[根目录](../../../CLAUDE.md) > [src](../../) > [components](../) > **tools**

> 最后更新：2026-02-28 17:46:07

## 模块职责

提供工具页面的 UI 组件。当前包括 JSON 格式化工具页面和加解密工具页面。每个工具页面集成对应的 `src/lib/` 工具函数，提供完整的用户交互体验。

## 页面列表

| 页面组件 | 路由 | 工具库 | 说明 |
|---------|------|--------|------|
| `JsonFormatter.tsx` | `/json` | `src/lib/json` | JSON 格式化、验证、压缩、修复 |
| `CryptoTools.tsx` | `/crypto` | `src/lib/crypto` | Base64、哈希、AES 加密 |

## 入口与启动

**主文件：** 各组件独立文件

```typescript
// 路由配置（src/App.tsx）
import { JsonFormatter } from '@/components/tools/JsonFormatter'
import { CryptoTools } from '@/components/tools/CryptoTools'

<Route path="json" element={<JsonFormatter />} />
<Route path="crypto" element={<CryptoTools />} />
```

## 页面组件

### JsonFormatter.tsx

JSON 格式化工具页面，提供完整的 JSON 处理功能。

**功能列表：**
- 格式化 JSON（自定义缩进）
- 压缩 JSON
- 验证 JSON（错误定位）
- 自动修复 JSON（智能修复）
- 键排序
- 复制结果

**状态管理：**
```typescript
const [input, setInput] = useState('')           // 输入 JSON
const [output, setOutput] = useState('')         // 输出结果
const [error, setError] = useState('')           // 错误信息
const [indent, setIndent] = useState('2')         // 缩进（2/4/8）
const [sortKeys, setSortKeys] = useState(false)  // 排序键
const [copied, setCopied] = useState(false)      // 复制状态
```

**集成的工具函数：**
```typescript
import { formatJson, minifyJson, validateJson } from '@/lib/json'
import { tryFixJson } from '@/lib/json/fixJson'
```

**UI 布局：**
```
┌─────────────────────────────────────────┐
│ 标题：JSON 格式化工具                     │
│ 描述：格式化、压缩和验证 JSON 数据         │
├─────────────┬───────────────────────────┤
│ 输入区域     │ 输出区域                   │
│ ┌─────────┐ │ ┌─────────┐               │
│ │Textarea │ │ │Textarea │               │
│ └─────────┘ │ │(只读)   │               │
│ 错误提示    │ │ 复制按钮  │               │
│ ┌─────────┐ │ │ 字符统计  │               │
│ │错误框   │ │ └─────────┘               │
│ └─────────┘ │                           │
│ 缩进选择    │                           │
│ 键排序      │                           │
│ 操作按钮    │                           │
└─────────────┴───────────────────────────┘
│ 功能说明 + 常见错误提示                   │
└─────────────────────────────────────────┘
```

**操作按钮：**
```typescript
<Button onClick={handleFormat}>格式化</Button>
<Button onClick={handleMinify} variant="outline">压缩</Button>
<Button onClick={handleValidate} variant="outline">验证</Button>
<Button onClick={handleAutoFix} variant="outline">
  <Wrench className="h-4 w-4" />
  尝试自动修复
</Button>
<Button onClick={handleClear} variant="ghost">清空</Button>
```

**错误处理：**
```typescript
// 验证 JSON 并显示错误位置
const result = validateJson(input)
if (!result.valid) {
  const errorMsg = result.line
    ? `第 ${result.line} 行错误: ${result.error}`
    : result.error
  setError(errorMsg)
}
```

**常见错误提示：**
- 属性名必须使用双引号
- 字符串值必须使用双引号
- 不能有尾随逗号
- 不支持注释
- 布尔值和 null 必须小写

### CryptoTools.tsx

加解密工具页面，提供编码、哈希、加密功能。

**功能列表：**
- Base64 编解码
- 哈希计算（MD5/SHA-1/SHA-256/SHA-512）
- AES 加解密（多种模式和填充）
- 国密算法（SM2/SM3/SM4）

**集成的工具函数：**
```typescript
import {
  base64Encode,
  base64Decode,
  hash,
  aesEncrypt,
  aesDecrypt,
  sm2Encrypt,
  sm2Decrypt,
  sm3Hash,
  sm4Encrypt,
  sm4Decrypt
} from '@/lib/crypto'
```

**UI 结构：**（使用 Tabs 切换不同算法）

```
┌─────────────────────────────────────────┐
│ 标题：加解密工具                          │
├─────────────────────────────────────────┤
│ [Base64] [哈希] [AES] [SM2] [SM3] [SM4]  │
├─────────────────────────────────────────┤
│ 输入区域 + 参数配置                       │
│ 输出区域 + 复制按钮                       │
│ 功能说明                                  │
└─────────────────────────────────────────┘
```

## 通用模式

### 状态管理

所有工具页面遵循相同的状态管理模式：

```typescript
// 1. 输入状态
const [input, setInput] = useState('')

// 2. 输出状态
const [output, setOutput] = useState('')

// 3. 错误状态
const [error, setError] = useState('')

// 4. 配置状态
const [config, setConfig] = useState(defaultConfig)

// 5. UI 状态（复制、加载等）
const [copied, setCopied] = useState(false)
```

### 错误处理

统一的错误处理模式：

```typescript
const handleOperation = () => {
  // 1. 验证输入
  if (!input.trim()) {
    setError('请输入内容')
    return
  }

  // 2. 执行操作
  const result = someFunction(input, config)

  // 3. 处理结果
  if (result.success) {
    setOutput(result.result || '')
    setError('')
  } else {
    setError(result.error || '操作失败')
    setOutput('')
  }
}
```

### 复制功能

统一的复制到剪贴板功能：

```typescript
const handleCopy = async () => {
  if (!output) return

  try {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    showToast('已复制到剪贴板', 'success')
    setTimeout(() => setCopied(false), 2000)
  } catch {
    showToast('复制失败', 'error')
  }
}
```

### 清空功能

统一的清空功能：

```typescript
const handleClear = () => {
  setInput('')
  setOutput('')
  setError('')
}
```

## 设计规范

### 页面结构

每个工具页面遵循统一的结构：

```typescript
export function ToolPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 1. 标题区域 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">工具名称</h1>
        <p className="text-muted-foreground">工具描述</p>
      </div>

      {/* 2. 工作区域（输入 + 输出） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>...</Card>

        {/* 输出区域 */}
        <Card>...</Card>
      </div>

      {/* 3. 功能说明 */}
      <Card className="mt-8">
        <CardHeader><CardTitle>功能说明</CardTitle></CardHeader>
        <CardContent>...</CardContent>
      </Card>
    </div>
  )
}
```

### 响应式布局

```typescript
// 移动端单列，桌面端双列
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// 最大宽度限制
<div className="container mx-auto max-w-7xl">
```

### 使用 Toast 通知

```typescript
import { useToast } from '@/components/ui/Toast'

const { showToast } = useToast()

// 成功提示
showToast('操作成功', 'success')

// 错误提示
showToast('操作失败', 'error')

// 信息提示
showToast('处理中...', 'info')
```

## 关键依赖与配置

**外部依赖：**
- `react` ^18.3.1 - UI 框架
- `lucide-react` ^0.344.0 - 图标库

**内部依赖：**
- `@/lib/json` - JSON 工具函数
- `@/lib/crypto` - 加解密工具函数
- `@/lib/utils` - 通用工具函数
- `@/components/ui/*` - 基础 UI 组件

## 测试与质量

**测试文件：** 暂无组件测试

**建议测试：**
- 组件渲染测试
- 用户交互测试（输入、点击、复制）
- 错误处理测试
- Props 变化响应测试

**运行测试：**
```bash
npm test -- components/tools/
```

## 添加新工具页面

### 步骤 1：创建组件文件

```bash
# 在 src/components/tools/ 创建新文件
touch src/components/tools/NewTool.tsx
```

### 步骤 2：编写组件

```typescript
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { toolFunction } from '@/lib/newTool'

export function NewTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const { showToast } = useToast()

  const handleProcess = () => {
    const result = toolFunction(input)
    if (result.success) {
      setOutput(result.result || '')
      setError('')
    } else {
      setError(result.error || '处理失败')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <h1 className="text-4xl font-bold mb-2">新工具</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader><CardTitle>输入</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} />
            {error && <div className="text-destructive">{error}</div>}
            <Button onClick={handleProcess}>处理</Button>
          </CardContent>
        </Card>

        {/* 输出区域 */}
        <Card>
          <CardHeader><CardTitle>输出</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={output} readOnly />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### 步骤 3：添加路由

```typescript
// src/App.tsx
import { NewTool } from '@/components/tools/NewTool'

<Route path="newtool" element={<NewTool />} />
```

### 步骤 4：添加导航链接

```typescript
// src/components/layout/Header.tsx
<Link to="/newtool">新工具</Link>
```

### 步骤 5：添加首页卡片

```typescript
// src/components/Home.tsx
const tools = [
  // ...
  {
    title: '新工具',
    description: '工具描述',
    icon: IconName,
    path: '/newtool',
    color: 'text-color-500',
  },
]
```

## 常见问题 (FAQ)

### Q: 如何处理大文件输入？

建议使用防抖（debounce）或手动触发：
```typescript
// 自动处理（小文件）
useEffect(() => {
  if (input) {
    handleProcess()
  }
}, [input])

// 手动触发（大文件）
<Button onClick={handleProcess}>处理</Button>
```

### Q: 如何实时处理输入？

使用 `useEffect` 监听输入变化：
```typescript
useEffect(() => {
  if (input) {
    const result = toolFunction(input)
    setOutput(result.result || '')
  }
}, [input])
```

### Q: 如何添加配置选项？

使用 `useState` 管理配置：
```typescript
const [config, setConfig] = useState({
  option1: true,
  option2: 'default',
})

<Select
  value={config.option2}
  onChange={(e) => setConfig({ ...config, option2: e.target.value })}
  options={options}
/>
```

### Q: 如何处理异步操作？

使用 `async/await` 和加载状态：
```typescript
const [loading, setLoading] = useState(false)

const handleProcess = async () => {
  setLoading(true)
  try {
    const result = await asyncToolFunction(input)
    setOutput(result)
  } catch (error) {
    setError('处理失败')
  } finally {
    setLoading(false)
  }
}

<Button onClick={handleProcess} disabled={loading}>
  {loading ? '处理中...' : '处理'}
</Button>
```

## 相关文件清单

```
src/components/tools/
├── JsonFormatter.tsx    # JSON 格式化工具页面
└── CryptoTools.tsx      # 加解密工具页面

# 依赖的组件
src/components/ui/
├── Button.tsx
├── Card.tsx
├── Textarea.tsx
├── Input.tsx
├── Select.tsx
└── Toast.tsx

# 依赖的工具函数
src/lib/
├── json/
├── crypto/
└── utils.ts
```

## 变更记录

### 2026-02-28 17:46:07
- 初始化工具页面组件模块文档
- 记录 JsonFormatter 和 CryptoTools 页面
- 添加通用模式和添加新工具的步骤
