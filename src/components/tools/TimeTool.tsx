import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import {
  timestampToDatetime,
  datetimeToTimestamp,
  getCurrentTimestamp,
  convertTimeZone,
  calculateDateFromDate,
  dateDiff,
  TIME_ZONES,
} from '@/lib/time'
import { Copy, Check, Clock, Calendar, Calculator, Globe } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type Tab = 'timestamp' | 'timezone' | 'diff' | 'calculate'

export function TimeTool() {
  const [tab, setTab] = useState<Tab>('timestamp')
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  // 时间戳转换状态
  const [timestampInput, setTimestampInput] = useState('')
  const [datetimeInput, setDatetimeInput] = useState('')
  const [currentTimestamp, setCurrentTimestamp] = useState(0)

  // 时区换算状态
  const [timezoneTimestamp, setTimezoneTimestamp] = useState('')
  const [fromTimezone, setFromTimezone] = useState('UTC')
  const [toTimezone, setToTimezone] = useState('Asia/Shanghai')
  const [timezoneResult, setTimezoneResult] = useState('')

  // 日期差值状态
  const [date1, setDate1] = useState('')
  const [date2, setDate2] = useState('')
  const [diffResult, setDiffResult] = useState('')

  // 日期计算状态
  const [calcStartDate, setCalcStartDate] = useState('')
  const [calcValue, setCalcValue] = useState('1')
  const [calcUnit, setCalcUnit] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const [calcOperation, setCalcOperation] = useState<'add' | 'subtract'>('add')
  const [calcResult, setCalcResult] = useState('')

  // 更新当前时间戳
  useEffect(() => {
    const updateTimestamp = () => {
      setCurrentTimestamp(getCurrentTimestamp())
    }
    updateTimestamp()
    const interval = setInterval(updateTimestamp, 1000)
    return () => clearInterval(interval)
  }, [])

  // 时间戳转换为日期时间
  const handleTimestampToDatetime = () => {
    if (!timestampInput.trim()) {
      showToast('请输入时间戳', 'error')
      return
    }

    const timestamp = parseInt(timestampInput.trim())
    if (isNaN(timestamp)) {
      showToast('时间戳格式错误', 'error')
      return
    }

    const result = timestampToDatetime(timestamp)
    setDatetimeInput(result.datetime)
    showToast('转换成功', 'success')
  }

  // 日期时间转换为时间戳
  const handleDatetimeToTimestamp = () => {
    if (!datetimeInput.trim()) {
      showToast('请输入日期时间', 'error')
      return
    }

    try {
      const timestamp = datetimeToTimestamp(datetimeInput)
      setTimestampInput(timestamp.toString())
      showToast('转换成功', 'success')
    } catch {
      showToast('日期时间格式错误', 'error')
    }
  }

  // 使用当前时间戳
  const handleUseCurrentTimestamp = () => {
    setTimestampInput(getCurrentTimestamp().toString())
    const result = timestampToDatetime(getCurrentTimestamp())
    setDatetimeInput(result.datetime)
  }

  // 时区换算
  const handleTimezoneConvert = () => {
    if (!timezoneTimestamp.trim()) {
      showToast('请输入时间戳', 'error')
      return
    }

    const timestamp = parseInt(timezoneTimestamp.trim())
    if (isNaN(timestamp)) {
      showToast('时间戳格式错误', 'error')
      return
    }

    const result = convertTimeZone(timestamp, fromTimezone, toTimezone)
    setTimezoneResult(result.datetime)
    showToast('换算成功', 'success')
  }

  // 日期差值计算
  const handleDateDiff = () => {
    if (!date1.trim() || !date2.trim()) {
      showToast('请输入两个日期', 'error')
      return
    }

    try {
      const result = dateDiff(date1, date2)
      const resultText = [
        `总天数: ${result.totalDays} 天`,
        `总小时: ${result.totalHours} 小时`,
        `总分钟: ${result.totalMinutes} 分钟`,
        `总秒数: ${result.totalSeconds} 秒`,
        ``,
        `自然时间:`,
        `${result.days} 天 ${result.hours} 小时 ${result.minutes} 分 ${result.seconds} 秒`,
      ].join('\n')
      setDiffResult(resultText)
      showToast('计算成功', 'success')
    } catch {
      showToast('日期格式错误', 'error')
    }
  }

  // 日期计算
  const handleDateCalculate = () => {
    const startDate = calcStartDate.trim() || new Date().toISOString().substring(0, 10) + ' 00:00:00'
    const value = parseInt(calcValue)

    if (isNaN(value) || value < 0) {
      showToast('请输入有效的数值', 'error')
      return
    }

    try {
      const result = calculateDateFromDate(startDate, {
        value,
        unit: calcUnit,
        operation: calcOperation,
      })
      setCalcResult(result)
      showToast('计算成功', 'success')
    } catch {
      showToast('计算失败', 'error')
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">时间计算工具</h1>
        <p className="text-muted-foreground">
          时间戳转换、时区换算、日期计算和差值计算
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={tab === 'timestamp' ? 'default' : 'outline'}
          onClick={() => setTab('timestamp')}
        >
          <Clock className="h-4 w-4 mr-2" />
          时间戳转换
        </Button>
        <Button
          variant={tab === 'timezone' ? 'default' : 'outline'}
          onClick={() => setTab('timezone')}
        >
          <Globe className="h-4 w-4 mr-2" />
          时区换算
        </Button>
        <Button
          variant={tab === 'diff' ? 'default' : 'outline'}
          onClick={() => setTab('diff')}
        >
          <Calculator className="h-4 w-4 mr-2" />
          日期差值
        </Button>
        <Button
          variant={tab === 'calculate' ? 'default' : 'outline'}
          onClick={() => setTab('calculate')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          日期计算
        </Button>
      </div>

      {/* 时间戳转换 */}
      {tab === 'timestamp' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>时间戳转日期时间</CardTitle>
              <CardDescription>输入时间戳（秒）转换为可读时间</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>时间戳（秒）</Label>
                <Input
                  type="number"
                  value={timestampInput}
                  onChange={(e) => setTimestampInput(e.target.value)}
                  placeholder="例如: 1672531200"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleTimestampToDatetime} className="flex-1">
                  转换为日期时间
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUseCurrentTimestamp}
                >
                  使用当前时间
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-md">
                <div className="text-sm text-muted-foreground mb-2">当前时间戳</div>
                <div className="font-mono text-lg">{currentTimestamp}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>日期时间转时间戳</CardTitle>
              <CardDescription>输入日期时间转换为时间戳</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>日期时间</Label>
                <Input
                  type="datetime-local"
                  value={datetimeInput}
                  onChange={(e) => setDatetimeInput(e.target.value)}
                  step="1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  格式: YYYY-MM-DD HH:mm:ss
                </p>
              </div>

              <Button onClick={handleDatetimeToTimestamp} className="w-full">
                转换为时间戳
              </Button>

              {timestampInput && (
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground mb-2">时间戳</div>
                  <div className="font-mono text-lg">{timestampInput}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 时区换算 */}
      {tab === 'timezone' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>时区换算</CardTitle>
              <CardDescription>将时间戳从一个时区转换为另一个时区</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>时间戳（秒）</Label>
                <Input
                  type="number"
                  value={timezoneTimestamp}
                  onChange={(e) => setTimezoneTimestamp(e.target.value)}
                  placeholder="例如: 1672531200"
                />
              </div>

              <div>
                <Label>源时区</Label>
                <Select
                  value={fromTimezone}
                  onChange={(e) => setFromTimezone(e.target.value)}
                  options={TIME_ZONES.map(tz => ({
                    value: tz.value,
                    label: tz.label,
                  }))}
                />
              </div>

              <div>
                <Label>目标时区</Label>
                <Select
                  value={toTimezone}
                  onChange={(e) => setToTimezone(e.target.value)}
                  options={TIME_ZONES.map(tz => ({
                    value: tz.value,
                    label: tz.label,
                  }))}
                />
              </div>

              <Button onClick={handleTimezoneConvert} className="w-full">
                转换时区
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>转换结果</CardTitle>
            </CardHeader>
            <CardContent>
              {timezoneResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground mb-2">目标时区时间</div>
                    <div className="font-mono text-lg">{timezoneResult}</div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    从 {fromTimezone} 转换为 {toTimezone}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleCopy(timezoneResult)}
                    className="w-full"
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? '已复制' : '复制结果'}
                  </Button>
                </div>
              ) : (
                <div className="min-h-[200px] flex items-center justify-center border rounded-md border-dashed text-muted-foreground">
                  转换结果将显示在这里...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 日期差值 */}
      {tab === 'diff' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>日期差值计算</CardTitle>
              <CardDescription>计算两个日期之间的时间差</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>开始日期时间</Label>
                <Input
                  type="datetime-local"
                  value={date1}
                  onChange={(e) => setDate1(e.target.value)}
                  step="1"
                />
              </div>

              <div>
                <Label>结束日期时间</Label>
                <Input
                  type="datetime-local"
                  value={date2}
                  onChange={(e) => setDate2(e.target.value)}
                  step="1"
                />
              </div>

              <Button onClick={handleDateDiff} className="w-full">
                计算差值
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>计算结果</CardTitle>
            </CardHeader>
            <CardContent>
              {diffResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-md whitespace-pre-line font-mono text-sm">
                    {diffResult}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleCopy(diffResult)}
                    className="w-full"
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? '已复制' : '复制结果'}
                  </Button>
                </div>
              ) : (
                <div className="min-h-[200px] flex items-center justify-center border rounded-md border-dashed text-muted-foreground">
                  计算结果将显示在这里...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 日期计算 */}
      {tab === 'calculate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>日期加减计算</CardTitle>
              <CardDescription>从指定日期开始进行时间推算</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>起始日期时间（可选）</Label>
                <Input
                  type="datetime-local"
                  value={calcStartDate}
                  onChange={(e) => setCalcStartDate(e.target.value)}
                  step="1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  留空则使用当前时间
                </p>
              </div>

              <div>
                <Label>操作</Label>
                <Select
                  value={calcOperation}
                  onChange={(e) => setCalcOperation(e.target.value as 'add' | 'subtract')}
                  options={[
                    { value: 'add', label: '加（未来）' },
                    { value: 'subtract', label: '减（过去）' },
                  ]}
                />
              </div>

              <div>
                <Label>数值</Label>
                <Input
                  type="number"
                  value={calcValue}
                  onChange={(e) => setCalcValue(e.target.value)}
                  placeholder="例如: 7"
                  min="0"
                />
              </div>

              <div>
                <Label>单位</Label>
                <Select
                  value={calcUnit}
                  onChange={(e) => setCalcUnit(e.target.value as any)}
                  options={[
                    { value: 'day', label: '天' },
                    { value: 'week', label: '周' },
                    { value: 'month', label: '月' },
                    { value: 'year', label: '年' },
                  ]}
                />
              </div>

              <Button onClick={handleDateCalculate} className="w-full">
                计算
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>计算结果</CardTitle>
            </CardHeader>
            <CardContent>
              {calcResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground mb-2">结果日期时间</div>
                    <div className="font-mono text-lg">{calcResult}</div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleCopy(calcResult)}
                    className="w-full"
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? '已复制' : '复制结果'}
                  </Button>
                </div>
              ) : (
                <div className="min-h-[200px] flex items-center justify-center border rounded-md border-dashed text-muted-foreground">
                  计算结果将显示在这里...
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
          <p>• <strong>时间戳转换</strong>: Unix时间戳（秒）与日期时间格式之间的相互转换</p>
          <p>• <strong>时区换算</strong>: 将时间戳从一个时区转换为另一个时区的时间</p>
          <p>• <strong>日期差值</strong>: 计算两个日期时间之间的差值，支持天、小时、分钟、秒等多种单位</p>
          <p>• <strong>日期计算</strong>: 从指定日期开始进行加减运算，支持天、周、月、年等单位</p>
          <p className="mt-4 text-xs">
            💡 <strong>提示</strong>: 时间戳是从1970-01-01 00:00:00 UTC开始的秒数
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
