import type { ChatMessage } from './types'

const REGEX_SYSTEM_PROMPT =
  '你是正则表达式专家。根据用户的自然语言描述，生成一个 JavaScript 兼容的正则表达式（不含分隔符和标志位）。' +
  '只输出正则表达式本身，不要任何解释、Markdown 代码块或首尾的斜杠。'

/** 构造「自然语言 → 正则」的对话消息 */
export function buildRegexMessages(description: string): ChatMessage[] {
  return [
    { role: 'system', content: REGEX_SYSTEM_PROMPT },
    { role: 'user', content: description },
  ]
}

export interface JavaEntityOptions {
  /** Java 包名；为空则不生成 package 声明 */
  packageName: string
  /** 是否使用 Lombok @Data，否则生成完整 getter/setter */
  useLombok: boolean
}

const JAVA_ENTITY_SYSTEM_PROMPT =
  '你是 Java 开发专家。根据用户提供的 JSON 生成对应的 Java 实体类。要求：\n' +
  '- 类名根据 JSON 的业务语义合理命名（如 data 数组元素命名为 XxxItem）\n' +
  '- 字段使用小驼峰命名，类型根据 JSON 值推断（整数用 Integer/Long，小数用 BigDecimal，日期时间字符串用 String）\n' +
  '- 嵌套对象与数组生成对应的类，外层 JSON 是数组时以第一个元素的类为主实体\n' +
  '- 需要的 import（如 java.util.List、java.math.BigDecimal、Lombok 注解）要完整\n' +
  '- 根据字段名和值类型为类与字段添加简短中文注释\n' +
  '- 只输出 Java 代码，不要任何解释，不要 Markdown 代码块'

/** 构造「JSON → Java 实体类」的对话消息 */
export function buildJavaEntityMessages(json: string, options: JavaEntityOptions): ChatMessage[] {
  const requirements = [
    options.packageName.trim() ? `包名：${options.packageName.trim()}` : '不需要 package 声明',
    options.useLombok ? '使用 Lombok 的 @Data 注解' : '不使用 Lombok，生成完整的 getter/setter',
  ]
  return [
    { role: 'system', content: JAVA_ENTITY_SYSTEM_PROMPT },
    { role: 'user', content: `${requirements.join('；')}\n\nJSON 数据：\n${json}` },
  ]
}

const EXCEPTION_SYSTEM_PROMPT =
  '你是资深 Java 后端工程师，擅长排查线上异常。根据用户提供的异常堆栈进行分析，用中文严格按以下 Markdown 结构输出：\n' +
  '## 根因判断\n引用堆栈中的关键异常类与业务类帧，给出最可能的直接原因。\n' +
  '## 常见触发场景\n2~4 条，结合异常类型与堆栈上下文具体说明，不要泛泛而谈。\n' +
  '## 排查步骤\n按优先级列出可执行的排查动作（日志关键字、参数与数据检查、依赖与配置核对等）。\n' +
  '## 修复建议\n给出代码或配置层面的具体建议，可包含简短代码片段。\n' +
  '要求：结论先行；堆栈信息不足时，在根因判断后明确列出还需要哪些补充信息。'

/** 构造「异常堆栈 → AI 分析」的对话消息；context 为用户补充的上下文，可为空 */
export function buildExceptionMessages(stack: string, context: string): ChatMessage[] {
  const trimmedContext = context.trim()
  const user = `异常堆栈：\n${stack}${trimmedContext ? `\n\n补充上下文：${trimmedContext}` : ''}`
  return [
    { role: 'system', content: EXCEPTION_SYSTEM_PROMPT },
    { role: 'user', content: user },
  ]
}

/** cron 表达式格式 */
export type CronFormat = 'five-field' | 'six-field'

const CRON_SYSTEM_PROMPT =
  '你是 cron 表达式专家。根据用户的自然语言描述生成 cron 表达式。要求：\n' +
  '- 只输出表达式本身，不要任何解释、Markdown 代码块或引号\n' +
  '- 使用简洁写法（*、*/n、范围、? 占位）'

/** 构造「自然语言 → cron」的对话消息 */
export function buildCronMessages(description: string, format: CronFormat): ChatMessage[] {
  const formatHint =
    format === 'six-field'
      ? '生成 6 个字段：秒 分 时 日 月 周（Quartz/Spring 格式，日和周最多一个用 ? 占位）。'
      : '生成 5 个字段：分 时 日 月 周（Linux crontab 格式）。'
  return [
    { role: 'system', content: `${CRON_SYSTEM_PROMPT}\n- ${formatHint}` },
    { role: 'user', content: description },
  ]
}

/** 从模型回复中提取纯 cron 表达式：剥代码块、首尾引号与「表达式：」类前缀 */
export function extractCronFromResponse(text: string): string {
  let result = extractCodeBlock(text)
  result = result.replace(/^["'`]+|["'`]+$/g, '')
  result = result.replace(/^(?:cron\s*表达式?|cron|表达式)\s*[:：]\s*/i, '')
  return result.trim()
}

export type SqlMode = 'generate' | 'optimize'
export type SqlDialect = 'mysql' | 'postgresql' | 'oracle'

export interface SqlRequest {
  mode: SqlMode
  dialect: SqlDialect
  /** generate 模式：表结构 DDL */
  ddl: string
  /** generate 模式：查询需求（自然语言） */
  requirement: string
  /** optimize 模式：待分析的 SQL，可附 EXPLAIN 输出 */
  sql: string
}

const SQL_SYSTEM_PROMPT =
  '你是资深数据库工程师，擅长 SQL 编写与查询性能优化。用中文按 Markdown 结构输出：\n' +
  '生成需求输出：## SQL（sql 代码块）→ ## 逻辑说明 → ## 索引与性能提示；\n' +
  '优化需求输出：## 问题分析 → ## 优化后的 SQL（sql 代码块）→ ## 优化点说明。\n' +
  '严格依据用户给出的表结构编写，不要假设不存在的表、字段或数据量。'

const SQL_DIALECT_NAMES: Record<SqlDialect, string> = {
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  oracle: 'Oracle',
}

/** 构造「DDL+需求 → SQL」或「SQL → 优化建议」的对话消息 */
export function buildSqlMessages(request: SqlRequest): ChatMessage[] {
  const dialectName = SQL_DIALECT_NAMES[request.dialect]
  const user =
    request.mode === 'generate'
      ? `数据库：${dialectName}\n\n表结构 DDL：\n${request.ddl.trim()}\n\n查询需求：${request.requirement.trim()}`
      : `数据库：${dialectName}\n\n待分析的 SQL（如已执行 EXPLAIN 请一并粘贴其输出）：\n${request.sql.trim()}`
  return [
    { role: 'system', content: SQL_SYSTEM_PROMPT },
    { role: 'user', content: user },
  ]
}

const MOCK_DATA_SYSTEM_PROMPT =
  '你是测试数据生成专家。根据用户提供的 JSON 结构样例，生成一批模拟数据用于开发测试。要求：\n' +
  '- 保持与样例完全相同的字段名和结构层级，输出为 JSON 数组，每个元素结构与样例一致\n' +
  '- 数据逼真且多样：人名、手机号、邮箱、地址用合理的模拟值，金额、日期、状态等字段按语义取值\n' +
  '- ID、编号类字段保证唯一且格式与样例一致\n' +
  '- 只输出 JSON 数组，不要任何解释、Markdown 代码块或注释'

/** 构造「JSON 样例 + 要求 → 批量模拟数据」的对话消息 */
export function buildMockDataMessages(sampleJson: string, requirement: string): ChatMessage[] {
  const trimmed = requirement.trim()
  const user = `样例结构：\n${sampleJson.trim()}${trimmed ? `\n\n生成要求：${trimmed}` : ''}`
  return [
    { role: 'system', content: MOCK_DATA_SYSTEM_PROMPT },
    { role: 'user', content: user },
  ]
}

/** 「问 AI」对话轮次：面板展示与消息构造共用 */
export interface AskTurn {
  role: 'user' | 'assistant'
  content: string
}

const ASK_SYSTEM_PROMPT =
  '你是开发者工具箱内的 AI 助手，回答简洁、准确，使用中文；如提供了工具上下文，请结合上下文回答。'

/** 构造全局「问 AI」的多轮对话消息：系统提示（含可选工具上下文）+ 全部历史轮次 */
export function buildAskConversationMessages(
  turns: AskTurn[],
  context?: { toolName: string; content: string } | null,
): ChatMessage[] {
  const contextContent = context?.content.trim()
  return [
    {
      role: 'system',
      content:
        context && contextContent
          ? `${ASK_SYSTEM_PROMPT}\n\n【当前上下文 · ${context.toolName}】\n${contextContent}`
          : ASK_SYSTEM_PROMPT,
    },
    ...turns.map((turn) => ({ role: turn.role, content: turn.content })),
  ]
}

/**
 * 提取模型回复中的代码：优先取第一个 Markdown 代码块（任意语言标注），
 * 没有代码块时原样返回去首尾空白的内容。
 */
export function extractCodeBlock(text: string): string {
  const fenced = text.trim().match(/```[a-zA-Z]*\s*\n?([\s\S]*?)```/)
  return fenced ? fenced[1].trim() : text.trim()
}

/**
 * 从模型回复中提取纯正则文本：
 * 兼容 Markdown 代码块（可带语言标注）、正则字面量 /…/flags 包裹，以及直接输出。
 * 提取不到内容时返回空字符串。
 */
export function extractRegexFromResponse(text: string): string {
  let result = extractCodeBlock(text)
  const literal = result.match(/^\/(.+)\/([gimsuy]*)$/s)
  if (literal && !literal[1].includes('/')) result = literal[1]
  return result
}
