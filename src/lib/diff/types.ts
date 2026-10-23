/** 差异行类型：equal 两边共有，remove 仅存在于原文本，add 仅存在于新文本 */
export type DiffRowType = 'equal' | 'add' | 'remove'

/** 差异结果中的一行 */
export interface DiffRow {
  type: DiffRowType
  /** 行内容（原始文本，未做忽略选项的变换） */
  text: string
  /** 原文本行号（1 起），仅 equal / remove 行存在 */
  leftNo?: number
  /** 新文本行号（1 起），仅 equal / add 行存在 */
  rightNo?: number
  /**
   * 行内差异片段（可选，仅变更行携带）：
   * remove 行描述原文本行的片段，add 行描述新文本行的片段，
   * changed 为 true 的片段是相对另一侧发生变化的文字。
   */
  segs?: InlineSegment[]
}

/** 差异统计 */
export interface DiffStats {
  /** 新增行数 */
  added: number
  /** 删除行数 */
  removed: number
  /** 未变行数 */
  unchanged: number
}

/** 比对选项 */
export interface DiffOptions {
  /** 忽略大小写 */
  ignoreCase?: boolean
  /** 忽略空白差异（行首尾空白不计，连续空白视为一个空格） */
  ignoreWhitespace?: boolean
}

/** 行内差异片段 */
export interface InlineSegment {
  text: string
  /** 该片段相对另一侧发生了变化 */
  changed: boolean
}

/** 并排视图的一行：左侧/右侧各至多一个差异行，删除行无右侧、新增行无左侧 */
export interface SplitRow {
  left?: DiffRow
  right?: DiffRow
}

/** 行级比对结果 */
export interface LineDiffResult {
  rows: DiffRow[]
  stats: DiffStats
}

/** 统一 diff 输出选项 */
export interface UnifiedFormatOptions {
  /** 每个 hunk 保留的上下文行数，默认 3 */
  context?: number
  /** 原文本文件名，提供时输出 --- 头 */
  fromName?: string
  /** 新文本文件名，提供时输出 +++ 头 */
  toName?: string
}
