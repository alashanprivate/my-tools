import type {
  GenerateIdCardOptions,
  Gender,
  IdCardInfo,
  ValidateResult,
} from './types'
import { REGION_DATA, getRegionName } from './regionData'

/**
 * 校验码对应表
 */
const CHECK_CODE_MAP = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

/**
 * 校验码权重
 */
const CHECK_CODE_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]

/**
 * 计算校验码
 */
function calculateCheckCode(idCard17: string): string {
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard17[i]) * CHECK_CODE_WEIGHTS[i]
  }
  return CHECK_CODE_MAP[sum % 11]
}

/**
 * 生成随机地区码
 */
function randomRegionCode(): string {
  // 随机选择一个省份
  const randomProvince = REGION_DATA[Math.floor(Math.random() * REGION_DATA.length)]

  if (!randomProvince.children || randomProvince.children.length === 0) {
    // 如果没有城市，返回省份代码后补0000
    return randomProvince.code.padEnd(6, '0')
  }

  // 随机选择一个城市
  const randomCity = randomProvince.children[Math.floor(Math.random() * randomProvince.children.length)]

  if (!randomCity.children || randomCity.children.length === 0) {
    // 如果没有区县，返回城市代码后补00
    return randomCity.code.padEnd(6, '0')
  }

  // 随机选择一个区县
  const randomDistrict = randomCity.children[Math.floor(Math.random() * randomCity.children.length)]

  return randomDistrict.code
}

/**
 * 生成随机出生日期
 */
function randomBirthDate(minAge: number, maxAge: number): string {
  const now = new Date()
  const currentYear = now.getFullYear()

  // 计算出生日期范围
  const maxBirthYear = currentYear - minAge
  const minBirthYear = currentYear - maxAge

  const year = Math.floor(Math.random() * (maxBirthYear - minBirthYear + 1)) + minBirthYear
  const month = Math.floor(Math.random() * 12) + 1
  const day = Math.floor(Math.random() * 28) + 1

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * 计算年龄
 */
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * 生成顺序码（第15-17位）
 */
function generateSequenceCode(gender: Gender): string {
  let code = Math.floor(Math.random() * 1000)
  code = Math.max(1, code) // 确保至少为001

  let lastDigit = code % 10

  // 根据性别调整最后一位
  if (gender === 'male') {
    // 男性：奇数
    if (lastDigit % 2 === 0) {
      lastDigit = lastDigit === 0 ? 1 : lastDigit - 1
    }
  } else if (gender === 'female') {
    // 女性：偶数
    if (lastDigit % 2 === 1) {
      lastDigit = lastDigit === 9 ? 0 : lastDigit + 1
    }
  }
  // random: 不做调整

  return String(Math.floor(code / 10) * 10 + lastDigit).padStart(3, '0')
}

/**
 * 生成身份证号
 */
export function generateIdCard(options: GenerateIdCardOptions = {}): IdCardInfo {
  const {
    regionCode: inputRegionCode,
    birthDate: inputBirthDate,
    gender = 'random',
    minAge = 18,
    maxAge = 70,
  } = options

  // 地区码
  const regionCode = inputRegionCode || randomRegionCode()
  const regionName = getRegionName(regionCode)

  // 出生日期
  const birthDate = inputBirthDate || randomBirthDate(minAge, maxAge)
  const birthDateStr = birthDate.replace(/-/g, '')

  // 顺序码
  const sequenceCode = generateSequenceCode(gender)

  // 前17位
  const idCard17 = regionCode + birthDateStr + sequenceCode

  // 校验码
  const checkCode = calculateCheckCode(idCard17)

  // 完整身份证号
  const idCard = idCard17 + checkCode

  // 判断性别
  const finalGender = (parseInt(sequenceCode) % 2 === 1) ? 'male' : 'female'

  // 计算年龄
  const age = calculateAge(birthDate)

  return {
    idCard,
    regionCode,
    regionName,
    birthDate,
    age,
    gender: finalGender,
    sequenceCode,
    checkCode,
  }
}

/**
 * 批量生成身份证号
 */
export function generateMultipleIdCards(
  count: number,
  options: GenerateIdCardOptions = {}
): IdCardInfo[] {
  const results: IdCardInfo[] = []
  for (let i = 0; i < count; i++) {
    results.push(generateIdCard(options))
  }
  return results
}

/**
 * 验证身份证号
 */
export function validateIdCard(idCard: string): ValidateResult {
  // 基本格式检查
  if (!idCard || typeof idCard !== 'string') {
    return { success: false, valid: false, error: '身份证号不能为空' }
  }

  const trimmed = idCard.trim()

  if (trimmed.length !== 18) {
    return { success: false, valid: false, error: '身份证号必须为18位' }
  }

  // 检查是否为数字（最后一位可以是 X）
  const idCardPattern = /^\d{17}[\dX]$/
  if (!idCardPattern.test(trimmed)) {
    return { success: false, valid: false, error: '身份证号格式错误' }
  }

  // 验证校验码
  const idCard17 = trimmed.substring(0, 17)
  const checkCode = trimmed[17]
  const expectedCheckCode = calculateCheckCode(idCard17)

  if (checkCode.toUpperCase() !== expectedCheckCode) {
    return { success: false, valid: false, error: '校验码错误' }
  }

  // 解析信息
  const regionCode = trimmed.substring(0, 6)
  const regionName = getRegionName(regionCode)

  const birthDateStr = trimmed.substring(6, 14)
  const year = parseInt(birthDateStr.substring(0, 4))
  const month = parseInt(birthDateStr.substring(4, 6))
  const day = parseInt(birthDateStr.substring(6, 8))
  const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  // 验证日期合理性
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) {
    return { success: false, valid: false, error: '出生日期无效' }
  }

  const age = calculateAge(birthDate)

  const sequenceCode = trimmed.substring(14, 17)
  const gender = parseInt(sequenceCode) % 2 === 1 ? 'male' : 'female'

  return {
    success: true,
    valid: true,
    info: {
      idCard: trimmed,
      regionCode,
      regionName,
      birthDate,
      age,
      gender,
      sequenceCode,
      checkCode,
    },
  }
}

// 导出类型
export type {
  GenerateIdCardOptions,
  Gender,
  IdCardInfo,
  ValidateResult,
} from './types'
