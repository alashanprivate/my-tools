import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './components/Home'
import { ToastProvider } from './components/ui/Toast'

const JsonFormatter = lazy(() =>
  import('./components/tools/JsonFormatter').then((m) => ({ default: m.JsonFormatter }))
)
const Base64Tool = lazy(() =>
  import('./components/tools/Base64Tool').then((m) => ({ default: m.Base64Tool }))
)
const HashTool = lazy(() =>
  import('./components/tools/HashTool').then((m) => ({ default: m.HashTool }))
)
const AesTool = lazy(() => import('./components/tools/AesTool').then((m) => ({ default: m.AesTool })))
const Sm2Tool = lazy(() => import('./components/tools/Sm2Tool').then((m) => ({ default: m.Sm2Tool })))
const Sm3Tool = lazy(() => import('./components/tools/Sm3Tool').then((m) => ({ default: m.Sm3Tool })))
const Sm4Tool = lazy(() => import('./components/tools/Sm4Tool').then((m) => ({ default: m.Sm4Tool })))
const CronTools = lazy(() =>
  import('./components/tools/CronTools').then((m) => ({ default: m.CronTools }))
)
const JwtTool = lazy(() => import('./components/tools/JwtTool').then((m) => ({ default: m.JwtTool })))
const IdCardTool = lazy(() =>
  import('./components/tools/IdCardTool').then((m) => ({ default: m.IdCardTool }))
)
const TimeTool = lazy(() => import('./components/tools/TimeTool').then((m) => ({ default: m.TimeTool })))
const QRCodeTool = lazy(() =>
  import('./components/tools/QRCodeTool').then((m) => ({ default: m.QRCodeTool }))
)
const RegexTool = lazy(() =>
  import('./components/tools/RegexTool').then((m) => ({ default: m.RegexTool }))
)
const Settings = lazy(() =>
  import('./components/settings/Settings').then((m) => ({ default: m.Settings }))
)
const ExceptionAnalyzer = lazy(() =>
  import('./components/tools/ExceptionAnalyzer').then((m) => ({ default: m.ExceptionAnalyzer }))
)
const SqlAssistant = lazy(() =>
  import('./components/tools/SqlAssistant').then((m) => ({ default: m.SqlAssistant }))
)
const DiffTool = lazy(() =>
  import('./components/tools/DiffTool').then((m) => ({ default: m.DiffTool }))
)
const WebsiteNav = lazy(() =>
  import('./components/websites/WebsiteNav').then((m) => ({ default: m.WebsiteNav }))
)
const AiChatNav = lazy(() =>
  import('./components/aiChat/AiChatNav').then((m) => ({ default: m.AiChatNav }))
)
const AiChatEmbed = lazy(() =>
  import('./components/aiChat/AiChatEmbed').then((m) => ({ default: m.AiChatEmbed }))
)

function App() {
  // basename 必须与 vite 的 base 一致，否则子路径部署时刷新/直达深层路由匹配不到
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || undefined}>
      <ToastProvider>
        <Suspense
          fallback={<div className="container mx-auto py-8 text-muted-foreground">加载中…</div>}
        >
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="websites" element={<WebsiteNav />} />
              <Route path="ai-chat" element={<AiChatNav />} />
              <Route path="ai-chat/:id" element={<AiChatEmbed />} />
              <Route path="json" element={<JsonFormatter />} />
              <Route path="base64" element={<Base64Tool />} />
              <Route path="hash" element={<HashTool />} />
              <Route path="aes" element={<AesTool />} />
              <Route path="sm2" element={<Sm2Tool />} />
              <Route path="sm3" element={<Sm3Tool />} />
              <Route path="sm4" element={<Sm4Tool />} />
              <Route path="cron" element={<CronTools />} />
              <Route path="jwt" element={<JwtTool />} />
              <Route path="idcard" element={<IdCardTool />} />
              <Route path="time" element={<TimeTool />} />
              <Route path="qrcode" element={<QRCodeTool />} />
              <Route path="regex" element={<RegexTool />} />
              <Route path="exception" element={<ExceptionAnalyzer />} />
              <Route path="sql" element={<SqlAssistant />} />
              <Route path="diff" element={<DiffTool />} />
              <Route path="settings" element={<Settings />} />
              {/* AI 设置已并入设置页，旧路径重定向保证历史入口/收藏可用 */}
              <Route path="ai" element={<Navigate replace to="/settings?tab=ai" />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
