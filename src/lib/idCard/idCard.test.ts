import { describe, it, expect } from 'vitest'
import { generateIdCard, generateMultipleIdCards, validateIdCard } from './index'
import type { ValidateResult, IdCardInfo } from './index'

/** 按国家标准权重独立计算校验码，用于交叉验证 */
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const CHECK_MAP = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

function expectedCheckCode(idCard17: string): string {
  const sum = WEIGHTS.reduce((acc, w, i) => acc + parseInt(idCard17[i], 10) * w, 0)
  return CHECK_MAP[sum % 11]
}

/** 收窄联合类型，取出验证成功后的身份证信息 */
function mustInfo(result: ValidateResult): IdCardInfo {
  if (!result.success) {
    throw new Error(`预期验证通过，实际失败: ${result.error}`)
  }
  return result.info
}

// 手工构造的合法身份证号：11010119900101001 + 校验码 '5'
const VALID_ID = '11010119900101001' + expectedCheckCode('11010119900101001')

describe('generateIdCard', () => {
  it('生成 18 位且校验码正确的身份证号', () => {
    const info = generateIdCard()
    expect(info.idCard).toMatch(/^\d{17}[\dX]$/)
    expect(info.idCard).toHaveLength(18)
    expect(validateIdCard(info.idCard).valid).toBe(true)
  })

  it('校验码与独立计算结果一致', () => {
    const info = generateIdCard()
    expect(info.checkCode).toBe(expectedCheckCode(info.idCard.slice(0, 17)))
  })

  it('指定性别为男性时顺序码为奇数', () => {
    const info = generateIdCard({ gender: 'male' })
    expect(parseInt(info.sequenceCode, 10) % 2).toBe(1)
    expect(info.gender).toBe('male')
  })

  it('指定性别为女性时顺序码为偶数', () => {
    const info = generateIdCard({ gender: 'female' })
    expect(parseInt(info.sequenceCode, 10) % 2).toBe(0)
    expect(info.gender).toBe('female')
  })

  it('指定地区码和出生日期', () => {
    const info = generateIdCard({ regionCode: '110101', birthDate: '1990-01-01' })
    expect(info.regionCode).toBe('110101')
    expect(info.birthDate).toBe('1990-01-01')
    expect(info.idCard.slice(6, 14)).toBe('19900101')
    expect(info.regionName.length).toBeGreaterThan(0)
  })

  it('指定年龄范围时出生年份符合预期', () => {
    const currentYear = new Date().getFullYear()
    const info = generateIdCard({ minAge: 30, maxAge: 30 })
    expect(parseInt(info.birthDate.slice(0, 4), 10)).toBe(currentYear - 30)
  })

  it('返回完整的解析信息', () => {
    const info = generateIdCard({ regionCode: '110101', birthDate: '1990-01-01' })
    expect(info).toHaveProperty('idCard')
    expect(info).toHaveProperty('regionName')
    expect(info).toHaveProperty('age')
    expect(info).toHaveProperty('sequenceCode')
    expect(info).toHaveProperty('checkCode')
  })
})

describe('generateMultipleIdCards', () => {
  it('批量生成指定数量', () => {
    const results = generateMultipleIdCards(5)
    expect(results).toHaveLength(5)
    expect(results.every((r) => validateIdCard(r.idCard).valid)).toBe(true)
  })

  it('count 为 0 返回空数组', () => {
    expect(generateMultipleIdCards(0)).toEqual([])
  })
})

describe('validateIdCard', () => {
  it('验证合法身份证号并解析信息', () => {
    const info = mustInfo(validateIdCard(VALID_ID))
    expect(info.regionCode).toBe('110101')
    expect(info.birthDate).toBe('1990-01-01')
    expect(info.gender).toBe('male')
  })

  it('空输入返回错误', () => {
    expect(validateIdCard('')).toMatchObject({ valid: false, error: '身份证号不能为空' })
  })

  it('长度不为 18 位返回错误', () => {
    expect(validateIdCard('12345')).toMatchObject({ valid: false, error: '身份证号必须为18位' })
  })

  it('格式错误（含非法字符）返回错误', () => {
    expect(validateIdCard('abcdefghijklmnopqr')).toMatchObject({
      valid: false,
      error: '身份证号格式错误',
    })
  })

  it('校验码错误返回错误', () => {
    const wrongCheck = VALID_ID.slice(0, 17) + (VALID_ID[17] === '9' ? '8' : '9')
    expect(validateIdCard(wrongCheck)).toMatchObject({ valid: false, error: '校验码错误' })
  })

  it('生成-验证往返一致', () => {
    for (const gender of ['male', 'female', 'random'] as const) {
      const generated = generateIdCard({ gender })
      const info = mustInfo(validateIdCard(generated.idCard))
      expect(info.gender).toBe(generated.gender)
      expect(info.birthDate).toBe(generated.birthDate)
    }
  })
})
