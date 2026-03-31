/**
 * 性别类型
 */
export type Gender = 'male' | 'female' | 'random'

/**
 * 生成身份证号选项
 */
export interface GenerateIdCardOptions {
  /**
   * 地区码（6位数字）
   * 如果不提供，将随机选择一个常见地区
   */
  regionCode?: string

  /**
   * 出生日期（格式：YYYY-MM-DD）
   * 如果不提供，将生成一个18-70岁之间的随机日期
   */
  birthDate?: string

  /**
   * 性别
   * - 'male': 男性（奇数顺序码）
   * - 'female': 女性（偶数顺序码）
   * - 'random': 随机
   */
  gender?: Gender

  /**
   * 最小年龄（当 birthDate 未指定时使用）
   */
  minAge?: number

  /**
   * 最大年龄（当 birthDate 未指定时使用）
   */
  maxAge?: number
}

/**
 * 身份证号信息
 */
export interface IdCardInfo {
  /**
   * 完整身份证号（18位）
   */
  idCard: string

  /**
   * 地区码（前6位）
   */
  regionCode: string

  /**
   * 地区名称
   */
  regionName: string

  /**
   * 出生日期（YYYY-MM-DD 格式）
   */
  birthDate: string

  /**
   * 年龄
   */
  age: number

  /**
   * 性别
   */
  gender: 'male' | 'female'

  /**
   * 顺序码（第15-17位）
   */
  sequenceCode: string

  /**
   * 校验码（第18位）
   */
  checkCode: string
}

/**
 * 验证结果
 */
export type ValidateResult =
  | { success: true; valid: true; info: IdCardInfo }
  | { success: false; valid: false; error: string }
