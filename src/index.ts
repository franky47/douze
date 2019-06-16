require('dotenv').config()

import logger, { Logger, createChildLogger } from './logger'
import { App } from './defs'
import createApplication from './app'
import startApplication from './start'
import {
  RegisterPluginFn,
  createPluginRegistry,
  registerPlugin,
  PluginRegistry
} from './plugin'

interface Douze {
  extend: RegisterPluginFn
  createApp: () => App
  start: (app: App) => Promise<boolean>
  createLogger: (category: string) => Logger
  log: Logger
  _plugins: PluginRegistry
}

const createDouzeInstance = (): Douze => {
  const _plugins = createPluginRegistry()
  return {
    extend: plugin => registerPlugin(plugin, _plugins),
    createApp: () => createApplication(_plugins),
    start: app => startApplication(app, _plugins),
    createLogger: createChildLogger,
    log: logger,
    _plugins
  }
}

export default createDouzeInstance()
export { Plugin } from './plugin'
export * from './defs'
