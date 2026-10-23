/** AI 对话入口的内置默认列表：SQLite 首次建表时的种子数据（应用升级新增站点靠启动时 INSERT OR IGNORE 补种） */
export interface AiChatTool {
  /** 唯一标识（slug），内置项为固定 slug，自定义项用作内嵌 webview 的 label 后缀，仅限小写字母/数字/连字符 */
  id: string
  /** 显示名称 */
  name: string
  /** 聊天页地址 */
  url: string
  /** 头像底色（tailwind 背景类） */
  color: string
  /** 是否为用户自定义入口（存于 ai_entries 表，可删除） */
  custom?: boolean
  /** 自定义入口上传的 Logo（data URL），存在时优先于 favicon 抓取 */
  logo?: string
  /** 是否已固定到顶部标签栏 */
  pinned?: boolean
}

export const AI_CHAT_TOOLS: AiChatTool[] = [
  // 国内
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', color: 'bg-blue-500' },
  { id: 'kimi', name: 'Kimi', url: 'https://kimi.moonshot.cn', color: 'bg-slate-700' },
  { id: 'doubao', name: '豆包', url: 'https://www.doubao.com/chat/', color: 'bg-sky-500' },
  { id: 'tongyi', name: '通义千问', url: 'https://www.tongyi.com', color: 'bg-purple-500' },
  { id: 'yiyan', name: '文心一言', url: 'https://yiyan.baidu.com', color: 'bg-blue-600' },
  { id: 'yuanbao', name: '腾讯元宝', url: 'https://yuanbao.tencent.com/chat/', color: 'bg-sky-600' },
  { id: 'chatglm', name: '智谱清言', url: 'https://chatglm.cn', color: 'bg-violet-500' },
  { id: 'metaso', name: '秘塔AI搜索', url: 'https://metaso.cn', color: 'bg-emerald-500' },
  // 国际
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', color: 'bg-emerald-600' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai', color: 'bg-orange-500' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com', color: 'bg-blue-400' },
  { id: 'grok', name: 'Grok', url: 'https://grok.com', color: 'bg-neutral-900' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai', color: 'bg-teal-500' },
  { id: 'poe', name: 'Poe', url: 'https://poe.com', color: 'bg-purple-600' },
]
