# 开发者工具应用

> 基于 TDD (测试驱动开发) 方法论构建的现代化开发者工具集合，支持 Web 和桌面应用。

[English](README-en.md) | 中文

## 功能列表

| 工具 | 路由 | 说明 |
|------|------|------|
| **JSON 格式化** | `/json` | 格式化、压缩、验证、自动修复、AI 生成 Java 实体/Mock 数据 |
| **加解密** | `/crypto` | Base64、哈希、AES、SM2/SM3/SM4 |
| **Cron 表达式** | `/cron` | 生成、解释、验证、测试、AI 自然语言生成 |
| **JWT 工具** | `/jwt` | 生成、解析、验证 JWT Token |
| **正则表达式** | `/regex` | 测试、模板、代码生成 |
| **时间戳** | `/time` | 转换、时区、日期计算 |
| **二维码** | `/qrcode` | 生成、解析二维码 |
| **身份证** | `/idcard` | 生成、验证身份证信息 |
| **AI 对话** | `/ai-chat` | 常用 AI 聊天入口，桌面端应用内窗口打开 |
| **异常分析** | `/exception` | Java 堆栈本地解析 + AI 根因分析 |
| **SQL 助手** | `/sql` | DDL + 需求生成 SQL，或分析优化慢 SQL |
| **AI 设置** | `/ai` | 多档案配置 OpenAI 兼容接口（公司模型/本地 Ollama 快速切换） |

## 技术栈

**前端框架：**
- React 19 + TypeScript
- Vite 8.x
- Tailwind CSS 4 + 自定义组件
- React Router DOM v7
- Vitest 5 + React Testing Library 16

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
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── nav.ts
│   └── tools/           # 工具页面
│       ├── JsonFormatter.tsx
│       ├── CryptoTools.tsx
│       ├── CronTools.tsx
│       ├── JwtTool.tsx
│       ├── RegexTool.tsx
│       ├── TimeTool.tsx
    │       ├── QRCodeTool.tsx
    │       ├── IdCardTool.tsx
    │       ├── ExceptionAnalyzer.tsx
    │       ├── SqlAssistant.tsx
    │       └── AiSettings.tsx
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
    ├── idCard/          # 身份证
    ├── exception/       # Java 异常堆栈解析
    └── ai/              # AI 能力（OpenAI 兼容流式客户端、设置存储）
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
- AI 生成 Java 实体类（可选包名、Lombok @Data，嵌套对象与数组自动拆类）
- AI 生成 Mock 数据（以输入 JSON 为结构样例批量生成模拟数据，可加数量/取值约束）

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
- AI 生成（自然语言描述 → 表达式，支持 6 段 Quartz/Spring 与 5 段 crontab，生成后本地校验把关）

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

### 异常分析 (/exception)

- **本地解析（无需 AI 配置）**：识别异常链（含多层 `Caused by`）、根因异常、`... N more` 省略帧统计、高频包统计
- **业务帧定位**：配置业务包前缀（如 `com.example`）后，高亮根因链中最接近抛出点的业务代码帧
- **AI 分析（流式）**：按「根因判断 → 常见触发场景 → 排查步骤 → 修复建议」结构输出，支持补充上下文（如"SIT 环境偶现"）
- 支持中断与一键复制

### SQL 助手 (/sql)

- **DDL 生成 SQL**：粘贴建表语句 + 一句话需求 → 生成 SQL（含逻辑说明与索引/性能提示）
- **SQL 优化**：粘贴待分析 SQL（可含 EXPLAIN 输出）→ 问题分析、优化后的 SQL、优化点说明
- 支持方言选择：MySQL / PostgreSQL / Oracle；流式输出、可中断、一键复制

### AI 设置 (/ai)

- 多配置档案：公司模型、本地 Ollama 等多套配置一键切换，支持新建/删除/重命名
- 配置任意 OpenAI 兼容接口（Base URL + API Key + 模型名）
- 支持本地模型（Ollama `http://localhost:11434/v1`、LM Studio）和云端服务（OpenAI、DeepSeek、通义等）
- 测试连接并拉取模型列表
- 配置仅存本机 localStorage；流式输出，支持中断；旧版单配置自动迁移
- 全局「问 AI」：顶栏 ✨ 按钮或 Ctrl/Cmd+Shift+K 唤起，可自动携带当前工具页的上下文（正则、JSON、Cron、异常分析、SQL 五个页面已接入）
- 已接入工具：正则「AI 生成正则」、JSON「AI 生成 Java 实体 / Mock 数据」、Cron「AI 生成」、异常分析、SQL 助手

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
