import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { JsonTree } from '@/components/ui/JsonTree'
import { signJwt, verifyJwt, decodeJwt } from '@/lib/jwt'
import { Copy, Check, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type TabType = 'sign' | 'verify' | 'decode'

export function JwtTool() {
  const [activeTab, setActiveTab] = useState<TabType>('sign')
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  // 生成 JWT 状态
  const [signAlgorithm, setSignAlgorithm] = useState<string>('HS256')
  const [signSecret, setSignSecret] = useState('your-secret-key')
  const [signPayloadIss, setSignPayloadIss] = useState('')
  const [signPayloadSub, setSignPayloadSub] = useState('')
  const [signPayloadExp, setSignPayloadExp] = useState('3600')
  const [signCustomFields, setSignCustomFields] = useState<{ key: string; value: string }[]>([])
  const [signJsonMode, setSignJsonMode] = useState(false)
  const [signJsonPayload, setSignJsonPayload] = useState('{\n  "iss": "my-app",\n  "sub": "user123"\n}')
  const [signResult, setSignResult] = useState('')
  const [signError, setSignError] = useState('')

  // 验证 JWT 状态
  const [verifyToken, setVerifyToken] = useState('')
  const [verifySecret, setVerifySecret] = useState('your-secret-key')
  const [verifyAlgorithm, setVerifyAlgorithm] = useState('')
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; payload?: Record<string, unknown>; error?: string } | null>(null)

  // 解析 JWT 状态
  const [decodeToken, setDecodeToken] = useState('')
  const [decodeResult, setDecodeResult] = useState<{ header: unknown; payload: unknown; signature: string } | null>(null)
  const [decodeError, setDecodeError] = useState('')

  // 生成 JWT
  const handleSign = async () => {
    setSignError('')
    setSignResult('')

    try {
      let payload: Record<string, unknown> = {}

      if (signJsonMode) {
        // JSON 模式
        try {
          payload = JSON.parse(signJsonPayload)
        } catch {
          setSignError('JSON 格式错误')
          return
        }
      } else {
        // 表单模式
        if (signPayloadIss) payload.iss = signPayloadIss
        if (signPayloadSub) payload.sub = signPayloadSub
        if (signPayloadExp) payload.exp = Math.floor(Date.now() / 1000) + Number.parseInt(signPayloadExp)

        // 自定义字段
        signCustomFields.forEach(field => {
          if (field.key && field.value) {
            try {
              // 尝试解析为 JSON
              payload[field.key] = JSON.parse(field.value)
            } catch {
              // 如果不是 JSON，作为字符串
              payload[field.key] = field.value
            }
          }
        })
      }

      const result = await signJwt({
        algorithm: signAlgorithm as any,
        payload,
        secret: signSecret,
      })

      if (result.success) {
        setSignResult(result.token)
      } else {
        setSignError(result.error || '生成失败')
      }
    } catch {
      setSignError('生成失败')
    }
  }

  // 验证 JWT
  const handleVerify = async () => {
    setVerifyResult(null)

    const result = await verifyJwt({
      token: verifyToken,
      secret: verifySecret,
      algorithm: verifyAlgorithm || undefined,
    })

    if (result.success) {
      setVerifyResult({
        valid: result.valid,
        payload: result.payload,
      })
      showToast('Token 验证成功', 'success')
    } else {
      setVerifyResult({
        valid: false,
        error: result.error,
      })
      showToast(`Token 验证失败: ${result.error}`, 'error')
    }
  }

  // 解析 JWT
  const handleDecode = async () => {
    setDecodeError('')
    setDecodeResult(null)

    const result = await decodeJwt(decodeToken)

    if (result.success) {
      setDecodeResult({
        header: result.header,
        payload: result.payload,
        signature: result.signature,
      })
    } else {
      setDecodeError(result.error || '解析失败')
    }
  }

  // 复制到剪贴板
  const handleCopy = async (text: string) => {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      showToast('已复制到剪贴板', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('复制失败', 'error')
    }
  }

  // 添加自定义字段
  const addCustomField = () => {
    setSignCustomFields([...signCustomFields, { key: '', value: '' }])
  }

  // 删除自定义字段
  const removeCustomField = (index: number) => {
    setSignCustomFields(signCustomFields.filter((_, i) => i !== index))
  }

  // 更新自定义字段
  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...signCustomFields]
    updated[index][field] = value
    setSignCustomFields(updated)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">JWT 工具</h1>
        <p className="text-muted-foreground">
          快速生成、解析和验证 JWT Token
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'sign' ? 'default' : 'outline'}
          onClick={() => setActiveTab('sign')}
        >
          生成 JWT
        </Button>
        <Button
          variant={activeTab === 'verify' ? 'default' : 'outline'}
          onClick={() => setActiveTab('verify')}
        >
          验证 JWT
        </Button>
        <Button
          variant={activeTab === 'decode' ? 'default' : 'outline'}
          onClick={() => setActiveTab('decode')}
        >
          解析 JWT
        </Button>
      </div>

      {/* 生成 JWT */}
      {activeTab === 'sign' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 配置区域 */}
          <Card>
            <CardHeader>
              <CardTitle>配置</CardTitle>
              <CardDescription>设置 JWT 参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 算法选择 */}
              <div>
                <Label>算法</Label>
                <Select
                  value={signAlgorithm}
                  onChange={(e) => setSignAlgorithm(e.target.value)}
                  options={[
                    { value: 'HS256', label: 'HS256 (HMAC-SHA256)' },
                    { value: 'HS384', label: 'HS384 (HMAC-SHA384)' },
                    { value: 'HS512', label: 'HS512 (HMAC-SHA512)' },
                    { value: 'RS256', label: 'RS256 (RSA-SHA256)' },
                  ]}
                />
              </div>

              {/* 密钥 */}
              <div>
                <Label>密钥</Label>
                <Input
                  type="password"
                  value={signSecret}
                  onChange={(e) => setSignSecret(e.target.value)}
                  placeholder="your-secret-key"
                />
              </div>

              {/* Payload 模式切换 */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!signJsonMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSignJsonMode(false)}
                >
                  表单模式
                </Button>
                <Button
                  type="button"
                  variant={signJsonMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSignJsonMode(true)}
                >
                  JSON 模式
                </Button>
              </div>

              {/* 表单模式 */}
              {!signJsonMode && (
                <div className="space-y-3">
                  <div>
                    <Label>iss (签发者)</Label>
                    <Input
                      value={signPayloadIss}
                      onChange={(e) => setSignPayloadIss(e.target.value)}
                      placeholder="my-app"
                    />
                  </div>
                  <div>
                    <Label>sub (主题)</Label>
                    <Input
                      value={signPayloadSub}
                      onChange={(e) => setSignPayloadSub(e.target.value)}
                      placeholder="user123"
                    />
                  </div>
                  <div>
                    <Label>exp (过期时间，秒)</Label>
                    <Input
                      type="number"
                      value={signPayloadExp}
                      onChange={(e) => setSignPayloadExp(e.target.value)}
                      placeholder="3600"
                    />
                  </div>

                  {/* 自定义字段 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>自定义字段</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                        <Plus className="h-4 w-4" />
                        添加
                      </Button>
                    </div>
                    {signCustomFields.map((field, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          placeholder="Key"
                          value={field.key}
                          onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                        />
                        <Input
                          placeholder="Value"
                          value={field.value}
                          onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomField(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* JSON 模式 */}
              {signJsonMode && (
                <div>
                  <Label>Payload (JSON)</Label>
                  <Textarea
                    value={signJsonPayload}
                    onChange={(e) => setSignJsonPayload(e.target.value)}
                    className="font-mono text-sm min-h-[200px]"
                    placeholder='{\n  "iss": "my-app",\n  "sub": "user123"\n}'
                  />
                </div>
              )}

              {/* 错误提示 */}
              {signError && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-sm text-destructive">
                  {signError}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button onClick={handleSign}>生成 JWT</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSignResult('')
                    setSignError('')
                  }}
                >
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 结果区域 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>结果</CardTitle>
                  <CardDescription>生成的 JWT Token</CardDescription>
                </div>
                {signResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(signResult)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? '已复制' : '复制'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {signResult ? (
                <div className="space-y-4">
                  <Textarea
                    value={signResult}
                    readOnly
                    className="font-mono text-sm min-h-[100px]"
                  />

                  <div>
                    <Label>解码预览</Label>
                    <div className="mt-2 max-h-[400px] overflow-auto">
                      <JsonTree
                        data={(() => {
                          try {
                            const parts = signResult.split('.')
                            if (parts.length === 3) {
                              const [, payloadB64] = parts
                              const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
                              const payload = JSON.parse(payloadJson)
                              return payload
                            }
                          } catch {
                            return null
                          }
                          return null
                        })()}
                        className="border-0"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-[400px] flex items-center justify-center border rounded-md border-dashed text-muted-foreground">
                  结果将显示在这里...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 验证 JWT */}
      {activeTab === 'verify' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>验证 Token</CardTitle>
              <CardDescription>输入 JWT Token 和密钥进行验证</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>JWT Token</Label>
                <Textarea
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="font-mono text-sm min-h-[120px]"
                />
              </div>

              <div>
                <Label>密钥</Label>
                <Input
                  type="password"
                  value={verifySecret}
                  onChange={(e) => setVerifySecret(e.target.value)}
                  placeholder="your-secret-key"
                />
              </div>

              <div>
                <Label>期望算法（可选）</Label>
                <Select
                  value={verifyAlgorithm}
                  onChange={(e) => setVerifyAlgorithm(e.target.value)}
                  options={[
                    { value: '', label: '任意' },
                    { value: 'HS256', label: 'HS256' },
                    { value: 'HS384', label: 'HS384' },
                    { value: 'HS512', label: 'HS512' },
                    { value: 'RS256', label: 'RS256' },
                  ]}
                />
              </div>

              <Button onClick={handleVerify}>验证</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>验证结果</CardTitle>
            </CardHeader>
            <CardContent>
              {verifyResult ? (
                <div className="space-y-4">
                  {verifyResult.valid ? (
                    <div className="p-4 bg-green-500/10 border border-green-500 rounded-md">
                      <p className="font-medium text-green-600">✓ Token 验证成功</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                      <p className="font-medium text-destructive">✗ Token 验证失败</p>
                      <p className="text-sm text-destructive/80 mt-1">{verifyResult.error}</p>
                    </div>
                  )}

                  {verifyResult.payload && (
                    <div>
                      <Label>Payload</Label>
                      <div className="mt-2 max-h-[400px] overflow-auto">
                        <JsonTree data={verifyResult.payload as Record<string, unknown>} className="border-0" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[400px] flex items-center justify-center border rounded-md border-dashed text-muted-foreground">
                  验证结果将显示在这里...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 解析 JWT */}
      {activeTab === 'decode' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>解析 Token</CardTitle>
              <CardDescription>输入 JWT Token 进行解析（不验证签名）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>JWT Token</Label>
                <Textarea
                  value={decodeToken}
                  onChange={(e) => setDecodeToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>

              {/* 错误提示 */}
              {decodeError && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-sm text-destructive">
                  {decodeError}
                </div>
              )}

              <Button onClick={handleDecode}>解析</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>解析结果</CardTitle>
            </CardHeader>
            <CardContent>
              {decodeResult ? (
                <div className="space-y-4">
                  <div>
                    <Label>Header</Label>
                    <div className="mt-2 max-h-[200px] overflow-auto border rounded-md p-3">
                      <JsonTree data={decodeResult.header} className="border-0" />
                    </div>
                  </div>

                  <div>
                    <Label>Payload</Label>
                    <div className="mt-2 max-h-[300px] overflow-auto border rounded-md p-3">
                      <JsonTree data={decodeResult.payload} className="border-0" />
                    </div>
                  </div>

                  <div>
                    <Label>Signature</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <code className="text-sm font-mono break-all">{decodeResult.signature}</code>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-[400px] flex items-center justify-center border rounded-md border-dashed text-muted-foreground">
                  解析结果将显示在这里...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 功能说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>生成 JWT</strong>: 使用多种算法（HS256/HS384/HS512/RS256）生成 JWT Token</p>
          <p>• <strong>验证 JWT</strong>: 验证 Token 签名和过期状态</p>
          <p>• <strong>解析 JWT</strong>: 解码并查看 Token 内容（不验证签名）</p>
          <p className="mt-4 text-xs">
            ⚠️ <strong>安全提示</strong>: 密钥仅在本地使用，不会上传到服务器。请妥善保管你的密钥。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
