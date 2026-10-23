import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { sm3Hash } from '@/lib/gm'
import { Copy } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'

export function Sm3Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const { showToast } = useToast()

  const handleSm3 = () => {
    try {
      const result = sm3Hash(input)
      setOutput(result)
      showToast('SM3 哈希计算成功', 'success')
    } catch {
      showToast('SM3 哈希计算失败', 'error')
    }
  }

  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(successMsg, 'success')
    } catch {
      showToast('复制失败', 'error')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">SM3 哈希</h1>
        <p className="text-muted-foreground">国密 SM3 密码杂凑算法，计算文本的 256 位哈希值</p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="输入要计算 SM3 哈希的文本"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
          />

          <div className="flex gap-2">
            <Button onClick={handleSm3}>计算 SM3 哈希</Button>
            <Button
              onClick={() => {
                setInput('')
                setOutput('')
              }}
              variant="outline"
            >
              清空
            </Button>
            {output && (
              <Button
                onClick={() => copyToClipboard(output, '已复制到剪贴板')}
                variant="outline"
                className="ml-auto gap-2"
              >
                <Copy className="h-4 w-4" />
                复制
              </Button>
            )}
          </div>

          {output && (
            <Textarea
              value={output}
              readOnly
              placeholder="SM3 哈希值将显示在这里..."
              className="min-h-[100px] font-mono text-sm"
            />
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• SM3 是国密标准的密码杂凑算法，输出 256 位（64 个十六进制字符），安全性对标 SHA-256</p>
          <p>• 所有计算在本地完成，数据不会上传到服务器</p>
        </CardContent>
      </Card>
    </div>
  )
}
