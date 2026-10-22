import { describe, it, expect } from 'vitest'
import { analyzeStack, parseStack } from './index'

const SIMPLE_NPE = `java.lang.NullPointerException
	at com.example.service.UserService.getUser(UserService.java:42)
	at com.example.controller.UserController.handle(UserController.java:88)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)`

const CHAINED = `org.springframework.dao.DataAccessResourceFailureException: Could not obtain connection
	at org.springframework.orm.jpa.JpaTransactionManager.doBegin(JpaTransactionManager.java:402)
	at com.example.service.OrderService.create(OrderService.java:77)
	... 15 more
Caused by: java.sql.SQLException: Connection refused
	at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:101)
	at com.example.service.OrderService.create(OrderService.java:77)
	... 12 common frames omitted`

describe('parseStack', () => {
  it('解析单层无消息异常', () => {
    const { exceptions } = parseStack(SIMPLE_NPE)
    expect(exceptions).toHaveLength(1)
    expect(exceptions[0].exceptionClass).toBe('java.lang.NullPointerException')
    expect(exceptions[0].message).toBe('')
    expect(exceptions[0].isCause).toBe(false)
  })

  it('解析帧的类名、方法名、文件与行号', () => {
    const { exceptions } = parseStack(SIMPLE_NPE)
    const [first, second, native] = exceptions[0].frames
    expect(first).toMatchObject({
      className: 'com.example.service.UserService',
      method: 'getUser',
      fileName: 'UserService.java',
      line: 42,
    })
    expect(second).toMatchObject({ method: 'handle', line: 88 })
    expect(native).toMatchObject({
      className: 'sun.reflect.NativeMethodAccessorImpl',
      method: 'invoke0',
    })
    expect(native.fileName).toBeUndefined()
    expect(native.line).toBeUndefined()
  })

  it('解析 <init> 与 lambda 方法名的帧', () => {
    const text = `java.lang.IllegalStateException: bad
	at com.example.Foo.<init>(Foo.java:10)
	at com.example.Foo.lambda$bar$0(Foo.java:22)`
    const { exceptions } = parseStack(text)
    expect(exceptions[0].frames[0].method).toBe('<init>')
    expect(exceptions[0].frames[1].method).toBe('lambda$bar$0')
  })

  it('解析多层 Caused by 异常链', () => {
    const { exceptions } = parseStack(CHAINED)
    expect(exceptions).toHaveLength(2)
    expect(exceptions[0].exceptionClass).toBe(
      'org.springframework.dao.DataAccessResourceFailureException',
    )
    expect(exceptions[0].isCause).toBe(false)
    expect(exceptions[1]).toMatchObject({
      exceptionClass: 'java.sql.SQLException',
      message: 'Connection refused',
      isCause: true,
    })
  })

  it('省略帧计入 omittedFrames（more 与 common frames omitted）', () => {
    const { exceptions } = parseStack(CHAINED)
    expect(exceptions[0].omittedFrames).toBe(15)
    expect(exceptions[1].omittedFrames).toBe(12)
  })

  it('无关行计入 unrecognizedLines，空行忽略', () => {
    const text = `${SIMPLE_NPE}\n\n日志时间戳 2026-10-22 之类的无关文本\n`
    const { exceptions, unrecognizedLines } = parseStack(text)
    expect(exceptions).toHaveLength(1)
    expect(unrecognizedLines).toBe(1)
  })

  it('帧出现在异常声明前时归入未知异常', () => {
    const text = '\tat com.example.Foo.bar(Foo.java:1)'
    const { exceptions } = parseStack(text)
    expect(exceptions[0].exceptionClass).toBe('')
    expect(exceptions[0].frames).toHaveLength(1)
  })
})

describe('analyzeStack', () => {
  it('空文本无效', () => {
    expect(analyzeStack('')).toMatchObject({ isValid: false, rootCause: null })
  })

  it('无 Caused by 时根因为第一个异常', () => {
    const result = analyzeStack(SIMPLE_NPE)
    expect(result.isValid).toBe(true)
    expect(result.rootCause?.exceptionClass).toBe('java.lang.NullPointerException')
  })

  it('有 Caused by 时根因为最后一个异常', () => {
    const result = analyzeStack(CHAINED)
    expect(result.rootCause?.exceptionClass).toBe('java.sql.SQLException')
  })

  it('统计出现最多的包前缀并降序', () => {
    const result = analyzeStack(CHAINED)
    expect(result.topPackages[0]).toEqual({ pkg: 'com.example', count: 2 })
    expect(result.topPackages.map((p) => p.pkg)).toEqual(
      expect.arrayContaining(['com.zaxxer', 'org.springframework']),
    )
  })

  it('配置业务包前缀后定位根因链中最深业务帧', () => {
    const result = analyzeStack(CHAINED, { businessPrefix: 'com.example' })
    expect(result.deepestBusinessFrame).toMatchObject({
      className: 'com.example.service.OrderService',
      method: 'create',
      line: 77,
    })
  })

  it('根因链无业务帧时回退到整条异常链查找', () => {
    const text = `java.sql.SQLException: boom
	at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:101)
	at com.example.service.OrderService.load(OrderService.java:9)`
    const result = analyzeStack(text, { businessPrefix: 'com.example' })
    expect(result.deepestBusinessFrame).toMatchObject({
      className: 'com.example.service.OrderService',
      method: 'load',
    })
  })

  it('未配置前缀或无匹配时业务帧为 null', () => {
    expect(analyzeStack(SIMPLE_NPE).deepestBusinessFrame).toBeNull()
    expect(
      analyzeStack(SIMPLE_NPE, { businessPrefix: 'com.other' }).deepestBusinessFrame,
    ).toBeNull()
  })
})
