import type { GenerateConfig } from './types'

/**
 * 根据配置生成 Cron 表达式
 */
export function generate(config: GenerateConfig): string {
  // 预设模式
  if (config.preset) {
    return generatePreset(config.preset)
  }

  // 自定义模式
  const second = config.second ?? '0'
  const minute = config.minute ?? '0'
  const hour = config.hour ?? '*'
  const day = config.day ?? '*'
  const month = config.month ?? '*'
  const weekday = config.weekday ?? '?'

  return `${second} ${minute} ${hour} ${day} ${month} ${weekday}`
}

/**
 * 生成预设的 Cron 表达式
 */
function generatePreset(preset: string): string {
  const presets: Record<string, string> = {
    'everyMinute': '0 * * * * ?',
    'every5min': '0 */5 * * * ?',
    'every15min': '0 */15 * * * ?',
    'every30min': '0 */30 * * * ?',
    'hourly': '0 0 * * * ?',
    'daily': '0 0 12 * * ?',
    'weekly': '0 0 12 ? * 1',  // 每周一
    'monthly': '0 0 12 1 * ?',   // 每月1号
    'workdays': '0 0 9 * * 1-5',  // 工作日9点
  }

  if (presets[preset]) {
    return presets[preset]
  }

  throw new Error(`未知的预设: ${preset}`)
}
