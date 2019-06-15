require('dotenv').config()

import logger, { Logger } from './logger'
import { App } from './defs'
import createApp from './app'
import start from './start'
import { RegisterHooksFn, registerHooks } from './hooks'

interface Douze {
  log: Logger
  createApp: () => App
  start: (app: App) => Promise<boolean>
  registerHooks: RegisterHooksFn
}

const Douze: Douze = {
  log: logger,
  createApp,
  start,
  registerHooks
}

export default Douze
export { Hooks } from './hooks'
export * from './defs'
