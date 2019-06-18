import {
  createHooksRegistry,
  registerHooks,
  Hooks,
  HooksRegistry
} from './hooks'
import {
  createEnvRegistry,
  registerRequiredEnv,
  registerOptionalEnv,
  EnvRequirementsRegistry
} from './env'
import { appLogger } from './app'

export interface Plugin<R> {
  name?: string
  env?: {
    required: string[]
    optional?: string[]
  }
  hooks?: Hooks
  return?: R
}

export interface PluginRegistry {
  names: string[]
  env: EnvRequirementsRegistry
  hooks: HooksRegistry
}

// --

export const createPluginRegistry = (): PluginRegistry => ({
  names: [],
  env: createEnvRegistry(),
  hooks: createHooksRegistry()
})

export type RegisterPluginFn = (plugin: Plugin<any>) => any | void

export const registerPlugin = <R>(
  plugin: Plugin<R>,
  registry: PluginRegistry
): R | void => {
  const name = plugin.name || 'unnamed-plugin'
  appLogger.debug({ msg: 'Registering plugin', meta: { name } })
  registry.names.push(name)
  if (plugin.hooks) {
    registerHooks(plugin.hooks, registry.hooks, name)
  }
  if (plugin.env) {
    plugin.env.required.forEach(env => registerRequiredEnv(env, registry.env))
    plugin.env.optional &&
      plugin.env.optional.forEach(env => registerOptionalEnv(env, registry.env))
  }
  if (typeof plugin.return === 'function') {
    return plugin.return()
  } else {
    return plugin.return
  }
}
