import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { JsonTree } from '@/components/ui/JsonTree'
import { formatJson, minifyJson, validateJson } from '@/lib/json'
import { tryFixJson } from '@/lib/json/fixJson'
import {
  AiError,
  buildJavaEntityMessages,
  buildMockDataMessages,
  extractCodeBlock,
  loadAiSettings,
  streamChatCompletion,
  useToolAiContext,
} from '@/lib/ai'
import { Copy, Check, Wrench, Maximize, Minimize, FileCode2, Sparkles, Square, Boxes } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'

export function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState('2')
  const [sortKeys, setSortKeys] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [javaPackage, setJavaPackage] = useState('')
  const [useLombok, setUseLombok] = useState(true)
  const [javaStreaming, setJavaStreaming] = useState(false)
  const [javaStreamingText, setJavaStreamingText] = useState('')
  const [javaCode, setJavaCode] = useState('')
  const [javaCopied, setJavaCopied] = useState(false)
  const javaAbortRef = useRef<AbortController | null>(null)
  const [mockRequirement, setMockRequirement] = useState('')
  const [mockStreaming, setMockStreaming] = useState(false)
  const [mockStreamingText, setMockStreamingText] = useState('')
  const [mockCode, setMockCode] = useState('')
  const [mockCopied, setMockCopied] = useState(false)
  const mockAbortRef = useRef<AbortController | null>(null)
  const { showToast } = useToast()

  useToolAiContext('JSON 格式化', () => input)

  const handleFormat = () => {
    if (!input.trim()) {
      setError('请输入 JSON 字符串')
      return
    }

    const result = formatJson(input, {
      indent: Number.parseInt(indent),
      sortKeys,
    })

    if (result.success) {
      setOutput(result.result || '')
      setError('')
    } else {
      setError(result.error || '格式化失败')
      setOutput('')
    }
  }

  const handleMinify = () => {
    if (!input.trim()) {
      setError('请输入 JSON 字符串')
      return
    }

    const result = minifyJson(input)

    if (result.success) {
      setOutput(result.result || '')
      setError('')
    } else {
      setError(result.error || '压缩失败')
      setOutput('')
    }
  }

  const handleValidate = () => {
    if (!input.trim()) {
      setError('请输入 JSON 字符串')
      return
    }

    const result = validateJson(input)

    if (result.valid) {
      showToast('JSON 格式正确 ✅', 'success')
      setError('')
    } else {
      const errorMsg = result.line
        ? `第 ${result.line} 行错误: ${result.error}`
        : result.error
      setError(errorMsg || 'JSON 格式错误')
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

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  // AI 生成 Java 实体：流式生成，完成后清洗代码块
  const handleGenerateJava = async () => {
    if (javaStreaming) return
    if (!input.trim()) {
      showToast('请先输入 JSON', 'error')
      return
    }
    if (!validateJson(input).valid) {
      showToast('JSON 格式有误，请先修正再生成', 'error')
      return
    }
    const aiSettings = loadAiSettings()
    if (!aiSettings.model.trim()) {
      showToast('请先在「AI 设置」中配置接口和模型', 'error')
      return
    }
    const controller = new AbortController()
    javaAbortRef.current = controller
    setJavaStreaming(true)
    setJavaCode('')
    setJavaStreamingText('')
    try {
      let full = ''
      await streamChatCompletion(
        aiSettings,
        buildJavaEntityMessages(input, {
          packageName: javaPackage,
          useLombok,
        }),
        {
          signal: controller.signal,
          onDelta: (delta) => {
            full += delta
            setJavaStreamingText(full)
          },
        },
      )
      const code = extractCodeBlock(full)
      if (!code) {
        showToast('AI 未返回有效的 Java 代码', 'error')
      } else {
        setJavaCode(code)
        showToast('Java 实体已生成', 'success')
      }
    } catch (error) {
      if (error instanceof AiError && error.kind === 'aborted') {
        showToast('已取消生成', 'info')
      } else {
        showToast(error instanceof Error ? error.message : String(error), 'error')
      }
    } finally {
      setJavaStreaming(false)
      javaAbortRef.current = null
    }
  }

  const handleCopyJava = async () => {
    if (!javaCode) return
    try {
      await navigator.clipboard.writeText(javaCode)
      setJavaCopied(true)
      showToast('已复制到剪贴板', 'success')
      setTimeout(() => setJavaCopied(false), 2000)
    } catch {
      showToast('复制失败', 'error')
    }
  }

  // AI 生成 Mock 数据：以输入 JSON 为结构样例，流式生成一批模拟数据
  const handleGenerateMock = async () => {
    if (mockStreaming) return
    if (!input.trim()) {
      showToast('请先输入 JSON 样例', 'error')
      return
    }
    if (!validateJson(input).valid) {
      showToast('JSON 格式有误，请先修正再生成', 'error')
      return
    }
    const aiSettings = loadAiSettings()
    if (!aiSettings.model.trim()) {
      showToast('请先在「AI 设置」中配置接口和模型', 'error')
      return
    }
    const controller = new AbortController()
    mockAbortRef.current = controller
    setMockStreaming(true)
    setMockCode('')
    setMockStreamingText('')
    try {
      let full = ''
      await streamChatCompletion(
        aiSettings,
        buildMockDataMessages(input, mockRequirement),
        {
          signal: controller.signal,
          onDelta: (delta) => {
            full += delta
            setMockStreamingText(full)
          },
        },
      )
      let code = extractCodeBlock(full)
      // 结果是 JSON 数组，顺手格式化，失败则用原文
      const formatted = formatJson(code, { indent: 2 })
      if (formatted.success && formatted.result) code = formatted.result
      if (!code) {
        showToast('AI 未返回有效的 Mock 数据', 'error')
      } else {
        setMockCode(code)
        showToast('Mock 数据已生成', 'success')
      }
    } catch (error) {
      if (error instanceof AiError && error.kind === 'aborted') {
        showToast('已取消生成', 'info')
      } else {
        showToast(error instanceof Error ? error.message : String(error), 'error')
      }
    } finally {
      setMockStreaming(false)
      mockAbortRef.current = null
    }
  }

  const handleCopyMock = async () => {
    if (!mockCode) return
    try {
      await navigator.clipboard.writeText(mockCode)
      setMockCopied(true)
      showToast('已复制到剪贴板', 'success')
      setTimeout(() => setMockCopied(false), 2000)
    } catch {
      showToast('复制失败', 'error')
    }
  }

  const handleAutoFix = () => {
    if (!input.trim()) {
      setError('请输入 JSON 字符串')
      return
    }

    const result = tryFixJson(input)

    if (result.success && result.result) {
      setInput(result.result)
      setError('')

      // 显示应用的修复
      if (result.fixesApplied && result.fixesApplied.length > 0) {
        showToast(
          `已自动修复：${result.fixesApplied.join('、')}`,
          'success'
        )
      } else {
        showToast('JSON 格式正确，无需修复', 'success')
      }
    } else {
      setError(result.error || '自动修复失败')
      showToast('无法自动修复此 JSON，请手动检查', 'error')
    }
  }

  // 监听 ESC 键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">JSON 格式化工具</h1>
        <p className="text-muted-foreground">
          格式化、压缩和验证 JSON 数据
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle>输入</CardTitle>
            <CardDescription>粘贴你的 JSON 数据</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder='{"name": "John", "age": 30}'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />

            {/* 错误提示 */}
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                <div className="flex items-start gap-2">
                  <span className="text-destructive text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="font-medium text-destructive">JSON 格式错误</p>
                    <p className="text-sm text-destructive/80 mt-1">{error}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 提示：请检查下方的"常见 JSON 格式错误"了解如何修复
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 选项 */}

            {/* 选项 */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Select
                label="缩进空格数"
                value={indent}
                onChange={(e) => setIndent(e.target.value)}
                options={[
                  { value: '2', label: '2 空格' },
                  { value: '4', label: '4 空格' },
                  { value: '8', label: '8 空格' },
                ]}
              />

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="sortKeys"
                  checked={sortKeys}
                  onChange={(e) => setSortKeys(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="sortKeys" className="cursor-pointer">
                  按字母顺序排序键
                </Label>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={handleFormat}>格式化</Button>
              <Button onClick={handleMinify} variant="outline">
                压缩
              </Button>
              <Button onClick={handleValidate} variant="outline">
                验证
              </Button>
              <Button onClick={handleAutoFix} variant="outline" className="gap-2">
                <Wrench className="h-4 w-4" />
                尝试自动修复
              </Button>
              <Button onClick={handleClear} variant="ghost">
                清空
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 输出区域 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>输出</CardTitle>
                <CardDescription>格式化后的结果</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {output && (
                  <>
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? '已复制' : '复制'}
                    </Button>
                    <Button
                      onClick={() => setIsFullscreen(true)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      title="全屏查看"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {output ? (
              <div className="min-h-[400px] max-h-[600px] overflow-auto">
                <JsonTree
                  data={(() => {
                    try {
                      return JSON.parse(output)
                    } catch {
                      return null
                    }
                  })()}
                  className="border-0"
                />
              </div>
            ) : (
              <div className="min-h-[400px] flex items-center justify-center border rounded-md border-dashed text-muted-foreground">
                结果将显示在这里...
              </div>
            )}
            {output && (
              <div className="mt-4 text-sm text-muted-foreground">
                字符数: {output.length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI 生成 Java 实体 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileCode2 className="h-5 w-5 text-fuchsia-500" />
            AI 生成 Java 实体
          </CardTitle>
          <CardDescription>把上方输入的 JSON 转成 Java 实体类，自动处理嵌套对象与数组</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <Input
              label="包名（可选）"
              value={javaPackage}
              onChange={(e) => setJavaPackage(e.target.value)}
              placeholder="com.example.dto"
              className="font-mono"
            />
            <div className="flex items-center space-x-2 md:pt-8">
              <input
                type="checkbox"
                id="useLombok"
                checked={useLombok}
                onChange={(e) => setUseLombok(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="useLombok" className="cursor-pointer">
                使用 Lombok @Data
              </Label>
            </div>
            <div className="flex gap-2 md:justify-end">
              {javaStreaming ? (
                <Button variant="outline" onClick={() => javaAbortRef.current?.abort()}>
                  <Square className="h-4 w-4 mr-2" />
                  取消
                </Button>
              ) : (
                <Button onClick={handleGenerateJava}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成 Java 类
                </Button>
              )}
            </div>
          </div>

          {javaStreaming && (
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono whitespace-pre-wrap">
              {javaStreamingText || '生成中…'}
            </pre>
          )}
          {!javaStreaming && javaCode && (
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono">
                {javaCode}
              </pre>
              <Button
                onClick={handleCopyJava}
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 gap-2"
              >
                {javaCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {javaCopied ? '已复制' : '复制'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI 生成 Mock 数据 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Boxes className="h-5 w-5 text-sky-500" />
            AI 生成 Mock 数据
          </CardTitle>
          <CardDescription>
            以上方输入的 JSON 为结构样例，批量生成逼真的模拟数据（输出 JSON 数组）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <Label htmlFor="mock-requirement">生成要求（可选）</Label>
              <Input
                id="mock-requirement"
                value={mockRequirement}
                onChange={(e) => setMockRequirement(e.target.value)}
                placeholder="如：生成 20 条，金额 1-500 元，状态含已支付和已退款"
              />
            </div>
            {mockStreaming ? (
              <Button
                variant="outline"
                onClick={() => mockAbortRef.current?.abort()}
                className="shrink-0 whitespace-nowrap"
              >
                <Square className="h-4 w-4 mr-2" />
                取消
              </Button>
            ) : (
              <Button onClick={handleGenerateMock} className="shrink-0 whitespace-nowrap">
                <Boxes className="h-4 w-4 mr-2" />
                生成 Mock 数据
              </Button>
            )}
          </div>

          {mockStreaming && (
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono whitespace-pre-wrap">
              {mockStreamingText || '生成中…'}
            </pre>
          )}
          {!mockStreaming && mockCode && (
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono">
                {mockCode}
              </pre>
              <Button
                onClick={handleCopyMock}
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 gap-2"
              >
                {mockCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {mockCopied ? '已复制' : '复制'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>格式化</strong>: 美化 JSON，使其易于阅读</p>
          <p>• <strong>压缩</strong>: 移除所有空格和换行符</p>
          <p>• <strong>验证</strong>: 检查 JSON 语法是否正确</p>
          <p>• <strong>排序键</strong>: 按字母顺序排序对象键</p>
          <p>• <strong>AI 生成 Java 实体</strong>: 把 JSON 转成 Java 实体类，支持包名与 Lombok 选项（需先在「AI 设置」中配置服务）</p>
          <p>• <strong>AI 生成 Mock 数据</strong>: 以输入 JSON 为样例批量生成模拟数据（需先在「AI 设置」中配置服务）</p>
        </CardContent>
      </Card>

      {/* 常见错误提示 */}
      <Card className="mt-4 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950">
        <CardHeader>
          <CardTitle className="text-yellow-800 dark:text-yellow-500 text-lg">
            ⚠️ 常见 JSON 格式错误
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-1">
            <p className="font-medium text-yellow-900 dark:text-yellow-400">
              1. 属性名必须使用双引号
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-red-600 font-semibold">❌ 错误:</span>
                <code className="ml-2 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                  {'{\'name\': \'John\'}'}
                </code>
              </div>
              <div>
                <span className="text-green-600 font-semibold">✅ 正确:</span>
                <code className="ml-2 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  {'{"name": "John"}'}
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-yellow-900 dark:text-yellow-400">
              2. 字符串值必须使用双引号
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-red-600 font-semibold">❌ 错误:</span>
                <code className="ml-2 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                  {'{"name": \'John\'}'}
                </code>
              </div>
              <div>
                <span className="text-green-600 font-semibold">✅ 正确:</span>
                <code className="ml-2 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  {'{"name": "John"}'}
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-yellow-900 dark:text-yellow-400">
              3. 不能有尾随逗号
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-red-600 font-semibold">❌ 错误:</span>
                <code className="ml-2 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                  {'{"name": "John",}'}
                </code>
              </div>
              <div>
                <span className="text-green-600 font-semibold">✅ 正确:</span>
                <code className="ml-2 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  {'{"name": "John"}'}
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-yellow-900 dark:text-yellow-400">
              4. 不支持注释
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-red-600 font-semibold">❌ 错误:</span>
                <code className="ml-2 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                  {'{/* comment */}'}
                </code>
              </div>
              <div>
                <span className="text-green-600 font-semibold">✅ 正确:</span>
                <code className="ml-2 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  删除所有注释
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-yellow-900 dark:text-yellow-400">
              5. 布尔值和 null 必须小写
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-red-600 font-semibold">❌ 错误:</span>
                <code className="ml-2 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                  {'{"active": True}'}
                </code>
              </div>
              <div>
                <span className="text-green-600 font-semibold">✅ 正确:</span>
                <code className="ml-2 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  {'{"active": true}'}
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 全屏模态框 */}
      {isFullscreen && output && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="h-full flex flex-col p-4">
            {/* 全屏头部工具栏 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">JSON 全屏查看</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? '已复制' : '复制'}
                </Button>
                <Button
                  onClick={() => setIsFullscreen(false)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Minimize className="h-4 w-4" />
                  退出全屏
                </Button>
                <kbd className="hidden md:inline-flex pointer-events-none h-9 select-none items-center gap-1 rounded border bg-muted px-3 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">ESC</span>
                </kbd>
              </div>
            </div>

            {/* 全屏内容区 */}
            <div className="flex-1 overflow-auto border rounded-lg bg-background">
              <div className="p-6">
                <JsonTree
                  data={(() => {
                    try {
                      return JSON.parse(output)
                    } catch {
                      return null
                    }
                  })()}
                />
              </div>
            </div>

            {/* 全屏底部信息 */}
            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-4">
              <span>字符数: {output.length}</span>
              <span>提示: 按 ESC 键退出全屏</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
