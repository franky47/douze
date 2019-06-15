require('dotenv').config()

import logger, { Logger } from './logger'
import { App } from './defs'
import createApp from './app'
import start from './start'
import { RegisterPluginFn, registerPlugin } from './plugin'

interface Douze {
  log: Logger
  createApp: () => App
  start: (app: App) => Promise<boolean>
  extend: RegisterPluginFn
}

const Douze: Douze = {
  log: logger,
  createApp,
  start,
  extend: registerPlugin
}

export default Douze
export { Hooks } from './hooks'
export { Plugin } from './plugin'
export * from './defs'
