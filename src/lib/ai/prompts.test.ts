import { describe, it, expect } from 'vitest'
import {
  buildAskConversationMessages,
  buildCronMessages,
  buildExceptionMessages,
  buildJavaEntityMessages,
  buildMockDataMessages,
  buildRegexMessages,
  buildSqlMessages,
  extractCodeBlock,
  extractCronFromResponse,
  extractRegexFromResponse,
} from './prompts'

describe('buildRegexMessages', () => {
  it('返回 system + user 两条消息', () => {
    const messages = buildRegexMessages('匹配手机号')
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[1]).toEqual({ role: 'user', content: '匹配手机号' })
  })
})

describe('extractRegexFromResponse', () => {
  it('纯文本直接返回', () => {
    expect(extractRegexFromResponse('^\\d+$')).toBe('^\\d+$')
  })

  it('去除带语言标注的 Markdown 代码块', () => {
    expect(extractRegexFromResponse('```regex\n\\d{11}\n```')).toBe('\\d{11}')
  })

  it('去除无语言标注的代码块', () => {
    expect(extractRegexFromResponse('```\n[a-z]+\n```')).toBe('[a-z]+')
  })

  it('回复夹带说明文字时仍能提取代码块', () => {
    const reply = '好的，正则如下：\n```regex\n\\d{11}\n```\n希望有帮助'
    expect(extractRegexFromResponse(reply)).toBe('\\d{11}')
  })

  it('去除正则字面量包裹（含标志位）', () => {
    expect(extractRegexFromResponse('/\\d+/gm')).toBe('\\d+')
  })

  it('包含斜杠的正则不误剥字面量包裹', () => {
    expect(extractRegexFromResponse('/a\\/b/')).toBe('/a\\/b/')
  })

  it('空内容返回空字符串', () => {
    expect(extractRegexFromResponse('  ')).toBe('')
  })
})

describe('buildJavaEntityMessages', () => {
  it('包含包名与 Lombok 要求', () => {
    const messages = buildJavaEntityMessages('{"id":1}', {
      packageName: 'com.example.dto',
      useLombok: true,
    })
    expect(messages[0].role).toBe('system')
    expect(messages[1].role).toBe('user')
    expect(messages[1].content).toContain('com.example.dto')
    expect(messages[1].content).toContain('Lombok')
    expect(messages[1].content).toContain('{"id":1}')
  })

  it('包名为空时要求不生成 package 声明', () => {
    const messages = buildJavaEntityMessages('{}', { packageName: '  ', useLombok: true })
    expect(messages[1].content).toContain('不需要 package 声明')
  })

  it('关闭 Lombok 时要求完整 getter/setter', () => {
    const messages = buildJavaEntityMessages('{}', { packageName: 'a.b', useLombok: false })
    expect(messages[1].content).toContain('不使用 Lombok')
    expect(messages[1].content).toContain('getter/setter')
  })
})

describe('buildExceptionMessages', () => {
  it('包含堆栈与四段分析结构', () => {
    const messages = buildExceptionMessages('java.lang.NullPointerException', '')
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('根因判断')
    expect(messages[1].content).toContain('java.lang.NullPointerException')
  })

  it('补充上下文为空时不出现占位内容', () => {
    const messages = buildExceptionMessages('stack', '   ')
    expect(messages[1].content).not.toContain('补充上下文')
  })

  it('补充上下文会拼进用户消息', () => {
    const messages = buildExceptionMessages('stack', 'SIT 环境偶现')
    expect(messages[1].content).toContain('补充上下文：SIT 环境偶现')
  })
})

describe('buildCronMessages', () => {
  it('6 段格式带 Quartz 提示', () => {
    const messages = buildCronMessages('每天九点', 'six-field')
    expect(messages[1].content).toBe('每天九点')
    expect(messages[0].content).toContain('6 个字段')
    expect(messages[0].content).toContain('Quartz')
  })

  it('5 段格式带 crontab 提示', () => {
    const messages = buildCronMessages('每天九点', 'five-field')
    expect(messages[0].content).toContain('5 个字段')
    expect(messages[0].content).toContain('crontab')
  })
})

describe('extractCronFromResponse', () => {
  it('提取代码块中的表达式', () => {
    expect(extractCronFromResponse('```cron\n0 0 9 ? * 2-6\n```')).toBe('0 0 9 ? * 2-6')
  })

  it('剥首尾引号', () => {
    expect(extractCronFromResponse('"0 0 12 * * ?"')).toBe('0 0 12 * * ?')
  })

  it('剥「表达式：」类前缀', () => {
    expect(extractCronFromResponse('表达式：0 0 12 * * ?')).toBe('0 0 12 * * ?')
    expect(extractCronFromResponse('cron: 0 0 12 * * ?')).toBe('0 0 12 * * ?')
  })

  it('纯表达式原样返回', () => {
    expect(extractCronFromResponse('0 */5 * * * ?')).toBe('0 */5 * * * ?')
  })
})

describe('buildSqlMessages', () => {
  it('生成模式包含 DDL 与需求、方言名称', () => {
    const messages = buildSqlMessages({
      mode: 'generate',
      dialect: 'mysql',
      ddl: 'CREATE TABLE t_order (id BIGINT);',
      requirement: '查最近 30 天订单总额',
      sql: '',
    })
    expect(messages[0].content).toContain('数据库工程师')
    expect(messages[1].content).toContain('MySQL')
    expect(messages[1].content).toContain('CREATE TABLE t_order')
    expect(messages[1].content).toContain('查最近 30 天订单总额')
    expect(messages[1].content).not.toContain('待分析的 SQL')
  })

  it('优化模式包含待分析 SQL 且不含 DDL 字段', () => {
    const messages = buildSqlMessages({
      mode: 'optimize',
      dialect: 'postgresql',
      ddl: '',
      requirement: '',
      sql: 'SELECT * FROM t_order;',
    })
    expect(messages[1].content).toContain('PostgreSQL')
    expect(messages[1].content).toContain('SELECT * FROM t_order;')
    expect(messages[1].content).not.toContain('查询需求')
  })

  it('方言名称正确映射', () => {
    const messages = buildSqlMessages({
      mode: 'optimize',
      dialect: 'oracle',
      ddl: '',
      requirement: '',
      sql: 'SELECT 1 FROM DUAL',
    })
    expect(messages[1].content).toContain('Oracle')
  })
})

describe('buildMockDataMessages', () => {
  it('包含样例结构与生成要求', () => {
    const messages = buildMockDataMessages('{"id": 1}', '生成 10 条')
    expect(messages[0].content).toContain('测试数据生成专家')
    expect(messages[1].content).toContain('{"id": 1}')
    expect(messages[1].content).toContain('生成要求：生成 10 条')
  })

  it('要求为空时不拼接生成要求', () => {
    const messages = buildMockDataMessages('{"id": 1}', '')
    expect(messages[1].content).not.toContain('生成要求')
  })
})

describe('buildAskConversationMessages', () => {
  it('携带上下文时 system 包含工具名与上下文', () => {
    const messages = buildAskConversationMessages([{ role: 'user', content: '这段正则在干嘛' }], {
      toolName: '正则表达式',
      content: '/\\d+/g',
    })
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('【当前上下文 · 正则表达式】')
    expect(messages[0].content).toContain('/\\d+/g')
    expect(messages[1]).toEqual({ role: 'user', content: '这段正则在干嘛' })
  })

  it('无上下文时 system 不包含上下文段落', () => {
    const messages = buildAskConversationMessages([{ role: 'user', content: '你好' }], null)
    expect(messages[0].content).not.toContain('当前上下文')
    expect(messages[1]).toEqual({ role: 'user', content: '你好' })
  })

  it('历史轮次按原顺序完整携带，支持连续追问', () => {
    const messages = buildAskConversationMessages([
      { role: 'user', content: '第一问' },
      { role: 'assistant', content: '第一答' },
      { role: 'user', content: '第二问' },
    ])
    expect(messages.slice(1)).toEqual([
      { role: 'user', content: '第一问' },
      { role: 'assistant', content: '第一答' },
      { role: 'user', content: '第二问' },
    ])
  })
})

describe('extractCodeBlock', () => {
  it('提取带语言标注的代码块', () => {
    expect(extractCodeBlock('```java\npublic class A {}\n```')).toBe('public class A {}')
  })

  it('说明文字包围时仍能提取', () => {
    const reply = '好的：\n```java\nint x = 1;\n```\n以上。'
    expect(extractCodeBlock(reply)).toBe('int x = 1;')
  })

  it('无代码块时原样返回去首尾空白', () => {
    expect(extractCodeBlock('  public class A {}  ')).toBe('public class A {}')
  })
})
