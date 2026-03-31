import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { generateQRCode, downloadQRCode, ERROR_CORRECTION_LEVELS, PRESET_SIZES } from '@/lib/qrcode'
import { Download, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type InputType = 'text' | 'url' | 'phone' | 'email'

export function QRCodeTool() {
  const [inputType, setInputType] = useState<InputType>('text')
  const [textContent, setTextContent] = useState('')
  const [urlContent, setUrlContent] = useState('')
  const [phoneContent, setPhoneContent] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [subjectContent, setSubjectContent] = useState('')
  const [qrSize, setQrSize] = useState(300)
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [darkColor, setDarkColor] = useState('#000000')
  const [lightColor, setLightColor] = useState('#ffffff')
  const [qrCodeData, setQrCodeData] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { showToast } = useToast()

  // 获取要生成二维码的内容
  const getQRContent = (): string => {
    switch (inputType) {
      case 'text':
        return textContent
      case 'url':
        return urlContent
      case 'phone':
        return `tel:${phoneContent}`
      case 'email':
        return subjectContent
          ? `mailto:${emailContent}?subject=${encodeURIComponent(subjectContent)}`
          : `mailto:${emailContent}`
      default:
        return ''
    }
  }

  // 生成二维码
  const handleGenerate = async () => {
    const content = getQRContent()

    if (!content.trim()) {
      showToast('请输入要生成二维码的内容', 'error')
      return
    }

    setIsGenerating(true)

    const result = await generateQRCode(content, {
      width: qrSize,
      margin: 4,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: errorLevel,
    })

    setIsGenerating(false)

    if (result.success && result.dataUrl) {
      setQrCodeData(result.dataUrl)
      showToast('二维码生成成功', 'success')
    } else {
      showToast(result.error || '生成失败', 'error')
      setQrCodeData('')
    }
  }

  // 下载二维码
  const handleDownload = () => {
    if (!qrCodeData) {
      showToast('请先生成二维码', 'error')
      return
    }

    try {
      downloadQRCode(qrCodeData, `qrcode-${Date.now()}.png`)
      showToast('下载成功', 'success')
    } catch {
      showToast('下载失败', 'error')
    }
  }

  // 清空内容
  const handleClear = () => {
    setTextContent('')
    setUrlContent('')
    setPhoneContent('')
    setEmailContent('')
    setSubjectContent('')
    setQrCodeData('')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">二维码生成工具</h1>
        <p className="text-muted-foreground">
          支持文本、网址、电话、邮箱等多种内容类型的二维码生成
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle>内容输入</CardTitle>
            <CardDescription>选择类型并输入要生成二维码的内容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 类型选择 */}
            <div>
              <Label>二维码类型</Label>
              <Select
                value={inputType}
                onChange={(e) => setInputType(e.target.value as InputType)}
                options={[
                  { value: 'text', label: '文本' },
                  { value: 'url', label: '网址链接' },
                  { value: 'phone', label: '电话号码' },
                  { value: 'email', label: '电子邮件' },
                ]}
              />
            </div>

            {/* 文本输入 */}
            {inputType === 'text' && (
              <div>
                <Label>文本内容</Label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="请输入文本内容..."
                  className="min-h-[120px]"
                />
              </div>
            )}

            {/* 网址输入 */}
            {inputType === 'url' && (
              <div>
                <Label>网址链接</Label>
                <Input
                  type="url"
                  value={urlContent}
                  onChange={(e) => setUrlContent(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            )}

            {/* 电话输入 */}
            {inputType === 'phone' && (
              <div>
                <Label>电话号码</Label>
                <Input
                  type="tel"
                  value={phoneContent}
                  onChange={(e) => setPhoneContent(e.target.value)}
                  placeholder="13800138000"
                />
              </div>
            )}

            {/* 邮箱输入 */}
            {inputType === 'email' && (
              <div className="space-y-4">
                <div>
                  <Label>邮箱地址</Label>
                  <Input
                    type="email"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <Label>邮件主题（可选）</Label>
                  <Input
                    type="text"
                    value={subjectContent}
                    onChange={(e) => setSubjectContent(e.target.value)}
                    placeholder="邮件主题"
                  />
                </div>
              </div>
            )}

            {/* 样式配置 */}
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>二维码尺寸</Label>
                  <Select
                    value={qrSize.toString()}
                    onChange={(e) => setQrSize(parseInt(e.target.value))}
                    options={PRESET_SIZES.map(size => ({
                      value: size.value.toString(),
                      label: size.label,
                    }))}
                  />
                </div>

                <div>
                  <Label>容错级别</Label>
                  <Select
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as any)}
                    options={ERROR_CORRECTION_LEVELS.map(level => ({
                      value: level.value,
                      label: level.label,
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>前景色</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>背景色</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? '生成中...' : '生成二维码'}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
              >
                清空
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 预览区域 */}
        <Card>
          <CardHeader>
            <CardTitle>二维码预览</CardTitle>
            <CardDescription>生成的二维码将显示在这里</CardDescription>
          </CardHeader>
          <CardContent>
            {qrCodeData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center p-8 bg-white rounded-lg border">
                  <img
                    src={qrCodeData}
                    alt="QR Code"
                    className="max-w-full h-auto"
                    style={{ maxWidth: `${qrSize}px` }}
                  />
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  尺寸: {qrSize} x {qrSize} 像素
                </div>

                <Button
                  onClick={handleDownload}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载二维码
                </Button>

                <div className="p-4 bg-muted rounded-md">
                  <div className="text-sm font-medium mb-2">容错级别说明</div>
                  <div className="text-xs text-muted-foreground">
                    {ERROR_CORRECTION_LEVELS.find(l => l.value === errorLevel)?.description}
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-[500px] flex items-center justify-center border rounded-md border-dashed">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>二维码将显示在这里...</p>
                  <p className="text-sm mt-2">请输入内容并点击生成按钮</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 功能说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>文本二维码</strong>: 将任意文本内容生成二维码，扫描后显示文本</p>
          <p>• <strong>网址链接</strong>: 生成网址二维码，扫描后自动打开浏览器访问</p>
          <p>• <strong>电话号码</strong>: 生成电话二维码，扫描后自动拨号</p>
          <p>• <strong>电子邮件</strong>: 生成邮箱二维码，扫描后自动打开邮件应用</p>
          <p>• <strong>自定义样式</strong>: 支持调整尺寸、颜色和容错级别</p>
          <p>• <strong>容错级别</strong>: 级别越高，二维码越复杂但抗损能力越强</p>
          <p className="mt-4 text-xs">
            💡 <strong>提示</strong>: 推荐使用中等级别(M)容错，兼顾二维码复杂度和可靠性
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
