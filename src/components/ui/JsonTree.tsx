import { useState, useCallback } from 'react'

interface JsonTreeNodeProps {
  data: unknown
  keyName?: string
  path: string[]
  onToggle: (path: string[]) => void
  expandedPaths: Set<string>
}

/**
 * 递归渲染 JSON 节点
 */
function JsonTreeNode({
  data,
  keyName,
  path,
  onToggle,
  expandedPaths,
}: JsonTreeNodeProps) {
  const pathKey = path.join('.')
  const isExpanded = expandedPaths.has(pathKey)
  const isObject = data !== null && typeof data === 'object'
  const isArray = Array.isArray(data)

  // 获取值的颜色类名
  const getValueColor = () => {
    if (data === null) return 'text-gray-600 dark:text-gray-400'
    if (typeof data === 'string') return 'text-green-600 dark:text-green-400'
    if (typeof data === 'number') return 'text-blue-600 dark:text-blue-400'
    if (typeof data === 'boolean') return 'text-red-600 dark:text-red-400'
    return ''
  }

  // 渲染值（非对象/数组）
  const renderValue = () => {
    const color = getValueColor()
    const formatted =
      typeof data === 'string' ? `"${data}"` : String(data)

    return <span className={color}>{formatted}</span>
  }

  // 渲染对象/数组的子节点
  const renderChildren = () => {
    if (!isObject) return null

    const entries = isArray
      ? (data as unknown[]).map((item, index) => [String(index), item] as [string, unknown])
      : Object.entries(data as Record<string, unknown>)

    return (
      <div className="relative ml-6">
        {/* 垂直连接虚线 */}
        <div className="absolute left-0 top-0 bottom-0 w-px border-l border-dashed border-muted-foreground/50" style={{ transform: 'translateX(-8px)' }}></div>
        {entries.map(([key, value]) => (
          <div key={key} className="relative">
            {/* 水平连接虚线 */}
            <div className="absolute left-0 top-3 w-4 border-t border-dashed border-muted-foreground/50" style={{ transform: 'translateX(-8px)' }}></div>
            <JsonTreeNode
              data={value}
              keyName={key}
              path={[...path, key]}
              onToggle={onToggle}
              expandedPaths={expandedPaths}
            />
          </div>
        ))}
      </div>
    )
  }

  // 处理点击事件
  const handleClick = useCallback(() => {
    if (isObject) {
      onToggle(path)
    }
  }, [isObject, onToggle, path])

  // 渲染节点
  return (
    <div className="font-mono text-sm">
      <div
        className={`flex items-start gap-1 py-0.5 ${
          isObject ? 'cursor-pointer hover:bg-muted/50' : ''
        }`}
        onClick={handleClick}
      >
        {/* 展开/折叠图标 */}
        {isObject && (
          <span className="flex items-center">
            <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-medium text-muted-foreground border-2 border-muted-foreground/60 rounded hover:bg-muted transition-colors">
              {isExpanded ? '-' : '+'}
            </span>
          </span>
        )}
        {keyName !== undefined && (
          <>
            <span className={`font-semibold ${
              /^\d+$/.test(keyName)
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-purple-600 dark:text-purple-400'
            }`}>
              "{keyName}"
            </span>
            <span className="text-gray-500">:</span>
          </>
        )}

        {/* 值或摘要 */}
        {!isObject ? (
          renderValue()
        ) : (
          <span className="text-gray-500">
            {isArray ? '[' : '{'}
            {!isExpanded && (
              <span className="ml-1">
                {isArray
                  ? `${(data as unknown[]).length} items`
                  : `${Object.keys(data as Record<string, unknown>).length} keys`}
                ...
              </span>
            )}
            {isArray ? ']' : '}'}
          </span>
        )}
      </div>

      {/* 展开的子节点 */}
      {isObject && isExpanded && renderChildren()}
    </div>
  )
}

interface JsonTreeProps {
  data: unknown
  className?: string
}

/**
 * 可折叠的 JSON 树组件
 * 支持递归展开/折叠嵌套的对象和数组
 */
export function JsonTree({ data, className = '' }: JsonTreeProps) {
  // 初始化展开所有节点
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    const paths = new Set<string>()

    const collectPaths = (obj: unknown, currentPath: string[] = []) => {
      if (obj !== null && typeof obj === 'object') {
        const pathKey = currentPath.join('.')
        // 展开所有对象/数组节点，包括根节点
        paths.add(pathKey)

        const entries = Array.isArray(obj)
          ? obj.map((item, index) => [String(index), item])
          : Object.entries(obj as Record<string, unknown>)

        entries.forEach(([key, value]) => {
          collectPaths(value, [...currentPath, key])
        })
      }
    }

    collectPaths(data)
    return paths
  })

  // 切换节点展开/折叠状态
  const handleToggle = useCallback((path: string[]) => {
    const pathKey = path.join('.')
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(pathKey)) {
        next.delete(pathKey)
      } else {
        next.add(pathKey)
      }
      return next
    })
  }, [])

  // 展开所有节点
  const expandAll = useCallback(() => {
    const paths = new Set<string>()

    const collectPaths = (obj: unknown, currentPath: string[] = []) => {
      if (obj !== null && typeof obj === 'object') {
        const pathKey = currentPath.join('.')
        // 展开所有对象/数组节点，包括根节点
        paths.add(pathKey)

        const entries = Array.isArray(obj)
          ? obj.map((item, index) => [String(index), item])
          : Object.entries(obj as Record<string, unknown>)

        entries.forEach(([key, value]) => {
          collectPaths(value, [...currentPath, key])
        })
      }
    }

    collectPaths(data)
    setExpandedPaths(paths)
  }, [data])

  // 折叠所有节点
  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set())
  }, [])

  return (
    <div className={className}>
      {/* 工具栏 */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={expandAll}
          className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
        >
          全部展开
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
        >
          全部折叠
        </button>
      </div>

      {/* JSON 树 */}
      <div className="border-2 border-muted-foreground/60 rounded-md p-4 bg-background">
        <JsonTreeNode
          data={data}
          path={[]}
          onToggle={handleToggle}
          expandedPaths={expandedPaths}
        />
      </div>
    </div>
  )
}
