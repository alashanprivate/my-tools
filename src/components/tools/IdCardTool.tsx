import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { RegionSelector } from '@/components/ui/RegionSelector'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { generateMultipleIdCards, validateIdCard } from '@/lib/idCard'
import type { IdCardInfo } from '@/lib/idCard'

export function IdCardTool() {
  const [tab, setTab] = useState<'generate' | 'validate'>('generate')
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  // 生成身份证号状态
  const [generateGender, setGenerateGender] = useState<'male' | 'female' | 'random'>('random')
  const [generateMinAge, setGenerateMinAge] = useState('18')
  const [generateMaxAge, setGenerateMaxAge] = useState('70')
  const [generateCount, setGenerateCount] = useState('1')
  const [generateRegionCode, setGenerateRegionCode] = useState('')
  const [generatedResults, setGeneratedResults] = useState<IdCardInfo[]>([])

  // 验证身份证号状态
  const [validateInput, setValidateInput] = useState('')
  const [validateResult, setValidateResult] = useState<IdCardInfo | null>(null)
  const [validateError, setValidateError] = useState('')

  // 生成身份证号
  const handleGenerate = () => {
    const count = parseInt(generateCount)
    if (isNaN(count) || count < 1 || count > 100) {
      showToast('生成数量必须在1-100之间', 'error')
      return
    }

    const minAge = parseInt(generateMinAge)
    const maxAge = parseInt(generateMaxAge)

    if (isNaN(minAge) || isNaN(maxAge) || minAge < 0 || maxAge < minAge) {
      showToast('年龄范围无效', 'error')
      return
    }

    const results = generateMultipleIdCards(count, {
      gender: generateGender,
      minAge,
      maxAge,
      regionCode: generateRegionCode || undefined,
    })

    setGeneratedResults(results)
    showToast(`成功生成 ${count} 个身份证号`, 'success')
  }

  // 验证身份证号
  const handleValidate = () => {
    if (!validateInput.trim()) {
      showToast('请输入身份证号', 'error')
      return
    }

    const result = validateIdCard(validateInput.trim())

    if (result.success) {
      setValidateResult(result.info)
      setValidateError('')
      showToast('身份证号验证通过', 'success')
    } else {
      setValidateResult(null)
      setValidateError(result.error)
      showToast(`验证失败: ${result.error}`, 'error')
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

  // 清空生成结果
  const handleClearGenerated = () => {
    setGeneratedResults([])
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">身份证号工具</h1>
        <p className="text-muted-foreground">
          随机生成和验证中国身份证号码
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === 'generate' ? 'default' : 'outline'}
          onClick={() => setTab('generate')}
        >
          生成身份证号
        </Button>
        <Button
          variant={tab === 'validate' ? 'default' : 'outline'}
          onClick={() => setTab('validate')}
        >
          验证身份证号
        </Button>
      </div>

      {/* 生成身份证号 */}
      {tab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 配置区域 */}
          <Card>
            <CardHeader>
              <CardTitle>配置</CardTitle>
              <CardDescription>设置生成参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>性别</Label>
                <Select
                  value={generateGender}
                  onChange={(e) => setGenerateGender(e.target.value as any)}
                  options={[
                    { value: 'random', label: '随机' },
                    { value: 'male', label: '男性' },
                    { value: 'female', label: '女性' },
                  ]}
                />
              </div>

              <div>
                <Label>最小年龄</Label>
                <Input
                  type="number"
                  value={generateMinAge}
                  onChange={(e) => setGenerateMinAge(e.target.value)}
                  placeholder="18"
                  min="0"
                  max="120"
                />
              </div>

              <div>
                <Label>最大年龄</Label>
                <Input
                  type="number"
                  value={generateMaxAge}
                  onChange={(e) => setGenerateMaxAge(e.target.value)}
                  placeholder="70"
                  min="0"
                  max="120"
                />
              </div>

              <div>
                <Label>生成数量</Label>
                <Input
                  type="number"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(e.target.value)}
                  placeholder="1"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <Label>地区（可选）</Label>
                <RegionSelector
                  value={generateRegionCode}
                  onChange={setGenerateRegionCode}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleGenerate} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  生成
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearGenerated}
                >
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 结果区域 */}
          <Card>
            <CardHeader>
              <CardTitle>结果</CardTitle>
              <CardDescription>生成的身份证号</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedResults.length > 0 ? (
                <div className="space-y-4">
                  <Textarea
                    value={generatedResults.map(r => r.idCard).join('\n')}
                    readOnly
                    className="font-mono text-sm min-h-[200px]"
                  />

                  <div className="text-sm text-muted-foreground">
                    共生成 {generatedResults.length} 个身份证号
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleCopy(generatedResults.map(r => r.idCard).join('\n'))}
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? '已复制' : '复制'}
                  </Button>

                  {/* 详细信息 */}
                  <div className="space-y-2 max-h-[300px] overflow-auto">
                    {generatedResults.map((info, index) => (
                      <div key={index} className="p-3 bg-muted rounded-md text-sm">
                        <div className="font-mono font-bold mb-2">{info.idCard}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>地区: {info.regionName}</div>
                          <div>出生日期: {info.birthDate}</div>
                          <div>年龄: {info.age} 岁</div>
                          <div>性别: {info.gender === 'male' ? '男' : '女'}</div>
                        </div>
                      </div>
                    ))}
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

      {/* 验证身份证号 */}
      {tab === 'validate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>验证</CardTitle>
              <CardDescription>输入身份证号进行验证</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>身份证号</Label>
                <Textarea
                  value={validateInput}
                  onChange={(e) => setValidateInput(e.target.value)}
                  placeholder="请输入18位身份证号"
                  className="font-mono text-sm min-h-[120px]"
                />
              </div>

              <Button onClick={handleValidate}>验证</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>验证结果</CardTitle>
            </CardHeader>
            <CardContent>
              {validateResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500 rounded-md">
                    <p className="font-medium text-green-600">✓ 身份证号有效</p>
                  </div>

                  <div className="p-4 bg-muted rounded-md">
                    <div className="font-mono text-lg font-bold mb-4">{validateResult.idCard}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">地区</div>
                        <div className="font-medium">{validateResult.regionName}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">出生日期</div>
                        <div className="font-medium">{validateResult.birthDate}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">年龄</div>
                        <div className="font-medium">{validateResult.age} 岁</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">性别</div>
                        <div className="font-medium">{validateResult.gender === 'male' ? '男' : '女'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">顺序码</div>
                        <div className="font-mono font-medium">{validateResult.sequenceCode}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">校验码</div>
                        <div className="font-mono font-medium">{validateResult.checkCode}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : validateError ? (
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                    <p className="font-medium text-destructive">✗ 身份证号无效</p>
                    <p className="text-sm text-destructive/80 mt-1">{validateError}</p>
                  </div>
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

      {/* 功能说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>生成身份证号</strong>: 随机生成符合规则的中国身份证号码，支持设置性别、年龄范围和地区</p>
          <p>• <strong>地区选择</strong>: 可以指定省市区县，不选择则随机生成全国任意地区的身份证号</p>
          <p>• <strong>验证身份证号</strong>: 验证身份证号码的格式和校验码是否正确</p>
          <p>• <strong>信息解析</strong>: 显示身份证号包含的地区、出生日期、年龄和性别等信息</p>
          <p className="mt-4 text-xs">
            ⚠️ <strong>免责声明</strong>: 本工具生成的身份证号仅供测试和开发使用，请勿用于非法用途。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
