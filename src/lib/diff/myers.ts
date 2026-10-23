/**
 * Myers O(ND) 差异算法的通用实现。
 *
 * 输入任意类型的 token 序列（等价 token 必须值相等，归一化由调用方完成），
 * 输出最短编辑脚本（保持原顺序的 equal/remove/add 序列）。
 * 与教材版实现的两点工程化差异：
 * 1. 回溯用的 V 数组按 d 存窗口快照，内存 O(D²) 而非 O(D·N)，大文本也不会爆内存；
 * 2. 编辑距离超过上限时按中点二分降级重算，保证最坏情况的耗时/内存有界
 *    （结果不再保证最短，但界面上不会卡死）。
 */

export type DiffOp<T> =
  | { type: 'equal'; value: T }
  | { type: 'remove'; value: T }
  | { type: 'add'; value: T }

/** 单次比对允许的最大编辑距离，超过则二分降级 */
const MAX_EDIT_DISTANCE = 1024

/**
 * 计算两个 token 序列的最短编辑脚本。
 * @param a 原序列
 * @param b 新序列（等价 token 之间必须满足 === ）
 */
export function diffTokens<T>(a: T[], b: T[]): DiffOp<T>[] {
  // 先裁掉公共前后缀，绝大多数真实输入（改了几行的文件）到这里就只剩极小的中间段
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }

  const head: DiffOp<T>[] = new Array(start)
  for (let i = 0; i < start; i++) head[i] = { type: 'equal', value: a[i] }
  const tail: DiffOp<T>[] = new Array(a.length - endA)
  for (let i = endA; i < a.length; i++) tail[i - endA] = { type: 'equal', value: a[i] }

  return [...head, ...diffCore(a.slice(start, endA), b.slice(start, endB)), ...tail]
}

/** 对裁剪后的中段做 Myers 比对，含降级与捷径处理 */
function diffCore<T>(a: T[], b: T[]): DiffOp<T>[] {
  if (a.length === 0 && b.length === 0) return []
  if (a.length === 0) return b.map((value) => ({ type: 'add', value }) as DiffOp<T>)
  if (b.length === 0) return a.map((value) => ({ type: 'remove', value }) as DiffOp<T>)

  // 两侧没有任何公共 token 时最短脚本必然是全删全加，直接返回避免平方级搜索
  const pool = new Set(a)
  if (!b.some((y) => pool.has(y))) {
    return [
      ...a.map((value) => ({ type: 'remove', value }) as DiffOp<T>),
      ...b.map((value) => ({ type: 'add', value }) as DiffOp<T>),
    ]
  }

  const trace = shortestEditTrace(a, b)
  if (!trace) {
    // 超过编辑距离上限：中点二分，两段各自继续（子段若无交集会被上面的捷径接住）
    const halfA = Math.floor(a.length / 2)
    const halfB = Math.floor(b.length / 2)
    return [...diffCore(a.slice(0, halfA), b.slice(0, halfB)), ...diffCore(a.slice(halfA), b.slice(halfB))]
  }
  return reconstruct(trace, a, b)
}

/**
 * Myers 前向过程：逐轮记录各对角线最远到达 x。
 * 返回 trace（trace[d] 是第 d-1 轮结束时 |k| <= d 的窗口快照，下标 i ↔ 对角线 k = i - d）；
 * 编辑距离超过 MAX_EDIT_DISTANCE 时返回 undefined，主动放弃。
 */
function shortestEditTrace<T>(a: T[], b: T[]): Int32Array[] | undefined {
  const n = a.length
  const m = b.length
  const max = n + m
  const offset = max
  const v = new Int32Array(2 * max + 1)
  const trace: Int32Array[] = []

  for (let d = 0; d <= max; d++) {
    if (d > MAX_EDIT_DISTANCE) return undefined // 超过上限仍未到达终点，主动放弃
    trace.push(v.slice(Math.max(0, offset - d), offset + d + 1))
    for (let k = -d; k <= d; k += 2) {
      let x: number
      if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
        x = v[k + 1 + offset] // 向下移动：来自 b 的插入
      } else {
        x = v[k - 1 + offset] + 1 // 向右移动：a 的删除
      }
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v[k + offset] = x
      if (x >= n && y >= m) return trace
    }
  }
  return undefined
}

/** 从 trace 窗口快照倒推编辑脚本 */
function reconstruct<T>(trace: Int32Array[], a: T[], b: T[]): DiffOp<T>[] {
  const ops: DiffOp<T>[] = []
  let x = a.length
  let y = b.length

  for (let d = trace.length - 1; d > 0; d--) {
    const win = trace[d]
    const k = x - y
    let prevK: number
    if (k === -d || (k !== d && win[k - 1 + d] < win[k + 1 + d])) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }
    const prevX = win[prevK + d]
    const prevY = prevX - prevK
    while (x > prevX && y > prevY) {
      ops.unshift({ type: 'equal', value: a[x - 1] })
      x--
      y--
    }
    if (x === prevX) {
      ops.unshift({ type: 'add', value: b[y - 1] })
      y--
    } else {
      ops.unshift({ type: 'remove', value: a[x - 1] })
      x--
    }
  }
  // d = 0 时路径全在对角线上
  while (x > 0 && y > 0) {
    ops.unshift({ type: 'equal', value: a[x - 1] })
    x--
    y--
  }
  return ops
}
