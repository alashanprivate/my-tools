import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  AiError,
  buildAskMessages,
  getToolAiContext,
  loadAiSettings,
  streamChatCompletion,
  type ToolAiContext,
} from '@/lib/ai'
import { ASK_AI_OPEN_EVENT } from './askAi'
import { Sparkles, Square, X } from 'lucide-react'

/** 全局「问 AI」对话框：自动携带当前工具页注册的上下文 */
export function AskAiDialog() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [contextSnapshot, setContextSnapshot] = useState<ToolAiContext | null>(null)
  const [includeContext, setIncludeContext] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [output, setOutput] = useState('')
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const openDialog = () => {
      setQuestion('')
      setOutput('')
      setDone(false)
      setError('')
      setContextSnapshot(getToolAiContext())
      setIncludeContext(true)
      setOpen(true)
      // 等渲染后聚焦输入框
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    const onGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault()
        openDialog()
      }
    }
    window.addEventListener('keydown', onGlobalKeyDown)
    window.addEventListener(ASK_AI_OPEN_EVENT, openDialog)
    return () => {
      window.removeEventListener('keydown', onGlobalKeyDown)
      window.removeEventListener(ASK_AI_OPEN_EVENT, openDialog)
    }
  }, [])

  const handleClose = () => {
    abortRef.current?.abort()
    setOpen(false)
  }

  const handleCopy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 剪贴板不可用时静默，不打断阅读
    }
  }

  const handleAsk = async () => {
    const trimmed = question.trim()
    if (!trimmed || streaming) return
    const aiSettings = loadAiSettings()
    if (!aiSettings.model.trim()) {
      setError('请先在「AI 设置」中配置接口和模型')
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setStreaming(true)
    setOutput('')
    setDone(false)
    setError('')
    try {
      let full = ''
      await streamChatCompletion(
        aiSettings,
        buildAskMessages(trimmed, includeContext ? contextSnapshot : null),
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
    } catch (err) {
      if (!(err instanceof AiError && err.kind === 'aborted')) {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 p-4 backdrop-blur-sm md:p-10"
      onClick={handleClose}
    >
      <div
        className="flex max-h-full w-full max-w-3xl flex-col rounded-lg border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') handleClose()
        }}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-fuchsia-500" />
            问 AI
          </div>
          <div className="flex items-center gap-1">
            {done && (
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? '已复制' : '复制'}
              </Button>
            )}
            <button
              type="button"
              onClick={handleClose}
              title="关闭"
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeContext && contextSnapshot !== null}
              disabled={contextSnapshot === null}
              onChange={(e) => setIncludeContext(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            附带当前工具上下文
            <span className="font-medium text-foreground">
              {contextSnapshot ? `（${contextSnapshot.toolName}）` : '（当前页面未提供）'}
            </span>
          </label>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAsk()
              }}
              placeholder={
                contextSnapshot
                  ? `就「${contextSnapshot.toolName}」里的内容提问…`
                  : '输入你的问题…'
              }
              disabled={streaming}
              className="flex h-10 w-full min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {streaming ? (
              <Button
                variant="outline"
                onClick={() => abortRef.current?.abort()}
                className="shrink-0 whitespace-nowrap"
              >
                <Square className="h-4 w-4 mr-2" />
                取消
              </Button>
            ) : (
              <Button
                onClick={handleAsk}
                disabled={!question.trim()}
                className="shrink-0 whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                提问
              </Button>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {(streaming || output) && (
            <pre className="max-h-[50vh] min-h-[120px] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm font-mono">
              {output || '思考中…'}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
