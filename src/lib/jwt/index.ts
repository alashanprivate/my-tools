import { base64url } from 'jose'
import type {
  SignOptions,
  SignResult,
  VerifyOptions,
  VerifyResult,
  DecodeResult,
  JwtPayload,
  JwtHeader,
} from './types'
/**
 * Base64URL 编码
 */
function base64UrlEncode(str: string): string {
  // 将字符串转为 base64
  const base64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16))
  }))
  // 转为 base64url
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * 生成 JWT Token
 */
export async function signJwt(options: SignOptions): Promise<SignResult> {
  try {
    const { algorithm, payload, secret } = options

    // 验证密钥
    if (!secret || secret.trim() === '') {
      return { success: false, error: '密钥不能为空' }
    }

    // 添加 iat 字段（如果不存在）
    const payloadWithIat = payload.iat
      ? payload
      : { ...payload, iat: Math.floor(Date.now() / 1000) }

    // 构造 Header
    const header = { alg: algorithm, typ: 'JWT' }

    // 编码 Header 和 Payload
    const encodedHeader = base64UrlEncode(JSON.stringify(header))
    const encodedPayload = base64UrlEncode(JSON.stringify(payloadWithIat))

    // 构造签名（使用 HMAC）
    const data = `${encodedHeader}.${encodedPayload}`
    const signature = await sign(data, secret, algorithm)

    return { success: true, token: `${data}.${signature}` }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成 Token 失败',
    }
  }
}

/**
 * HMAC 签名
 */
async function sign(data: string, secret: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const dataBytes = encoder.encode(data)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: algorithm.replace('HS', 'SHA-') } },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    { name: 'HMAC' },
    cryptoKey,
    dataBytes
  )

  // 转换为 base64url
  const signatureArray = Array.from(new Uint8Array(signature))
  const signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray))
  return signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * 验证 JWT Token
 */
export async function verifyJwt(options: VerifyOptions): Promise<VerifyResult> {
  try {
    const { token, secret, algorithm } = options

    // 验证输入
    if (!token || token.trim() === '') {
      return { success: false, valid: false, error: 'Token 不能为空' }
    }

    if (!secret || secret.trim() === '') {
      return { success: false, valid: false, error: '密钥不能为空' }
    }

    // 先解析 Token
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { success: false, valid: false, error: 'Token 格式错误' }
    }

    const [headerB64, payloadB64, signature] = parts

    // 解码 payload 检查过期
    let payload: Record<string, unknown>
    try {
      const payloadBytes = base64url.decode(payloadB64)
      const payloadText = new TextDecoder().decode(payloadBytes)
      payload = JSON.parse(payloadText)
    } catch {
      return { success: false, valid: false, error: 'Payload 解码失败' }
    }

    // 检查过期时间
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000)
      if ((payload.exp as number) < now) {
        return { success: false, valid: false, error: 'Token 已过期' }
      }
    }

    // 重新计算签名并验证
    const data = `${headerB64}.${payloadB64}`
    const expectedSignature = await sign(data, secret, algorithm || 'HS256')

    if (signature !== expectedSignature) {
      return { success: false, valid: false, error: '签名无效' }
    }

    // 验证算法匹配（如果指定）
    if (algorithm) {
      let header: Record<string, unknown>
      try {
        const headerBytes = base64url.decode(headerB64)
        const headerText = new TextDecoder().decode(headerBytes)
        header = JSON.parse(headerText)
      } catch {
        return { success: false, valid: false, error: 'Header 解码失败' }
      }

      if (header.alg !== algorithm) {
        return { success: false, valid: false, error: '算法不匹配' }
      }
    }

    return {
      success: true,
      valid: true,
      payload: payload as JwtPayload,
    }
  } catch (error) {
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : '验证失败',
    }
  }
}

/**
 * 解析 JWT Token（不验证签名）
 */
export async function decodeJwt(token: string): Promise<DecodeResult> {
  try {
    // 验证输入
    if (!token || token.trim() === '') {
      return { success: false, error: 'Token 不能为空' }
    }

    // JWT 格式: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { success: false, error: 'Token 格式错误' }
    }

    const [headerB64, payloadB64, signature] = parts

    // 解码 header
    let header: Record<string, unknown>
    try {
      const headerBytes = base64url.decode(headerB64)
      const headerText = new TextDecoder().decode(headerBytes)
      header = JSON.parse(headerText)
    } catch {
      return { success: false, error: 'Header 解码失败' }
    }

    // 解码 payload
    let payload: Record<string, unknown>
    try {
      const payloadBytes = base64url.decode(payloadB64)
      const payloadText = new TextDecoder().decode(payloadBytes)
      payload = JSON.parse(payloadText)
    } catch {
      return { success: false, error: 'Payload 解码失败' }
    }

    return {
      success: true,
      header: header as JwtHeader,
      payload: payload as JwtPayload,
      signature,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '解析失败',
    }
  }
}

// 导出类型
export type {
  JwtAlgorithm,
  JwtPayload,
  JwtHeader,
  SignOptions,
  SignResult,
  VerifyOptions,
  VerifyResult,
  DecodeResult,
  TokenExpirationStatus,
} from './types'
