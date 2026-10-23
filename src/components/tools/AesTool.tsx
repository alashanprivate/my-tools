import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { aesEncrypt, aesDecrypt } from '@/lib/crypto'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'

export function AesTool() {
  const [aesMode, setAesMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [aesKey, setAesKey] = useState('')
  const [aesIv, setAesIv] = useState('')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  const handleAes = () => {
    if (!input.trim()) {
      setError('请输入文本')
      return
    }

    if (!aesKey.trim()) {
      setError('请输入密钥')
      return
    }

    const options = {
      key: aesKey,
      ...(aesIv.trim() && { iv: aesIv }),
    }

    const result = aesMode === 'encrypt' ? aesEncrypt(input, options) : aesDecrypt(input, options)

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
        <h1 className="text-4xl font-bold mb-2">AES 加解密</h1>
        <p className="text-muted-foreground">使用 AES 算法进行对称加密和解密</p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={aesMode === 'encrypt' ? 'default' : 'outline'}
              onClick={() => setAesMode('encrypt')}
            >
              加密
            </Button>
            <Button
              variant={aesMode === 'decrypt' ? 'default' : 'outline'}
              onClick={() => setAesMode('decrypt')}
            >
              解密
            </Button>
          </div>

          <Input
            label="密钥"
            placeholder="输入密钥（建议使用 16、24 或 32 位字符）"
            value={aesKey}
            onChange={(e) => setAesKey(e.target.value)}
            error={error && !aesKey.trim() ? '请输入密钥' : ''}
          />

          <Input
            label="初始化向量（可选）"
            placeholder="输入 IV（16 位字符）"
            value={aesIv}
            onChange={(e) => setAesIv(e.target.value)}
          />

          <Textarea
            placeholder={aesMode === 'encrypt' ? '输入要加密的文本' : '输入要解密的密文'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
            error={error && aesKey.trim() ? error : ''}
          />

          <div className="flex gap-2">
            <Button onClick={handleAes}>{aesMode === 'encrypt' ? '加密' : '解密'}</Button>
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
          <CardTitle className="text-yellow-700 dark:text-yellow-500">⚠️ 安全提示</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 默认使用 CBC 模式，建议使用 16/24/32 位长度的密钥以获得更好的安全性</p>
          <p>• 请妥善保管密钥，密钥一旦丢失将无法解密数据</p>
          <p>• 所有加解密操作在本地完成，数据不会上传到服务器</p>
        </CardContent>
      </Card>
    </div>
  )
}
