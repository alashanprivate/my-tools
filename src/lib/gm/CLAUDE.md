# 国密算法模块

[根目录](../../../CLAUDE.md) > [src](../../) > [lib](../) > **gm**

> 最后更新：2026-02-28 17:46:07

## 模块职责

提供中国国密标准算法（SM2/SM3/SM4）的封装实现。包括 SM2 椭圆曲线公钥密码、SM3 密码杂凑算法、SM4 分组密码算法。

## 入口与启动

**主文件：** `src/lib/gm/index.ts`

```typescript
import {
  sm3Hash,
  sm4Encrypt,
  sm4Decrypt,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2VerifySignature,
  sm2Encrypt,
  sm2Decrypt
} from '@/lib/gm'
```

## 对外接口

### SM3 密码杂凑算法

#### `sm3Hash(input: string): string`

计算字符串的 SM3 哈希值。

**参数：**
- `input: string` - 待哈希的字符串

**返回：** 64 位小写十六进制哈希值

**示例：**
```typescript
import { sm3Hash } from '@/lib/gm'

const hash = sm3Hash('Hello World')
// '44f0061e69fa6fdfc290c494654a05dc0c053da7e5c52b84ef93a9d67d3fff88'
```

**特性：**
- 输出长度：256 位（64 字符十六进制）
- 安全性：相当于 SHA-256
- 用途：数字签名、完整性校验

### SM4 分组密码算法

#### `sm4Encrypt(plaintext: string, key: string): string`

SM4 加密（ECB 模式）。

**参数：**
- `plaintext: string` - 明文
- `key: string` - 32 字符十六进制密钥（128 位）

**返回：** 十六进制密文

**示例：**
```typescript
import { sm4Encrypt, sm4Decrypt } from '@/lib/gm'

const key = '0123456789abcdeffedcba9876543210'
const ciphertext = sm4Encrypt('Hello World', key)
const plaintext = sm4Decrypt(ciphertext, key)
```

#### `sm4Decrypt(ciphertext: string, key: string): string`

SM4 解密（ECB 模式）。

**参数：**
- `ciphertext: string` - 十六进制密文
- `key: string` - 32 字符十六进制密钥（128 位）

**返回：** 明文

**注意：** 当前实现为 ECB 模式（sm-crypto 默认）。如需 CBC 模式，请直接使用 `sm-crypto` 库。

### SM2 椭圆曲线公钥密码

#### `sm2GenerateKeyPair(): SM2KeyPair`

生成 SM2 密钥对。

**返回：** `SM2KeyPair`
```typescript
interface SM2KeyPair {
  publicKey: string   // 130 字符十六进制（含 04 前缀）
  privateKey: string  // 64 字符十六进制
}
```

**示例：**
```typescript
const keyPair = sm2GenerateKeyPair()
// {
//   publicKey: '0412345678...abcdef',
//   privateKey: '12345678...abcdef'
// }
```

#### `sm2Sign(message: string, privateKey: string): string`

SM2 签名。

**参数：**
- `message: string` - 待签名消息
- `privateKey: string` - 64 字符十六进制私钥

**返回：** 128 字符十六进制签名

**示例：**
```typescript
const signature = sm2Sign('Hello World', privateKey)
```

#### `sm2VerifySignature(message: string, signature: string, publicKey: string): boolean`

SM2 验签。

**参数：**
- `message: string` - 原始消息
- `signature: string` - 128 字符十六进制签名
- `publicKey: string` - 130 字符十六进制公钥（含 04 前缀）

**返回：** 是否验证通过

**示例：**
```typescript
const isValid = sm2VerifySignature('Hello World', signature, publicKey)
```

#### `sm2Encrypt(plaintext: string, publicKey: string): string`

SM2 加密。

**参数：**
- `plaintext: string` - 明文
- `publicKey: string` - 130 字符十六进制公钥（含 04 前缀）

**返回：** 十六进制密文

#### `sm2Decrypt(ciphertext: string, privateKey: string): string`

SM2 解密。

**参数：**
- `ciphertext: string` - 十六进制密文
- `privateKey: string` - 64 字符十六进制私钥

**返回：** 明文

## 关键依赖与配置

**外部依赖：**
- `sm-crypto` ^0.4.0 - 国密算法实现

**类型定义：**
```typescript
// src/lib/gm/sm2.ts
interface SM2KeyPair {
  publicKey: string
  privateKey: string
}
```

**无配置文件。**

## 数据模型

### `SM2KeyPair`
```typescript
interface SM2KeyPair {
  publicKey: string   // 130 字符十六进制（含 04 前缀）
  privateKey: string  // 64 字符十六进制
}
```

### 密钥格式要求

**SM2 密钥：**
- 公钥：130 字符十六进制（含 04 前缀）或 128 字符（无前缀）
- 私钥：64 字符十六进制（256 位）

**SM4 密钥：**
- 密钥：32 字符十六进制（128 位）
- IV：32 字符十六进制（CBC 模式）

**SM3 输出：**
- 哈希值：64 字符十六进制（256 位）

## 测试与质量

**测试文件：**
- `src/lib/gm/sm2.test.ts`
- `src/lib/gm/sm3.test.ts`
- `src/lib/gm/sm4.test.ts`

**测试覆盖率：** 有完整测试

**测试内容：**
- SM2 密钥生成、签名、验签、加密、解密
- SM3 哈希计算
- SM4 加密、解密

**运行测试：**
```bash
npm test -- sm2.test.ts
npm test -- sm3.test.ts
npm test -- sm4.test.ts
```

## 实现细节

### SM2 椭圆曲线算法

**特点：**
- 基于椭圆曲线离散对数难题
- 密钥长度：256 位
- 性能：优于 RSA-2048

**用途：**
- 数字签名（代替 RSA）
- 密钥交换（代替 ECDH）
- 数据加密（配合对称加密）

**密钥格式：**
sm-crypto 生成的公钥带 `04` 前缀（未压缩格式）：
```typescript
const keyPair = sm2.generateKeyPairHex()
// keyPair.publicKey = '0412345678...abcdef'  // 130 字符
```

### SM3 密码杂凑算法

**特点：**
- 输出长度：256 位（64 字符十六进制）
- 安全性：相当于 SHA-256
- 性能：优于 SHA-256

**用途：**
- 数字签名（代替 SHA-256）
- 完整性校验
- 密码派生

**计算流程：**
```typescript
import { sm3 } from 'sm-crypto'

const hash = sm3('Hello World')
// '44f0061e69fa6fdfc290c494654a05dc0c053da7e5c52b84ef93a9d67d3fff88'
```

### SM4 分组密码算法

**特点：**
- 密钥长度：128 位（32 字符十六进制）
- 分组长度：128 位
- 轮数：32 轮

**模式：**
- ECB 模式（sm-crypto 默认）
- CBC 模式（需手动指定 IV）

**使用示例：**
```typescript
import { sm4 } from 'sm-crypto'

const key = '0123456789abcdeffedcba9876543210'

// ECB 模式
const encrypted = sm4.encrypt('Hello World', key)
const decrypted = sm4.decrypt(encrypted, key)

// CBC 模式
const iv = '0123456789abcdeffedcba9876543210'
const encryptedCBC = sm4.encrypt('Hello World', key, { mode: 'cbc', iv })
const decryptedCBC = sm4.decrypt(encryptedCBC, key, { mode: 'cbc', iv })
```

## 国密标准背景

### 算法介绍

**SM2（GM/T 0003）**
- 全称：SM2 椭圆曲线公钥密码算法
- 类型：非对称加密
- 发布时间：2010 年
- 依据：ANSI X9.62、IEEE 1363

**SM3（GM/T 0004）**
- 全称：SM3 密码杂凑算法
- 类型：哈希算法
- 发布时间：2010 年
- 输出长度：256 位

**SM4（GM/T 0002）**
- 全称：SM4 分组密码算法
- 类型：对称加密
- 发布时间：2006 年
- 密钥长度：128 位

### 应用场景

**金融行业：**
- 银行卡（PBOC 3.0）
- 网上银行
- 移动支付

**政府机关：**
- 电子政务
- 身份认证
- 数据加密

**通信行业：**
- 5G 通信
- 物联网安全
- TLS 1.3 国密套件

## 常见问题 (FAQ)

### Q: SM2 公钥长度不对？

sm-crypto 生成的公钥带 `04` 前缀（130 字符）。某些场景需要去掉前缀（128 字符）。

**修复：**
```typescript
const publicKey = keyPair.publicKey.startsWith('04')
  ? keyPair.publicKey.slice(2)
  : keyPair.publicKey
```

### Q: SM4 加密失败？

检查：
1. 密钥是否为 32 字符十六进制（128 位）
2. 明文不能为空
3. CBC 模式需要提供 IV

### Q: 与国际算法的对应关系？

| 国密算法 | 国际算法 |
|---------|---------|
| SM2 | ECDSA / ECDH / RSA |
| SM3 | SHA-256 |
| SM4 | AES-128 |

### Q: 为什么使用国密算法？

1. **合规要求** - 国内特定行业强制要求
2. **安全性** - 经过国家密码管理局认证
3. **性能** - SM4 性能优于 AES-128
4. **自主可控** - 不受国外算法限制

### Q: 性能对比？

| 算法 | 密钥长度 | 性能 | 安全性 |
|------|---------|------|--------|
| SM2 vs RSA-2048 | 256 vs 2048 位 | 快 3-5 倍 | 相当 |
| SM3 vs SHA-256 | 256 vs 256 位 | 快 10-20% | 相当 |
| SM4 vs AES-128 | 128 vs 128 位 | 相当 | 相当 |

## 安全说明

**重要提示：**

1. **密钥管理** - 不要在代码中硬编码密钥
2. **密钥随机性** - 使用加密安全的随机数生成器
3. **IV 唯一性** - CBC 模式每次加密应使用不同的 IV
4. **错误处理** - 解密失败应丢弃密文，防止重放攻击

**密钥生成建议：**
```typescript
// SM2 密钥对（由 sm-crypto 生成）
const keyPair = sm2GenerateKeyPair()

// SM4 密钥（使用加密随机数）
import { randomBytes } from 'crypto'
const key = randomBytes(16).toString('hex') // 32 字符
```

## 相关文件清单

```
src/lib/gm/
├── index.ts           # 统一导出
├── sm2.ts             # SM2 实现
├── sm3.ts             # SM3 实现
├── sm4.ts             # SM4 实现
├── sm2.test.ts        # SM2 测试
├── sm3.test.ts        # SM3 测试
└── sm4.test.ts        # SM4 测试

# 也在 src/lib/crypto/ 中提供了封装版本
src/lib/crypto/index.ts
```

## 变更记录

### 2026-02-28 17:46:07
- 初始化模块文档
- 记录 SM2/SM3/SM4 接口和使用方法
- 添加国密标准背景和 FAQ
