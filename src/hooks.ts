import { App, AppServer } from './defs'

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
  signal?: string
}

interface AllHooks {
  beforeMiddlewareLoad: (args: MiddlewareLoadArgs) => void
  afterMiddlewareLoad: (args: MiddlewareLoadArgs) => void
  beforeStart: (args: BeforeStartArgs) => Promise<boolean>
  appReady: (args: AppReadyArgs) => Promise<void>
  beforeExit: (args: BeforeExitArgs) => Promise<void>
}

export type Hooks = Partial<AllHooks>

// --

type HookRegister = { [K in keyof AllHooks]: AllHooks[K][] }

const registeredHooks: HookRegister = {
  beforeMiddlewareLoad: [],
  afterMiddlewareLoad: [],
  beforeStart: [],
  appReady: [],
  beforeExit: []
}

export type RegisterHooksFn = (hooks: Hooks) => void

export const registerHooks: RegisterHooksFn = hooks => {
  if (hooks.beforeMiddlewareLoad) {
    registeredHooks.beforeMiddlewareLoad.push(hooks.beforeMiddlewareLoad)
  }
  if (hooks.afterMiddlewareLoad) {
    registeredHooks.afterMiddlewareLoad.push(hooks.afterMiddlewareLoad)
  }
  if (hooks.beforeStart) {
    registeredHooks.beforeStart.push(hooks.beforeStart)
  }
  if (hooks.appReady) {
    registeredHooks.appReady.push(hooks.appReady)
  }
  if (hooks.beforeExit) {
    registeredHooks.beforeExit.push(hooks.beforeExit)
  }
}

export const runHooks: AllHooks = {
  beforeMiddlewareLoad: (args: MiddlewareLoadArgs) => {
    registeredHooks.beforeMiddlewareLoad.forEach(f => f(args))
  },
  afterMiddlewareLoad: (args: MiddlewareLoadArgs) => {
    registeredHooks.afterMiddlewareLoad.forEach(f => f(args))
  },
  beforeStart: async (args: BeforeStartArgs): Promise<boolean> => {
    const calls = registeredHooks.beforeStart.map(f => f(args))
    const results = await Promise.all(calls)
    return results.every(r => r)
  },
  appReady: async (args: AppReadyArgs): Promise<void> => {
    const calls = registeredHooks.appReady.map(f => f(args))
    await Promise.all(calls)
  },
  beforeExit: async (args: BeforeExitArgs): Promise<void> => {
    const calls = registeredHooks.beforeExit.map(f => f(args))
    await Promise.all(calls)
  }
}
