import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { importLegacyJson, openJsonStore } from './index'
import type { Store } from '@tauri-apps/plugin-store'

/** 进程内存假 Store，模拟 Rust 侧落盘行为（仅 Tauri 路径测试用） */
function fakeStore(saved: string[] = []): Store {
  const map = new Map<string, unknown>()
  return {
    get: async <T,>(key: string) => map.get(key) as T | undefined,
    set: async (key: string, value: unknown) => {
      map.set(key, value)
    },
    delete: async (key: string) => map.delete(key),
    entries: async () => [...map.entries()],
    save: async () => {
      saved.push('flushed')
    },
  } as unknown as Store
}

const loadMock = vi.hoisted(() => vi.fn())
vi.mock('@tauri-apps/plugin-store', () => ({ load: loadMock }))

/** 让 isTauri() 返回 true，走插件路径 */
function useTauri() {
  vi.stubGlobal('__TAURI_INTERNALS__', {})
}

beforeEach(() => {
  loadMock.mockReset()
  loadMock.mockImplementation(async () => fakeStore())
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Tauri 插件路径', () => {
  it('键值读写往返', async () => {
    useTauri()
    const store = await openJsonStore('roundtrip')
    await store.set('config', { theme: 'dark', size: 2 })
    expect(await store.get<{ theme: string }>('config')).toEqual({ theme: 'dark', size: 2 })
  })

  it('不存在的键返回 null', async () => {
    useTauri()
    const store = await openJsonStore('missing')
    expect(await store.get('nope')).toBeNull()
  })

  it('remove 删除键值', async () => {
    useTauri()
    const store = await openJsonStore('remove')
    await store.set('key', 1)
    await store.remove('key')
    expect(await store.get('key')).toBeNull()
  })

  it('entries 返回全部键值对', async () => {
    useTauri()
    const store = await openJsonStore('entries')
    await store.set('a', 1)
    await store.set('b', 'x')
    expect(await store.entries()).toEqual([
      ['a', 1],
      ['b', 'x'],
    ])
  })

  it('flush 触发底层 save', async () => {
    useTauri()
    const saved: string[] = []
    loadMock.mockImplementation(async () => fakeStore(saved))
    const store = await openJsonStore('flush')
    await store.flush()
    expect(saved).toEqual(['flushed'])
  })

  it('同一文件复用实例，文件名自动补 .json', async () => {
    useTauri()
    await openJsonStore('same')
    await openJsonStore('same')
    await openJsonStore('other.json')
    expect(loadMock).toHaveBeenNthCalledWith(1, 'same.json', { autoSave: true })
    expect(loadMock).toHaveBeenNthCalledWith(2, 'other.json', { autoSave: true })
    expect(loadMock).toHaveBeenCalledTimes(2)
  })

  it('打开失败不缓存，下次调用重试', async () => {
    useTauri()
    loadMock.mockRejectedValueOnce(new Error('not in tauri'))
    await expect(openJsonStore('retry')).rejects.toThrow('not in tauri')
    await expect(openJsonStore('retry')).resolves.toBeDefined()
    expect(loadMock).toHaveBeenCalledTimes(2)
  })
})

describe('浏览器降级路径（npm run dev 调试）', () => {
  it('读写走 localStorage 命名空间，JSON 序列化', async () => {
    const store = await openJsonStore('browser')
    await store.set('key', { n: 1 })
    expect(localStorage.getItem('json-store:browser.json#key')).toBe('{"n":1}')
    expect(await store.get<{ n: number }>('key')).toEqual({ n: 1 })
    expect(await store.get('absent')).toBeNull()
  })

  it('remove 删除键，entries 只含本文件前缀', async () => {
    const store = await openJsonStore('browser2')
    await openJsonStore('elsewhere')
    await store.set('a', 1)
    await store.set('b', 2)
    await store.remove('a')
    await (await openJsonStore('elsewhere')).set('c', 3)

    expect(await store.entries()).toEqual([['b', 2]])
    expect(await store.get('a')).toBeNull()
  })

  it('损坏数据读回 null', async () => {
    localStorage.setItem('json-store:broken.json#key', '{oops')
    const store = await openJsonStore('broken')
    expect(await store.get('key')).toBeNull()
  })
})

describe('importLegacyJson 旧数据迁移', () => {
  it('把 localStorage 旧键搬进 store 并删除旧键', async () => {
    localStorage.setItem('legacy-key', JSON.stringify(['a', 'b']))
    const store = await openJsonStore('migrate')

    expect(await importLegacyJson(store, 'legacy-key', 'data')).toBe(true)
    expect(await store.get('data')).toEqual(['a', 'b'])
    expect(localStorage.getItem('legacy-key')).toBeNull()
  })

  it('store 已有该键时不迁移、不动旧键', async () => {
    const store = await openJsonStore('migrate-existing')
    await store.set('data', 'fresh')
    localStorage.setItem('legacy-key', '"stale"')

    expect(await importLegacyJson(store, 'legacy-key', 'data')).toBe(false)
    expect(await store.get('data')).toBe('fresh')
    expect(localStorage.getItem('legacy-key')).toBe('"stale"')
  })

  it('旧键不存在返回 false，损坏旧键删除后返回 false', async () => {
    const store = await openJsonStore('migrate-absent')
    expect(await importLegacyJson(store, 'no-such-key', 'data')).toBe(false)

    localStorage.setItem('broken-key', '{oops')
    expect(await importLegacyJson(store, 'broken-key', 'data')).toBe(false)
    expect(localStorage.getItem('broken-key')).toBeNull()
  })
})
