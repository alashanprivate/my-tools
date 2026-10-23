import { Outlet } from 'react-router-dom'
import { AskAiPanel } from '@/components/ai/AskAiPanel'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <AskAiPanel />
        </div>
      </div>
    </div>
  )
}
