import pino, { Logger } from 'pino'
import { __DEV__ } from './defs'
import { RuntimeEnvironment } from './env'

export const createRootLogger = (env: RuntimeEnvironment, name?: string) =>
  pino({
    name,
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
      category: 'APP',
      instance: env.instanceId,
      commit: env.revision
    }
  })

export const createChildLogger = (
  baseLogger: Logger,
  category: string,
  { ...args } = {}
): Logger =>
  baseLogger.child({
    category,
    ...args
  })

// --

export { Logger }
