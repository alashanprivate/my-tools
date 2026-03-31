# 加解密工具模块

[根目录](../../../CLAUDE.md) > [src](../../) > [lib](../) > **crypto**

> 最后更新：2026-02-28 17:46:07

## 模块职责

提供常用的编码、哈希和对称加密功能。包括 Base64 编解码、MD5/SHA 哈希计算、AES 加解密，以及国密 SM2/SM3/SM4 算法封装。

## 入口与启动

**主文件：** `src/lib/crypto/index.ts`

```typescript
import {
  base64Encode,
  base64Decode,
  hash,
  aesEncrypt,
  aesDecrypt,
  sm2Encrypt,
  sm2Decrypt,
  sm2Sign,
  sm2Verify,
  sm3Hash,
  sm4Encrypt,
  sm4Decrypt
} from '@/lib/crypto'
```

## 对外接口

### Base64 编解码

#### `base64Encode(input: string): CryptoResult`

Base64 编码，支持 Unicode 字符。

**参数：**
- `input: string` - 待编码的字符串

**返回：** `CryptoResult`

**示例：**
```typescript
const result = base64Encode('Hello World')
// { success: true, result: 'SGVsbG8gV29ybGQ=' }
```

#### `base64Decode(input: string): CryptoResult`

Base64 解码。

**参数：**
- `input: string` - Base64 编码的字符串

**返回：** `CryptoResult`

**特性：**
- 验证 Base64 格式
- 支持 Unicode 字符

### 哈希计算

#### `hash(input: string, algorithm: HashAlgorithm): CryptoResult`

计算字符串的哈希值。

**参数：**
- `input: string` - 待哈希的字符串
- `algorithm: HashAlgorithm` - 哈希算法：`'md5' | 'sha1' | 'sha256' | 'sha512'`

**返回：** `CryptoResult`

**示例：**
```typescript
const result = hash('Hello World', 'sha256')
// { success: true, result: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e' }
```

**支持的算法：**
- `md5` - 128 位哈希（32 字符十六进制）
- `sha1` - 160 位哈希（40 字符十六进制）
- `sha256` - 256 位哈希（64 字符十六进制）
- `sha512` - 512 位哈希（128 字符十六进制）

### AES 加解密

#### `aesEncrypt(plaintext: string, options: AesOptions): CryptoResult`

AES 加密。

**参数：**
- `plaintext: string` - 明文
- `options: AesOptions`
  - `key: string` - 密钥
  - `iv?: string` - 初始化向量（可选）
  - `mode?: 'CBC' | 'CTR' | 'OFB' | 'ECB'` - 加密模式，默认 CBC
  - `padding?: 'Pkcs7' | 'ZeroPadding' | 'Iso10126'` - 填充方式，默认 Pkcs7

**返回：** `CryptoResult`

**示例：**
```typescript
const encrypted = aesEncrypt('Secret', { key: 'my-secret-key' })
// { success: true, result: 'U2FsdGVkX1...' }
```

#### `aesDecrypt(ciphertext: string, options: AesOptions): CryptoResult`

AES 解密。

**参数：**
- `ciphertext: string` - 密文
- `options: AesOptions` - 同加密参数

**返回：** `CryptoResult`

**注意：**
- 加密和解密必须使用相同的密钥、模式和填充
- CBC 模式建议提供 IV
- 空解密结果表示解密失败（密钥或密文不匹配）

### 国密算法

#### SM2 椭圆曲线公钥密码

##### `sm2GenerateKeyPair(): Sm2KeyPair`

生成 SM2 密钥对。

**返回：** `Sm2KeyPair`
```typescript
{
  publicKey: string   // 64 字符十六进制
  privateKey: string  // 64 字符十六进制
}
```

##### `sm2Encrypt(plaintext: string, options: Sm2EncryptOptions): CryptoResult`

SM2 加密。

**参数：**
- `plaintext: string` - 明文
- `options`
  - `publicKey: string` - 公钥（64 字符十六进制）
  - `mode?: 0 | 1` - 加密模式，1=C1C3C2（默认），0=C1C2C3

##### `sm2Decrypt(ciphertext: string, options: Sm2DecryptOptions): CryptoResult`

SM2 解密。

**参数：**
- `ciphertext: string` - 密文
- `options`
  - `privateKey: string` - 私钥（64 字符十六进制）
  - `mode?: 0 | 1` - 加密模式

##### `sm2Sign(message: string, options: Sm2SignOptions): CryptoResult`

SM2 签名。

**参数：**
- `message: string` - 待签名消息
- `options`
  - `privateKey: string` - 私钥
  - `userId?: string` - 用户 ID，默认 '1234567812345678'

##### `sm2Verify(message: string, signature: string, options: Sm2VerifyOptions): CryptoResult`

SM2 验签。

**参数：**
- `message: string` - 原始消息
- `signature: string` - 签名
- `options`
  - `publicKey: string` - 公钥
  - `userId?: string` - 用户 ID

#### SM3 密码杂凑算法

##### `sm3Hash(input: string): CryptoResult`

计算 SM3 哈希值。

**参数：**
- `input: string` - 待哈希字符串

**返回：** `CryptoResult`（64 字符小写十六进制）

**示例：**
```typescript
const result = sm3Hash('Hello World')
// { success: true, result: '...' }
```

#### SM4 分组密码算法

##### `sm4Encrypt(plaintext: string, options: Sm4Options): CryptoResult`

SM4 加密。

**参数：**
- `plaintext: string` - 明文
- `options`
  - `key: string` - 密钥（32 字符十六进制，128 位）
  - `mode?: 'ecb' | 'cbc'` - 模式，默认 ecb
  - `iv?: string` - IV（CBC 模式必需，32 字符十六进制）

##### `sm4Decrypt(ciphertext: string, options: Sm4Options): CryptoResult`

SM4 解密。

**参数：**
- `ciphertext: string` - 密文
- `options` - 同加密参数

## 关键依赖与配置

**外部依赖：**
- `crypto-js` ^4.2.0 - Base64、哈希、AES 实现
- `js-base64` ^3.7.7 - Base64 编解码（支持 Unicode）
- `sm-crypto` ^0.4.0 - 国密算法实现

**类型定义：** `src/lib/crypto/types.ts`

## 数据模型

### `CryptoResult`
```typescript
interface CryptoResult {
  success: boolean
  result?: string
  error?: string
}
```

### `AesOptions`
```typescript
interface AesOptions {
  key: string
  iv?: string
  mode?: 'CBC' | 'CTR' | 'OFB' | 'ECB'
  padding?: 'Pkcs7' | 'ZeroPadding' | 'Iso10126'
}
```

### `Sm2KeyPair`
```typescript
interface Sm2KeyPair {
  publicKey: string    // 64 字符十六进制
  privateKey: string   // 64 字符十六进制
}
```

### `Sm2EncryptOptions`
```typescript
interface Sm2EncryptOptions {
  publicKey: string
  mode?: 0 | 1  // 1=C1C3C2（默认），0=C1C2C3
}
```

### `Sm2DecryptOptions`
```typescript
interface Sm2DecryptOptions {
  privateKey: string
  mode?: 0 | 1
}
```

### `Sm2SignOptions`
```typescript
interface Sm2SignOptions {
  privateKey: string
  userId?: string  // 默认 '1234567812345678'
}
```

### `Sm2VerifyOptions`
```typescript
interface Sm2VerifyOptions {
  publicKey: string
  userId?: string
}
```

### `Sm4Options`
```typescript
interface Sm4Options {
  key: string           // 32 字符十六进制（128 位）
  mode?: 'ecb' | 'cbc'
  iv?: string           // CBC 模式必需，32 字符十六进制
}
```

## 测试与质量

**测试文件：** `src/lib/crypto/crypto.test.ts`

**测试覆盖率：** 77.95%
- 语句覆盖：77.95%
- 分支覆盖：63.04%
- 函数覆盖：100%

**测试用例数：** 25 个

**测试内容：**
- Base64 编解码（含 Unicode）
- 各种哈希算法
- AES 加解密（多种模式和填充）
- 国密算法（SM2/SM3/SM4）

**运行测试：**
```bash
npm test -- crypto.test.ts
```

## 实现细节

### Base64 编码

使用 `js-base64` 库而非浏览器原生 `atob`/`btoa`，原因：
- 原生 API 不支持 Unicode 字符
- `js-base64` 自动处理 UTF-8 编码

### AES 加密

**模式说明：**
- `CBC` - 密码分组链接（推荐，需要 IV）
- `CTR` - 计数器模式
- `OFB` - 输出反馈模式
- `ECB` - 电子密码本（不推荐，无需 IV）

**填充说明：**
- `Pkcs7` - PKCS#7 填充（推荐）
- `ZeroPadding` - 零填充
- `Iso10126` - ISO 10126 填充

**密钥处理：**
CryptoJS 自动处理字符串密钥，无需手动转换为 WordArray。

### 国密算法

**SM2 密钥格式：**
- 公钥：64 字符十六进制（256 位，不含 04 前缀）
- 私钥：64 字符十六进制（256 位）

**SM4 密钥格式：**
- 密钥：32 字符十六进制（128 位）
- IV：32 字符十六进制（CBC 模式必需）

**加密模式：**
- C1C3C2（mode=1，默认）：旧标准
- C1C2C3（mode=0）：新标准

## 常见问题 (FAQ)

### Q: AES 加密结果每次不同？

正常现象。CBC 模式使用随机 IV（未指定时），导致每次加密结果不同。解密时需要使用相同的 IV。

**解决方案：**
1. 固定 IV 值
2. 将 IV 与密文一起存储（通常拼接在密文前）

### Q: SM2 公钥长度不对？

sm-crypto 生成的公钥默认带 `04` 前缀（130 字符），实际使用时需要去掉前缀（128 字符）。

**修复：**
```typescript
const publicKey = keyPair.publicKey.startsWith('04')
  ? keyPair.publicKey.slice(2)
  : keyPair.publicKey
```

### Q: SM4 加密失败？

检查：
1. 密钥是否为 32 字符十六进制（128 位）
2. CBC 模式是否提供了 IV
3. IV 是否为 32 字符十六进制

### Q: Base64 解码报错？

检查输入是否为有效的 Base64 字符串：
- 只包含 `A-Za-z0-9+/=` 字符
- 末尾最多 2 个 `=` 填充

## 安全说明

**重要提示：**

1. **仅供学习使用** - 不建议用于生产环境
2. **密钥管理** - 不要在代码中硬编码密钥
3. **HTTPS** - 生产环境必须使用 HTTPS
4. **密钥强度** - 建议使用 256 位密钥（AES-256）
5. **IV 随机性** - CBC 模式应使用随机 IV

**加密算法选择建议：**
- **AES-256** - 通用场景
- **SM4** - 国内合规需求
- **SM2** - 数字签名和密钥交换
- **SM3** - 替代 SHA-256

## 相关文件清单

```
src/lib/crypto/
├── index.ts           # 主文件，包含所有加解密函数
├── types.ts           # TypeScript 类型定义
└── crypto.test.ts     # 测试文件

# 国密算法（独立模块）
src/lib/gm/
├── index.ts           # 国密算法统一导出
├── sm2.ts             # SM2 实现
├── sm3.ts             # SM3 实现
├── sm4.ts             # SM4 实现
└── *.test.ts          # 测试文件
```

## 变更记录

### 2026-02-28 17:46:07
- 初始化模块文档
- 记录所有加解密接口和国密算法
- 添加安全说明和 FAQ
