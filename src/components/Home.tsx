import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { FileJson, Lock, Hash, Key, Shield, Clock, Ticket, User, Calendar, QrCode, FileSearch, Search } from 'lucide-react'

export function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  const tools = [
    {
      title: 'JSON 格式化',
      description: '格式化、压缩和验证 JSON',
      icon: FileJson,
      path: '/json',
      color: 'text-blue-500',
    },
    {
      title: 'Base64 编解码',
      description: 'Base64 编码和解码',
      icon: Lock,
      path: '/crypto?tab=base64',
      color: 'text-green-500',
    },
    {
      title: '哈希计算',
      description: 'MD5、SHA-1、SHA-256、SHA-512',
      icon: Hash,
      path: '/crypto?tab=hash',
      color: 'text-purple-500',
    },
    {
      title: 'AES 加解密',
      description: 'AES-256 加密和解密',
      icon: Lock,
      path: '/crypto?tab=aes',
      color: 'text-orange-500',
    },
    {
      title: 'SM2 签名验签',
      description: '国密 SM2 椭圆曲线签名',
      icon: Shield,
      path: '/crypto?tab=sm2',
      color: 'text-red-500',
    },
    {
      title: 'SM3 哈希',
      description: '国密 SM3 密码杂凑算法',
      icon: Hash,
      path: '/crypto?tab=sm3',
      color: 'text-pink-500',
    },
    {
      title: 'SM4 加解密',
      description: '国密 SM4 分组密码算法',
      icon: Key,
      path: '/crypto?tab=sm4',
      color: 'text-indigo-500',
    },
    {
      title: 'Cron 表达式',
      description: '生成、解释和验证 Cron',
      icon: Clock,
      path: '/cron',
      color: 'text-cyan-500',
    },
    {
      title: 'JWT 工具',
      description: '生成、解析和验证 JWT Token',
      icon: Ticket,
      path: '/jwt',
      color: 'text-amber-500',
    },
    {
      title: '身份证号工具',
      description: '随机生成和验证身份证号',
      icon: User,
      path: '/idcard',
      color: 'text-teal-500',
    },
    {
      title: '时间计算',
      description: '时间戳转换、时区换算、日期计算',
      icon: Calendar,
      path: '/time',
      color: 'text-rose-500',
    },
    {
      title: '二维码生成',
      description: '文本、网址、电话、邮箱二维码生成',
      icon: QrCode,
      path: '/qrcode',
      color: 'text-violet-500',
    },
    {
      title: '正则表达式',
      description: '测试正则表达式，提供模板和代码生成',
      icon: FileSearch,
      path: '/regex',
      color: 'text-lime-500',
    },
  ]

  const filteredTools = tools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div>
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="搜索工具..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link key={tool.path} to={tool.path}>
                <Card className="transition-all hover:shadow-lg hover:border-primary cursor-pointer h-full">
                  <CardHeader>
                    <Icon className={`h-10 w-10 ${tool.color} mb-3`} />
                    <CardTitle className="text-xl">{tool.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
        {filteredTools.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            未找到匹配的工具
          </p>
        )}
      </div>
    </div>
  )
}
