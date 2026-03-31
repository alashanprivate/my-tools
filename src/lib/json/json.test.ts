import { describe, it, expect } from 'vitest'
import { formatJson, validateJson, minifyJson } from './index'

describe('formatJson', () => {
  it('should format a simple JSON object', () => {
    const input = '{"name":"John","age":30}'
    const result = formatJson(input)
    expect(result.success).toBe(true)
    expect(result.result).toContain('\n')
    expect(result.result).toContain('  ')
  })

  it('should format with custom indent', () => {
    const input = '{"name":"John","age":30}'
    const result = formatJson(input, { indent: 4 })
    expect(result.success).toBe(true)
    expect(result.result).toContain('    ')
  })

  it('should sort keys when sortKeys is true', () => {
    const input = '{"z":1,"a":2,"m":3}'
    const result = formatJson(input, { sortKeys: true })
    expect(result.success).toBe(true)
    const lines = result.result!.split('\n')
    expect(lines[1]).toContain('"a"')
    expect(lines[2]).toContain('"m"')
    expect(lines[3]).toContain('"z"')
  })

  it('should handle nested objects', () => {
    const input = '{"user":{"name":"John","age":30}}'
    const result = formatJson(input)
    expect(result.success).toBe(true)
    expect(result.result).toMatch(/user/)
    expect(result.result).toMatch(/name/)
  })

  it('should handle arrays', () => {
    const input = '[1,2,3]'
    const result = formatJson(input)
    expect(result.success).toBe(true)
    expect(result.result).toContain('\n')
  })

  it('should return error for invalid JSON', () => {
    const input = '{"invalid": json}'
    const result = formatJson(input)
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should handle empty input', () => {
    const result = formatJson('')
    expect(result.success).toBe(false)
  })
})

describe('validateJson', () => {
  it('should validate correct JSON', () => {
    const result = validateJson('{"name":"John"}')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should detect missing closing brace', () => {
    const result = validateJson('{"name":"John"')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.line).toBeDefined()
  })

  it('should detect trailing comma', () => {
    const result = validateJson('{"name":"John",}')
    expect(result.valid).toBe(false)
  })

  it('should validate array', () => {
    const result = validateJson('[1,2,3]')
    expect(result.valid).toBe(true)
  })

  it('should handle empty string', () => {
    const result = validateJson('')
    expect(result.valid).toBe(false)
  })

  it('should provide line and column for errors', () => {
    const result = validateJson('{\n  "name": "John",\n  "age":\n}')
    expect(result.valid).toBe(false)
    expect(result.line).toBeGreaterThan(0)
    expect(result.column).toBeGreaterThan(0)
  })
})

describe('minifyJson', () => {
  it('should remove all whitespace', () => {
    const input = '{\n  "name": "John",\n  "age": 30\n}'
    const result = minifyJson(input)
    expect(result.success).toBe(true)
    expect(result.result).toBe('{"name":"John","age":30}')
  })

  it('should handle already minified JSON', () => {
    const input = '{"name":"John"}'
    const result = minifyJson(input)
    expect(result.success).toBe(true)
    expect(result.result).toBe(input)
  })

  it('should return error for invalid JSON', () => {
    const result = minifyJson('{invalid}')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should handle nested structures', () => {
    const input = '{\n  "user": {\n    "name": "John"\n  }\n}'
    const result = minifyJson(input)
    expect(result.success).toBe(true)
    expect(result.result).toBe('{"user":{"name":"John"}}')
  })

  it('should handle arrays', () => {
    const input = '[\n  1,\n  2,\n  3\n]'
    const result = minifyJson(input)
    expect(result.success).toBe(true)
    expect(result.result).toBe('[1,2,3]')
  })
})
