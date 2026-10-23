import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { base64Encode, base64Decode } from '@/lib/crypto'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'

export function Base64Tool() {
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  const handleBase64 = () => {
    if (!input.trim()) {
      setError('请输入文本')
      return
    }

    const result = base64Mode === 'encode' ? base64Encode(input) : base64Decode(input)

    if (result.success) {
      setOutput(result.result || '')
      setError('')
    } else {
      setError(result.error || '操作失败')
      setOutput('')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  const handleCopy = async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      showToast('已复制到剪贴板', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('复制失败', 'error')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Base64 编解码</h1>
        <p className="text-muted-foreground">将文本转换为 Base64 编码，或解码 Base64 文本</p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={base64Mode === 'encode' ? 'default' : 'outline'}
              onClick={() => setBase64Mode('encode')}
            >
              编码
            </Button>
            <Button
              variant={base64Mode === 'decode' ? 'default' : 'outline'}
              onClick={() => setBase64Mode('decode')}
            >
              解码
            </Button>
          </div>

          <Textarea
            placeholder={base64Mode === 'encode' ? '输入要编码的文本' : '输入 Base64 字符串'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
            error={error}
          />

          <div className="flex gap-2">
            <Button onClick={handleBase64}>{base64Mode === 'encode' ? '编码' : '解码'}</Button>
            <Button onClick={handleClear} variant="outline">
              清空
            </Button>
            {output && (
              <Button onClick={handleCopy} variant="outline" className="ml-auto gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? '已复制' : '复制'}
              </Button>
            )}
          </div>

          {output && (
            <Textarea
              value={output}
              readOnly
              placeholder="结果将显示在这里..."
              className="min-h-[150px] font-mono text-sm"
            />
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Base64 是编码而非加密，任何人都可以解码，不要用来保存敏感信息</p>
          <p>• 所有操作在本地完成，数据不会上传到服务器</p>
        </CardContent>
      </Card>
    </div>
  )
}
