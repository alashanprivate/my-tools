import { useEffect, useMemo, useRef, useState } from 'react'
import type { UIEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { diffLines, formatUnifiedDiff } from '@/lib/diff'
import type { DiffRow, InlineSegment } from '@/lib/diff'
import { cn } from '@/lib/utils'
import {
  ArrowLeftRight,
  Check,
  Columns2,
  Copy,
  Eraser,
  FileDiff,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { useToast } from '@/components/ui/useToast'

type ViewMode = 'edit' | 'unified'

/** 行高（px），高亮层、行号列、输入层共用，保证逐行对齐 */
const LINE_HEIGHT_PX = 20
/** 编辑框垂直内边距合计（py-2 上下各 8px） */
const EDITOR_PADDING_PX = 16
/** 编辑框最少展示的行数 */
const MIN_EDITOR_LINES = 16

export function DiffTool() {
  const [oldText, setOldText] = useState('')
  const [newText, setNewText] = useState('')
  const [view, setView] = useState<ViewMode>('edit')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const [ignoreCase, setIgnoreCase] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { showToast } = useToast()

  // 全屏时锁定页面滚动，Esc 直接退出
  useEffect(() => {
    if (!isFullscreen) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isFullscreen])

  const result = useMemo(
    () => diffLines(oldText, newText, { ignoreWhitespace, ignoreCase }),
    [oldText, newText, ignoreWhitespace, ignoreCase]
  )
  // 左侧编辑器展示旧文本侧的行（equal + remove），右侧展示新文本侧的行（equal + add）
  const leftLines = useMemo(() => result.rows.filter((r) => r.type !== 'add'), [result])
  const rightLines = useMemo(() => result.rows.filter((r) => r.type !== 'remove'), [result])
  const hasInput = oldText.length > 0 || newText.length > 0
  const hasChanges = result.stats.added > 0 || result.stats.removed > 0

  const handleSwap = () => {
    setOldText(newText)
    setNewText(oldText)
  }

  const handleClear = () => {
    setOldText('')
    setNewText('')
  }

  const handleCopyPatch = async () => {
    if (!hasChanges) {
      showToast('两段文本没有差异', 'info')
      return
    }
    try {
      await navigator.clipboard.writeText(formatUnifiedDiff(result.rows))
      setCopied(true)
      showToast('差异（unified diff）已复制到剪贴板', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('复制失败', 'error')
    }
  }

  // 编辑框高度按内容多的一侧自适应，避免框内出现滚动条；两侧始终等高
  const rawLineCount = (text: string) => (text === '' ? 0 : text.split('\n').length)
  const editorLines = Math.max(MIN_EDITOR_LINES, rawLineCount(oldText), rawLineCount(newText))

  const workspace = (
    <Card className={cn('flex flex-col', isFullscreen && 'min-h-0 flex-1')}>
      <CardContent
        className={cn('flex flex-col gap-4 p-4 md:p-6', isFullscreen && 'min-h-0 flex-1')}
      >
        {/* 工具栏 */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={view === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('edit')}
          >
            <Columns2 className="h-4 w-4 mr-2" />
            对照编辑
          </Button>
          <Button
            variant={view === 'unified' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('unified')}
          >
            <FileDiff className="h-4 w-4 mr-2" />
            统一视图
          </Button>

          <div className="flex items-center space-x-2 ml-2">
            <input
              type="checkbox"
              id="diffIgnoreWhitespace"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="diffIgnoreWhitespace" className="cursor-pointer text-sm">
              忽略空白
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="diffIgnoreCase"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="diffIgnoreCase" className="cursor-pointer text-sm">
              忽略大小写
            </Label>
          </div>

          <div className="flex-1" />

          <Button variant="outline" size="sm" onClick={handleSwap} disabled={!hasInput}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            交换
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyPatch} disabled={!hasInput}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? '已复制' : '复制差异'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={!hasInput}>
            <Eraser className="h-4 w-4 mr-2" />
            清空
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
            <Maximize2 className="h-4 w-4 mr-2" />
            全屏
          </Button>
        </div>

        {/* 统计行 */}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          {hasInput ? (
            hasChanges ? (
              <span className="text-xs text-muted-foreground">
                <span className="text-green-600 dark:text-green-400">
                  +{result.stats.added} 行新增
                </span>
                {' / '}
                <span className="text-red-600 dark:text-red-400">
                  -{result.stats.removed} 行删除
                </span>
                {' / '}
                {result.stats.unchanged} 行未变
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">两段文本没有差异</span>
            )
          ) : (
            <span className="text-xs text-muted-foreground">
              在两侧输入或粘贴文本，差异将直接高亮在输入框内
            </span>
          )}
        </div>

        {/* 编辑区：对照编辑时差异直接渲染在输入框内；统一视图占据同一区域。全屏时撑满可用高度 */}
        {view === 'edit' ? (
          <div
            className={cn(
              'grid grid-cols-1 gap-4 lg:grid-cols-2',
              isFullscreen && 'min-h-0 flex-1'
            )}
          >
            <DiffEditor
              title="原文本"
              side="remove"
              value={oldText}
              onChange={setOldText}
              lines={leftLines}
              heightLines={editorLines}
              fillHeight={isFullscreen}
              placeholder="粘贴修改前的代码或文本..."
            />
            <DiffEditor
              title="新文本"
              side="add"
              value={newText}
              onChange={setNewText}
              lines={rightLines}
              heightLines={editorLines}
              fillHeight={isFullscreen}
              placeholder="粘贴修改后的代码或文本..."
            />
          </div>
        ) : isFullscreen ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <UnifiedView rows={result.rows} />
          </div>
        ) : (
          <UnifiedView rows={result.rows} />
        )}
      </CardContent>
    </Card>
  )

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col gap-3 bg-background p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">代码比对</h2>
          <span className="text-xs text-muted-foreground">按 Esc 退出全屏</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
            <Minimize2 className="h-4 w-4 mr-2" />
            退出全屏
          </Button>
        </div>
        {workspace}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">代码比对</h1>
        <p className="text-muted-foreground">差异直接高亮在输入框内，边输入边比对，纯本地计算</p>
      </div>

      {workspace}

      {/* 功能说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>对照编辑</strong>:
            差异直接高亮在输入框内——原文本侧红底为删除行，新文本侧绿底为新增行，
            行内变化的文字加深标记，可继续在框内编辑
          </p>
          <p>
            • <strong>统一视图</strong>: git diff 风格的单列展示，- 开头为删除行，+ 开头为新增行
          </p>
          <p>
            • <strong>实时比对</strong>: 基于 Myers 差异算法逐行比对，输入即时刷新
          </p>
          <p>
            • <strong>忽略选项</strong>: 忽略空白（行首尾空白与连续空格）或忽略大小写后再比对
          </p>
          <p>
            • <strong>复制差异</strong>: 复制标准 unified diff 文本，可直接用 <code>git apply</code>{' '}
            应用
          </p>
          <p>• 所有计算均在本地完成，内容不会上传</p>
        </CardContent>
      </Card>
    </div>
  )
}

/** 渲染一行内的高亮片段：changed 部分按 add/remove 底色强调（比整行底色更深一层） */
function renderInline(row: DiffRow, kind: 'add' | 'remove') {
  const segs: InlineSegment[] = row.segs ?? [{ text: row.text, changed: true }]
  return segs.map((seg, i) =>
    seg.changed ? (
      <span
        key={i}
        className={kind === 'add' ? 'bg-green-500/40 rounded-sm' : 'bg-red-500/40 rounded-sm'}
      >
        {seg.text}
      </span>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  )
}

/**
 * 差异直显编辑器：底层为逐行着色的高亮层，上层为透明背景的 textarea，
 * 两者行高、字体、内边距完全一致（禁用软换行），滚动时同步平移高亮层。
 */
function DiffEditor({
  title,
  side,
  value,
  onChange,
  lines,
  heightLines,
  fillHeight,
  placeholder,
}: {
  title: string
  side: 'add' | 'remove'
  value: string
  onChange: (value: string) => void
  lines: DiffRow[]
  /** 编辑框总行数（按两侧内容较多者计算，垂直方向不再出滚动条） */
  heightLines: number
  /** 全屏模式：忽略 heightLines，撑满父容器剩余高度，内容超出时框内滚动 */
  fillHeight?: boolean
  placeholder: string
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const { scrollLeft, scrollTop } = event.currentTarget
    if (overlayRef.current) {
      overlayRef.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`
    }
    if (gutterRef.current) {
      gutterRef.current.style.transform = `translateY(${-scrollTop}px)`
    }
  }

  // 结尾换行会让 textarea 比差异行多出一个空行，补齐空行使两层高度一致
  const rawLineCount = value === '' ? 0 : value.split('\n').length
  const padCount = Math.max(0, rawLineCount - lines.length)
  const stripeCls = side === 'add' ? 'bg-green-500/15' : 'bg-red-500/15'
  const lineNoCls =
    side === 'add'
      ? 'text-green-700/70 dark:text-green-400/60'
      : 'text-red-700/70 dark:text-red-400/60'
  const lineNo = (row: DiffRow) => (side === 'add' ? row.rightNo : row.leftNo) ?? ''

  return (
    <div className="flex flex-col rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <div className="flex items-center justify-between bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <span>{title}</span>
        <span>{lines.length} 行</span>
      </div>
      <div
        className={cn('flex', fillHeight && 'min-h-0 flex-1')}
        style={
          fillHeight ? undefined : { height: heightLines * LINE_HEIGHT_PX + EDITOR_PADDING_PX }
        }
      >
        {/* 行号列 */}
        <div className="w-12 shrink-0 overflow-hidden border-r bg-muted/40 select-none font-mono text-xs leading-5 text-right">
          <div ref={gutterRef} className="py-2 pr-2">
            {lines.map((row, i) => (
              <div key={i} className={cn('h-5', row.type !== 'equal' && lineNoCls)}>
                {lineNo(row)}
              </div>
            ))}
            {Array.from({ length: padCount }, (_, i) => (
              <div key={`pad-${i}`} className="h-5" />
            ))}
          </div>
        </div>
        {/* 内容层：高亮层在下，输入层在上 */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none font-mono text-xs leading-5">
            <div ref={overlayRef} className="px-3 py-2">
              {lines.map((row, i) => (
                <div
                  key={i}
                  className={cn('h-5 whitespace-pre', row.type !== 'equal' && stripeCls)}
                >
                  {row.type === 'equal' ? row.text : renderInline(row, side)}
                </div>
              ))}
              {Array.from({ length: padCount }, (_, i) => (
                <div key={`pad-${i}`} className="h-5" />
              ))}
            </div>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            wrap="off"
            spellCheck={false}
            placeholder={placeholder}
            className="absolute inset-0 w-full h-full resize-none bg-transparent px-3 py-2 font-mono text-xs leading-5 whitespace-pre overflow-auto focus:outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </div>
  )
}

/** 统一视图：git diff 风格单列，随内容自然伸展（页面滚动） */
function UnifiedView({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full border-collapse font-mono text-xs">
        <thead className="sticky top-0 z-10 bg-muted text-muted-foreground">
          <tr>
            <th className="w-12 border-r px-2 py-1.5 font-normal text-right">#</th>
            <th className="w-12 border-r px-2 py-1.5 font-normal text-right">#</th>
            <th className="border-r px-2 py-1.5 font-normal text-left">差异</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border/50">
              <td className="w-12 select-none border-r px-2 py-0.5 text-right align-top text-muted-foreground">
                {row.leftNo ?? ''}
              </td>
              <td className="w-12 select-none border-r px-2 py-0.5 text-right align-top text-muted-foreground">
                {row.rightNo ?? ''}
              </td>
              <td className="px-2 py-0.5 align-top whitespace-pre-wrap break-all">
                <span
                  className={
                    row.type === 'add'
                      ? 'bg-green-500/10 block'
                      : row.type === 'remove'
                        ? 'bg-red-500/10 block'
                        : 'block'
                  }
                >
                  <span
                    className={`inline-block w-4 select-none ${
                      row.type === 'add'
                        ? 'text-green-600 dark:text-green-400'
                        : row.type === 'remove'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-transparent'
                    }`}
                  >
                    {row.type === 'add' ? '+' : row.type === 'remove' ? '-' : ' '}
                  </span>
                  {row.type === 'equal' ? row.text : renderInline(row, row.type)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
