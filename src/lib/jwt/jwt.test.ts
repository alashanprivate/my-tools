import { describe, it, expect } from 'vitest'
import { signJwt, verifyJwt, decodeJwt } from './index'
import type { JwtPayload } from './types'

describe('JWT 工具函数', () => {
  // 测试密钥
  const testSecret = 'test-secret-key-for-testing'

  describe('signJwt', () => {
    it('应该生成 HS256 Token', async () => {
      const payload: JwtPayload = {
        iss: 'test-issuer',
        sub: 'test-subject',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
      }

      const result = await signJwt({
        algorithm: 'HS256',
        payload,
        secret: testSecret,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.token).toBeTruthy()
        expect(result.token.split('.')).toHaveLength(3) // JWT 格式: header.payload.signature
      }
    })

    it('应该生成 HS384 Token', async () => {
      const payload: JwtPayload = {
        sub: 'user123',
      }

      const result = await signJwt({
        algorithm: 'HS384',
        payload,
        secret: testSecret,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.token).toBeTruthy()
      }
    })

    it('应该生成 HS512 Token', async () => {
      const payload: JwtPayload = {
        sub: 'user123',
      }

      const result = await signJwt({
        algorithm: 'HS512',
        payload,
        secret: testSecret,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.token).toBeTruthy()
      }
    })

    it('应该自动添加 iat 字段', async () => {
      const payload: JwtPayload = {
        sub: 'user123',
      }

      const result = await signJwt({
        algorithm: 'HS256',
        payload,
        secret: testSecret,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        const decoded = await decodeJwt(result.token)
        expect(decoded.success).toBe(true)
        if (decoded.success) {
          expect(decoded.payload.iat).toBeTruthy()
          expect(typeof decoded.payload.iat).toBe('number')
        }
      }
    })

    it('应该支持自定义字段', async () => {
      const payload: JwtPayload = {
        sub: 'user123',
        customField: 'custom-value',
        nested: { key: 'value' },
      }

      const result = await signJwt({
        algorithm: 'HS256',
        payload,
        secret: testSecret,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        const decoded = await decodeJwt(result.token)
        expect(decoded.success).toBe(true)
        if (decoded.success) {
          expect(decoded.payload.customField).toBe('custom-value')
          expect(decoded.payload.nested).toEqual({ key: 'value' })
        }
      }
    })

    it('应该处理空 payload', async () => {
      const result = await signJwt({
        algorithm: 'HS256',
        payload: {},
        secret: testSecret,
      })

      expect(result.success).toBe(true)
    })

    it('应该拒绝无效的密钥', async () => {
      const result = await signJwt({
        algorithm: 'HS256',
        payload: { sub: 'user123' },
        secret: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })
  })

  describe('verifyJwt', () => {
    it('应该验证有效的 HS256 Token', async () => {
      // 使用我们自己的 signJwt 生成 token
      const signResult = await signJwt({
        algorithm: 'HS256',
        payload: { sub: 'user123', iss: 'test-issuer' },
        secret: testSecret,
      })

      expect(signResult.success).toBe(true)
      if (signResult.success) {
        const verifyResult = await verifyJwt({
          token: signResult.token,
          secret: testSecret,
        })

        expect(verifyResult.success).toBe(true)
        expect(verifyResult.valid).toBe(true)
        if (verifyResult.success) {
          expect(verifyResult.payload.sub).toBe('user123')
          expect(verifyResult.payload.iss).toBe('test-issuer')
          expect(verifyResult.payload.iat).toBeTruthy()
          // exp 不应该自动添加，除非用户明确提供
          expect(verifyResult.payload.exp).toBeUndefined()
        }
      }
    })

    it('应该拒绝无效的签名', async () => {
      const token = 'invalid.token.here'

      const result = await verifyJwt({
        token,
        secret: testSecret,
      })

      expect(result.success).toBe(false)
      expect(result.valid).toBe(false)
    })

    it('应该检测过期的 Token', async () => {
      // 手动构造一个已过期的 token
      const now = Math.floor(Date.now() / 1000)
      const expiredPayload = {
        sub: 'user123',
        iat: now - 3600, // 1小时前签发
        exp: now - 1800, // 30分钟前过期
      }

      const signResult = await signJwt({
        algorithm: 'HS256',
        payload: expiredPayload,
        secret: testSecret,
      })

      expect(signResult.success).toBe(true)
      if (signResult.success) {
        const verifyResult = await verifyJwt({
          token: signResult.token,
          secret: testSecret,
        })

        expect(verifyResult.success).toBe(false)
        expect(verifyResult.valid).toBe(false)
        if (!verifyResult.success) {
          expect(verifyResult.error).toContain('过期')
        }
      }
    })

    it('应该验证算法匹配（当指定时）', async () => {
      // 生成一个 HS256 token
      const signResult = await signJwt({
        algorithm: 'HS256',
        payload: { sub: 'user123' },
        secret: testSecret,
      })

      expect(signResult.success).toBe(true)
      if (signResult.success) {
        // 指定正确的算法
        const verifyResult = await verifyJwt({
          token: signResult.token,
          secret: testSecret,
          algorithm: 'HS256',
        })

        expect(verifyResult.success).toBe(true)

        // 指定错误的算法应该失败
        const verifyResult2 = await verifyJwt({
          token: signResult.token,
          secret: testSecret,
          algorithm: 'HS512',
        })

        expect(verifyResult2.success).toBe(false)
      }
    })

    it('应该处理格式错误的 Token', async () => {
      const result = await verifyJwt({
        token: 'not-a-valid-jwt',
        secret: testSecret,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('decodeJwt', () => {
    it('应该解析有效的 Token', async () => {
      // 使用我们自己的 signJwt 生成 token
      const signResult = await signJwt({
        algorithm: 'HS256',
        payload: {
          sub: 'user123',
          iss: 'test-issuer',
          custom: 'value',
        },
        secret: testSecret,
      })

      expect(signResult.success).toBe(true)
      if (signResult.success) {
        const result = await decodeJwt(signResult.token)

        if (result.success) {
          expect(result.header.alg).toBe('HS256')
          expect(result.payload.sub).toBe('user123')
          expect(result.payload.iss).toBe('test-issuer')
          expect(result.payload.custom).toBe('value')
          expect(result.payload.iat).toBeTruthy()
          // exp 不应该自动添加
          expect(result.signature).toBeTruthy()
        }
      }
    })

    it('应该解析 jose 生成的 Token', async () => {
      // 测试会自动添加 typ: 'JWT'
      const signResult = await signJwt({
        algorithm: 'HS256',
        payload: { sub: 'user123' },
        secret: testSecret,
      })

      expect(signResult.success).toBe(true)
      if (signResult.success) {
        const decoded = await decodeJwt(signResult.token)

        expect(decoded.success).toBe(true)
        if (decoded.success) {
          expect(decoded.header.alg).toBe('HS256')
          // jose 库会自动添加 typ 字段
          expect(decoded.header.typ).toBe('JWT')
        }
      }
    })

    it('应该处理格式错误的 Token', async () => {
      const result = await decodeJwt('invalid-token')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('应该处理部分 Token（少于3部分）', async () => {
      const result = await decodeJwt('only.two')

      expect(result.success).toBe(false)
    })

    it('应该处理无效的 Base64URL', async () => {
      const result = await decodeJwt('invalid!@#$%^&*().invalid!@#$%^&*().invalid')

      expect(result.success).toBe(false)
    })

    it('应该提取签名部分', async () => {
      const signResult = await signJwt({
        algorithm: 'HS256',
        payload: { sub: 'user123' },
        secret: testSecret,
      })

      expect(signResult.success).toBe(true)
      if (signResult.success) {
        const decoded = await decodeJwt(signResult.token)

        expect(decoded.success).toBe(true)
        if (decoded.success) {
          expect(decoded.signature).toBeTruthy()
          expect(typeof decoded.signature).toBe('string')
        }
      }
    })
  })

  describe('Token 过期状态检查', () => {
    it('应该识别有效的 Token', async () => {
      // 明确提供 exp 字段
      const now = Math.floor(Date.now() / 1000)
      const signResult = await signJwt({
        algorithm: 'HS256',
        payload: {
          sub: 'user123',
          exp: now + 3600, // 1小时后过期
        },
        secret: testSecret,
      })

      expect(signResult.success).toBe(true)
      if (signResult.success) {
        const decoded = await decodeJwt(signResult.token)

        expect(decoded.success).toBe(true)
        if (decoded.success) {
          const exp = decoded.payload.exp
          expect(exp).toBeGreaterThan(now)
        }
      }
    })

    it('应该识别过期的 Token', async () => {
      // 手动构造一个已过期的 token
      const now = Math.floor(Date.now() / 1000)
      const expiredPayload = {
        sub: 'user123',
        iat: now - 3600, // 1小时前签发
        exp: now - 1800, // 30分钟前过期
      }

      const signResult = await signJwt({
        algorithm: 'HS256',
        payload: expiredPayload,
        secret: testSecret,
      })

      expect(signResult.success).toBe(true)
      if (signResult.success) {
        const decoded = await decodeJwt(signResult.token)

        expect(decoded.success).toBe(true)
        if (decoded.success) {
          const exp = decoded.payload.exp
          expect(exp).toBeLessThan(now)
        }
      }
    })
  })
})
