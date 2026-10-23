import { describe, expect, it } from 'vitest'
import { buildSplitRows, diffInline, diffLines, formatUnifiedDiff, splitLines } from './index'
import type { DiffRow } from './types'

/** 校验差异脚本的正确性：两侧各自能还原出原文本 */
function expectReconstructable(oldText: string, newText: string, rows: DiffRow[]) {
  const fromOld = rows
    .filter((r) => r.type !== 'add')
    .map((r) => r.text)
    .join('\n')
  const fromNew = rows
    .filter((r) => r.type !== 'remove')
    .map((r) => r.text)
    .join('\n')
  expect(fromOld).toBe(oldText.split('\n').join('\n'))
  expect(fromNew).toBe(newText)
}

describe('splitLines', () => {
  it('空文本返回空数组', () => {
    expect(splitLines('')).toEqual([])
  })

  it('兼容 LF 与 CRLF，结尾换行不产生空行', () => {
    expect(splitLines('a\nb')).toEqual(['a', 'b'])
    expect(splitLines('a\nb\n')).toEqual(['a', 'b'])
    expect(splitLines('a\r\nb\r\n')).toEqual(['a', 'b'])
    expect(splitLines('a\r\n\r\nb')).toEqual(['a', '', 'b'])
  })
})

describe('diffLines', () => {
  it('相同文本全部为 equal', () => {
    const { rows, stats } = diffLines('a\nb\nc', 'a\nb\nc')
    expect(rows.every((r) => r.type === 'equal')).toBe(true)
    expect(stats).toEqual({ added: 0, removed: 0, unchanged: 3 })
  })

  it('空文本与文本比对', () => {
    expect(diffLines('', 'a\nb').rows.map((r) => r.type)).toEqual(['add', 'add'])
    expect(diffLines('a\nb', '').rows.map((r) => r.type)).toEqual(['remove', 'remove'])
    expect(diffLines('', '').stats).toEqual({ added: 0, removed: 0, unchanged: 0 })
  })

  it('完全不同的文本为全删全加', () => {
    const { rows, stats } = diffLines('a\nb\nc', 'x\ny\nz')
    expect(stats).toEqual({ added: 3, removed: 3, unchanged: 0 })
    expect(rows.slice(0, 3).every((r) => r.type === 'remove')).toBe(true)
    expect(rows.slice(3).every((r) => r.type === 'add')).toBe(true)
  })

  it('单行替换为删除+新增，且行号正确', () => {
    const { rows } = diffLines('a\nb\nc', 'a\nX\nc')
    const change = rows.filter((r) => r.type !== 'equal')
    expect(change).toHaveLength(2)
    expect(change[0]).toMatchObject({ type: 'remove', text: 'b', leftNo: 2 })
    expect(change[1]).toMatchObject({ type: 'add', text: 'X', rightNo: 2 })
    // 替换行配对了行内差异
    expect(change[0].segs).toEqual([{ text: 'b', changed: true }])
    expect(change[1].segs).toEqual([{ text: 'X', changed: true }])
  })

  it('等价行携带双侧行号', () => {
    const { rows } = diffLines('a\nb', 'X\na\nb')
    const equal = rows.find((r) => r.type === 'equal')
    expect(equal).toMatchObject({ text: 'a', leftNo: 1, rightNo: 2 })
  })

  it('经典 Myers 用例 ABCABBA → CBABAC 的最短编辑距离为 5', () => {
    const { rows, stats } = diffLines('A\nB\nC\nA\nB\nB\nA', 'C\nB\nA\nB\nA\nC')
    expectReconstructable('A\nB\nC\nA\nB\nB\nA', 'C\nB\nA\nB\nA\nC', rows)
    expect(stats.added + stats.removed).toBe(5)
  })

  it('大间隔插入不破坏行号', () => {
    const oldText = Array.from({ length: 50 }, (_, i) => `l${i + 1}`).join('\n')
    const newText = ['l1', 'l2', 'inserted', ...Array.from({ length: 48 }, (_, i) => `l${i + 3}`)].join('\n')
    const { rows, stats } = diffLines(oldText, newText)
    expectReconstructable(oldText, newText, rows)
    expect(stats.added).toBe(1)
    expect(stats.removed).toBe(0)
    const add = rows.find((r) => r.type === 'add')
    expect(add).toMatchObject({ text: 'inserted', rightNo: 3 })
  })

  it('忽略空白差异', () => {
    expect(diffLines('foo  bar\nbaz', 'foo bar\nbaz', { ignoreWhitespace: true }).stats.unchanged).toBe(2)
    expect(diffLines('  foo\tbar  ', 'foo bar', { ignoreWhitespace: true }).stats.unchanged).toBe(1)
    // 不开启选项时是差异
    expect(diffLines('foo  bar', 'foo bar').stats.unchanged).toBe(0)
  })

  it('忽略大小写', () => {
    expect(diffLines('Foo\nBAR', 'foo\nbar', { ignoreCase: true }).stats.unchanged).toBe(2)
    expect(diffLines('Foo', 'foo').stats.unchanged).toBe(0)
  })

  it('超长脚本触发二分降级后仍能还原', () => {
    const oldLines = Array.from({ length: 1200 }, (_, i) => `tok${i}`)
    const newText = [...oldLines].reverse().join('\n')
    const oldText = oldLines.join('\n')
    const { rows } = diffLines(oldText, newText)
    expectReconstructable(oldText, newText, rows)
  })
})

describe('buildSplitRows', () => {
  it('变更块内删除/新增按序左右配对', () => {
    const { rows } = diffLines('a\nb\nc', 'a\nX\nY\nc')
    const split = buildSplitRows(rows)
    expect(split).toHaveLength(4)
    expect(split[0].left).toMatchObject({ type: 'equal', text: 'a' })
    expect(split[1].left).toMatchObject({ type: 'remove', text: 'b' })
    expect(split[1].right).toMatchObject({ type: 'add', text: 'X' })
    expect(split[2].left).toBeUndefined()
    expect(split[2].right).toMatchObject({ type: 'add', text: 'Y', rightNo: 3 })
    expect(split[3].left).toMatchObject({ type: 'equal', text: 'c' })
  })

  it('纯新增行左侧为空', () => {
    const { rows } = diffLines('a', 'a\nb')
    const split = buildSplitRows(rows)
    expect(split[1].left).toBeUndefined()
    expect(split[1].right).toMatchObject({ type: 'add', text: 'b' })
  })
})

describe('diffInline', () => {
  it('词级比对只标出变化的词', () => {
    const { old: oldSegs, new: newSegs } = diffInline('const a = 1;', 'const b = 1;', {})
    expect(oldSegs).toEqual([
      { text: 'const ', changed: false },
      { text: 'a', changed: true },
      { text: ' = 1;', changed: false },
    ])
    expect(newSegs).toEqual([
      { text: 'const ', changed: false },
      { text: 'b', changed: true },
      { text: ' = 1;', changed: false },
    ])
  })

  it('空行配对时整行标记为变更', () => {
    const { old: oldSegs, new: newSegs } = diffInline('', 'new line', {})
    expect(oldSegs).toEqual([])
    expect(newSegs).toEqual([{ text: 'new line', changed: true }])
  })

  it('超长行整行视为变更', () => {
    const long = 'x'.repeat(600)
    const { old: oldSegs } = diffInline(long, `${long}y`, {})
    expect(oldSegs).toEqual([{ text: long, changed: true }])
  })

  it('忽略大小写在词级生效', () => {
    const { old: oldSegs } = diffInline('Foo', 'foo', { ignoreCase: true })
    expect(oldSegs).toEqual([{ text: 'Foo', changed: false }])
  })

  it('忽略空白时空白 token 相互等价', () => {
    const { old: oldSegs } = diffInline('a  b', 'a b', { ignoreWhitespace: true })
    expect(oldSegs).toEqual([{ text: 'a  b', changed: false }])
  })
})

describe('formatUnifiedDiff', () => {
  it('无差异返回空字符串', () => {
    const { rows } = diffLines('a', 'a')
    expect(formatUnifiedDiff(rows)).toBe('')
  })

  it('单行替换生成 git 风格 hunk', () => {
    const oldText = 'a\nb\nc\nd\ne\nf\ng'
    const newText = 'a\nb\nc\nX\ne\nf\ng'
    const { rows } = diffLines(oldText, newText)
    expect(formatUnifiedDiff(rows, { context: 2 })).toBe(
      ['@@ -2,5 +2,5 @@', ' b', ' c', '-d', '+X', ' e', ' f'].join('\n')
    )
  })

  it('长间隔的两处变更拆成两个 hunk', () => {
    const oldLines = Array.from({ length: 12 }, (_, i) => `l${i + 1}`)
    const newLines = [...oldLines]
    newLines[0] = 'L1'
    newLines[9] = 'L10'
    const { rows } = diffLines(oldLines.join('\n'), newLines.join('\n'))
    expect(formatUnifiedDiff(rows, { context: 1 })).toBe(
      [
        '@@ -1,2 +1,2 @@',
        '-l1',
        '+L1',
        ' l2',
        '@@ -9,3 +9,3 @@',
        ' l9',
        '-l10',
        '+L10',
        ' l11',
      ].join('\n')
    )
  })

  it('文件级新增/删除使用 0 行号约定', () => {
    const { rows } = diffLines('', 'a\nb')
    expect(formatUnifiedDiff(rows, { context: 3 })).toBe(['@@ -0,0 +1,2 @@', '+a', '+b'].join('\n'))

    const removed = diffLines('a\nb', '')
    expect(formatUnifiedDiff(removed.rows, { context: 3 })).toBe(
      ['@@ -1,2 +0,0 @@', '-a', '-b'].join('\n')
    )
  })

  it('count 为 1 时省略数量，可选输出文件名头', () => {
    const { rows } = diffLines('a', 'b')
    expect(formatUnifiedDiff(rows, { context: 0, fromName: 'a.txt', toName: 'b.txt' })).toBe(
      ['--- a.txt', '+++ b.txt', '@@ -1 +1 @@', '-a', '+b'].join('\n')
    )
  })
})
