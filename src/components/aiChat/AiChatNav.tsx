import { useState } from 'react'
import { MessagesSquare, Search } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'
import { AI_CHAT_TOOLS, type AiChatTool } from '@/lib/aiChat'
import { openAiChatWindow } from '@/lib/aiChat/openAiChatWindow'

function ChatTile({ tool, onOpen }: { tool: AiChatTool; onOpen: (tool: AiChatTool) => void }) {
  const letter = tool.name.trim().charAt(0).toUpperCase() || '?'
  return (
    <button
      type="button"
      title={`${tool.name}（应用内窗口打开）`}
      onClick={() => onOpen(tool)}
      className="group flex w-20 flex-col items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white shadow-sm transition-all group-hover:shadow-md ${tool.color}`}
      >
        {letter}
      </div>
      <p className="mt-2 w-20 truncate text-center text-sm">{tool.name}</p>
    </button>
  )
}

export function AiChatNav() {
  const [keyword, setKeyword] = useState('')
  const { showToast } = useToast()

  const filtered = AI_CHAT_TOOLS.filter((tool) =>
    `${tool.name} ${tool.url}`.toLowerCase().includes(keyword.trim().toLowerCase()),
  )

  const handleOpen = (tool: AiChatTool) => {
    void openAiChatWindow(tool).then((opened) => {
      if (!opened) showToast(`打开「${tool.name}」失败，请重启应用后重试`, 'error')
    })
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">AI 对话</h1>
        <p className="text-sm text-muted-foreground">
          常用 AI 聊天入口，桌面端在应用内独立窗口打开
        </p>
        <div className="relative ml-auto min-w-52 sm:max-w-md sm:flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            aria-label="搜索 AI 对话"
            placeholder="搜索..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-5">
          {filtered.map((tool) => (
            <ChatTile key={tool.id} tool={tool} onOpen={handleOpen} />
          ))}
        </div>
      ) : (
        <div className="mt-24 text-center text-sm text-muted-foreground">没有匹配的 AI 对话</div>
      )}

      <p className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <MessagesSquare className="h-3.5 w-3.5" />
        需要登录的服务在窗口内直接登录即可；浏览器环境下点击将以新标签页打开
      </p>
    </div>
  )
}
