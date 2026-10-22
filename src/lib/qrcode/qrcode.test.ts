import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import QRCode from 'qrcode'
import { generateQRCode, downloadQRCode, ERROR_CORRECTION_LEVELS, PRESET_SIZES } from './index'

// jsdom 无 canvas，mock 掉底层 qrcode 库的渲染
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}))

// toDataURL 声明带多个重载，mock 句柄统一按 Mock 处理
const mockedToDataURL = QRCode.toDataURL as unknown as Mock

describe('generateQRCode', () => {
  beforeEach(() => {
    mockedToDataURL.mockReset()
    mockedToDataURL.mockResolvedValue('data:image/png;base64,MOCK')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('空内容返回错误且不调用底层库', async () => {
    const result = await generateQRCode('')
    expect(result.success).toBe(false)
    expect(result.error).toBe('请输入要生成二维码的内容')
    expect(mockedToDataURL).not.toHaveBeenCalled()
  })

  it('纯空白内容返回错误', async () => {
    const result = await generateQRCode('   ')
    expect(result.success).toBe(false)
    expect(mockedToDataURL).not.toHaveBeenCalled()
  })

  it('正常生成并使用默认配置', async () => {
    const result = await generateQRCode('https://example.com')
    expect(result.success).toBe(true)
    expect(result.dataUrl).toBe('data:image/png;base64,MOCK')
    expect(mockedToDataURL).toHaveBeenCalledWith('https://example.com', {
      width: 300,
      margin: 4,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
  })

  it('自定义配置覆盖默认值', async () => {
    await generateQRCode('hello', {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#ff0000', light: '#00ff00' },
    })
    expect(mockedToDataURL).toHaveBeenCalledWith('hello', {
      width: 500,
      margin: 2,
      color: { dark: '#ff0000', light: '#00ff00' },
      errorCorrectionLevel: 'H',
    })
  })

  it('底层库抛错时返回失败结果', async () => {
    mockedToDataURL.mockRejectedValueOnce(new Error('渲染失败'))
    const result = await generateQRCode('hello')
    expect(result.success).toBe(false)
    expect(result.error).toBe('渲染失败')
  })
})

describe('downloadQRCode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('创建下载链接并触发点击', () => {
    const clickMock = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    const createSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tag: string) => {
        if (tag === 'a') {
          return { href: '', download: '', click: clickMock } as unknown as HTMLAnchorElement
        }
        return originalCreateElement(tag)
      }) as typeof document.createElement)

    downloadQRCode('data:image/png;base64,MOCK', 'qr.png')

    const anchor = createSpy.mock.results[0].value as unknown as HTMLAnchorElement
    expect(anchor.href).toBe('data:image/png;base64,MOCK')
    expect(anchor.download).toBe('qr.png')
    expect(clickMock).toHaveBeenCalledTimes(1)
  })

  it('未指定文件名时使用默认文件名', () => {
    const clickMock = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickMock } as unknown as HTMLAnchorElement
      }
      return originalCreateElement(tag)
    }) as typeof document.createElement)

    downloadQRCode('data:image/png;base64,MOCK')

    const anchor = clickMock.mock.instances[0] as HTMLAnchorElement
    expect(anchor.download).toBe('qrcode.png')
  })
})

describe('常量配置', () => {
  it('容错级别包含 L/M/Q/H 且带说明', () => {
    expect(ERROR_CORRECTION_LEVELS.map((l) => l.value)).toEqual(['L', 'M', 'Q', 'H'])
    expect(ERROR_CORRECTION_LEVELS.every((l) => l.label.length > 0)).toBe(true)
  })

  it('预设尺寸为常见正方形尺寸', () => {
    expect(PRESET_SIZES.map((s) => s.value)).toEqual([200, 300, 400, 500, 600])
  })
})
