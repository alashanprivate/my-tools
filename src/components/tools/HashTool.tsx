import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { hash, type HashAlgorithm } from '@/lib/crypto'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'

export function HashTool() {
  const [hashAlgorithm, setHashAlgorithm] = useState<HashAlgorithm>('sha256')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  const handleHash = () => {
    if (!input.trim()) {
      setError('请输入文本')
      return
    }

    const result = hash(input, hashAlgorithm)

    if (result.success) {
      setOutput(result.result || '')
      setError('')
    } else {
      setError(result.error || '哈希计算失败')
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
        <h1 className="text-4xl font-bold mb-2">哈希计算</h1>
        <p className="text-muted-foreground">计算文本的 MD5、SHA-1、SHA-256、SHA-512 哈希值</p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <Select
            label="哈希算法"
            value={hashAlgorithm}
            onChange={(e) => setHashAlgorithm(e.target.value as HashAlgorithm)}
            options={[
              { value: 'md5', label: 'MD5' },
              { value: 'sha1', label: 'SHA-1' },
              { value: 'sha256', label: 'SHA-256' },
              { value: 'sha512', label: 'SHA-512' },
            ]}
          />

          <Textarea
            placeholder="输入要计算哈希的文本"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
            error={error}
          />

          <div className="flex gap-2">
            <Button onClick={handleHash}>计算哈希</Button>
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
              placeholder="哈希值将显示在这里..."
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
          <p>• 哈希是单向的，不可逆；MD5/SHA-1 已不安全，校验场景建议使用 SHA-256 及以上</p>
          <p>• 所有计算在本地完成，数据不会上传到服务器</p>
        </CardContent>
      </Card>
    </div>
  )
}
