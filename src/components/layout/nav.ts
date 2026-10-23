import {
  Bug,
  Calendar,
  Clock,
  Database,
  FileDiff,
  FileJson,
  FileSearch,
  Globe,
  Hash,
  House,
  Key,
  Lock,
  MessagesSquare,
  QrCode,
  Shield,
  Ticket,
  User,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  /** 显示名称 */
  title: string
  /** 工具简介（首页卡片用） */
  description: string
  /** 路由路径，加密类工具通过 ?tab= 参数区分 */
  path: string
  icon: LucideIcon
  /** 图标颜色（首页卡片用） */
  color: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

/** 首页入口，不属于任何分组 */
export const homeItem: NavItem = {
  title: '首页',
  description: '全部工具导航',
  path: '/',
  icon: House,
  color: 'text-slate-500',
}

/** 一级菜单「网站导航」：常用网站快捷入口页（不属于开发工具分组，也不进标签页） */
export const websiteNavItem: NavItem = {
  title: '网站导航',
  description: '常用网站快捷入口',
  path: '/websites',
  icon: Globe,
  color: 'text-sky-500',
}

/** 一级菜单「AI 对话」：常用 AI 聊天入口，桌面端点击后内嵌在功能区打开（不进标签页） */
export const aiChatNavItem: NavItem = {
  title: 'AI 对话',
  description: '常用 AI 聊天入口，桌面端内嵌在功能区打开',
  path: '/ai-chat',
  icon: MessagesSquare,
  color: 'text-indigo-500',
}

export const navGroups: NavGroup[] = [
  {
    label: '格式与文本',
    items: [
      {
        title: 'JSON 格式化',
        description: '格式化、压缩和验证 JSON',
        path: '/json',
        icon: FileJson,
        color: 'text-blue-500',
      },
      {
        title: '正则表达式',
        description: '测试正则表达式，提供模板和代码生成',
        path: '/regex',
        icon: FileSearch,
        color: 'text-lime-500',
      },
      {
        title: '代码比对',
        description: '对比两段文本/代码差异，支持并排与统一视图',
        path: '/diff',
        icon: FileDiff,
        color: 'text-orange-500',
      },
    ],
  },
  {
    label: '加解密',
    items: [
      {
        title: 'Base64 编解码',
        description: 'Base64 编码和解码',
        path: '/base64',
        icon: Lock,
        color: 'text-green-500',
      },
      {
        title: '哈希计算',
        description: 'MD5、SHA-1、SHA-256、SHA-512',
        path: '/hash',
        icon: Hash,
        color: 'text-purple-500',
      },
      {
        title: 'AES 加解密',
        description: 'AES-256 加密和解密',
        path: '/aes',
        icon: Lock,
        color: 'text-orange-500',
      },
      {
        title: 'SM2 签名验签',
        description: '国密 SM2 椭圆曲线签名',
        path: '/sm2',
        icon: Shield,
        color: 'text-red-500',
      },
      {
        title: 'SM3 哈希',
        description: '国密 SM3 密码杂凑算法',
        path: '/sm3',
        icon: Hash,
        color: 'text-pink-500',
      },
      {
        title: 'SM4 加解密',
        description: '国密 SM4 分组密码算法',
        path: '/sm4',
        icon: Key,
        color: 'text-indigo-500',
      },
      {
        title: 'JWT 工具',
        description: '生成、解析和验证 JWT Token',
        path: '/jwt',
        icon: Ticket,
        color: 'text-amber-500',
      },
    ],
  },
  {
    label: '时间',
    items: [
      {
        title: 'Cron 表达式',
        description: '生成、解释和验证 Cron',
        path: '/cron',
        icon: Clock,
        color: 'text-cyan-500',
      },
      {
        title: '时间计算',
        description: '时间戳转换、时区换算、日期计算',
        path: '/time',
        icon: Calendar,
        color: 'text-rose-500',
      },
    ],
  },
  {
    label: '生成与校验',
    items: [
      {
        title: '二维码生成',
        description: '文本、网址、电话、邮箱二维码生成',
        path: '/qrcode',
        icon: QrCode,
        color: 'text-violet-500',
      },
      {
        title: '身份证号工具',
        description: '随机生成和验证身份证号',
        path: '/idcard',
        icon: User,
        color: 'text-teal-500',
      },
    ],
  },
  {
    label: 'AI 助手',
    items: [
      {
        title: '异常分析',
        description: '粘贴 Java 异常堆栈，本地解析 + AI 定位根因',
        path: '/exception',
        icon: Bug,
        color: 'text-red-500',
      },
      {
        title: 'SQL 助手',
        description: 'DDL + 需求生成 SQL，或分析优化慢 SQL',
        path: '/sql',
        icon: Database,
        color: 'text-emerald-500',
      },
    ],
  },
]

/** 一级菜单「开发工具」：二级为各分组，三级为具体工具 */
export const toolsSection: { title: string; key: string; groups: NavGroup[] } = {
  title: '开发工具',
  key: 'tools',
  groups: navGroups,
}

/** 扁平化的全部工具项（首页卡片用，不含首页入口） */
export const allNavItems: NavItem[] = navGroups.flatMap((group) => group.items)

const itemsByPath = new Map(allNavItems.map((item) => [item.path, item]))

/** 按完整路径（含 ?tab= 查询串）反查导航项，未知路径返回 undefined */
export function getNavItemByPath(path: string): NavItem | undefined {
  return itemsByPath.get(path)
}

/**
 * 判断导航项是否对应当前路由。
 * 普通项按路径精确匹配；带 ?tab= 的项还要求当前 URL 的 tab 参数一致
 * （供未来需要子路径区分的工具使用）。
 */
export function isNavItemActive(item: NavItem, pathname: string, search: string): boolean {
  const [basePath, query] = item.path.split('?')
  if (pathname !== basePath) return false
  const itemTab = query ? new URLSearchParams(query).get('tab') : null
  if (!itemTab) return true
  return new URLSearchParams(search).get('tab') === itemTab
}
