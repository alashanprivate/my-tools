/** 堆栈中的一帧 */
export interface StackFrame {
  /** 完整帧文本，如 at com.example.Foo.bar(Foo.java:10) */
  raw: string
  /** 声明类全限定名 */
  className: string
  /** 方法名（含 <init>、lambda$xxx$0 等） */
  method: string
  /** 源文件名（Native Method 等无源信息的帧没有） */
  fileName?: string
  /** 行号 */
  line?: number
}

/** 一层异常（含 Caused by 层级） */
export interface ExceptionEntry {
  /** 异常类全限定名 */
  exceptionClass: string
  /** 异常消息，可能为空 */
  message: string
  /** 该异常下的栈帧 */
  frames: StackFrame[]
  /** 是否由 Caused by: 引出 */
  isCause: boolean
  /** "... N more" / "common frames omitted" 省略的帧数 */
  omittedFrames: number
}

export interface PackageCount {
  /** 包前缀（前两段，如 com.example） */
  pkg: string
  count: number
}

export interface StackAnalysis {
  /** 是否识别到至少一个异常 */
  isValid: boolean
  /** 异常链，按出现顺序（最外层在前） */
  exceptions: ExceptionEntry[]
  /** 根因：有 Caused by 时为最后一个异常，否则为第一个 */
  rootCause: ExceptionEntry | null
  /** 所有帧中出现最多的包前缀，降序前 5 */
  topPackages: PackageCount[]
  /** 业务包前缀下最深的帧（最接近抛出点）；未配置前缀或无匹配时为 null */
  deepestBusinessFrame: StackFrame | null
  /** 无法识别的行数（诊断用） */
  unrecognizedLines: number
}

export interface AnalyzeOptions {
  /** 业务包前缀，如 com.example */
  businessPrefix?: string
}
