import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/useToast'
import {
  AiError,
  buildSqlMessages,
  loadAiSettings,
  streamChatCompletion,
  useToolAiContext,
  type SqlDialect,
  type SqlMode,
} from '@/lib/ai'
import { Copy, Check, Database, Sparkles, Square } from 'lucide-react'

const DIALECT_OPTIONS = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'oracle', label: 'Oracle' },
]

export function SqlAssistant() {
  const [mode, setMode] = useState<SqlMode>('generate')
  const [dialect, setDialect] = useState<SqlDialect>('mysql')
  const [ddl, setDdl] = useState('')
  const [requirement, setRequirement] = useState('')
  const [sql, setSql] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [output, setOutput] = useState('')
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const { showToast } = useToast()

  useToolAiContext('SQL 助手', () =>
    mode === 'generate'
      ? `模式: 生成\n方言: ${dialect}\nDDL:\n${ddl}\n需求: ${requirement}`
      : `模式: 优化\n方言: ${dialect}\nSQL:\n${sql}`,
  )

  const canSubmit =
    mode === 'generate'
      ? ddl.trim().length > 0 && requirement.trim().length > 0
      : sql.trim().length > 0

  const handleRun = async () => {
    if (streaming || !canSubmit) return
    const aiSettings = loadAiSettings()
    if (!aiSettings.model.trim()) {
      showToast('请先在「AI 设置」中配置接口和模型', 'error')
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setStreaming(true)
    setOutput('')
    setDone(false)
    try {
      let full = ''
      await streamChatCompletion(
        aiSettings,
        buildSqlMessages({ mode, dialect, ddl, requirement, sql }),
        {
          signal: controller.signal,
          onDelta: (delta) => {
            full += delta
            setOutput(full)
          },
        },
      )
      setOutput(full)
      setDone(true)
      showToast(mode === 'generate' ? 'SQL 已生成' : '分析完成', 'success')
    } catch (error) {
      if (error instanceof AiError && error.kind === 'aborted') {
        showToast('已取消', 'info')
      } else {
        showToast(error instanceof Error ? error.message : String(error), 'error')
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  const handleCopy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      showToast('已复制到剪贴板', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('复制失败', 'error')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">SQL 助手</h1>
        <p className="text-muted-foreground">
          表结构 + 自然语言需求生成 SQL，或贴 SQL 与执行计划获取优化建议
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === 'generate' ? 'default' : 'outline'}
          onClick={() => setMode('generate')}
        >
          <Database className="h-4 w-4 mr-2" />
          DDL 生成 SQL
        </Button>
        <Button
          variant={mode === 'optimize' ? 'default' : 'outline'}
          onClick={() => setMode('optimize')}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          SQL 优化
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{mode === 'generate' ? '生成 SQL' : '优化分析'}</CardTitle>
          <CardDescription>
            {mode === 'generate'
              ? '粘贴相关表的建表 DDL，并用一句话描述查询需求'
              : '粘贴待分析的 SQL（如已执行 EXPLAIN，把输出一并贴上）'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Select
              label="数据库方言"
              value={dialect}
              onChange={(e) => setDialect(e.target.value as SqlDialect)}
              options={DIALECT_OPTIONS}
            />
          </div>

          {mode === 'generate' ? (
            <>
              <div>
                <Label htmlFor="sql-ddl">表结构 DDL</Label>
                <Textarea
                  id="sql-ddl"
                  value={ddl}
                  onChange={(e) => setDdl(e.target.value)}
                  placeholder={`CREATE TABLE t_order (\n  id BIGINT PRIMARY KEY,\n  user_id BIGINT,\n  amount DECIMAL(10,2),\n  created_at DATETIME\n);`}
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>
              <div>
                <Label htmlFor="sql-requirement">查询需求</Label>
                <Textarea
                  id="sql-requirement"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="如：查询最近 30 天下单金额最高的前 10 个用户，含用户名"
                  className="min-h-[80px]"
                />
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="sql-input">待分析的 SQL</Label>
              <Textarea
                id="sql-input"
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder={`SELECT * FROM t_order WHERE user_id = 1;\n\n-- 可选：EXPLAIN 输出也粘贴在这里`}
                className="font-mono text-sm min-h-[280px]"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            {streaming ? (
              <Button variant="outline" onClick={() => abortRef.current?.abort()}>
                <Square className="h-4 w-4 mr-2" />
                取消
              </Button>
            ) : (
              <Button onClick={handleRun} disabled={!canSubmit}>
                <Sparkles className="h-4 w-4 mr-2" />
                {mode === 'generate' ? 'AI 生成 SQL' : 'AI 分析'}
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              需先在「AI 设置」中配置服务；表结构不会发送到所配服务以外的任何地方
            </span>
          </div>
        </CardContent>
      </Card>

      {(streaming || output) && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{mode === 'generate' ? '生成的 SQL' : '分析结果'}</CardTitle>
                <CardDescription>
                  {streaming
                    ? '分析中…'
                    : mode === 'generate'
                      ? 'SQL → 逻辑说明 → 索引与性能提示'
                      : '问题分析 → 优化后的 SQL → 优化点说明'}
                </CardDescription>
              </div>
              {done && (
                <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? '已复制' : '复制'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono whitespace-pre-wrap">
              {output || '生成中…'}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
