/**
 * 国密SM系列算法工具集
 *
 * 包含SM2、SM3、SM4三种国密算法的封装
 * - SM2: 椭圆曲线公钥密码算法（签名验签、加密解密）
 * - SM3: 密码杂凑算法
 * - SM4: 分组密码算法
 */

// SM3 密码杂凑算法
export { sm3Hash } from './sm3'

// SM4 分组密码算法
export { sm4Encrypt, sm4Decrypt } from './sm4'

// SM2 椭圆曲线公钥密码算法
export {
  sm2GenerateKeyPair,
  sm2Sign,
  sm2VerifySignature,
  sm2Encrypt,
  sm2Decrypt,
  type SM2KeyPair,
} from './sm2'
