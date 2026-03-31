import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { JsonTree } from '@/components/ui/JsonTree'
import { formatJson, minifyJson, validateJson } from '@/lib/json'
import { tryFixJson } from '@/lib/json/fixJson'
import { Copy, Check, Wrench, Maximize, Minimize } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState('2')
  const [sortKeys, setSortKeys] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { showToast } = useToast()

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
}
