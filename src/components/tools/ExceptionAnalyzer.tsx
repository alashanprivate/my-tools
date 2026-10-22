import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useToast } from '@/components/ui/useToast'
import { analyzeStack, type StackAnalysis } from '@/lib/exception'
import {
  AiError,
  buildExceptionMessages,
  loadAiSettings,
  streamChatCompletion,
  useToolAiContext,
} from '@/lib/ai'
import { Bug, Copy, Check, Sparkles, Square } from 'lucide-react'

export function ExceptionAnalyzer() {
  const [input, setInput] = useState('')
  const [businessPrefix, setBusinessPrefix] = useState('')
  const [context, setContext] = useState('')
  const [analysis, setAnalysis] = useState<StackAnalysis | null>(null)
  const [aiStreaming, setAiStreaming] = useState(false)
  const [aiOutput, setAiOutput] = useState('')
  const [aiDone, setAiDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const { showToast } = useToast()

  useToolAiContext('异常分析', () =>
    businessPrefix ? `${input}\n业务包前缀: ${businessPrefix}` : input,
  )

  // 本地解析随输入实时更新，不依赖 AI 配置
  useEffect(() => {
    setAnalysis(input.trim() ? analyzeStack(input, { businessPrefix }) : null)
  }, [input, businessPrefix])

  // AI 分析：流式输出结构化结论
  const handleAnalyze = async () => {
    if (aiStreaming) return
    if (!analysis?.isValid) {
      showToast('未识别到 Java 异常堆栈，请检查输入', 'error')
      return
    }
    const aiSettings = loadAiSettings()
    if (!aiSettings.model.trim()) {
      showToast('请先在「AI 设置」中配置接口和模型', 'error')
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setAiStreaming(true)
    setAiOutput('')
    setAiDone(false)
    try {
      let full = ''
      await streamChatCompletion(
        aiSettings,
        buildExceptionMessages(input, context),
        {
          signal: controller.signal,
          onDelta: (delta) => {
            full += delta
            setAiOutput(full)
          },
        },
      )
      setAiOutput(full)
      setAiDone(true)
      showToast('分析完成', 'success')
    } catch (error) {
      if (error instanceof AiError && error.kind === 'aborted') {
        showToast('已取消分析', 'info')
      } else {
        showToast(error instanceof Error ? error.message : String(error), 'error')
      }
    } finally {
      setAiStreaming(false)
      abortRef.current = null
    }
  }

  const handleCopy = async () => {
    if (!aiOutput) return
    try {
      await navigator.clipboard.writeText(aiOutput)
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
        <h1 className="text-4xl font-bold mb-2">异常分析</h1>
        <p className="text-muted-foreground">
          粘贴 Java 异常堆栈：本地解析定位业务帧，AI 输出根因与修复建议
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle>异常堆栈</CardTitle>
            <CardDescription>粘贴完整的异常堆栈（含 Caused by 链）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`java.lang.NullPointerException: ...\n\tat com.example.service.UserService.getUser(UserService.java:42)\n\t...`}
              className="font-mono text-sm min-h-[240px]"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exc-prefix">业务包前缀（可选）</Label>
                <Input
                  id="exc-prefix"
                  value={businessPrefix}
                  onChange={(e) => setBusinessPrefix(e.target.value)}
                  placeholder="com.example"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="exc-context">补充上下文（可选）</Label>
                <Input
                  id="exc-context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="如：SIT 环境偶现，发版后开始"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {aiStreaming ? (
                <Button variant="outline" onClick={() => abortRef.current?.abort()}>
                  <Square className="h-4 w-4 mr-2" />
                  取消
                </Button>
              ) : (
                <Button onClick={handleAnalyze} disabled={!analysis?.isValid}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI 分析
                </Button>
              )}
              <span className="text-xs text-muted-foreground self-center">
                需先在「AI 设置」中配置服务；本地解析无需配置
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 本地解析结果 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              本地解析
            </CardTitle>
            <CardDescription>实时解析，无需 AI 配置</CardDescription>
          </CardHeader>
          <CardContent>
            {analysis?.isValid ? (
              <div className="space-y-4">
                {analysis.rootCause && (
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">根因异常</div>
                    <div className="font-mono text-sm font-medium break-all">
                      {analysis.rootCause.exceptionClass}
                    </div>
                    {analysis.rootCause.message && (
                      <div className="text-sm text-muted-foreground mt-1 break-all">
                        {analysis.rootCause.message}
                      </div>
                    )}
                  </div>
                )}

                {analysis.deepestBusinessFrame && (
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">
                      最深业务帧（最接近抛出点）
                    </div>
                    <div className="font-mono text-sm break-all">
                      {analysis.deepestBusinessFrame.className}.
                      {analysis.deepestBusinessFrame.method}
                      {analysis.deepestBusinessFrame.fileName &&
                        ` (${analysis.deepestBusinessFrame.fileName}${analysis.deepestBusinessFrame.line ? `:${analysis.deepestBusinessFrame.line}` : ''})`}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium mb-2">
                    异常链（共 {analysis.exceptions.length} 层）
                  </div>
                  <div className="space-y-2 max-h-[240px] overflow-auto">
                    {analysis.exceptions.map((entry, i) => (
                      <div key={i} className="p-3 bg-muted rounded-md">
                        <div className="font-mono text-xs font-medium break-all">
                          {entry.isCause && (
                            <span className="text-red-500 mr-1">Caused by:</span>
                          )}
                          {entry.exceptionClass}
                        </div>
                        {entry.message && (
                          <div className="text-xs text-muted-foreground mt-1 break-all">
                            {entry.message}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          帧 {entry.frames.length}
                          {entry.omittedFrames > 0 && `（另省略 ${entry.omittedFrames}）`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {analysis.topPackages.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">高频包</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.topPackages.map((p) => (
                        <span
                          key={p.pkg}
                          className="px-2 py-1 rounded-md bg-muted text-xs font-mono"
                        >
                          {p.pkg} ×{p.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.unrecognizedLines > 0 && (
                  <p className="text-xs text-muted-foreground">
                    另有 {analysis.unrecognizedLines} 行无法识别（已忽略，不影响解析）
                  </p>
                )}
              </div>
            ) : (
              <div className="min-h-[320px] flex items-center justify-center border rounded-md border-dashed text-muted-foreground">
                <div className="text-center">
                  <Bug className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>粘贴异常堆栈后自动解析</p>
                  <p className="text-sm mt-2">识别异常链、根因、业务帧与高频包</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI 分析结果 */}
      {(aiStreaming || aiOutput) && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI 分析结果</CardTitle>
                <CardDescription>
                  {aiStreaming ? '分析中…' : '根因判断 → 触发场景 → 排查步骤 → 修复建议'}
                </CardDescription>
              </div>
              {aiDone && (
                <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? '已复制' : '复制'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono whitespace-pre-wrap">
              {aiOutput || '生成中…'}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
