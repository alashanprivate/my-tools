import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './components/Home'
import { ToastProvider } from './components/ui/Toast'

const JsonFormatter = lazy(() =>
  import('./components/tools/JsonFormatter').then((m) => ({ default: m.JsonFormatter }))
)
const CryptoTools = lazy(() =>
  import('./components/tools/CryptoTools').then((m) => ({ default: m.CryptoTools }))
)
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
const AiSettings = lazy(() =>
  import('./components/tools/AiSettings').then((m) => ({ default: m.AiSettings }))
)
const ExceptionAnalyzer = lazy(() =>
  import('./components/tools/ExceptionAnalyzer').then((m) => ({ default: m.ExceptionAnalyzer }))
)
const SqlAssistant = lazy(() =>
  import('./components/tools/SqlAssistant').then((m) => ({ default: m.SqlAssistant }))
)
const WebsiteNav = lazy(() =>
  import('./components/websites/WebsiteNav').then((m) => ({ default: m.WebsiteNav }))
)
const AiChatNav = lazy(() =>
  import('./components/aiChat/AiChatNav').then((m) => ({ default: m.AiChatNav }))
)

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Suspense
          fallback={<div className="container mx-auto py-8 text-muted-foreground">加载中…</div>}
        >
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="websites" element={<WebsiteNav />} />
              <Route path="ai-chat" element={<AiChatNav />} />
              <Route path="json" element={<JsonFormatter />} />
              <Route path="crypto" element={<CryptoTools />} />
              <Route path="cron" element={<CronTools />} />
              <Route path="jwt" element={<JwtTool />} />
              <Route path="idcard" element={<IdCardTool />} />
              <Route path="time" element={<TimeTool />} />
              <Route path="qrcode" element={<QRCodeTool />} />
              <Route path="regex" element={<RegexTool />} />
              <Route path="ai" element={<AiSettings />} />
              <Route path="exception" element={<ExceptionAnalyzer />} />
              <Route path="sql" element={<SqlAssistant />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
