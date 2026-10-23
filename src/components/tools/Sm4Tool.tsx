import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { base64Decode } from '@/lib/crypto'
import { sm3Hash, sm4Encrypt, sm4Decrypt } from '@/lib/gm'
import { Copy } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'

export function Sm4Tool() {
  const [sm4Mode, setSm4Mode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [sm4Input, setSm4Input] = useState('')
  const [sm4Key, setSm4Key] = useState('')
  const [sm4KeyFormat, setSm4KeyFormat] = useState<'hex' | 'base64' | 'string'>('hex')
  const [sm4Output, setSm4Output] = useState('')
  const [sm4Error, setSm4Error] = useState('')
  const { showToast } = useToast()

  const handleSm4 = () => {
    if (!sm4Input.trim()) {
      setSm4Error('请输入文本')
      return
    }

    if (!sm4Key.trim()) {
      setSm4Error('请输入密钥')
      return
    }

    // 根据格式验证和转换密钥
    let finalKey = sm4Key

    if (sm4KeyFormat === 'hex') {
      // 验证十六进制格式（32位）
      if (!/^[0-9a-fA-F]{32}$/.test(sm4Key)) {
        setSm4Error('密钥必须为32位十六进制字符')
        return
      }
    } else if (sm4KeyFormat === 'base64') {
      // Base64格式：先解码再验证
      try {
        const decoded = base64Decode(sm4Key)
        if (!decoded.success) {
          setSm4Error('Base64解码失败：' + (decoded.error || '无效的Base64字符串'))
          return
        }
        // Base64解码后应该是16字节，转换为32位十六进制
        const hexResult = decoded.result || ''
        // 验证解码后的长度是否为16字节（32个十六进制字符）
        if (hexResult.length !== 32) {
          setSm4Error('Base64解码后的密钥长度不正确，应为16字节')
          return
        }
        finalKey = hexResult
      } catch {
        setSm4Error('Base64解码失败')
        return
      }
    } else {
      // 字符串格式：转换为UTF-8字节数组，然后转十六进制
      try {
        const encoder = new TextEncoder()
        const bytes = encoder.encode(sm4Key)

        // 如果长度不足16字节，填充0
        // 如果长度超过16字节，使用SM3哈希截取前32位
        let keyBytes: Uint8Array

        if (bytes.length < 16) {
          keyBytes = new Uint8Array(16)
          keyBytes.set(bytes)
          // 剩余字节已经是0
        } else if (bytes.length === 16) {
          keyBytes = bytes
        } else {
          // 超过16字节，使用SM3哈希
          const hash = sm3Hash(sm4Key)
          keyBytes = new Uint8Array(16)
          for (let i = 0; i < 16; i++) {
            keyBytes[i] = parseInt(hash.substr(i * 2, 2), 16)
          }
        }

        // 转换为十六进制字符串
        finalKey = Array.from(keyBytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      } catch {
        setSm4Error('字符串密钥转换失败')
        return
      }
    }

    try {
      const result =
        sm4Mode === 'encrypt' ? sm4Encrypt(sm4Input, finalKey) : sm4Decrypt(sm4Input, finalKey)
      setSm4Output(result)
      setSm4Error('')
      showToast(sm4Mode === 'encrypt' ? 'SM4 加密成功' : 'SM4 解密成功', 'success')
    } catch {
      setSm4Error(sm4Mode === 'encrypt' ? 'SM4 加密失败' : 'SM4 解密失败，请检查密钥')
      setSm4Output('')
      showToast('操作失败', 'error')
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
        <h1 className="text-4xl font-bold mb-2">SM4 加解密</h1>
        <p className="text-muted-foreground">国密 SM4 分组密码算法，对称加密和解密（16 字节密钥）</p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={sm4Mode === 'encrypt' ? 'default' : 'outline'} onClick={() => setSm4Mode('encrypt')}>
              加密
            </Button>
            <Button variant={sm4Mode === 'decrypt' ? 'default' : 'outline'} onClick={() => setSm4Mode('decrypt')}>
              解密
            </Button>
          </div>

          <Select
            label="密钥格式"
            value={sm4KeyFormat}
            onChange={(e) => setSm4KeyFormat(e.target.value as 'hex' | 'base64' | 'string')}
            options={[
              { value: 'hex', label: '32位十六进制（例如：0123456789abcdeffedcba9876543210）' },
              { value: 'base64', label: 'Base64字符串（16字节编码）' },
              { value: 'string', label: '字符串密码（自动转换为16字节密钥）' },
            ]}
          />

          <Input
            label={`密钥（${
              sm4KeyFormat === 'hex' ? '32位十六进制' : sm4KeyFormat === 'base64' ? 'Base64字符串' : '字符串'
            }）`}
            placeholder={
              sm4KeyFormat === 'hex'
                ? '例如: 0123456789abcdeffedcba9876543210'
                : sm4KeyFormat === 'base64'
                  ? '例如: ASNFZ4mrze/+3LqYdlQyEA=='
                  : '例如: MySecretPassword123'
            }
            value={sm4Key}
            onChange={(e) => setSm4Key(e.target.value)}
            error={sm4Error && !sm4Key.trim() ? sm4Error : ''}
          />

          <Textarea
            placeholder={sm4Mode === 'encrypt' ? '输入要加密的文本' : '输入要解密的密文'}
            value={sm4Input}
            onChange={(e) => setSm4Input(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
            error={sm4Error && sm4Key.trim() ? sm4Error : ''}
          />

          <div className="flex gap-2">
            <Button onClick={handleSm4}>{sm4Mode === 'encrypt' ? '加密' : '解密'}</Button>
            <Button
              onClick={() => {
                setSm4Input('')
                setSm4Key('')
                setSm4Output('')
                setSm4Error('')
              }}
              variant="outline"
            >
              清空
            </Button>
            {sm4Output && (
              <Button
                onClick={() => copyToClipboard(sm4Output, '已复制到剪贴板')}
                variant="outline"
                className="ml-auto gap-2"
              >
                <Copy className="h-4 w-4" />
                复制
              </Button>
            )}
          </div>

          {sm4Output && (
            <Textarea
              value={sm4Output}
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
          <p>• SM4 密钥必须为 16 字节：32 位十六进制、16 字节的 Base64，或自动转换的字符串密码</p>
          <p>• 请妥善保管密钥，密钥一旦丢失将无法解密数据</p>
          <p>• 所有加解密操作在本地完成，数据不会上传到服务器</p>
        </CardContent>
      </Card>
    </div>
  )
}
