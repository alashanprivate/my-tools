import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Search } from 'lucide-react'
import { allNavItems } from '@/components/layout/nav'

export function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTools = allNavItems.filter(
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
