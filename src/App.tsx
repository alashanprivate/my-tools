import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './components/Home'
import { JsonFormatter } from './components/tools/JsonFormatter'
import { CryptoTools } from './components/tools/CryptoTools'
import { CronTools } from './components/tools/CronTools'
import { JwtTool } from './components/tools/JwtTool'
import { IdCardTool } from './components/tools/IdCardTool'
import { TimeTool } from './components/tools/TimeTool'
import { QRCodeTool } from './components/tools/QRCodeTool'
import { RegexTool } from './components/tools/RegexTool'
import { ToastProvider } from './components/ui/Toast'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="json" element={<JsonFormatter />} />
            <Route path="crypto" element={<CryptoTools />} />
            <Route path="cron" element={<CronTools />} />
            <Route path="jwt" element={<JwtTool />} />
            <Route path="idcard" element={<IdCardTool />} />
            <Route path="time" element={<TimeTool />} />
            <Route path="qrcode" element={<QRCodeTool />} />
            <Route path="regex" element={<RegexTool />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
