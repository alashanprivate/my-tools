import { FIELD_RANGES, type CronExpression, type CronField, type CronFormat, type ParsedField } from './types'

/**
 * 解析 Cron 表达式
 */
export function parse(expression: string): CronExpression {
  if (!expression || expression.trim().length === 0) {
    throw new Error('Cron 表达式不能为空')
  }

  const parts = expression.trim().split(/\s+/)
  let format: CronFormat

  // 判断是 5 段还是 6 段
  if (parts.length === 5) {
    format = '5-part'
    // 5段格式：分 时 日 月 周，在前面添加秒（默认为 0）
    parts.unshift('0')
  } else if (parts.length === 6) {
    format = '6-part'
  } else {
    throw new Error(`Cron 表达式段数不正确，期望 5 或 6 段，实际得到 ${parts.length} 段`)
  }

  const fields: CronField[] = ['second', 'minute', 'hour', 'day', 'month', 'weekday']
  const parsedParts: ParsedField[] = parts.map((part, index) =>
    parsePart(fields[index], part)
  )

  return {
    raw: expression,
    format,
    parts: parsedParts
  }
}

/**
 * 解析单个字段
 */
function parsePart(field: CronField, value: string): ParsedField {
  // 通配符
  if (value === '*' || value === '?') {
    return { field, raw: value, type: 'all' }
  }

  // 步长表达式：*/5 或 0-10/2
  if (value.includes('/')) {
    const [base, step] = value.split('/')
    const stepNum = parseInt(step, 10)

    if (isNaN(stepNum) || stepNum <= 0) {
      throw new Error(`${field} 字段的步长必须为正整数`)
    }

    if (base === '*' || base === '?') {
      return { field, raw: value, type: 'step', step: stepNum }
    }

    // 范围步长：0-10/2
    const rangePart = parsePart(field, base)
    if (rangePart.type === 'range' && rangePart.range) {
      return { field, raw: value, type: 'step', step: stepNum, values: generateRangeValues(rangePart.range.min, rangePart.range.max) }
    }
  }

  // 列表：1,2,3
  if (value.includes(',')) {
    const values = value.split(',').map(v => {
      const num = parseInt(v, 10)
      if (isNaN(num)) throw new Error(`${field} 字段包含无效值: ${v}`)
      return num
    })

    validateValues(field, values)
    return { field, raw: value, type: 'list', values }
  }

  // 范围：1-5
  if (value.includes('-')) {
    const [minStr, maxStr] = value.split('-')
    const min = parseInt(minStr, 10)
    const max = parseInt(maxStr, 10)

    if (isNaN(min) || isNaN(max)) {
      throw new Error(`${field} 字段的范围必须为数字`)
    }

    if (min > max) {
      throw new Error(`${field} 字段范围的最小值不能大于最大值`)
    }

    validateValue(field, min)
    validateValue(field, max)

    return { field, raw: value, type: 'range', range: { min, max }, values: generateRangeValues(min, max) }
  }

  // 具体值
  const num = parseInt(value, 10)
  if (isNaN(num)) {
    throw new Error(`${field} 字段必须为数字或有效表达式`)
  }

  validateValue(field, num)
  return { field, raw: value, type: 'specific', values: [num] }
}

/**
 * 验证单个值是否在有效范围内
 */
function validateValue(field: CronField, value: number): void {
  const range = FIELD_RANGES[field]
  if (value < range.min || value > range.max) {
    throw new Error(`${field} 字段值 ${value} 超出范围 [${range.min}, ${range.max}]`)
  }
}

/**
 * 验证多个值
 */
function validateValues(field: CronField, values: number[]): void {
  values.forEach(v => validateValue(field, v))
}

/**
 * 生成范围的值数组
 */
function generateRangeValues(min: number, max: number): number[] {
  const values: number[] = []
  for (let i = min; i <= max; i++) {
    values.push(i)
  }
  return values
}
