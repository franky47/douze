import pino, { Logger } from 'pino'
import { instanceId, __DEV__ } from './defs'

const rootLogger = pino({
  name: instanceId,
  level: process.env.LOG_LEVEL || (__DEV__ ? 'debug' : 'info'),
  redact: ['req.headers.authentication'],
  base: {
    instance: instanceId,
    commit: process.env.COMMIT_ID
  }
})

export const makeChildLogger = (category: LogCategory, { ...args } = {}) =>
  rootLogger.child({
    category,
    ...args
  })

// --

export type LogCategory = 'APP' | 'HTTP' | 'API' | 'AUTH' | 'DB'

export type LogMeta = { [key: string]: any }

export type LogFn = (msg: string, category: LogCategory, meta?: LogMeta) => void

export default rootLogger

export { Logger }
