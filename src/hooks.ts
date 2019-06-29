import { App, AppServer } from './defs'

// --

export interface MiddlewareLoadArgs<T> {
  // App local storage can be registered during middleware load (pre/post),
  // so at this time the presence of T cannot be enforced in these hooks.
  // Other hooks in the lifecycle of the application will use final locals.
  app: App<Partial<T>>
}

export interface BeforeStartArgs<T> {
  app: App<T>
}

export interface AppReadyArgs<T> {
  app: App<T>
  server: AppServer
}

export interface BeforeExitArgs<T> {
  app: App<T>
  server: AppServer
  signal: string
}

export type Hooks<T = {}> = Partial<AllHooks<T>>

export interface BeforeStartResult {
  ok: boolean
  reason?: any
}

// --

interface AllHooks<T> {
  beforeMiddlewareLoad: (args: MiddlewareLoadArgs<T>) => void
  afterMiddlewareLoad: (args: MiddlewareLoadArgs<T>) => void
  beforeStart: (args: BeforeStartArgs<T>) => Promise<BeforeStartResult>
  appReady: (args: AppReadyArgs<T>) => Promise<void>
  beforeExit: (args: BeforeExitArgs<T>) => Promise<void>
}

type HookCell<T> = {
  name: string
  hook: T
}

type AsyncFn<A, R> = (args: A) => Promise<R>

type HooksStorage = { [K in keyof AllHooks<any>]: HookCell<AllHooks<any>[K]>[] }

export interface HooksRegistry extends AllHooks<any> {
  _storage: HooksStorage
}

// --

export class HookError extends Error {
  public hook: string
  public plugin: string
  public original: Error
  constructor(error: Error, hook: string, plugin: string) {
    super(error.message)
    this.hook = hook
    this.plugin = plugin
    this.original = error
  }
}

type ErrorMap = Map<string, HookError>

export class HookErrors extends Error {
  public hook: string
  public errors: HookError[]

  constructor(hookName: string, errorMap: ErrorMap) {
    const plural = errorMap.size > 1
    super(`Error${plural ? 's' : ''} encountered in hook ${hookName}`)
    this.hook = hookName
    this.errors = Array.from(errorMap.values())
  }
}

// --

export const runHooksInSequenceCollectErrors = async <Args, Return>(
  hookName: string,
  store: HookCell<AsyncFn<Args, Return>>[],
  args: Args,
  reducer: (results: Map<string, Return>) => Return
): Promise<Return> => {
  const errorMap: ErrorMap = new Map()
  const results: Map<string, Return> = new Map()

  for (const { name: plugin, hook } of store) {
    try {
      const result = await hook(args)
      results.set(plugin, result)
    } catch (error) {
      errorMap.set(plugin, new HookError(error, hookName, plugin))
    }
  }
  if (errorMap.size) {
    throw new HookErrors(hookName, errorMap)
  }

  return reducer(results)
}

// --

export const runHooksInParallelCollectErrors = async <Args, Return>(
  hookName: string,
  store: HookCell<AsyncFn<Args, Return>>[],
  args: Args,
  reducer: (results: Map<string, Return>) => Return
): Promise<Return> => {
  const errorMap: ErrorMap = new Map()
  const promises = store.map(({ name: plugin, hook }) => {
    return hook(args)
      .then((result): [string, Return] => [plugin, result])
      .catch(error => {
        errorMap.set(plugin, new HookError(error, hookName, plugin))
        return null
      })
  })
  const results = await Promise.all(promises)
  if (errorMap.size) {
    throw new HookErrors(hookName, errorMap)
  }
  return reducer(new Map(<[string, Return][]>results))
}

// --

export const createHooksRegistry = (): HooksRegistry => {
  const _storage: HooksStorage = {
    beforeMiddlewareLoad: [],
    afterMiddlewareLoad: [],
    beforeStart: [],
    appReady: [],
    beforeExit: []
  }
  return {
    _storage,
    beforeMiddlewareLoad: <T>(args: MiddlewareLoadArgs<T>) => {
      _storage.beforeMiddlewareLoad.forEach(({ name, hook }) => {
        try {
          hook(args)
        } catch (error) {
          throw new HookError(error, 'beforeMiddlewareLoad', name)
        }
      })
    },
    afterMiddlewareLoad: <T>(args: MiddlewareLoadArgs<T>) => {
      _storage.afterMiddlewareLoad.forEach(({ name, hook }) => {
        try {
          hook(args)
        } catch (error) {
          throw new HookError(error, 'afterMiddlewareLoad', name)
        }
      })
    },
    beforeStart: async <T>(
      args: BeforeStartArgs<T>
    ): Promise<BeforeStartResult> => {
      return runHooksInSequenceCollectErrors(
        'beforeStart',
        _storage.beforeStart,
        args,
        results => {
          const ok = Array.from(results.values()).every(
            result => result && result.ok
          )
          return {
            ok,
            reason: ok
              ? undefined
              : Array.from(results.entries())
                  .filter(([_, result]) => result && result.reason)
                  .reduce(
                    (acc, [plugin, result]) => ({
                      ...acc,
                      [plugin]: result.reason
                    }),
                    {}
                  )
          }
        }
      )
    },
    appReady: async <T>(args: AppReadyArgs<T>): Promise<void> => {
      return runHooksInParallelCollectErrors(
        'appReady',
        _storage.appReady,
        args,
        () => {}
      )
    },
    beforeExit: async <T>(args: BeforeExitArgs<T>): Promise<void> => {
      return runHooksInSequenceCollectErrors(
        'beforeExit',
        _storage.beforeExit,
        args,
        () => {}
      )
    }
  }
}

// --

export const registerHooks = <T>(
  hooks: Hooks<T>,
  registry: HooksRegistry,
  name: string
) => {
  if (hooks.beforeMiddlewareLoad) {
    registry._storage.beforeMiddlewareLoad.push({
      name,
      hook: hooks.beforeMiddlewareLoad
    })
  }
  if (hooks.afterMiddlewareLoad) {
    registry._storage.afterMiddlewareLoad.push({
      name,
      hook: hooks.afterMiddlewareLoad
    })
  }
  if (hooks.beforeStart) {
    registry._storage.beforeStart.push({
      name,
      hook: hooks.beforeStart
    })
  }
  if (hooks.appReady) {
    registry._storage.appReady.push({
      name,
      hook: hooks.appReady
    })
  }
  if (hooks.beforeExit) {
    registry._storage.beforeExit.push({
      name,
      hook: hooks.beforeExit
    })
  }
}
