require('dotenv').config()

import logger, { Logger } from './logger'
import { Config, DouzeApp } from './defs'
import createApp from './app'
import start from './start'

interface Douze {
  log: Logger
  createApp: (config?: Config) => DouzeApp
  start: (app: DouzeApp) => Promise<void>
}

const Douze: Douze = {
  log: logger,
  createApp,
  start
}

export default Douze

export * from './defs'
