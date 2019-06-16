import { App, AppServer } from './defs'

// --

export interface MiddlewareLoadArgs {
  app: App
}

export interface BeforeStartArgs {
  app: App
}

export interface AppReadyArgs {
  app: App
  server: AppServer
}

export interface BeforeExitArgs {
  app: App
  server: AppServer
  signal: string
}

export type Hooks = Partial<AllHooks>

// --

interface AllHooks {
  beforeMiddlewareLoad: (args: MiddlewareLoadArgs) => void
  afterMiddlewareLoad: (args: MiddlewareLoadArgs) => void
  beforeStart: (args: BeforeStartArgs) => Promise<boolean>
  appReady: (args: AppReadyArgs) => Promise<void>
  beforeExit: (args: BeforeExitArgs) => Promise<void>
}

type HookCell<T> = {
  name: string
  hook: T
}

type AsyncHook<A, R> = (args: A) => Promise<R>

type HooksStorage = { [K in keyof AllHooks]: HookCell<AllHooks[K]>[] }

export interface HooksRegistry extends AllHooks {
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
  store: HookCell<AsyncHook<Args, Return>>[],
  args: Args,
  reducer: (results: (Return | null)[]) => Return
): Promise<Return> => {
  const errorMap: ErrorMap = new Map()
  const results: Return[] = []

  for (const { name: plugin, hook } of store) {
    try {
      const result = await hook(args)
      results.push(result)
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
  store: HookCell<AsyncHook<Args, Return>>[],
  args: Args,
  reducer: (results: (Return | null)[]) => Return
): Promise<Return> => {
  const errorMap: ErrorMap = new Map()
  const promises = store.map(({ name: plugin, hook }) => {
    return hook(args)
      .then(result => {
        return result
      })
      .catch(error => {
        errorMap.set(plugin, new HookError(error, hookName, plugin))
        return null
      })
  })
  const results = await Promise.all(promises)
  if (errorMap.size) {
    throw new HookErrors(hookName, errorMap)
  }
  return reducer(results)
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
    beforeMiddlewareLoad: (args: MiddlewareLoadArgs) => {
      _storage.beforeMiddlewareLoad.forEach(({ name, hook }) => {
        try {
          hook(args)
        } catch (error) {
          throw new HookError(error, 'beforeMiddlewareLoad', name)
        }
      })
    },
    afterMiddlewareLoad: (args: MiddlewareLoadArgs) => {
      _storage.afterMiddlewareLoad.forEach(({ name, hook }) => {
        try {
          hook(args)
        } catch (error) {
          throw new HookError(error, 'afterMiddlewareLoad', name)
        }
      })
    },
    beforeStart: async (args: BeforeStartArgs): Promise<boolean> => {
      return runHooksInParallelCollectErrors(
        'beforeStart',
        _storage.beforeStart,
        args,
        results => results.every(r => !!r)
      )
    },
    appReady: async (args: AppReadyArgs): Promise<void> => {
      return runHooksInParallelCollectErrors(
        'appReady',
        _storage.appReady,
        args,
        () => {}
      )
    },
    beforeExit: async (args: BeforeExitArgs): Promise<void> => {
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

export const registerHooks = (
  hooks: Hooks,
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
