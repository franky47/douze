import Express from 'express'
import * as hooks from './hooks'
import { AppServer } from './defs'

describe('hook runners', () => {
  describe('runHooksInSequenceCollectErrors', () => {
    test('no content should resolve', async () => {
      const received = hooks.runHooksInSequenceCollectErrors<any, string>(
        'name',
        [],
        'foo',
        () => 'bar'
      )
      await expect(received).resolves.toBe('bar')
    })

    test('all ok should resolve', async () => {
      const received = hooks.runHooksInSequenceCollectErrors<any, string>(
        'name',
        [
          { name: 'foo', hook: () => Promise.resolve('foo') },
          { name: 'bar', hook: () => Promise.resolve('bar') }
        ],
        'foo',
        () => 'egg'
      )
      await expect(received).resolves.toBe('egg')
    })

    test('results reducer', async () => {
      const received = hooks.runHooksInSequenceCollectErrors<any, string>(
        'name',
        [
          { name: 'foo', hook: arg => Promise.resolve(arg) },
          { name: 'bar', hook: arg => Promise.resolve(arg) }
        ],
        'egg',
        results =>
          Array.from(results.entries())
            .map(([plugin, result]) => `${plugin}:${result}`)
            .join(',')
      )
      await expect(received).resolves.toBe('foo:egg,bar:egg')
    })

    test('one throw lets subsequent hooks run', async () => {
      const mockFn = jest.fn()
      const received = hooks.runHooksInSequenceCollectErrors<any, string>(
        'name',
        [
          { name: 'foo', hook: () => Promise.reject(new Error('fooError')) },
          {
            name: 'bar',
            hook: arg => {
              mockFn(arg)
              return Promise.resolve(arg + 'bar')
            }
          }
        ],
        'egg',
        () => 'spam'
      )
      await expect(received).rejects.toThrow(hooks.HookErrors)
      expect(mockFn).toHaveBeenCalledWith('egg')
    })

    test('multiple throws are collected', async () => {
      const received = await hooks
        .runHooksInSequenceCollectErrors<any, string>(
          'hookName',
          [
            { name: 'foo', hook: () => Promise.reject(new Error('fooError')) },
            { name: 'bar', hook: () => Promise.reject(new Error('barError')) }
          ],
          'egg',
          () => 'spam'
        )
        .catch(err => err)
      expect(received.message).toMatch('hookName')
      expect(received.hook).toBe('hookName')
      expect(received.errors).toHaveLength(2)
      expect(received.errors[0].plugin).toEqual('foo')
      expect(received.errors[1].plugin).toEqual('bar')
      expect(received.errors[0].hook).toEqual('hookName')
      expect(received.errors[1].hook).toEqual('hookName')
      expect(received.errors[0].message).toEqual('fooError')
      expect(received.errors[1].message).toEqual('barError')
    })
  })

  describe('runHooksInParallelCollectErrors', () => {
    test('no content should resolve', async () => {
      const received = hooks.runHooksInParallelCollectErrors<any, string>(
        'name',
        [],
        'foo',
        () => 'bar'
      )
      await expect(received).resolves.toBe('bar')
    })

    test('all ok should resolve', async () => {
      const received = hooks.runHooksInParallelCollectErrors<any, string>(
        'name',
        [
          { name: 'foo', hook: () => Promise.resolve('foo') },
          { name: 'bar', hook: () => Promise.resolve('bar') }
        ],
        'foo',
        () => 'egg'
      )
      await expect(received).resolves.toBe('egg')
    })

    test('results reducer', async () => {
      const received = hooks.runHooksInParallelCollectErrors<any, string>(
        'name',
        [
          { name: 'foo', hook: arg => Promise.resolve(arg) },
          { name: 'bar', hook: arg => Promise.resolve(arg) }
        ],
        'egg',
        results =>
          Array.from(results.entries())
            .map(([plugin, result]) => `${plugin}:${result}`)
            .join(',')
      )
      await expect(received).resolves.toBe('foo:egg,bar:egg')
    })

    test('one throw lets subsequent hooks run', async () => {
      const mockFn = jest.fn()
      const received = hooks.runHooksInParallelCollectErrors<any, string>(
        'name',
        [
          { name: 'foo', hook: () => Promise.reject(new Error('fooError')) },
          {
            name: 'bar',
            hook: arg => {
              mockFn(arg)
              return Promise.resolve(arg + 'bar')
            }
          }
        ],
        'egg',
        () => 'spam'
      )
      await expect(received).rejects.toThrow(hooks.HookErrors)
      expect(mockFn).toHaveBeenCalledWith('egg')
    })

    test('multiple throws are collected', async () => {
      const received = await hooks
        .runHooksInParallelCollectErrors<any, string>(
          'hookName',
          [
            { name: 'foo', hook: () => Promise.reject(new Error('fooError')) },
            { name: 'bar', hook: () => Promise.reject(new Error('barError')) }
          ],
          'egg',
          () => 'spam'
        )
        .catch(err => err)
      expect(received.message).toMatch('hookName')
      expect(received.hook).toBe('hookName')
      expect(received.errors).toHaveLength(2)
      expect(received.errors[0].plugin).toEqual('foo')
      expect(received.errors[1].plugin).toEqual('bar')
      expect(received.errors[0].hook).toEqual('hookName')
      expect(received.errors[1].hook).toEqual('hookName')
      expect(received.errors[0].message).toEqual('fooError')
      expect(received.errors[1].message).toEqual('barError')
    })
  })
})

describe('hooks', () => {
  test('registries should be empty at creation', () => {
    const registry = hooks.createHooksRegistry()
    expect(registry._storage.beforeMiddlewareLoad).toEqual([])
    expect(registry._storage.afterMiddlewareLoad).toEqual([])
    expect(registry._storage.beforeStart).toEqual([])
    expect(registry._storage.appReady).toEqual([])
    expect(registry._storage.beforeExit).toEqual([])
  })

  // --

  test('beforeMiddlewareLoad should be called', () => {
    const registry = hooks.createHooksRegistry()
    const mockFn = jest.fn()
    hooks.registerHooks(
      {
        beforeMiddlewareLoad: mockFn
      },
      registry,
      'foo'
    )
    const app = <Express.Express>{}
    registry.beforeMiddlewareLoad({ app })
    expect(mockFn).toHaveBeenCalledWith({ app })
  })

  test('beforeMiddlewareLoad throw should not run subsequent hooks', () => {
    const registry = hooks.createHooksRegistry()
    const mockFn = jest.fn()
    hooks.registerHooks(
      {
        beforeMiddlewareLoad: () => {
          throw new Error('foo')
        }
      },
      registry,
      'foo'
    )
    hooks.registerHooks(
      {
        beforeMiddlewareLoad: mockFn
      },
      registry,
      'bar'
    )
    const app = <Express.Express>{}
    const run = () => registry.beforeMiddlewareLoad({ app })
    expect(run).toThrowError('foo')
    expect(mockFn).not.toHaveBeenCalled()
  })

  // --

  test('afterMiddlewareLoad should be called', () => {
    const registry = hooks.createHooksRegistry()
    const mockFn = jest.fn()
    hooks.registerHooks(
      {
        afterMiddlewareLoad: mockFn
      },
      registry,
      'foo'
    )
    const app = <Express.Express>{}
    registry.afterMiddlewareLoad({ app })
    expect(mockFn).toHaveBeenCalledWith({ app })
  })

  test('afterMiddlewareLoad throw should not run subsequent hooks', () => {
    const registry = hooks.createHooksRegistry()
    const mockFn = jest.fn()
    hooks.registerHooks(
      {
        afterMiddlewareLoad: () => {
          throw new Error('foo')
        }
      },
      registry,
      'foo'
    )
    hooks.registerHooks(
      {
        afterMiddlewareLoad: mockFn
      },
      registry,
      'bar'
    )
    const app = <Express.Express>{}
    const run = () => registry.afterMiddlewareLoad({ app })
    expect(run).toThrowError('foo')
    expect(mockFn).not.toHaveBeenCalled()
  })

  // --

  test('beforeStart should be called', async () => {
    const registry = hooks.createHooksRegistry()
    const mockFn = jest.fn()
    hooks.registerHooks(
      {
        beforeStart: async args => {
          mockFn(args)
          return Promise.resolve({ ok: true })
        }
      },
      registry,
      'foo'
    )
    const app = <Express.Express>{}
    await registry.beforeStart({ app })
    expect(mockFn).toHaveBeenCalledWith({ app })
  })

  test('beforeStart should say ok if no hooks have been registered', async () => {
    const registry = hooks.createHooksRegistry()
    const app = <Express.Express>{}
    const result = await registry.beforeStart({ app })
    expect(result).toEqual({ ok: true })
  })

  test('beforeStart should say ok if all say ok', async () => {
    const registry = hooks.createHooksRegistry()
    hooks.registerHooks(
      {
        beforeStart: () => Promise.resolve({ ok: true })
      },
      registry,
      'foo'
    )
    hooks.registerHooks(
      {
        beforeStart: () => Promise.resolve({ ok: true })
      },
      registry,
      'bar'
    )
    const app = <Express.Express>{}
    const result = await registry.beforeStart({ app })
    expect(result).toEqual({ ok: true })
  })

  test('beforeStart should collect reasons for no go', async () => {
    const registry = hooks.createHooksRegistry()

    hooks.registerHooks(
      {
        beforeStart: () => Promise.resolve({ ok: false, reason: 'nope' })
      },
      registry,
      'foo'
    )
    hooks.registerHooks(
      {
        beforeStart: () => Promise.resolve({ ok: false, reason: 'meh' })
      },
      registry,
      'bar'
    )
    const app = <Express.Express>{}
    const result = await registry.beforeStart({ app })
    expect(result).toEqual({
      ok: false,
      reason: {
        foo: 'nope',
        bar: 'meh'
      }
    })
  })

  test('beforeStart should reject if any rejects', async () => {
    // This is to handle any plugin throwing unexpected errors.
    // It will be considered an abort case by Douze, but plugin
    // developers should try and catch as many errors as possible
    // and resolve to false to stop app startup properly, and give
    // other hooks a chance to run.

    const registry = hooks.createHooksRegistry()
    const mockFn = jest.fn()

    hooks.registerHooks(
      {
        beforeStart: () => Promise.reject(new Error('nope'))
      },
      registry,
      'foo'
    )
    hooks.registerHooks(
      {
        beforeStart: async args => {
          // Simulate asynchronism
          await new Promise(resolve => setTimeout(resolve, 100))
          mockFn(args)
          return { ok: true }
        }
      },
      registry,
      'bar'
    )
    const app = <Express.Express>{}
    const result = registry.beforeStart({ app })
    await expect(result).rejects.toThrow(hooks.HookErrors)

    // Even though a hook threw an error, the others should run none the less.
    expect(mockFn).toHaveBeenCalledWith({ app })
  })

  // --

  test('appReady should be called', async () => {
    const registry = hooks.createHooksRegistry()
    const mockFn = jest.fn()
    hooks.registerHooks(
      {
        appReady: async args => {
          mockFn(args)
        }
      },
      registry,
      'foo'
    )
    const app = <Express.Express>{}
    const server = <AppServer>{}
    await registry.appReady({ app, server })
    expect(mockFn).toHaveBeenCalledWith({ app, server })
  })

  test('appReady throw should not run subsequent hooks', async () => {
    const registry = hooks.createHooksRegistry()
    const mockFn = jest.fn()
    hooks.registerHooks(
      {
        appReady: () => {
          throw 'foo'
        }
      },
      registry,
      'foo'
    )
    hooks.registerHooks(
      {
        appReady: mockFn
      },
      registry,
      'bar'
    )
    const app = <Express.Express>{}
    const server = <AppServer>{}
    const p = registry.appReady({ app, server })
    await expect(p).rejects.toBe('foo')
    expect(mockFn).not.toHaveBeenCalled()
  })

  // --

  test('beforeExit should be called', async () => {
    const registry = hooks.createHooksRegistry()
    const mockFn = jest.fn()
    hooks.registerHooks(
      {
        beforeExit: mockFn
      },
      registry,
      'foo'
    )
    const app = <Express.Express>{}
    const server = <AppServer>{}
    await registry.beforeExit({ app, server, signal: 'foo' })
    expect(mockFn).toHaveBeenCalledWith({ app, server, signal: 'foo' })
  })

  test('beforeExit throw should not prevent other hooks to run', async () => {
    const registry = hooks.createHooksRegistry()
    const mockFn = jest.fn()
    hooks.registerHooks(
      {
        beforeExit: () => {
          throw new Error('foo')
        }
      },
      registry,
      'foo'
    )
    hooks.registerHooks(
      {
        beforeExit: mockFn
      },
      registry,
      'bar'
    )
    const app = <Express.Express>{}
    const server = <AppServer>{}
    const p = registry.beforeExit({ app, server, signal: 'sig' })
    await expect(p).rejects.toThrow(hooks.HookErrors)
    expect(mockFn).toHaveBeenCalled()
  })
})
