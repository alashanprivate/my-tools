import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { testRegex, generateCode, REGEX_TEMPLATES, FLAG_DESCRIPTIONS } from '@/lib/regex'
import { FileCode, Check, X, Copy, BookOpen } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type Tab = 'test' | 'templates' | 'code'

type CodeLanguage = 'javascript' | 'python' | 'java' | 'php' | 'go'

export function RegexTool() {
  const [tab, setTab] = useState<Tab>('test')
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('gm')
  const [testText, setTestText] = useState('')
  const [testResult, setTestResult] = useState<ReturnType<typeof testRegex> | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>('javascript')
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  // 实时测试正则表达式
  useEffect(() => {
    if (pattern && testText) {
      const result = testRegex(pattern, flags, testText)
      setTestResult(result)
    } else {
      setTestResult(null)
    }
  }, [pattern, flags, testText])

  // 应用模板
  const handleApplyTemplate = () => {
    const template = REGEX_TEMPLATES.find(t => t.name === selectedTemplate)
    if (template) {
      setPattern(template.pattern)
      setFlags(template.flags)
      setTestText(template.example)
      showToast('已应用模板', 'success')
    }
  }

  // 切换标志位
  const handleToggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''))
    } else {
      setFlags(flags + flag)
    }
  }

  // 复制代码
  const handleCopyCode = async () => {
    if (!pattern) {
      showToast('请先输入正则表达式', 'error')
      return
    }

    const snippet = generateCode(pattern, flags, codeLanguage)

    try {
      await navigator.clipboard.writeText(snippet.code)
      setCopied(true)
      showToast('代码已复制到剪贴板', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('复制失败', 'error')
    }
  }

  // 渲染匹配高亮
  const renderHighlightedText = () => {
    if (!testText || !testResult?.matches.length) return testText

    const matches = testResult.matches.sort((a, b) => a.index - b.index)
    const result: Array<{ text: string; isMatch: boolean }> = []
    let lastIndex = 0

    matches.forEach((match) => {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        result.push({
          text: testText.substring(lastIndex, match.index),
          isMatch: false,
        })
      }

      // 添加匹配的文本
      result.push({
        text: match.match,
        isMatch: true,
      })

      lastIndex = match.index + match.match.length
    })

    // 添加剩余文本
    if (lastIndex < testText.length) {
      result.push({
        text: testText.substring(lastIndex),
        isMatch: false,
      })
    }

    return result.map((part, i) => (
      <span
        key={i}
        className={part.isMatch ? 'bg-green-500/30 text-green-700 dark:text-green-300 rounded px-0.5' : ''}
      >
        {part.text}
      </span>
    ))
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">正则表达式工具</h1>
        <p className="text-muted-foreground">
          实时测试正则表达式，提供常用模板和代码生成
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === 'test' ? 'default' : 'outline'}
          onClick={() => setTab('test')}
        >
          <FileCode className="h-4 w-4 mr-2" />
          测试正则
        </Button>
        <Button
          variant={tab === 'templates' ? 'default' : 'outline'}
          onClick={() => setTab('templates')}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          常用模板
        </Button>
        <Button
          variant={tab === 'code' ? 'default' : 'outline'}
          onClick={() => setTab('code')}
        >
          <Copy className="h-4 w-4 mr-2" />
          代码生成
        </Button>
      </div>

      {/* 测试正则 */}
      {tab === 'test' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 输入区域 */}
          <Card>
            <CardHeader>
              <CardTitle>正则表达式</CardTitle>
              <CardDescription>输入正则表达式和测试文本</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>正则表达式</Label>
                <div className="flex gap-2">
                  <span className="text-muted-foreground select-none flex items-center">/</span>
                  <Input
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="例如: \\d+"
                    className="font-mono"
                  />
                  <span className="text-muted-foreground select-none flex items-center">/</span>
                  <Input
                    value={flags}
                    onChange={(e) => setFlags(e.target.value)}
                    placeholder="gm"
                    className="w-20 font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <Label>标志位</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {FLAG_DESCRIPTIONS.map((flagDesc) => (
                    <button
                      key={flagDesc.flag}
                      onClick={() => handleToggleFlag(flagDesc.flag)}
                      className={`px-3 py-1.5 rounded-md text-sm font-mono transition-colors ${
                        flags.includes(flagDesc.flag)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      title={flagDesc.description}
                    >
                      {flagDesc.flag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>测试文本</Label>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="输入要测试的文本..."
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* 结果区域 */}
          <Card>
            <CardHeader>
              <CardTitle>匹配结果</CardTitle>
              <CardDescription>
                {testResult?.isValid ? (
                  <>找到 {testResult.matches.length} 个匹配</>
                ) : (
                  <>等待输入...</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResult ? (
                <div className="space-y-4">
                  {testResult.isValid ? (
                    <>
                      {/* 匹配高亮 */}
                      <div className="p-4 bg-muted rounded-md">
                        <div className="text-sm text-muted-foreground mb-2">匹配高亮</div>
                        <div className="font-mono text-sm whitespace-pre-wrap break-words">
                          {renderHighlightedText()}
                        </div>
                      </div>

                      {/* 匹配列表 */}
                      {testResult.matches.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">匹配详情</div>
                          <div className="space-y-2 max-h-[300px] overflow-auto">
                            {testResult.matches.map((match, i) => (
                              <div key={i} className="p-3 bg-muted rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                  <Check className="h-4 w-4 text-green-500" />
                                  <span className="text-sm font-medium">匹配 #{i + 1}</span>
                                  <span className="text-xs text-muted-foreground">
                                    位置: {match.index}
                                  </span>
                                </div>
                                <div className="font-mono text-sm bg-background p-2 rounded">
                                  {match.match}
                                </div>
                                {match.groups.length > 0 && (
                                  <div className="mt-2 text-xs">
                                    <span className="text-muted-foreground">捕获组: </span>
                                    {match.groups.map((group, j) => (
                                      <span key={j} className="ml-2 font-mono bg-background px-1 rounded">
                                        ${j + 1}: {group || '(empty)'}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {testResult.matches.length === 0 && (
                        <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
                          <X className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>未找到匹配项</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                      <p className="font-medium text-destructive flex items-center gap-2">
                        <X className="h-4 w-4" />
                        正则表达式错误
                      </p>
                      <p className="text-sm text-destructive/80 mt-1">{testResult.error}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[400px] flex items-center justify-center border rounded-md border-dashed text-muted-foreground">
                  <div className="text-center">
                    <FileCode className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>输入正则表达式和测试文本</p>
                    <p className="text-sm mt-2">匹配结果将实时显示</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 常用模板 */}
      {tab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle>常用正则表达式模板</CardTitle>
            <CardDescription>选择模板快速应用到测试区域</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REGEX_TEMPLATES.map((template) => (
                <div
                  key={template.name}
                  className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedTemplate(template.name)
                    handleApplyTemplate()
                  }}
                >
                  <div className="font-medium mb-1">{template.name}</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {template.description}
                  </div>
                  <div className="font-mono text-xs bg-muted p-2 rounded">
                    {template.pattern}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    示例: {template.example}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 代码生成 */}
      {tab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>代码生成</CardTitle>
              <CardDescription>选择编程语言</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>编程语言</Label>
                <Select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value as CodeLanguage)}
                  options={[
                    { value: 'javascript', label: 'JavaScript' },
                    { value: 'python', label: 'Python' },
                    { value: 'java', label: 'Java' },
                    { value: 'php', label: 'PHP' },
                    { value: 'go', label: 'Go' },
                  ]}
                />
              </div>

              <div className="p-4 bg-muted rounded-md space-y-2">
                <div className="text-sm font-medium">当前正则</div>
                <div className="font-mono text-xs">
                  /{pattern}/{flags}
                </div>
              </div>

              <Button
                onClick={handleCopyCode}
                disabled={!pattern}
                className="w-full"
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? '已复制' : '复制代码'}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>生成的代码</CardTitle>
            </CardHeader>
            <CardContent>
              {pattern ? (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{generateCode(pattern, flags, codeLanguage).code}</code>
                </pre>
              ) : (
                <div className="min-h-[300px] flex items-center justify-center border rounded-md border-dashed text-muted-foreground">
                  请先输入正则表达式
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 功能说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>实时测试</strong>: 输入正则表达式和测试文本，实时显示匹配结果</p>
          <p>• <strong>匹配高亮</strong>: 高亮显示所有匹配的文本位置</p>
          <p>• <strong>捕获组</strong>: 显示每个匹配的捕获组内容</p>
          <p>• <strong>标志位</strong>: 支持多种正则表达式标志位切换</p>
          <p>• <strong>常用模板</strong>: 提供12种常用正则表达式模板</p>
          <p>• <strong>代码生成</strong>: 生成5种编程语言的正则表达式使用代码</p>
          <div className="mt-4 p-4 bg-muted rounded-md">
            <div className="font-medium mb-2">标志位说明</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {FLAG_DESCRIPTIONS.map((flagDesc) => (
                <div key={flagDesc.flag} className="flex gap-2">
                  <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded">
                    {flagDesc.flag}
                  </code>
                  <span className="text-xs">{flagDesc.name}: {flagDesc.description}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
