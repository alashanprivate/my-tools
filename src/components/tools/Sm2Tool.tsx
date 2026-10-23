import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  sm2GenerateKeyPair,
  sm2Sign,
  sm2VerifySignature,
  sm2Encrypt as sm2Enc,
  sm2Decrypt as sm2Dec,
  type SM2KeyPair,
} from '@/lib/gm'
import { Copy } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'

export function Sm2Tool() {
  const [sm2KeyPair, setSm2KeyPair] = useState<SM2KeyPair | null>(null)
  const [sm2SignMessage, setSm2SignMessage] = useState('')
  const [sm2SignPrivateKey, setSm2SignPrivateKey] = useState('')
  const [sm2SignResult, setSm2SignResult] = useState('')
  const [sm2VerifyPublicKey, setSm2VerifyPublicKey] = useState('')
  const [sm2VerifySig, setSm2VerifySig] = useState('')
  const [sm2VerifyResult, setSm2VerifyResult] = useState<boolean | null>(null)
  const [sm2EncInput, setSm2EncInput] = useState('')
  const [sm2EncKey, setSm2EncKey] = useState('')
  const [sm2EncMode, setSm2EncMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [sm2EncOutput, setSm2EncOutput] = useState('')
  const [sm2EncError, setSm2EncError] = useState('')
  const { showToast } = useToast()

  // SM2 密钥生成
  const handleSm2KeyGen = () => {
    try {
      const keyPair = sm2GenerateKeyPair()
      setSm2KeyPair(keyPair)
      showToast('SM2 密钥对生成成功', 'success')
    } catch {
      showToast('密钥生成失败', 'error')
    }
  }

  // SM2 签名
  const handleSm2Sign = () => {
    if (!sm2SignMessage.trim()) {
      showToast('请输入消息', 'error')
      return
    }

    if (!sm2SignPrivateKey.trim()) {
      showToast('请输入私钥', 'error')
      return
    }

    // 验证私钥格式（64位十六进制）
    if (!/^[0-9a-fA-F]{64}$/.test(sm2SignPrivateKey)) {
      showToast('私钥必须为64位十六进制字符', 'error')
      return
    }

    try {
      const signature = sm2Sign(sm2SignMessage, sm2SignPrivateKey)
      setSm2SignResult(signature)
      showToast('SM2 签名成功', 'success')
    } catch {
      showToast('签名失败', 'error')
    }
  }

  // SM2 验签
  const handleSm2Verify = () => {
    if (!sm2SignMessage.trim()) {
      showToast('请输入消息', 'error')
      return
    }

    if (!sm2VerifySig.trim()) {
      showToast('请输入签名', 'error')
      return
    }

    if (!sm2VerifyPublicKey.trim()) {
      showToast('请输入公钥', 'error')
      return
    }

    // 验证公钥格式（130位，04开头）
    if (!/^04[0-9a-fA-F]{128}$/.test(sm2VerifyPublicKey)) {
      showToast('公钥必须为130位十六进制字符（04开头）', 'error')
      return
    }

    try {
      const isValid = sm2VerifySignature(sm2SignMessage, sm2VerifySig, sm2VerifyPublicKey)
      setSm2VerifyResult(isValid)
      showToast(isValid ? '✅ 签名验证成功' : '❌ 签名验证失败', isValid ? 'success' : 'error')
    } catch {
      showToast('验签失败', 'error')
    }
  }

  // SM2 加密/解密
  const handleSm2Enc = () => {
    if (!sm2EncInput.trim()) {
      setSm2EncError('请输入文本')
      return
    }

    if (!sm2EncKey.trim()) {
      setSm2EncError('请输入密钥')
      return
    }

    try {
      const result =
        sm2EncMode === 'encrypt' ? sm2Enc(sm2EncInput, sm2EncKey) : sm2Dec(sm2EncInput, sm2EncKey)
      setSm2EncOutput(result)
      setSm2EncError('')
      showToast(sm2EncMode === 'encrypt' ? 'SM2 加密成功' : 'SM2 解密成功', 'success')
    } catch {
      setSm2EncError(sm2EncMode === 'encrypt' ? 'SM2 加密失败' : 'SM2 解密失败，请检查密钥')
      setSm2EncOutput('')
      showToast('操作失败', 'error')
    }
  }

  // 复制辅助函数
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
        <h1 className="text-4xl font-bold mb-2">SM2 签名验签</h1>
        <p className="text-muted-foreground">
          国密 SM2 椭圆曲线公钥密码：密钥生成、数字签名、加密解密（非对称加密）
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SM2 椭圆曲线公钥密码算法</CardTitle>
          <CardDescription>密钥生成、数字签名、加密解密（非对称加密）</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="keygen" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="keygen">密钥生成</TabsTrigger>
              <TabsTrigger value="sign">签名验签</TabsTrigger>
              <TabsTrigger value="enc">加密解密</TabsTrigger>
            </TabsList>

            {/* SM2 密钥生成 */}
            <TabsContent value="keygen" className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleSm2KeyGen}>生成密钥对</Button>
                <Button onClick={() => setSm2KeyPair(null)} variant="outline">
                  清空
                </Button>
              </div>

              {sm2KeyPair && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">公钥（130位）</label>
                    <Textarea
                      value={sm2KeyPair.publicKey}
                      readOnly
                      className="min-h-[120px] font-mono text-xs"
                    />
                    <Button
                      onClick={() => copyToClipboard(sm2KeyPair.publicKey, '公钥已复制')}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      复制公钥
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">私钥（64位）</label>
                    <Textarea
                      value={sm2KeyPair.privateKey}
                      readOnly
                      className="min-h-[120px] font-mono text-xs"
                    />
                    <Button
                      onClick={() => copyToClipboard(sm2KeyPair.privateKey, '私钥已复制')}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      复制私钥
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* SM2 签名验签 */}
            <TabsContent value="sign" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">消息</label>
                <Textarea
                  placeholder="输入要签名或验签的消息"
                  value={sm2SignMessage}
                  onChange={(e) => setSm2SignMessage(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">私钥（用于签名，64位十六进制）</label>
                <Textarea
                  placeholder="输入私钥"
                  value={sm2SignPrivateKey}
                  onChange={(e) => setSm2SignPrivateKey(e.target.value)}
                  className="min-h-[80px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSm2Sign}>签名</Button>
                <Button
                  onClick={() => {
                    setSm2SignResult('')
                  }}
                  variant="outline"
                >
                  清空签名
                </Button>
              </div>

              {sm2SignResult && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">签名结果（128位）</label>
                  <Textarea value={sm2SignResult} readOnly className="min-h-[80px] font-mono text-xs" />
                  <Button
                    onClick={() => copyToClipboard(sm2SignResult, '签名已复制')}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    复制签名
                  </Button>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <label className="text-sm font-medium">公钥（用于验签，130位十六进制，04开头）</label>
                <Textarea
                  placeholder="输入公钥"
                  value={sm2VerifyPublicKey}
                  onChange={(e) => setSm2VerifyPublicKey(e.target.value)}
                  className="min-h-[80px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">签名（128位十六进制）</label>
                <Textarea
                  placeholder="输入要验证的签名"
                  value={sm2VerifySig}
                  onChange={(e) => setSm2VerifySig(e.target.value)}
                  className="min-h-[80px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSm2Verify}>验签</Button>
                <Button onClick={() => setSm2VerifyResult(null)} variant="outline">
                  清空结果
                </Button>
              </div>

              {sm2VerifyResult !== null && (
                <div
                  className={`p-4 rounded-lg ${
                    sm2VerifyResult
                      ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                  }`}
                >
                  {sm2VerifyResult ? '✅ 签名有效' : '❌ 签名无效'}
                </div>
              )}
            </TabsContent>

            {/* SM2 加密解密 */}
            <TabsContent value="enc" className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={sm2EncMode === 'encrypt' ? 'default' : 'outline'}
                  onClick={() => setSm2EncMode('encrypt')}
                >
                  加密
                </Button>
                <Button
                  variant={sm2EncMode === 'decrypt' ? 'default' : 'outline'}
                  onClick={() => setSm2EncMode('decrypt')}
                >
                  解密
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {sm2EncMode === 'encrypt' ? '公钥（130位十六进制，04开头）' : '私钥（64位十六进制）'}
                </label>
                <Textarea
                  placeholder={sm2EncMode === 'encrypt' ? '输入公钥用于加密' : '输入私钥用于解密'}
                  value={sm2EncKey}
                  onChange={(e) => setSm2EncKey(e.target.value)}
                  className="min-h-[80px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{sm2EncMode === 'encrypt' ? '明文' : '密文'}</label>
                <Textarea
                  placeholder={sm2EncMode === 'encrypt' ? '输入要加密的明文' : '输入要解密的密文'}
                  value={sm2EncInput}
                  onChange={(e) => setSm2EncInput(e.target.value)}
                  className="min-h-[150px] font-mono text-sm"
                  error={sm2EncError}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSm2Enc}>{sm2EncMode === 'encrypt' ? '加密' : '解密'}</Button>
                <Button
                  onClick={() => {
                    setSm2EncInput('')
                    setSm2EncOutput('')
                    setSm2EncError('')
                  }}
                  variant="outline"
                >
                  清空
                </Button>
                {sm2EncOutput && (
                  <Button
                    onClick={() => copyToClipboard(sm2EncOutput, '已复制到剪贴板')}
                    variant="outline"
                    className="ml-auto gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    复制
                  </Button>
                )}
              </div>

              {sm2EncOutput && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{sm2EncMode === 'encrypt' ? '密文' : '明文'}</label>
                  <Textarea
                    value={sm2EncOutput}
                    readOnly
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-yellow-700 dark:text-yellow-500">⚠️ 安全提示</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 公钥为 130 位十六进制字符（04 开头），私钥为 64 位十六进制字符</p>
          <p>• 请妥善保管私钥，私钥一旦丢失将无法解密数据</p>
          <p>• 所有加解密操作在本地完成，数据不会上传到服务器</p>
        </CardContent>
      </Card>
    </div>
  )
}
