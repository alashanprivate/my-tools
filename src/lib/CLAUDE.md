# 通用工具函数模块

[根目录](../../CLAUDE.md) > [src](../) > **lib**

> 最后更新：2026-02-28 17:46:07

## 模块职责

提供通用的工具函数，服务于整个应用。当前实现聚焦于 CSS 类名合并功能，支持 Tailwind CSS 类名的智能合并。

## 入口与启动

**主文件：** `src/lib/utils.ts`

```typescript
import { cn } from '@/lib/utils'
```

## 对外接口

### `cn(...inputs: ClassValue[]): string`

合并 Tailwind CSS 类名，自动处理冲突。

**特性：**
- 结合 `clsx` 和 `tailwind-merge`
- 自动移除重复的 Tailwind 类
- 支持条件类名

**示例：**
```typescript
cn('px-2 py-1', 'px-4') // 'py-1 px-4' (px-4 覆盖 px-2)
cn('text-red-500', isActive && 'text-blue-500') // 条件类名
```

## 关键依赖与配置

**依赖项：**
- `clsx` ^2.1.0 - 类名条件拼接
- `tailwind-merge` ^2.2.1 - Tailwind 类名冲突解决

**无配置文件。**

## 数据模型

**无复杂数据模型。**

输入类型：
```typescript
type ClassValue = string | number | boolean | undefined | null | ClassValue[]
```

## 测试与质量

**测试文件：** `src/lib/utils.test.ts`

**测试覆盖率：** 100%

**测试内容：**
- 类名合并功能
- Tailwind 冲突解决
- 条件类名处理

**运行测试：**
```bash
npm test -- utils.test.ts
```

## 常见问题 (FAQ)

### Q: 为什么需要这个工具？

Tailwind CSS 的类名有优先级，直接拼接可能导致样式冲突。`cn` 函数智能合并类名，确保后定义的类覆盖前面的类。

### Q: 与 `clsx` 有什么区别？

`cn` 是 `clsx` 的增强版本，额外集成了 `tailwind-merge` 来解决 Tailwind 特定的类名冲突。

## 相关文件清单

```
src/lib/
├── utils.ts           # 主文件
├── utils.test.ts      # 测试文件
├── json/              # JSON 工具模块
├── crypto/            # 加解密工具模块
├── gm/                # 国密算法模块
└── text/              # 文本处理模块
```

## 变更记录

### 2026-02-28 17:46:07
- 初始化模块文档
- 记录通用工具函数的职责和接口
