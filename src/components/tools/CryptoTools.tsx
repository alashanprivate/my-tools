import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Select } from '@/components/ui/Select'
import { base64Encode, base64Decode, hash, aesEncrypt, aesDecrypt } from '@/lib/crypto'
import { sm3Hash, sm4Encrypt, sm4Decrypt, sm2GenerateKeyPair, sm2Sign, sm2VerifySignature, sm2Encrypt as sm2Enc, sm2Decrypt as sm2Dec, type SM2KeyPair } from '@/lib/gm'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export function CryptoTools() {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  // Base64 状态
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode')

  // 哈希状态
  const [hashAlgorithm, setHashAlgorithm] = useState('sha256')

  // AES 状态
  const [aesKey, setAesKey] = useState('')
  const [aesIv, setAesIv] = useState('')
  const [aesMode, setAesMode] = useState<'encrypt' | 'decrypt'>('encrypt')

  // SM3 状态
  const [sm3Input, setSm3Input] = useState('')
  const [sm3Output, setSm3Output] = useState('')

  // SM4 状态
  const [sm4Input, setSm4Input] = useState('')
  const [sm4Key, setSm4Key] = useState('')
  const [sm4KeyFormat, setSm4KeyFormat] = useState<'hex' | 'base64' | 'string'>('hex')
  const [sm4Mode, setSm4Mode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [sm4Output, setSm4Output] = useState('')
  const [sm4Error, setSm4Error] = useState('')

  // SM2 状态
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

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  // Base64 处理
  const handleBase64 = () => {
    if (!input.trim()) {
      setError('请输入文本')
      return
    }

    const result =
      base64Mode === 'encode' ? base64Encode(input) : base64Decode(input)

    if (result.success) {
      setOutput(result.result || '')
      setError('')
    } else {
      setError(result.error || '操作失败')
      setOutput('')
    }
  }

  // 哈希处理
  const handleHash = () => {
    if (!input.trim()) {
      setError('请输入文本')
      return
    }

    const result = hash(input, hashAlgorithm as any)

    if (result.success) {
      setOutput(result.result || '')
      setError('')
    } else {
      setError(result.error || '哈希计算失败')
      setOutput('')
    }
  }

  // AES 加密/解密
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

    const result =
      aesMode === 'encrypt'
        ? aesEncrypt(input, options)
        : aesDecrypt(input, options)

    if (result.success) {
      setOutput(result.result || '')
      setError('')
    } else {
      setError(result.error || '操作失败')
      setOutput('')
    }
  }

  // SM3 处理
  const handleSm3 = () => {
    try {
      const result = sm3Hash(sm3Input)
      setSm3Output(result)
      showToast('SM3 哈希计算成功', 'success')
    } catch (err) {
      showToast('SM3 哈希计算失败', 'error')
    }
  }

  // SM4 处理
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
      } catch (err) {
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
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      } catch (err) {
        setSm4Error('字符串密钥转换失败')
        return
      }
    }

    try {
      const result =
        sm4Mode === 'encrypt'
          ? sm4Encrypt(sm4Input, finalKey)
          : sm4Decrypt(sm4Input, finalKey)
      setSm4Output(result)
      setSm4Error('')
      showToast(sm4Mode === 'encrypt' ? 'SM4 加密成功' : 'SM4 解密成功', 'success')
    } catch (err) {
      setSm4Error(sm4Mode === 'encrypt' ? 'SM4 加密失败' : 'SM4 解密失败，请检查密钥')
      setSm4Output('')
      showToast('操作失败', 'error')
    }
  }

  // SM2 密钥生成
  const handleSm2KeyGen = () => {
    try {
      const keyPair = sm2GenerateKeyPair()
      setSm2KeyPair(keyPair)
      showToast('SM2 密钥对生成成功', 'success')
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
        sm2EncMode === 'encrypt'
          ? sm2Enc(sm2EncInput, sm2EncKey)
          : sm2Dec(sm2EncInput, sm2EncKey)
      setSm2EncOutput(result)
      setSm2EncError('')
      showToast(sm2EncMode === 'encrypt' ? 'SM2 加密成功' : 'SM2 解密成功', 'success')
    } catch (err) {
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
        <h1 className="text-4xl font-bold mb-2">加解密工具</h1>
        <p className="text-muted-foreground">
          Base64 编码、哈希计算、AES 加密、国密 SM 系列算法
        </p>
      </div>

      <Tabs defaultValue={tabParam === 'sm2' || tabParam === 'sm3' || tabParam === 'sm4' ? 'gm' : (tabParam || 'base64')} className="space-y-6">
        <TabsList className="inline-flex gap-1">
          <TabsTrigger value="base64">Base64</TabsTrigger>
          <TabsTrigger value="hash">哈希</TabsTrigger>
          <TabsTrigger value="aes">AES</TabsTrigger>
          <TabsTrigger value="gm">国密算法</TabsTrigger>
        </TabsList>

        {/* Base64 标签页 */}
        <TabsContent value="base64">
          <Card>
            <CardHeader>
              <CardTitle>Base64 编码/解码</CardTitle>
              <CardDescription>
                将文本转换为 Base64 编码，或解码 Base64 文本
              </CardDescription>
            </CardHeader>
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
                <Button onClick={handleBase64}>
                  {base64Mode === 'encode' ? '编码' : '解码'}
                </Button>
                <Button onClick={handleClear} variant="outline">
                  清空
                </Button>
                {output && (
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="ml-auto gap-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
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
        </TabsContent>

        {/* 哈希标签页 */}
        <TabsContent value="hash">
          <Card>
            <CardHeader>
              <CardTitle>哈希计算</CardTitle>
              <CardDescription>
                计算文本的 MD5、SHA-1、SHA-256、SHA-512 哈希值
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="哈希算法"
                value={hashAlgorithm}
                onChange={(e) => setHashAlgorithm(e.target.value)}
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
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="ml-auto gap-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
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
        </TabsContent>

        {/* AES 标签页 */}
        <TabsContent value="aes">
          <Card>
            <CardHeader>
              <CardTitle>AES 加密/解密</CardTitle>
              <CardDescription>
                使用 AES 算法进行对称加密和解密
              </CardDescription>
            </CardHeader>
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
                <Button onClick={handleAes}>
                  {aesMode === 'encrypt' ? '加密' : '解密'}
                </Button>
                <Button onClick={handleClear} variant="outline">
                  清空
                </Button>
                {output && (
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="ml-auto gap-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
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
        </TabsContent>

        {/* 国密算法标签页 */}
        <TabsContent value="gm">
          <Card>
            <CardHeader>
              <CardTitle>国密SM系列算法</CardTitle>
              <CardDescription>
                SM2 椭圆曲线公钥密码、SM3 密码杂凑算法、SM4 分组密码算法
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={tabParam === 'sm2' || tabParam === 'sm3' || tabParam === 'sm4' ? tabParam : 'sm3'} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sm3">SM3</TabsTrigger>
                  <TabsTrigger value="sm4">SM4</TabsTrigger>
                  <TabsTrigger value="sm2">SM2</TabsTrigger>
                </TabsList>

                {/* SM3 标签页 */}
                <TabsContent value="sm3">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">SM3 密码杂凑算法</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      计算文本的 SM3 哈希值（256位）
                    </p>

                    <Textarea
                      placeholder="输入要计算 SM3 哈希的文本"
                      value={sm3Input}
                      onChange={(e) => setSm3Input(e.target.value)}
                      className="min-h-[150px] font-mono text-sm"
                    />

                    <div className="flex gap-2">
                      <Button onClick={handleSm3}>计算 SM3 哈希</Button>
                      <Button
                        onClick={() => {
                          setSm3Input('')
                          setSm3Output('')
                        }}
                        variant="outline"
                      >
                        清空
                      </Button>
                      {sm3Output && (
                        <Button
                          onClick={() => copyToClipboard(sm3Output, '已复制到剪贴板')}
                          variant="outline"
                          className="ml-auto gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          复制
                        </Button>
                      )}
                    </div>

                    {sm3Output && (
                      <Textarea
                        value={sm3Output}
                        readOnly
                        placeholder="SM3 哈希值将显示在这里..."
                        className="min-h-[100px] font-mono text-sm"
                      />
                    )}
                  </div>
                </TabsContent>

                {/* SM4 标签页 */}
                <TabsContent value="sm4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">SM4 对称加密/解密</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      使用 SM4 分组密码算法进行对称加密和解密（16字节密钥）
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant={sm4Mode === 'encrypt' ? 'default' : 'outline'}
                        onClick={() => setSm4Mode('encrypt')}
                      >
                        加密
                      </Button>
                      <Button
                        variant={sm4Mode === 'decrypt' ? 'default' : 'outline'}
                        onClick={() => setSm4Mode('decrypt')}
                      >
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
                        sm4KeyFormat === 'hex' ? '32位十六进制' :
                        sm4KeyFormat === 'base64' ? 'Base64字符串' :
                        '字符串'
                      }）`}
                      placeholder={
                        sm4KeyFormat === 'hex' ? '例如: 0123456789abcdeffedcba9876543210' :
                        sm4KeyFormat === 'base64' ? '例如: ASNFZ4mrze/+3LqYdlQyEA==' :
                        '例如: MySecretPassword123'
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
                      <Button onClick={handleSm4}>
                        {sm4Mode === 'encrypt' ? '加密' : '解密'}
                      </Button>
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
                  </div>
                </TabsContent>

                {/* SM2 标签页 */}
                <TabsContent value="sm2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">SM2 椭圆曲线公钥密码算法</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      密钥生成、数字签名、加密解密（非对称加密）
                    </p>

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
                          <Button
                            onClick={() => setSm2KeyPair(null)}
                            variant="outline"
                          >
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
                            <Textarea
                              value={sm2SignResult}
                              readOnly
                              className="min-h-[80px] font-mono text-xs"
                            />
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
                          <Button
                            onClick={() => setSm2VerifyResult(null)}
                            variant="outline"
                          >
                            清空结果
                          </Button>
                        </div>

                        {sm2VerifyResult !== null && (
                          <div className={`p-4 rounded-lg ${sm2VerifyResult ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'}`}>
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
                          <label className="text-sm font-medium">
                            {sm2EncMode === 'encrypt' ? '明文' : '密文'}
                          </label>
                          <Textarea
                            placeholder={sm2EncMode === 'encrypt' ? '输入要加密的明文' : '输入要解密的密文'}
                            value={sm2EncInput}
                            onChange={(e) => setSm2EncInput(e.target.value)}
                            className="min-h-[150px] font-mono text-sm"
                            error={sm2EncError}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleSm2Enc}>
                            {sm2EncMode === 'encrypt' ? '加密' : '解密'}
                          </Button>
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
                            <label className="text-sm font-medium">
                              {sm2EncMode === 'encrypt' ? '密文' : '明文'}
                            </label>
                            <Textarea
                              value={sm2EncOutput}
                              readOnly
                              className="min-h-[150px] font-mono text-sm"
                            />
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 安全提示 */}
      <Card className="mt-8 border-yellow-200 dark:border-yellow-900">
        <CardHeader>
          <CardTitle className="text-yellow-700 dark:text-yellow-500">
            ⚠️ 安全提示
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • 所有加解密操作在本地浏览器中完成，数据不会上传到服务器
          </p>
          <p>• 这些工具仅供学习和开发使用，不建议用于生产环境</p>
          <p>
            • AES 加密默认使用 CBC 模式，建议使用 16/24/32 位长度的密钥以获得更好的安全性
          </p>
          <p>• SM4 密钥必须为 32 位十六进制字符（16 字节）</p>
          <p>
            • SM2 公钥为 130 位十六进制字符（04 开头），私钥为 64 位十六进制字符
          </p>
          <p>• 请妥善保管你的密钥，密钥一旦丢失将无法解密数据</p>
        </CardContent>
      </Card>
    </div>
  )
}
