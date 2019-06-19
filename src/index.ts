import { Logger, createChildLogger, createRootLogger } from './logger'
import { App } from './defs'
import createApplication from './app'
import startApplication from './start'
import {
  RegisterPluginFn,
  createPluginRegistry,
  registerPlugin,
  PluginRegistry
} from './plugin'
import { setupEnvironment } from './env'

interface Douze {
  extend: RegisterPluginFn
  createApp: () => App
  start: (app: App) => Promise<boolean>
  createLogger: (category: string) => Logger
  log: Logger
  _plugins: PluginRegistry
}

const createDouzeInstance = (name?: string): Douze => {
  const runtimeEnvironment = setupEnvironment()
  const logger = createRootLogger(runtimeEnvironment, name)
  const _plugins = createPluginRegistry()
  return {
    extend: plugin => registerPlugin(plugin, _plugins, logger),
    createApp: () => createApplication(_plugins, logger, runtimeEnvironment),
    start: app => startApplication(app, _plugins),
    createLogger: category => createChildLogger(logger, category),
    log: logger,
    _plugins
  }
}

export default createDouzeInstance()
export { Plugin } from './plugin'
export * from './defs'
