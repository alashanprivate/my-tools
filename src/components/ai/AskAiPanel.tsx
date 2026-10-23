import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp, Copy, Check, Sparkles, Square, SquarePen, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  AiError,
  buildAskConversationMessages,
  getToolAiContext,
  loadAiSettings,
  streamChatCompletion,
  type AskTurn,
  type ToolAiContext,
} from '@/lib/ai'
import { openJsonStore } from '@/lib/storage'
import { askAiPanel, useAskAiOpen } from './askAi'

const STORE_FILE = 'ask-ai-panel'
const WIDTH_KEY = 'width'
const TURNS_KEY = 'turns'
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 320
const MAX_WIDTH_RATIO = 0.6

const clampWidth = (width: number) =>
  Math.min(Math.max(width, MIN_WIDTH), Math.round(window.innerWidth * MAX_WIDTH_RATIO))

const isValidTurn = (turn: unknown): turn is AskTurn =>
  typeof turn === 'object' &&
  turn !== null &&
  ((turn as AskTurn).role === 'user' || (turn as AskTurn).role === 'assistant') &&
  typeof (turn as AskTurn).content === 'string'

/**
 * 右侧停靠的「问 AI」面板：多轮对话（右问左答）、可新建会话，
 * 自动携带当前工具页注册的上下文，宽度与会话内容本地记忆。
 */
export function AskAiPanel() {
  const open = useAskAiOpen()
  const { pathname } = useLocation()
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState<AskTurn[]>([])
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [contextSnapshot, setContextSnapshot] = useState<ToolAiContext | null>(null)
  const [includeContext, setIncludeContext] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef(width)
  widthRef.current = width
  const storeRef = useRef<Awaited<ReturnType<typeof openJsonStore>> | null>(null)
  const streaming = streamingText !== null

  // 挂载时打开存储、恢复记忆的面板宽度与历史会话
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    let cancelled = false
    void (async () => {
      const store = await openJsonStore(STORE_FILE)
      const storedWidth = await store.get<number>(WIDTH_KEY)
      const storedTurns = await store.get<unknown[]>(TURNS_KEY)
      if (cancelled) return
      storeRef.current = store
      if (typeof storedWidth === 'number') setWidth(clampWidth(storedWidth))
      if (Array.isArray(storedTurns)) setTurns(storedTurns.filter(isValidTurn))
      hydratedRef.current = true
    })().catch(() => {
      // 存储不可用时仅影响记忆能力
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 会话轮次变化时持久化
  useEffect(() => {
    if (!hydratedRef.current || !storeRef.current) return
    void storeRef.current.set(TURNS_KEY, turns).catch(() => {
      // 存储不可用时仅影响记忆能力
    })
  }, [turns])

  // Ctrl/Cmd+Shift+K 全局展开面板
  useEffect(() => {
    const onGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        askAiPanel.setOpen(true)
      }
    }
    window.addEventListener('keydown', onGlobalKeyDown)
    return () => window.removeEventListener('keydown', onGlobalKeyDown)
  }, [])

  // 展开面板或切换工具页时刷新上下文（停靠面板常驻，需跟随当前页面）
  useEffect(() => {
    if (!open) return
    setContextSnapshot(getToolAiContext())
    setIncludeContext(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open, pathname])

  // 新消息或流式输出时滚动到底部
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [turns, streamingText])

  if (!open) return null

  const handleClose = () => {
    abortRef.current?.abort()
    askAiPanel.setOpen(false)
  }

  const handleNewSession = () => {
    abortRef.current?.abort()
    setTurns([])
    setQuestion('')
    setError('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const lastAssistant = [...turns].reverse().find((turn) => turn.role === 'assistant')

  const handleCopy = async () => {
    if (!lastAssistant) return
    try {
      await navigator.clipboard.writeText(lastAssistant.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 剪贴板不可用时静默，不打断阅读
    }
  }

  // 左缘拖拽调宽，松开后记忆；双击恢复默认
  const startResize = (event: ReactMouseEvent) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = widthRef.current
    const onMove = (e: MouseEvent) => setWidth(clampWidth(startWidth + (startX - e.clientX)))
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      void openJsonStore(STORE_FILE)
        .then((store) => store.set(WIDTH_KEY, widthRef.current))
        .catch(() => {
          // 存储不可用时仅影响记忆宽度
        })
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleAsk = async () => {
    const trimmed = question.trim()
    if (!trimmed || streaming) return
    const aiSettings = await loadAiSettings()
    if (!aiSettings.model.trim()) {
      setError('请先在「AI 设置」中配置接口和模型')
      return
    }
    const history: AskTurn[] = [...turns, { role: 'user', content: trimmed }]
    setTurns(history)
    setQuestion('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setError('')
    setStreamingText('')
    const controller = new AbortController()
    abortRef.current = controller
    let full = ''
    try {
      await streamChatCompletion(
        aiSettings,
        buildAskConversationMessages(history, includeContext ? contextSnapshot : null),
        {
          signal: controller.signal,
          onDelta: (delta) => {
            full += delta
            setStreamingText(full)
          },
        },
      )
      setTurns([...history, { role: 'assistant', content: full }])
    } catch (err) {
      if (err instanceof AiError && err.kind === 'aborted') {
        // 中止时保留已生成的部分回答
        if (full.trim()) setTurns([...history, { role: 'assistant', content: full }])
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setStreamingText(null)
      abortRef.current = null
    }
  }

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l bg-card"
      style={{ width }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleClose()
      }}
    >
      <div
        onMouseDown={startResize}
        onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
        title="拖拽调整宽度，双击恢复默认"
        className="absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize transition-colors hover:bg-primary/30"
      />

      <div className="flex shrink-0 items-center justify-between border-b py-2 pl-4 pr-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-fuchsia-500" />
          问 AI
        </div>
        <div className="flex items-center gap-1">
          {lastAssistant && !streaming && (
            <Button variant="ghost" size="sm" onClick={handleCopy} title="复制最新回答">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '已复制' : '复制'}
            </Button>
          )}
          {turns.length > 0 && (
            <button
              type="button"
              onClick={handleNewSession}
              title="新建会话"
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <SquarePen className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            title="关闭面板"
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        {turns.length === 0 && !streaming ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm">就当前页面内容向 AI 提问</p>
            <p className="text-xs">支持连续追问，回答将显示在这里</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {turns.map((turn, index) =>
              turn.role === 'user' ? (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                    {turn.content}
                  </div>
                </div>
              ) : (
                <div key={index} className="flex justify-start">
                  <div className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-3 py-2 font-mono text-sm">
                    {turn.content}
                  </div>
                </div>
              ),
            )}
            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-3 py-2 font-mono text-sm">
                  {streamingText || '思考中…'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t p-3">
        {error && <p className="pb-2 text-xs text-destructive">{error}</p>}
        <label className="flex items-center gap-1.5 pb-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={includeContext && contextSnapshot !== null}
            disabled={contextSnapshot === null}
            onChange={(e) => setIncludeContext(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-input"
          />
          附带当前工具上下文
          <span className="truncate font-medium text-foreground">
            {contextSnapshot ? `（${contextSnapshot.toolName}）` : '（当前页面未提供）'}
          </span>
        </label>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                void handleAsk()
              }
            }}
            placeholder={
              contextSnapshot ? `就「${contextSnapshot.toolName}」里的内容提问…` : '输入你的问题…'
            }
            disabled={streaming}
            className="max-h-[120px] w-full min-w-0 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {streaming ? (
            <Button
              variant="outline"
              onClick={() => abortRef.current?.abort()}
              title="停止生成"
              className="h-9 w-9 shrink-0 p-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => void handleAsk()}
              disabled={!question.trim()}
              title="发送（Enter）"
              className="h-9 w-9 shrink-0 p-0"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
