/**
 * JWT 算法类型
 */
export type JwtAlgorithm =
  | 'HS256' // HMAC-SHA256
  | 'HS384' // HMAC-SHA384
  | 'HS512' // HMAC-SHA512
  | 'RS256' // RSA-SHA256

/**
 * JWT Payload 标准字段
 * @see https://tools.ietf.org/html/rfc7519#section-4.1
 */
export interface JwtPayload {
  iss?: string // Issuer: 签发者
  sub?: string // Subject: 主题
  aud?: string | string[] // Audience: 受众
  exp?: number // Expiration: 过期时间（Unix timestamp）
  nbf?: number // Not Before: 生效时间（Unix timestamp）
  iat?: number // Issued At: 签发时间（Unix timestamp）
  jti?: string // JWT ID: 唯一标识符

  [key: string]: unknown // 自定义字段
}

/**
 * JWT Header
 * @see https://tools.ietf.org/html/rfc7519#section-4.1.1
 */
export interface JwtHeader {
  alg: string // Algorithm: 算法
  typ?: string // Type: 类型（通常是 "JWT"）
  [key: string]: unknown // 自定义字段
}

/**
 * 生成 JWT 选项
 */
export interface SignOptions {
  algorithm: JwtAlgorithm
  payload: JwtPayload
  secret: string // HMAC 密钥或 RSA 私钥
}

/**
 * 生成 JWT 结果
 */
export type SignResult =
  | { success: true; token: string }
  | { success: false; error: string }

/**
 * 验证 JWT 选项
 */
export interface VerifyOptions {
  token: string
  secret: string // HMAC 密钥或 RSA 公钥
  algorithm?: string // 可选，验证算法匹配
}

/**
 * 验证 JWT 结果
 */
export type VerifyResult =
  | { success: true; valid: true; payload: JwtPayload }
  | { success: false; valid: false; error: string }

/**
 * 解析 JWT 结果（不验证签名）
 */
export type DecodeResult =
  | {
      success: true
      header: JwtHeader
      payload: JwtPayload
      signature: string
    }
  | { success: false; error: string }

/**
 * Token 过期状态
 */
export type TokenExpirationStatus =
  | 'valid' // 有效
  | 'expired' // 已过期
  | 'not-yet-valid' // 未生效
  | 'unknown' // 无法判断（无 exp/nbf 字段）
