import pino, { Logger as PinoLogger } from 'pino'
import { instanceId, __DEV__ } from './defs'

const rootLogger = pino({
  name: instanceId,
  level: process.env.LOG_LEVEL || (__DEV__ ? 'debug' : 'info'),
  redact: ['password', 'authentication', 'secret']
})

export const makeChildLogger = (name: string, { ...args }) =>
  rootLogger.child({
    name: `${instanceId}:${name}`,
    ...args
  })

// --

export type LogCategory = 'INIT' | 'APP' | 'HTTP' | 'API' | 'AUTH'

export type LogMeta = { [key: string]: any }

export type LogFn = (msg: string, category: LogCategory, meta?: LogMeta) => void

export interface Logger {
  trace: LogFn
  debug: LogFn
  info: LogFn
  warn: LogFn
  error: LogFn

  pino: PinoLogger
}

export default <Logger>{
  trace: (msg: string, category: LogCategory = 'APP', meta?: object) => {
    rootLogger.trace(msg, { category, meta })
  },
  debug: (msg: string, category: LogCategory = 'APP', meta?: object) => {
    rootLogger.debug(msg, { category, meta })
  },
  info: (msg: string, category: LogCategory = 'APP', meta?: object) => {
    rootLogger.info(msg, { category, meta })
  },
  warn: (msg: string, category: LogCategory = 'APP', meta?: object) => {
    rootLogger.warn(msg, { category, meta })
  },
  error: (msg: string, category: LogCategory = 'APP', meta?: object) => {
    rootLogger.error(msg, { category, meta })
  },
  pino: rootLogger
}
