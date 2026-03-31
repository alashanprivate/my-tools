# 国密SM系列算法工具集

基于 `sm-crypto` 库封装的国密算法工具，包含 SM2、SM3、SM4 三种算法。

## 安装依赖

项目已包含 `sm-crypto` 依赖，无需额外安装。

## 使用方法

### SM3 密码杂凑算法

```typescript
import { sm3Hash } from '@/lib/gm'

// 计算字符串的SM3哈希值
const hash = sm3Hash('Hello World')
console.log(hash) // 输出64位十六进制字符串
```

### SM4 分组密码算法

SM4 是对称加密算法，加密和解密使用相同的密钥。

```typescript
import { sm4Encrypt, sm4Decrypt } from '@/lib/gm'

const key = '0123456789abcdeffedcba9876543210' // 32个十六进制字符

// 加密
const plaintext = 'Hello World'
const ciphertext = sm4Encrypt(plaintext, key)

// 解密
const decrypted = sm4Decrypt(ciphertext, key)
console.log(decrypted === plaintext) // true
```

**注意**：密钥必须是 32 个十六进制字符（16 字节）。

### SM2 椭圆曲线公钥密码算法

SM2 是非对称加密算法，使用公钥加密、私钥解密，或私钥签名、公钥验签。

#### 密钥对生成

```typescript
import { sm2GenerateKeyPair } from '@/lib/gm'

const keyPair = sm2GenerateKeyPair()
console.log(keyPair.publicKey)   // 130位十六进制字符串（包含04前缀）
console.log(keyPair.privateKey)  // 64位十六进制字符串
```

#### 签名与验签

```typescript
import { sm2Sign, sm2VerifySignature } from '@/lib/gm'

const message = 'Hello World'
const keyPair = sm2GenerateKeyPair()

// 签名（使用私钥）
const signature = sm2Sign(message, keyPair.privateKey)

// 验签（使用公钥）
const isValid = sm2VerifySignature(message, signature, keyPair.publicKey)
console.log(isValid) // true
```

#### 加密与解密

```typescript
import { sm2Encrypt, sm2Decrypt, sm2GenerateKeyPair } from '@/lib/gm'

const plaintext = 'Hello World'
const keyPair = sm2GenerateKeyPair()

// 加密（使用公钥）
const ciphertext = sm2Encrypt(plaintext, keyPair.publicKey)

// 解密（使用私钥）
const decrypted = sm2Decrypt(ciphertext, keyPair.privateKey)
console.log(decrypted === plaintext) // true
```

## API 文档

### SM3

#### `sm3Hash(input: string): string`

计算字符串的 SM3 哈希值。

**参数**：
- `input`: 要计算哈希的字符串

**返回值**：64 位小写十六进制哈希值

### SM4

#### `sm4Encrypt(plaintext: string, key: string): string`

SM4 加密。

**参数**：
- `plaintext`: 明文
- `key`: 32 个十六进制字符的密钥

**返回值**：十六进制密文

#### `sm4Decrypt(ciphertext: string, key: string): string`

SM4 解密。

**参数**：
- `ciphertext`: 十六进制密文
- `key`: 32 个十六进制字符的密钥

**返回值**：明文

### SM2

#### `sm2GenerateKeyPair(): SM2KeyPair`

生成 SM2 密钥对。

**返回值**：
```typescript
interface SM2KeyPair {
  publicKey: string   // 130位十六进制字符串
  privateKey: string  // 64位十六进制字符串
}
```

#### `sm2Sign(message: string, privateKey: string): string`

SM2 签名。

**参数**：
- `message`: 要签名的消息
- `privateKey`: 64 位十六进制私钥

**返回值**：128 位十六进制签名

#### `sm2VerifySignature(message: string, signature: string, publicKey: string): boolean`

SM2 验签。

**参数**：
- `message`: 原始消息
- `signature`: 128 位十六进制签名
- `publicKey`: 130 位十六进制公钥

**返回值**：是否验证通过

#### `sm2Encrypt(plaintext: string, publicKey: string): string`

SM2 加密。

**参数**：
- `plaintext`: 明文
- `publicKey`: 130 位十六进制公钥

**返回值**：十六进制密文

#### `sm2Decrypt(ciphertext: string, privateKey: string): string`

SM2 解密。

**参数**：
- `ciphertext`: 十六进制密文
- `privateKey`: 64 位十六进制私钥

**返回值**：明文

## 测试

所有功能都包含完整的单元测试，遵循 TDD（测试驱动开发）流程。

运行测试：
```bash
npm test src/lib/gm
```

查看覆盖率：
```bash
npm test src/lib/gm --coverage
```

当前覆盖率：
- SM2: 100%
- SM3: 100%
- SM4: 100%

## 技术细节

### SM2
- 基于椭圆曲线的公钥密码算法
- 密钥长度：256 位
- 支持加密解密和数字签名

### SM3
- 密码杂凑算法
- 输出长度：256 位（64 个十六进制字符）
- 适用于数字签名和完整性验证

### SM4
- 分组密码算法
- 分组长度：128 位
- 密钥长度：128 位
- 适用于数据加密

## 参考资料

- [GM/T 0002-2012 SM2椭圆曲线公钥密码算法](http://www.gmbz.org.cn/main/viewfile.aspx?filename=2012041714333925644.pdf)
- [GM/T 0004-2012 SM3密码杂凑算法](http://www.gmbz.org.cn/main/viewfile.aspx?filename=2012041716362726815.pdf)
- [GM/T 0002-2012 SM4分组密码算法](http://www.gmbz.org.cn/main/viewfile.aspx?filename=2012041714161447648.pdf)
- [sm-crypto](https://github.com/JuneAndGreen/sm-crypto)
