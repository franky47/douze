import { Hooks, registerHooks } from './hooks'
import { addRequiredEnv, addOptionalEnv } from './env'

export interface Plugin {
  env?: {
    required: string[]
    optional?: string[]
  }
  hooks?: Hooks
}

const plugins: Plugin[] = []

// --

export type RegisterPluginFn = (plugin: Plugin) => void

export const registerPlugin: RegisterPluginFn = plugin => {
  plugins.push(plugin)
  if (plugin.hooks) {
    registerHooks(plugin.hooks)
  }
  if (plugin.env) {
    plugin.env.required.forEach(addRequiredEnv)
    plugin.env.optional && plugin.env.optional.forEach(addOptionalEnv)
  }
}
