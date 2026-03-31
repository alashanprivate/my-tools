import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Select } from '@/components/ui/Select'
import { explain, validate, schedule, generate } from '@/lib/cron'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export function CronTools() {
  const [input, setInput] = useState('0 0 12 * * ?')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [nextRuns, setNextRuns] = useState<Date[]>([])
  const [runCount, setRunCount] = useState(5)
  const [copied, setCopied] = useState(false)
  const [generateConfig, setGenerateConfig] = useState({
    preset: 'daily'
  })
  const { showToast } = useToast()

  const handleExplain = () => {
    if (!input.trim()) {
      setError('请输入 Cron 表达式')
      return
    }

    const result = explain(input)
    setOutput(result.description)
    setError('')

    try {
      const scheduled = schedule(input, new Date(), runCount)
      setNextRuns(scheduled.nextRuns)
    } catch (err) {
      setNextRuns([])
    }
  }

  const handleValidate = () => {
    if (!input.trim()) {
      setError('请输入 Cron 表达式')
      return
    }

    const result = validate(input)
    if (result.valid) {
      setOutput('✅ Cron 表达式有效')
      setError('')
    } else {
      setError(result.error || '无效的表达式')
      setOutput('')
    }
  }

  const handleGenerate = () => {
    try {
      const expression = generate({ preset: generateConfig.preset })
      setInput(expression)
      setOutput(`生成的表达式: ${expression}`)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setOutput('')
    }
  }

  const handleCopy = async () => {
    if (!input) return

    try {
      await navigator.clipboard.writeText(input)
      setCopied(true)
      showToast('已复制到剪贴板', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('复制失败', 'error')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
    setNextRuns([])
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Cron 表达式工具</h1>
        <p className="text-muted-foreground">
          生成、解释、验证 Cron 表达式，计算未来执行时间
        </p>
      </div>

      <Tabs defaultValue="explain" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="explain">解释 & 测试</TabsTrigger>
          <TabsTrigger value="validate">验证</TabsTrigger>
          <TabsTrigger value="generate">生成</TabsTrigger>
        </TabsList>

        <TabsContent value="explain">
          <Card>
            <CardHeader>
              <CardTitle>Cron 表达式解释</CardTitle>
              <CardDescription>
                输入 Cron 表达式，查看中文解释和未来执行时间
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="输入 Cron 表达式，如: 0 0 12 * * ?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />

              <div className="flex gap-2 items-center">
                <Button onClick={handleExplain}>解释</Button>
                <Button onClick={handleClear} variant="outline">清空</Button>
                {input && (
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="ml-auto gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? '已复制' : '复制'}
                  </Button>
                )}
              </div>

              {output && !error && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">解释结果：</p>
                  <p>{output}</p>
                </div>
              )}

              {nextRuns.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">未来执行时间</label>
                    <Select
                      value={runCount.toString()}
                      onChange={(e) => setRunCount(parseInt(e.target.value))}
                      options={[
                        { value: '5', label: '5 次' },
                        { value: '10', label: '10 次' },
                        { value: '20', label: '20 次' },
                        { value: '50', label: '50 次' },
                      ]}
                      className="w-24"
                    />
                  </div>
                  <div className="space-y-1">
                    {nextRuns.map((date, index) => (
                      <div key={index} className="text-sm font-mono p-2 bg-muted rounded">
                        {index + 1}. {formatDate(date)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validate">
          <Card>
            <CardHeader>
              <CardTitle>Cron 表达式验证</CardTitle>
              <CardDescription>
                验证 Cron 表达式的语法和范围是否正确
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="输入要验证的 Cron 表达式"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button onClick={handleValidate}>验证</Button>
                <Button onClick={handleClear} variant="outline">清空</Button>
              </div>

              {output && (
                <div className={`p-4 rounded-lg ${error ? 'bg-destructive/10 text-destructive' : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'}`}>
                  {output}
                </div>
              )}

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Cron 表达式生成</CardTitle>
              <CardDescription>
                通过预设生成常用的 Cron 表达式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="预设模式"
                value={generateConfig.preset}
                onChange={(e) => setGenerateConfig({ ...generateConfig, preset: e.target.value })}
                options={[
                  { value: 'everyMinute', label: '每分钟' },
                  { value: 'every5min', label: '每 5 分钟' },
                  { value: 'every15min', label: '每 15 分钟' },
                  { value: 'every30min', label: '每 30 分钟' },
                  { value: 'hourly', label: '每小时' },
                  { value: 'daily', label: '每天（中午12点）' },
                  { value: 'weekly', label: '每周' },
                  { value: 'monthly', label: '每月' },
                  { value: 'workdays', label: '工作日（上午9点）' },
                ]}
              />

              <Button onClick={handleGenerate}>生成表达式</Button>

              {input && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">生成的表达式：</label>
                  <Textarea
                    value={input}
                    readOnly
                    className="min-h-[80px] font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    复制表达式
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Cron 表达式语法说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-2">标准格式（6段）：</p>
            <code className="block p-2 bg-muted rounded">
              秒 分 时 日 月 周
            </code>
          </div>

          <div>
            <p className="font-medium mb-2">特殊字符：</p>
            <ul className="list-disc list-inside space-y-1">
              <li><code>*</code> - 匹配所有值</li>
              <li><code>?</code> - 不指定值（仅用于日和周）</li>
              <li><code>,</code> - 列表分隔符，如 <code>1,2,3</code></li>
              <li><code>-</code> - 范围，如 <code>1-5</code></li>
              <li><code>/</code> - 步长，如 <code>*/5</code> 表示每5个单位</li>
            </ul>
          </div>

          <div>
            <p className="font-medium mb-2">常用示例：</p>
            <ul className="space-y-1">
              <li><code>0 0 12 * * ?</code> - 每天 12:00 执行</li>
              <li><code>0 */5 * * * ?</code> - 每 5 分钟执行</li>
              <li><code>0 0 9-17 * * 1-5</code> - 工作日 9:00 到 17:00 每小时执行</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
