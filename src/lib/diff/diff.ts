import { diffTokens } from './myers'
import type {
  DiffOptions,
  DiffRow,
  DiffStats,
  InlineSegment,
  LineDiffResult,
  SplitRow,
  UnifiedFormatOptions,
} from './types'

/** 拆行：兼容 \r\n 与 \r，结尾的换行符不产生多余的空行 */
export function splitLines(text: string): string[] {
  if (text === '') return []
  const lines = text.split(/\r\n|\r|\n/)
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

/** 行级比对选项在这一层生效：得到用于比较的规范化形式（显示仍用原文） */
function normalizeLine(line: string, options: DiffOptions): string {
  let s = line
  if (options.ignoreCase) s = s.toLowerCase()
  if (options.ignoreWhitespace) s = s.trim().replace(/\s+/g, ' ')
  return s
}

/**
 * 逐行比对两段文本。
 * 返回按顺序排列的差异行与统计信息；连续的删除/新增已在块内规整为「先删后增」，
 * 并对块内按序配对的行做词级行内比对（segs 字段）。
 */
export function diffLines(oldText: string, newText: string, options: DiffOptions = {}): LineDiffResult {
  const oldLines = splitLines(oldText)
  const newLines = splitLines(newText)
  const oldKeys = oldLines.map((line) => normalizeLine(line, options))
  const newKeys = newLines.map((line) => normalizeLine(line, options))

  const ops = diffTokens(oldKeys, newKeys)
  const rows: DiffRow[] = []
  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 }

  // ops 的值是规范化后的行，按位置从原数组取回原文
  let i = 0
  let leftNo = 0
  let rightNo = 0
  while (i < ops.length) {
    if (ops[i].type === 'equal') {
      leftNo++
      rightNo++
      rows.push({ type: 'equal', text: oldLines[leftNo - 1], leftNo, rightNo })
      stats.unchanged++
      i++
      continue
    }
    const removes: DiffRow[] = []
    const adds: DiffRow[] = []
    while (i < ops.length && ops[i].type !== 'equal') {
      const op = ops[i]
      if (op.type === 'remove') {
        leftNo++
        removes.push({ type: 'remove', text: oldLines[leftNo - 1], leftNo })
        stats.removed++
      } else {
        rightNo++
        adds.push({ type: 'add', text: newLines[rightNo - 1], rightNo })
        stats.added++
      }
      i++
    }
    // 块内第 j 个删除行与第 j 个新增行配对，计算行内差异
    const pairCount = Math.min(removes.length, adds.length)
    for (let j = 0; j < pairCount; j++) {
      const inline = diffInline(removes[j].text, adds[j].text, options)
      removes[j].segs = inline.old
      adds[j].segs = inline.new
    }
    rows.push(...removes, ...adds)
  }

  return { rows, stats }
}

/** 将行级差异整理为并排视图的行：变更块内删除/新增按序左右对齐 */
export function buildSplitRows(rows: DiffRow[]): SplitRow[] {
  const result: SplitRow[] = []
  let i = 0
  while (i < rows.length) {
    if (rows[i].type === 'equal') {
      result.push({ left: rows[i], right: rows[i] })
      i++
      continue
    }
    const removes: DiffRow[] = []
    const adds: DiffRow[] = []
    while (i < rows.length && rows[i].type !== 'equal') {
      if (rows[i].type === 'remove') removes.push(rows[i])
      else adds.push(rows[i])
      i++
    }
    const pairCount = Math.max(removes.length, adds.length)
    for (let j = 0; j < pairCount; j++) {
      result.push({ left: removes[j], right: adds[j] })
    }
  }
  return result
}

/** 超过该长度的行不做行内比对（词级 diff 是平方级，超长行会卡界面），整行视为变更 */
const INLINE_MAX_CHARS = 500

/** 行内词级比对：返回两侧各自的高亮片段 */
export function diffInline(
  oldLine: string,
  newLine: string,
  options: DiffOptions
): { old: InlineSegment[]; new: InlineSegment[] } {
  const emptyOld: InlineSegment[] = []
  const wholeOld: InlineSegment[] = [{ text: oldLine, changed: true }]
  const wholeNew: InlineSegment[] = [{ text: newLine, changed: true }]

  if (!oldLine && !newLine) return { old: emptyOld, new: emptyOld }
  if (!oldLine) return { old: emptyOld, new: wholeNew }
  if (!newLine) return { old: wholeOld, new: emptyOld }
  if (oldLine.length > INLINE_MAX_CHARS || newLine.length > INLINE_MAX_CHARS) {
    return { old: wholeOld, new: wholeNew }
  }

  const oldTokens = oldLine.match(/\w+|\s+|[^\w\s]/g) ?? []
  const newTokens = newLine.match(/\w+|\s+|[^\w\s]/g) ?? []
  // token 归一化后做值相等的 diff；原文通过位置从 token 数组取回
  const key = (token: string): string => {
    if (options.ignoreWhitespace && /^\s+$/.test(token)) return ' '
    return options.ignoreCase ? token.toLowerCase() : token
  }
  const ops = diffTokens(oldTokens.map(key), newTokens.map(key))

  const oldSegs: InlineSegment[] = []
  const newSegs: InlineSegment[] = []
  let oi = 0
  let ni = 0
  const push = (segs: InlineSegment[], text: string, changed: boolean) => {
    const last = segs[segs.length - 1]
    if (last && last.changed === changed) last.text += text
    else segs.push({ text, changed })
  }
  for (const op of ops) {
    if (op.type === 'equal') {
      push(oldSegs, oldTokens[oi++], false)
      push(newSegs, newTokens[ni++], false)
    } else if (op.type === 'remove') {
      push(oldSegs, oldTokens[oi++], true)
    } else {
      push(newSegs, newTokens[ni++], true)
    }
  }
  return { old: oldSegs, new: newSegs }
}

/**
 * 生成 unified diff 文本（git diff -u 风格，hunk 头 `@@ -a,b +c,d @@`，count 为 1 时省略）。
 * 无差异时返回空字符串。
 */
export function formatUnifiedDiff(rows: DiffRow[], options: UnifiedFormatOptions = {}): string {
  const context = options.context ?? 3
  const changeIdx: number[] = []
  rows.forEach((row, idx) => {
    if (row.type !== 'equal') changeIdx.push(idx)
  })
  if (changeIdx.length === 0) return ''

  const out: string[] = []
  if (options.fromName !== undefined) out.push(`--- ${options.fromName}`)
  if (options.toName !== undefined) out.push(`+++ ${options.toName}`)

  // 两处变更之间的相等行数不超过 2 * context 时合并为一个 hunk
  let groupStart = 0
  for (let g = 0; g <= changeIdx.length; g++) {
    const gap =
      g === 0 || g === changeIdx.length ? 0 : changeIdx[g] - changeIdx[g - 1] - 1
    const isBreak = g === changeIdx.length || gap > 2 * context
    if (!isBreak) continue
    const from = Math.max(0, changeIdx[groupStart] - context)
    const to = Math.min(rows.length - 1, changeIdx[g - 1] + context)

    let oldCount = 0
    let newCount = 0
    let oldStart = 0
    let newStart = 0
    for (let i = from; i <= to; i++) {
      const row = rows[i]
      if (row.leftNo !== undefined) {
        if (oldStart === 0) oldStart = row.leftNo
        oldCount++
      }
      if (row.rightNo !== undefined) {
        if (newStart === 0) newStart = row.rightNo
        newCount++
      }
    }
    // 纯插入/纯删除的一侧没有行号：向前找最近的行号（git 对空区间的约定），文件头则记 0
    for (let i = from - 1; i >= 0 && oldStart === 0; i--) oldStart = rows[i].leftNo ?? 0
    for (let i = from - 1; i >= 0 && newStart === 0; i--) newStart = rows[i].rightNo ?? 0

    out.push(`@@ -${rangeLabel(oldStart, oldCount)} +${rangeLabel(newStart, newCount)} @@`)
    for (let i = from; i <= to; i++) {
      const row = rows[i]
      if (row.type === 'equal') out.push(` ${row.text}`)
      else if (row.type === 'remove') out.push(`-${row.text}`)
      else out.push(`+${row.text}`)
    }
    groupStart = g
  }
  return out.join('\n')
}

function rangeLabel(start: number, count: number): string {
  return count === 1 ? `${start}` : `${start},${count}`
}
