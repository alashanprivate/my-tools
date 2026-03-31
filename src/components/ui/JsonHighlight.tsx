import { useMemo } from 'react'

interface JsonHighlightProps {
  json: string
  className?: string
}

/**
 * JSON 语法高亮组件
 * 为格式化的 JSON 添加颜色，提升可读性
 */
export function JsonHighlight({ json, className = '' }: JsonHighlightProps) {
  const highlightedJson = useMemo(() => {
    if (!json) return ''

    // 语法高亮的颜色方案
    const colors = {
      key: 'text-purple-600 dark:text-purple-400 font-semibold',     // 键名：紫色+粗体
      string: 'text-green-600 dark:text-green-400',               // 字符串值：绿色
      number: 'text-blue-600 dark:text-blue-400',                // 数字：蓝色
      boolean: 'text-red-600 dark:text-red-400',                 // 布尔值：红色
      null: 'text-gray-600 dark:text-gray-400',                   // null：灰色
      punctuation: 'text-gray-500 dark:text-gray-500',        // 标点符号：灰色
    }

    // 转义 HTML 特殊字符
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }

    // JSON 语法高亮（区分键名和值）
    const highlight = (jsonStr: string): string => {
      let result = jsonStr

      // 1. 高亮键名（字符串后面跟着 : 的）
      result = result.replace(/"([^"]+)":/g, (_, p1) => {
        return `<span class="${colors.key}">"${escapeHtml(p1)}"</span>:`
      })

      // 2. 高亮字符串值
      result = result.replace(/: "([^"]*)"(?=[,}])/g, (_, p1) => {
        return `: <span class="${colors.string}">"${escapeHtml(p1)}"</span>`
      })

      // 3. 高亮数字
      result = result.replace(/:\s*(\d+\.?\d*)/g, (_, p1) => {
        return `: <span class="${colors.number}">${p1}</span>`
      })

      // 4. 高亮布尔值
      result = result.replace(/:\s*(true|false)/g, (_, p1) => {
        return `: <span class="${colors.boolean}">${p1}</span>`
      })

      // 5. 高亮 null
      result = result.replace(/:\s*null/g, () => {
        return `: <span class="${colors.null}">null</span>`
      })

      // 6. 高亮标点符号
      result = result.replace(/([{}[\]])/g, (match) => {
        return `<span class="${colors.punctuation}">${escapeHtml(match)}</span>`
      })

      return result
    }

    return highlight(json)
  }, [json])

  return (
    <div
      className={`font-mono text-sm whitespace-pre-wrap break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: highlightedJson }}
    />
  )
}
