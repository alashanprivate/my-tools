import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { initTheme } from '@/lib/theme'
import './index.css'

// 同步部分立即生效（首帧前内联脚本已处理，这里幂等）；store 校正在后台完成
void initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
