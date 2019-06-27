import { Logger } from 'pino'
import Douze from './Douze'
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

// --

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

export type PluginFactory<R> = (douze: Douze) => Plugin<R>

// --

export const createPluginRegistry = (): PluginRegistry => ({
  names: [],
  env: createEnvRegistry(),
  hooks: createHooksRegistry()
})

// --

export const registerPlugin = <R>(
  plugin: Plugin<R>,
  registry: PluginRegistry,
  logger?: Logger
): R | void => {
  const name = plugin.name || 'unnamed-plugin'
  if (logger) {
    logger.debug({
      msg: `Registering plugin ${name}`,
      meta: {
        name
      }
    })
  }
  registry.names.push(name)
  if (plugin.hooks) {
    registerHooks(plugin.hooks, registry.hooks, name)
  }
  if (plugin.env) {
    for (const env of plugin.env.required) {
      registerRequiredEnv(env, registry.env)
    }
    for (const env of plugin.env.optional || []) {
      registerOptionalEnv(env, registry.env)
    }
  }
  if (typeof plugin.return === 'function') {
    return plugin.return()
  } else {
    return plugin.return
  }
}
