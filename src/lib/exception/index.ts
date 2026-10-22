import type {
  AnalyzeOptions,
  ExceptionEntry,
  PackageCount,
  StackAnalysis,
  StackFrame,
} from './types'

export type {
  AnalyzeOptions,
  ExceptionEntry,
  PackageCount,
  StackAnalysis,
  StackFrame,
} from './types'

/** 异常声明行：可选 "Caused by: " 前缀，类名以 Exception/Error/Throwable 结尾，消息可选 */
const EXCEPTION_LINE = /^(Caused by:\s*)?([\w$.]+(?:Exception|Error|Throwable))\s*(?::\s?(.*))?$/

/** at 帧行：at 类名.方法名(源信息)，方法名含 <init>、lambda$xxx$0 等 */
const FRAME_LINE = /^\s*at\s+([\w$.]+)\.([\w$<>]+)\(([^)]*)\)\s*$/

/** 省略行：... 23 more / ... 12 common frames omitted */
const OMITTED_LINE = /^\s*\.{3}\s*(?:(\d+)\s*more|(\d+)\s*common frames omitted)\s*$/

function parseSource(
  source: string,
): { fileName?: string; line?: number } {
  const match = source.match(/^(.+?\.java)(?::(\d+))?$/)
  if (!match) return {}
  return { fileName: match[1], line: match[2] ? Number(match[2]) : undefined }
}

/** 逐行解析 Java 异常堆栈，返回异常链结构；对无关文本容错（计入 unrecognizedLines） */
export function parseStack(text: string): {
  exceptions: ExceptionEntry[]
  unrecognizedLines: number
} {
  const exceptions: ExceptionEntry[] = []
  let unrecognizedLines = 0
  let current: ExceptionEntry | null = null

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue

    const omitted = line.match(OMITTED_LINE)
    if (omitted) {
      if (current) current.omittedFrames += Number(omitted[1] ?? omitted[2] ?? 0)
      continue
    }

    const frameMatch = line.match(FRAME_LINE)
    if (frameMatch) {
      if (!current) {
        current = createEntry('', false)
        exceptions.push(current)
      }
      const { fileName, line: lineNo } = parseSource(frameMatch[3])
      current.frames.push({
        raw: `at ${frameMatch[1]}.${frameMatch[2]}(${frameMatch[3]})`,
        className: frameMatch[1],
        method: frameMatch[2],
        fileName,
        line: lineNo,
      })
      continue
    }

    const excMatch = line.match(EXCEPTION_LINE)
    if (excMatch) {
      current = createEntry(excMatch[2], Boolean(excMatch[1]))
      current.message = excMatch[3]?.trim() ?? ''
      exceptions.push(current)
      continue
    }

    unrecognizedLines++
  }

  return { exceptions, unrecognizedLines }
}

function createEntry(exceptionClass: string, isCause: boolean): ExceptionEntry {
  return { exceptionClass, message: '', frames: [], isCause, omittedFrames: 0 }
}

function computeTopPackages(exceptions: ExceptionEntry[]): PackageCount[] {
  const counts = new Map<string, number>()
  for (const entry of exceptions) {
    for (const frame of entry.frames) {
      const pkg = frame.className.split('.').slice(0, 2).join('.')
      counts.set(pkg, (counts.get(pkg) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([pkg, count]) => ({ pkg, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

function findDeepestBusinessFrame(
  exceptions: ExceptionEntry[],
  rootCause: ExceptionEntry | null,
  businessPrefix: string | undefined,
): StackFrame | null {
  const prefix = businessPrefix?.trim()
  if (!prefix) return null
  // 优先在根因链里找最深业务帧；找不到再看整条异常链
  const searchOrder = rootCause
    ? [rootCause.frames, exceptions.flatMap((e) => e.frames)]
    : [exceptions.flatMap((e) => e.frames)]
  for (const frames of searchOrder) {
    for (let i = frames.length - 1; i >= 0; i--) {
      if (frames[i].className.startsWith(prefix)) return frames[i]
    }
  }
  return null
}

/** 解析并归纳堆栈：异常链、根因、包统计、最深业务帧 */
export function analyzeStack(
  text: string,
  options: AnalyzeOptions = {},
): StackAnalysis {
  const { exceptions, unrecognizedLines } = parseStack(text)
  const rootCause =
    exceptions.length > 0
      ? exceptions.some((e) => e.isCause)
        ? exceptions[exceptions.length - 1]
        : exceptions[0]
      : null

  return {
    isValid: exceptions.length > 0,
    exceptions,
    rootCause,
    topPackages: computeTopPackages(exceptions),
    deepestBusinessFrame: findDeepestBusinessFrame(
      exceptions,
      rootCause,
      options.businessPrefix,
    ),
    unrecognizedLines,
  }
}
