// Cron 字段类型
export type CronField = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'weekday'

// Cron 表达式格式
export type CronFormat = '5-part' | '6-part'

// 解析后的单个字段值
export interface ParsedField {
  field: CronField
  raw: string              // 原始值，如 "*"
  type: 'all' | 'range' | 'list' | 'step' | 'specific'
  values?: number[]        // 具体的值列表
  range?: { min: number; max: number }
  step?: number            // 步长，如 "*/5" 中的 5
}

// 完整的 Cron 表达式
export interface CronExpression {
  raw: string              // 原始表达式
  format: CronFormat       // 5段或6段
  parts: ParsedField[]     // 解析后的字段
}

// 验证结果
export interface ValidationResult {
  valid: boolean
  error?: string
  field?: CronField        // 错误发生的字段
  position?: number        // 错误位置
}

// 调度结果
export interface ScheduleResult {
  expression: string
  nextRuns: Date[]
  timezone: string
}

// 中文解释结果
export interface ExplanationResult {
  expression: string
  description: string      // 中文描述
  nextRuns: Date[]         // 可选：未来执行时间
}

// 生成配置
export interface GenerateConfig {
  second?: string
  minute?: string
  hour?: string
  day?: string
  month?: string
  weekday?: string
  preset?: string
}

// Cron 字段范围
export const FIELD_RANGES: Record<CronField, { min: number; max: number }> = {
  second: { min: 0, max: 59 },
  minute: { min: 0, max: 59 },
  hour: { min: 0, max:  23 },
  day: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  weekday: { min: 0, max: 6 }  // 0=周日, 6=周六
}
