# 组件模块

[根目录](../../CLAUDE.md) > [src](../) > **components**

> 最后更新：2026-02-28 17:46:07

## 模块职责

提供 React UI 组件和页面组件。包括基础 UI 组件（Button、Card、Input 等）、布局组件（Layout、Header、Footer）和工具页面组件（JsonFormatter、CryptoTools）。

## 目录结构

```
src/components/
├── ui/              # 基础 UI 组件
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Label.tsx
│   ├── Select.tsx
│   ├── Tabs.tsx
│   └── Toast.tsx
├── layout/          # 布局组件
│   ├── Layout.tsx
│   ├── Header.tsx
│   └── Footer.tsx
└── tools/           # 工具页面组件
    ├── JsonFormatter.tsx
    └── CryptoTools.tsx
```

## 入口与启动

**主文件：** 无统一入口，按需导入

```typescript
// UI 组件
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// 布局组件
import { Layout } from '@/components/layout/Layout'

// 工具页面组件
import { JsonFormatter } from '@/components/tools/JsonFormatter'
```

## UI 组件 (src/components/ui/)

### Button.tsx

按钮组件，支持多种变体和尺寸。

**Props：**
```typescript
interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children: React.ReactNode
  onClick?: () => void
}
```

**示例：**
```typescript
<Button onClick={handleClick}>点击</Button>
<Button variant="outline">取消</Button>
<Button size="sm">小按钮</Button>
```

### Card.tsx

卡片容器组件，用于内容分组。

**子组件：**
- `Card` - 容器
- `CardHeader` - 头部
- `CardTitle` - 标题
- `CardDescription` - 描述
- `CardContent` - 内容区

**示例：**
```typescript
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述文本</CardDescription>
  </CardHeader>
  <CardContent>
    内容区域
  </CardContent>
</Card>
```

### Input.tsx

输入框组件。

**Props：**
```typescript
interface InputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  className?: string
}
```

### Textarea.tsx

多行文本输入组件。

**Props：**
```typescript
interface TextareaProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}
```

### Label.tsx

标签组件，用于表单元素标注。

**Props：**
```typescript
interface LabelProps {
  htmlFor?: string
  children: React.ReactNode
  className?: string
}
```

### Select.tsx

下拉选择组件。

**Props：**
```typescript
interface SelectProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  label?: string
  className?: string
}
```

**示例：**
```typescript
<Select
  label="缩进"
  value={indent}
  onChange={(e) => setIndent(e.target.value)}
  options={[
    { value: '2', label: '2 空格' },
    { value: '4', label: '4 空格' }
  ]}
/>
```

### Tabs.tsx

标签页组件。

**Props：**
```typescript
interface TabsProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onChange: (tabId: string) => void
}

interface TabPanelProps {
  tabId: string
  activeTab: string
  children: React.ReactNode
}
```

**示例：**
```typescript
<Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
  <Tabs.TabPanel tabId="tab1" activeTab={activeTab}>
    内容 1
  </Tabs.Panel>
</Tabs>
```

### Toast.tsx

消息提示组件（Toast 通知）。

**Hook：**
```typescript
function useToast() {
  const showToast = (message: string, type?: 'success' | 'error' | 'info') => void

  return { showToast }
}
```

**Provider：**
```typescript
<ToastProvider>
  <App />
</ToastProvider>
```

**使用：**
```typescript
const { showToast } = useToast()
showToast('操作成功', 'success')
```

## 布局组件 (src/components/layout/)

### Layout.tsx

应用主布局，包含 Header、Footer 和内容区。

**结构：**
```typescript
<Layout>
  <Header />      {/* 固定顶部导航 */}
  <main />        {/* 内容区（路由出口） */}
  <Footer />      {/* 页脚 */}
</Layout>
```

**特性：**
- 使用 `react-router-dom` 的 `Outlet` 渲染子路由
- 最小高度 100vh（`min-h-screen`）
- 响应式布局

### Header.tsx

顶部导航栏。

**特性：**
- 固定顶部（`sticky top-0`）
- Logo 和应用名称
- 导航链接（JSON 工具、加解密）
- 移动端菜单按钮（预留）

**路由：**
```typescript
<Link to="/">首页</Link>
<Link to="/json">JSON 工具</Link>
<Link to="/crypto">加解密</Link>
```

### Footer.tsx

页脚组件。

**内容：**
- 版权信息
- 链接（如有）

## 工具页面组件 (src/components/tools/)

### JsonFormatter.tsx

JSON 格式化工具页面。

**功能：**
- JSON 格式化
- JSON 压缩
- JSON 验证
- 自动修复 JSON
- 错误位置提示
- 键排序
- 缩进调整（2/4/8 空格）

**状态：**
```typescript
const [input, setInput] = useState('')           // 输入
const [output, setOutput] = useState('')         // 输出
const [error, setError] = useState('')           // 错误
const [indent, setIndent] = useState('2')         // 缩进
const [sortKeys, setSortKeys] = useState(false)  // 排序键
const [copied, setCopied] = useState(false)      // 复制状态
```

**集成的工具函数：**
```typescript
import { formatJson, minifyJson, validateJson } from '@/lib/json'
import { tryFixJson } from '@/lib/json/fixJson'
```

**UI 结构：**
```
┌─────────────────────────────────────────┐
│ 标题：JSON 格式化工具                     │
├─────────────┬───────────────────────────┤
│ 输入区域     │ 输出区域                   │
│ - Textarea  │ - Textarea (只读)         │
│ - 错误提示   │ - 复制按钮                 │
│ - 缩进选择   │ - 字符统计                 │
│ - 键排序     │                           │
│ - 操作按钮   │                           │
└─────────────┴───────────────────────────┘
│ 功能说明 + 常见错误提示                   │
└─────────────────────────────────────────┘
```

### CryptoTools.tsx

加解密工具页面。

**功能：**
- Base64 编解码
- 哈希计算（MD5/SHA-1/SHA-256/SHA-512）
- AES 加解密
- 国密算法（SM2/SM3/SM4）

**集成的工具函数：**
```typescript
import {
  base64Encode,
  base64Decode,
  hash,
  aesEncrypt,
  aesDecrypt
} from '@/lib/crypto'
```

## 关键依赖与配置

**外部依赖：**
- `lucide-react` ^0.344.0 - 图标库
- `react-router-dom` ^6.22.0 - 路由

**样式：**
- Tailwind CSS v3.4
- 自定义颜色变量（`text-muted-foreground`、`bg-destructive` 等）

**类型定义：** 组件内部定义 Props 接口

## 设计规范

### 组件命名

- **文件名：** PascalCase（如 `Button.tsx`）
- **组件名：** PascalCase（如 `Button`、`CardHeader`）
- **导出方式：** 命名导出（`export function Button()`）

### Props 定义

```typescript
interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant = 'default', size = 'default', className, children, onClick }: ButtonProps) {
  // ...
}
```

### 样式规范

**Tailwind 类名顺序：**
1. 布局（`flex`, `grid`）
2. 尺寸（`w-full`, `h-4`）
3. 间距（`p-4`, `m-2`, `gap-2`）
4. 颜色（`bg-primary`, `text-foreground`）
5. 边框（`border`, `rounded`）
6. 阴影（`shadow`）
7. 其他（`transition`, `hover:`）

**使用 `cn` 函数合并类名：**
```typescript
import { cn } from '@/lib/utils'

className={cn(
  'base-classes',
  variant === 'outline' && 'outline-classes',
  className
)}
```

### 图标使用

使用 `lucide-react` 图标库：
```typescript
import { Copy, Check, Wrench } from 'lucide-react'

<Copy className="h-4 w-4" />
<Wrench className="h-4 w-4" />
```

## 测试与质量

**测试文件：** 暂无组件测试

**测试框架：** React Testing Library（已配置）

**建议测试：**
- 组件渲染
- 用户交互（点击、输入）
- Props 变化响应

**运行测试：**
```bash
npm test -- components/
```

## 响应式设计

### 断点

```css
sm: 640px   /* 移动设备 */
md: 768px   /* 平板 */
lg: 1024px  /* 桌面 */
xl: 1280px  /* 大屏 */
```

### 示例

```typescript
// 移动端单列，桌面端双列
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// 桌面端显示，移动端隐藏
<nav className="hidden md:flex">

// 移动端显示，桌面端隐藏
<button className="md:hidden">
```

## 可访问性

### 键盘导航

- 所有交互元素支持键盘操作
- Tab 键导航顺序合理
- 焦点状态可见

### 语义化 HTML

```typescript
<header>     {/* 头部 */}
<main>       {/* 主内容 */}
<nav>        {/* 导航 */}
<footer>     {/* 页脚 */}
<button>     {/* 按钮 */}
<label>      {/* 表单标签 */}
```

### ARIA 属性

```typescript
<button aria-label="复制到剪贴板">
<input aria-invalid={hasError}>
<div role="alert">
```

## 常见问题 (FAQ)

### Q: 如何添加新的 UI 组件？

1. 在 `src/components/ui/` 创建新文件
2. 定义 Props 接口
3. 使用 Tailwind CSS 样式
4. 导出组件
5. 在需要的页面导入使用

### Q: 如何自定义组件样式？

**方式 1：** 通过 `className` prop
```typescript
<Button className="bg-red-500">自定义按钮</Button>
```

**方式 2：** 创建新变体
```typescript
interface ButtonProps {
  variant?: 'default' | 'outline' | 'custom'
}

const variantClasses = {
  custom: 'bg-red-500 hover:bg-red-600'
}
```

### Q: 如何使用图标？

```typescript
import { IconName } from 'lucide-react'

<IconName className="h-4 w-4" />
```

查找图标：https://lucide.dev/icons/

### Q: 如何处理表单状态？

使用 React Hooks：
```typescript
const [value, setValue] = useState('')
const [error, setError] = useState('')

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value)
  setError('') // 清除错误
}
```

## 相关文件清单

```
src/components/
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Label.tsx
│   ├── Select.tsx
│   ├── Tabs.tsx
│   └── Toast.tsx
├── layout/
│   ├── Layout.tsx
│   ├── Header.tsx
│   └── Footer.tsx
├── tools/
│   ├── JsonFormatter.tsx
│   └── CryptoTools.tsx
└── Home.tsx
```

## 变更记录

### 2026-02-28 17:46:07
- 初始化组件模块文档
- 记录所有 UI 组件和页面组件
- 添加设计规范和 FAQ
