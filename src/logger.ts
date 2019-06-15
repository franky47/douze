import pino, { Logger } from 'pino'
import { instanceId, __DEV__ } from './defs'

const rootLogger = pino({
  level: process.env.LOG_LEVEL || (__DEV__ ? 'debug' : 'info'),
  redact: [
    // Security redactions
    'req.headers["x-secret-token"]',
    'req.headers["x-csrf-token"]',
    'req.headers.cookie',
    'req.headers.authorization',
    'req.headers.referer',
    'res.headers["set-cookie"]',

    // Privacy redactions (must be explicitly disabled in production)
    ...(__DEV__ || process.env.DOUZE_ENFORCE_PRIVACY === 'false'
      ? []
      : ['req.headers.host', 'req.headers["user-agent"]'])
  ],
  base: {
    instance: instanceId,
    commit: process.env.COMMIT_ID,
    category: 'APP'
  }
})

export const makeChildLogger = (
  category: LogCategory,
  { ...args } = {}
): Logger =>
  rootLogger.child({
    category,
    ...args
  })

// --

// todo: These might want to be extended in final app
export type LogCategory = 'APP' | 'HTTP' | 'API' | 'AUTH' | 'DB'

export type LogMeta = { [key: string]: any }

export type LogFn = (msg: string, category: LogCategory, meta?: LogMeta) => void

export default rootLogger

export { Logger }
