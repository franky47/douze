import * as plugin from './plugin'

describe('plugin', () => {
  test('registry should be empty at creation', () => {
    const reg = plugin.createPluginRegistry()
    expect(reg.names).toHaveLength(0)
    expect(Array.from(reg.env.required)).toHaveLength(0)
    expect(Array.from(reg.env.optional)).toHaveLength(0)
    expect(reg.hooks._storage.beforeMiddlewareLoad).toHaveLength(0)
    expect(reg.hooks._storage.afterMiddlewareLoad).toHaveLength(0)
    expect(reg.hooks._storage.beforeStart).toHaveLength(0)
    expect(reg.hooks._storage.appReady).toHaveLength(0)
    expect(reg.hooks._storage.beforeExit).toHaveLength(0)
  })

  test('empty plugin', () => {
    const reg = plugin.createPluginRegistry()
    plugin.registerPlugin({}, reg)
    expect(reg.names).toEqual(['unnamed-plugin'])
    expect(Array.from(reg.env.required)).toHaveLength(0)
    expect(Array.from(reg.env.optional)).toHaveLength(0)
    expect(reg.hooks._storage.beforeMiddlewareLoad).toHaveLength(0)
    expect(reg.hooks._storage.afterMiddlewareLoad).toHaveLength(0)
    expect(reg.hooks._storage.beforeStart).toHaveLength(0)
    expect(reg.hooks._storage.appReady).toHaveLength(0)
    expect(reg.hooks._storage.beforeExit).toHaveLength(0)
  })

  test('named plugin', () => {
    const reg = plugin.createPluginRegistry()
    plugin.registerPlugin({ name: 'foo' }, reg)
    expect(reg.names).toEqual(['foo'])
  })

  test('no return value', () => {
    const reg = plugin.createPluginRegistry()
    const received = plugin.registerPlugin({}, reg)
    expect(received).toBeUndefined()
  })

  test('return value as a scalar', () => {
    const reg = plugin.createPluginRegistry()
    const received = plugin.registerPlugin({ return: 'foo' }, reg)
    expect(received).toEqual('foo')
  })

  test('return value as a function is called', () => {
    const reg = plugin.createPluginRegistry()
    const mockFn = jest.fn()
    const received = plugin.registerPlugin(
      {
        return: (): string => {
          mockFn()
          return 'foo'
        }
      },
      reg
    )
    expect(received).toEqual('foo')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  test('return value as an async function is called', async () => {
    const reg = plugin.createPluginRegistry()
    const mockFn = jest.fn()
    const received = plugin.registerPlugin(
      {
        return: async (): Promise<string> => {
          mockFn()
          return 'foo'
        }
      },
      reg
    )
    await expect(received).resolves.toEqual('foo')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})
