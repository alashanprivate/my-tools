import { Label } from './Label'
import { Select } from './Select'
import { REGION_DATA } from '@/lib/idCard/regionData'

interface RegionSelectorProps {
  value?: string
  onChange: (regionCode: string) => void
  disabled?: boolean
}

/**
 * 三级联动地区选择器（省 → 市 → 区县）
 */
export function RegionSelector({ value, onChange, disabled = false }: RegionSelectorProps) {
  // 解析当前选择的省市区
  const parseRegionCode = (code: string | undefined) => {
    if (!code || code.length < 6) {
      return { provinceCode: '', cityCode: '', districtCode: '' }
    }
    return {
      provinceCode: code.substring(0, 2),
      cityCode: code.substring(2, 4),
      districtCode: code.substring(4, 6),
    }
  }

  const { provinceCode, cityCode, districtCode } = parseRegionCode(value)

  // 获取选中的省份数据
  const selectedProvince = REGION_DATA.find((p) => p.code === provinceCode)

  // 获取选中的城市数据
  const selectedCity = selectedProvince?.children?.find((c) => c.code.substring(2, 4) === cityCode)

  // 处理省份变化
  const handleProvinceChange = (newProvinceCode: string) => {
    if (newProvinceCode === '') {
      onChange('')
      return
    }

    const province = REGION_DATA.find((p) => p.code === newProvinceCode)
    if (!province) return

    // 自动选择该省份的第一个城市的第一个区县
    if (province.children && province.children.length > 0) {
      const firstCity = province.children[0]
      if (firstCity.children && firstCity.children.length > 0) {
        onChange(firstCity.children[0].code)
        return
      }
      // 如果没有区县，使用城市代码后补00
      onChange(firstCity.code.padEnd(6, '0'))
      return
    }

    // 如果没有城市，使用省份代码后补0000
    onChange(newProvinceCode.padEnd(6, '0'))
  }

  // 处理城市变化
  const handleCityChange = (newCityCode: string) => {
    if (!selectedProvince) return

    if (newCityCode === '') {
      // 如果清空城市，重置为省份的第一个选择
      handleProvinceChange(provinceCode)
      return
    }

    const city = selectedProvince.children?.find((c) => c.code.substring(2, 4) === newCityCode)
    if (!city) return

    // 自动选择该城市的第一个区县
    if (city.children && city.children.length > 0) {
      onChange(city.children[0].code)
      return
    }

    // 如果没有区县，使用城市代码后补00
    onChange(city.code.padEnd(6, '0'))
  }

  // 处理区县变化
  const handleDistrictChange = (newDistrictCode: string) => {
    if (!selectedCity) return

    if (newDistrictCode === '') {
      // 如果清空区县，重置为城市的第一个选择
      handleCityChange(cityCode)
      return
    }

    const district = selectedCity.children?.find((d) => d.code.substring(4, 6) === newDistrictCode)
    if (district) {
      onChange(district.code)
    }
  }

  // 准备省份选项
  const provinceOptions = REGION_DATA.map((province) => ({
    value: province.code,
    label: province.name,
  }))

  // 准备城市选项
  const cityOptions = selectedProvince?.children?.map((city) => ({
    value: city.code.substring(2, 4),
    label: city.name,
  })) || []

  // 准备区县选项
  const districtOptions = selectedCity?.children?.map((district) => ({
    value: district.code.substring(4, 6),
    label: district.name,
  })) || []

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label>省份</Label>
        <Select
          value={provinceCode}
          onChange={(e) => handleProvinceChange(e.target.value)}
          disabled={disabled}
          options={[{ value: '', label: '请选择省份' }, ...provinceOptions]}
        />
      </div>

      <div>
        <Label>城市</Label>
        <Select
          value={cityCode}
          onChange={(e) => handleCityChange(e.target.value)}
          disabled={disabled || !provinceCode}
          options={[{ value: '', label: '请选择城市' }, ...cityOptions]}
        />
      </div>

      <div>
        <Label>区县</Label>
        <Select
          value={districtCode}
          onChange={(e) => handleDistrictChange(e.target.value)}
          disabled={disabled || !cityCode}
          options={[{ value: '', label: '请选择区县' }, ...districtOptions]}
        />
      </div>
    </div>
  )
}
