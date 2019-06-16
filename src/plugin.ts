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

export interface Plugin {
  name?: string
  env?: {
    required: string[]
    optional?: string[]
  }
  hooks?: Hooks
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

export type RegisterPluginFn = (plugin: Plugin) => void

export const registerPlugin = (plugin: Plugin, registry: PluginRegistry) => {
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
}
