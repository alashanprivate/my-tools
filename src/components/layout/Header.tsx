import { Link } from 'react-router-dom'
import { Code2, Menu, ChevronDown } from 'lucide-react'
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from '@/components/ui/DropdownMenu'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Code2 className="h-6 w-6" />
          <span>My-tools</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/json"
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-transparent hover:border-foreground hover:bg-muted transition-all whitespace-nowrap"
          >
            JSON 工具
          </Link>

          <Dropdown>
            <DropdownTrigger
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-transparent hover:border-foreground hover:bg-muted transition-all whitespace-nowrap flex items-center gap-1"
            >
              加解密 <ChevronDown className="h-3 w-3" />
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem to="/crypto?tab=base64">Base64 编解码</DropdownItem>
              <DropdownItem to="/crypto?tab=hash">哈希计算</DropdownItem>
              <DropdownItem to="/crypto?tab=aes">AES 加解密</DropdownItem>
              <DropdownItem to="/crypto?tab=sm2">SM2 签名验签</DropdownItem>
              <DropdownItem to="/crypto?tab=sm3">SM3 哈希</DropdownItem>
              <DropdownItem to="/crypto?tab=sm4">SM4 加解密</DropdownItem>
              <DropdownItem to="/jwt">JWT 工具</DropdownItem>
            </DropdownContent>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-transparent hover:border-foreground hover:bg-muted transition-all whitespace-nowrap flex items-center gap-1"
            >
              时间 <ChevronDown className="h-3 w-3" />
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem to="/cron">Cron 表达式</DropdownItem>
              <DropdownItem to="/time">时间计算</DropdownItem>
            </DropdownContent>
          </Dropdown>

          <Link
            to="/idcard"
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-transparent hover:border-foreground hover:bg-muted transition-all whitespace-nowrap"
          >
            身份证
          </Link>
          <Link
            to="/qrcode"
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-transparent hover:border-foreground hover:bg-muted transition-all whitespace-nowrap"
          >
            二维码
          </Link>
          <Link
            to="/regex"
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-transparent hover:border-foreground hover:bg-muted transition-all whitespace-nowrap"
          >
            正则
          </Link>
        </nav>

        <button className="md:hidden p-2 hover:bg-accent rounded-md">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
