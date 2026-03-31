# 开发者工具应用

> 基于 TDD (测试驱动开发) 方法论构建的现代化开发者工具集合，支持 Web 和桌面应用。

[English](README-en.md) | 中文

## 功能列表

| 工具 | 路由 | 说明 |
|------|------|------|
| **JSON 格式化** | `/json` | 格式化、压缩、验证、自动修复 |
| **加解密** | `/crypto` | Base64、哈希、AES、SM2/SM3/SM4 |
| **Cron 表达式** | `/cron` | 生成、解释、验证、测试 |
| **JWT 工具** | `/jwt` | 生成、解析、验证 JWT Token |
| **正则表达式** | `/regex` | 测试、模板、代码生成 |
| **时间戳** | `/time` | 转换、时区、日期计算 |
| **二维码** | `/qrcode` | 生成、解析二维码 |
| **身份证** | `/idcard` | 生成、验证身份证信息 |

## 技术栈

**前端框架：**
- React 18 + TypeScript
- Vite 5.x
- Tailwind CSS + 自定义组件
- React Router DOM v6
- Vitest + React Testing Library

**桌面应用：**
- Tauri 2.x (Rust 后端)
- WebView2 (Windows)

**核心库：**
- crypto-js - 通用加解密
- js-base64 - Base64 编解码
- sm-crypto - 国密算法
- jose - JWT 处理
- date-fns - 日期处理
- qrcode - 二维码生成

## 快速开始

### 安装依赖

```bash
npm install
```

### Web 开发

```bash
npm run dev
```

访问 http://localhost:5173

### 桌面应用 (Windows)

```bash
npm run tauri:dev
```

### 构建

```bash
# Web 应用
npm run build

# 桌面应用
npm run tauri:build
```

### 测试

```bash
# 运行所有测试
npm test

# 测试覆盖率
npm run test:coverage
```

## 桌面应用

基于 Tauri 2.x 构建的原生 Windows 桌面应用。

**优势：**
- 轻量级 (~3-5 MB) vs Electron (100MB+)
- 快速启动 (原生性能)
- 所有数据本地处理
- WebView2 渲染，体验接近原生

**构建产物：**
```
src-tauri/target/release/bundle/msi/    # MSI 安装包
src-tauri/target/release/bundle/nsis/  # NSIS 安装包
src-tauri/target/release/my-tools.exe  # 可执行文件
```

**注意：** 首次构建需要 5-10 分钟编译 Rust 依赖。

## 打包发布

### CI/CD 自动化

项目使用 GitHub Actions 自动构建和发布跨平台安装包。

**构建矩阵：**
| 平台 | 产物格式 |
|------|---------|
| Windows | `.exe` (NSIS) |
| macOS | `.dmg`, `.app.tar.gz` |
| Linux | `.AppImage`, `.deb` |

**发布名称格式：** `My-tools_{version}_{arch}.{ext}`

### 版本管理

使用 `npm version` 命令自动管理版本号：

```bash
# 更新补丁版本 (0.1.x → 0.1.9)
npm version patch

# 更新次版本 (0.x.0 → 0.2.0)
npm version minor

# 更新主版本 (x.0.0 → 1.0.0)
npm version major
```

### 发布流程

1. **推送代码更新**
   ```bash
   git add .
   git commit -m "描述"
   git push
   ```

2. **创建版本标签**
   ```bash
   npm version patch      # 自动更新 package.json + 创建 git tag
   git push --tags         # 推送标签触发 CI/CD
   ```

3. **GitHub Actions 自动完成**
   - 提取版本号并同步到 `tauri.conf.json`
   - 跨平台构建 (Windows/macOS/Linux)
   - 生成安装包
   - 创建 GitHub Release

4. **检查发布结果**
   - 访问 https://github.com/alashanprivate/my-tools/releases
   - 验证各平台安装包名称是否正确

### CI/CD 工作流

详见 [.github/workflows/release.yml](.github/workflows/release.yml)

**关键步骤：**
- `checkout` - 检出代码
- `sync version` - 从 git tag 同步版本号到 `tauri.conf.json`
- `tauri-action` - 构建并发布

### 本地打包

```bash
# 构建所有平台产物
npm run tauri:build

# 产物位置
src-tauri/target/release/bundle/
├── nsis/      # Windows NSIS 安装包
├── msi/       # Windows MSI 安装包 (需要 WiX)
├── dmg/       # macOS DMG
├── app/       # macOS App
├── appimage/  # Linux AppImage
└── deb/       # Linux DEB
```

## 项目结构

```
src/
├── components/
│   ├── ui/              # 基础组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Select.tsx
│   │   ├── Tabs.tsx
│   │   ├── Toast.tsx
│   │   ├── JsonTree.tsx
│   │   ├── JsonHighlight.tsx
│   │   ├── DropdownMenu.tsx
│   │   └── RegionSelector.tsx
│   ├── layout/          # 布局组件
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── tools/           # 工具页面
│       ├── JsonFormatter.tsx
│       ├── CryptoTools.tsx
│       ├── CronTools.tsx
│       ├── JwtTool.tsx
│       ├── RegexTool.tsx
│       ├── TimeTool.tsx
│       ├── QRCodeTool.tsx
│       └── IdCardTool.tsx
└── lib/                 # 工具函数库
    ├── utils.ts         # 通用工具
    ├── json/            # JSON 处理
    ├── crypto/          # 加解密
    ├── gm/              # 国密算法
    ├── text/            # 文本处理
    ├── cron/            # Cron 表达式
    ├── jwt/             # JWT
    ├── regex/           # 正则表达式
    ├── time/            # 时间戳
    ├── qrcode/          # 二维码
    └── idCard/          # 身份证
```

```
src-tauri/               # Tauri 桌面应用
├── src/
│   ├── main.rs         # Rust 入口
│   └── lib.rs          # Tauri 配置
├── Cargo.toml          # Rust 依赖
├── tauri.conf.json    # 应用配置
└── icons/             # 应用图标
```

## 工具详情

### JSON 格式化 (/json)

- 格式化（自定义缩进 2/4/8）
- 压缩
- 验证（错误行定位）
- 自动修复（单引号、尾随逗号、注释）
- 键排序

### 加解密 (/crypto)

- **Base64** - 编码/解码
- **哈希** - MD5, SHA-1, SHA-256, SHA-512
- **AES** - 加密/解密
- **SM2** - 签名/验签
- **SM3** - 哈希
- **SM4** - 加密/解密

### Cron 表达式 (/cron)

- 解析（5段/6段格式）
- 验证
- 解释为中文
- 计算未来执行时间
- 生成器（预设模式）

### JWT 工具 (/jwt)

- 生成 JWT (HS256/384/512, RS256)
- 解析 JWT
- 验证签名和过期

### 正则表达式 (/regex)

- 实时测试
- 常用模板
- 代码生成

### 时间戳 (/time)

- 时间戳转换
- 时区换算
- 日期计算
- 日期差值

### 二维码 (/qrcode)

- 生成二维码
- 解析二维码

### 身份证 (/idcard)

- 生成测试身份证
- 验证身份证信息

## 设计原则

- **SOLID** - 单一职责、开闭原则、里氏替换、接口隔离、依赖倒置
- **KISS** - 保持简单
- **DRY** - 杜绝重复
- **YAGNI** - 只实现需要的功能
- **TDD** - Red → Green → Refactor

## 隐私说明

- 所有数据处理在本地完成
- 不发送任何数据到服务器
- 不追踪用户行为
- 开源代码可审计

## License

MIT
