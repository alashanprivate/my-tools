/**
 * 国密算法使用示例
 *
 * 此文件展示了如何使用 SM2、SM3、SM4 三种国密算法
 */

import {
  sm3Hash,
  sm4Encrypt,
  sm4Decrypt,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2VerifySignature,
  sm2Encrypt,
  sm2Decrypt,
  type SM2KeyPair,
} from './gm/index'

// ============= SM3 示例 =============
console.log('=== SM3 密码杂凑算法 ===')

const message = 'Hello World'
const hash = sm3Hash(message)
console.log(`消息: ${message}`)
console.log(`SM3 哈希: ${hash}`)
console.log(`哈希长度: ${hash.length} 字符\n`)

// ============= SM4 示例 =============
console.log('=== SM4 对称加密算法 ===')

const sm4Key = '0123456789abcdeffedcba9876543210' // 32个十六进制字符
const plaintext = '你好，世界！这是SM4加密测试。'

console.log(`原始消息: ${plaintext}`)

// 加密
const ciphertext = sm4Encrypt(plaintext, sm4Key)
console.log(`加密后: ${ciphertext}`)

// 解密
const decrypted = sm4Decrypt(ciphertext, sm4Key)
console.log(`解密后: ${decrypted}`)
console.log(`解密成功: ${decrypted === plaintext}\n`)

// ============= SM2 示例 =============
console.log('=== SM2 椭圆曲线公钥密码算法 ===')

// 生成密钥对
const keyPair: SM2KeyPair = sm2GenerateKeyPair()
console.log(`公钥: ${keyPair.publicKey}`)
console.log(`私钥: ${keyPair.privateKey}\n`)

// 签名与验签
console.log('--- 签名与验签 ---')
const document = '重要文件内容'
const signature = sm2Sign(document, keyPair.privateKey)
console.log(`文档: ${document}`)
console.log(`签名: ${signature}`)

const isValid = sm2VerifySignature(document, signature, keyPair.publicKey)
console.log(`验签结果: ${isValid}\n`)

// 加密与解密
console.log('--- 加密与解密 ---')
const secretMessage = '这是机密信息'
const encrypted = sm2Encrypt(secretMessage, keyPair.publicKey)
console.log(`原始消息: ${secretMessage}`)
console.log(`加密后: ${encrypted}`)

const decrypted2 = sm2Decrypt(encrypted, keyPair.privateKey)
console.log(`解密后: ${decrypted2}`)
console.log(`解密成功: ${decrypted2 === secretMessage}\n`)

// ============= 完整流程示例 =============
console.log('=== 完整应用场景示例 ===')

// 场景：Alice 发送加密并签名的消息给 Bob
console.log('场景：Alice -> Bob\n')

// Alice 和 Bob 各自生成密钥对
const aliceKeyPair = sm2GenerateKeyPair()
const bobKeyPair = sm2GenerateKeyPair()

// Alice 要发送的消息
const originalMessage = 'Bob，你好！这是 Alice 发送的机密消息。'
console.log(`Alice 的原始消息: ${originalMessage}`)

// 1. Alice 对消息签名（用自己的私钥）
const aliceSignature = sm2Sign(originalMessage, aliceKeyPair.privateKey)
console.log(`Alice 的签名: ${aliceSignature.substring(0, 32)}...`)

// 2. Alice 加密消息（用 Bob 的公钥）
const encryptedForBob = sm2Encrypt(originalMessage, bobKeyPair.publicKey)
console.log(`加密后的消息: ${encryptedForBob.substring(0, 32)}...`)

// Bob 收到消息后：
console.log('\nBob 收到消息后：')

// 3. Bob 解密消息（用自己的私钥）
const decryptedByBob = sm2Decrypt(encryptedForBob, bobKeyPair.privateKey)
console.log(`Bob 解密后的消息: ${decryptedByBob}`)

// 4. Bob 验证签名（用 Alice 的公钥）
const signatureValid = sm2VerifySignature(
  decryptedByBob,
  aliceSignature,
  aliceKeyPair.publicKey
)
console.log(`签名验证结果: ${signatureValid ? '✅ 消息确实来自 Alice' : '❌ 消息被篡改或签名错误'}`)

console.log('\n所有示例运行完成！')
