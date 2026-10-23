import { createContext, useContext, useState, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

const useTabsContext = () => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  /** 非受控模式的初始 tab */
  defaultValue?: string
  /** 受控模式的当前 tab；提供后以外部状态为准，defaultValue 失效 */
  value?: string
  /** tab 变化回调，受控/非受控都会触发 */
  onValueChange?: (value: string) => void
}

const Tabs = ({ defaultValue = '', value, onValueChange, children, className }: TabsProps) => {
  const [internalTab, setInternalTab] = useState(defaultValue)
  const activeTab = value ?? internalTab
  const setActiveTab = (next: string) => {
    if (value === undefined) setInternalTab(next)
    onValueChange?.(next)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = ({ className, children }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md bg-muted/50 p-1',
        'text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = ({ value, children, className }: TabsTriggerProps) => {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2',
        'text-sm font-medium ring-offset-background',
        'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'border border-muted',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = ({ value, children, className }: TabsContentProps) => {
  const { activeTab } = useTabsContext()

  if (activeTab !== value) return null

  return (
    <div
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
