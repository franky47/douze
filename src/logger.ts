import pino, { Logger } from 'pino'
import SonicBoom from 'sonic-boom'
import { __DEV__ } from './defs'
import { RuntimeEnvironment } from './env'
import redactEnv from 'redact-env'

export const createRedactedStream = (
  pipeTo: SonicBoom,
  secureEnv: string[]
): SonicBoom => {
  const secrets = redactEnv.build(secureEnv, process.env)
  return Object.assign({}, pipeTo, {
    write: (string: string) => {
      const safeString = redactEnv.redact(string, secrets, '[secure]')
      return pipeTo.write(safeString)
    }
  })
}

// --

export const createRootLogger = (
  env: RuntimeEnvironment,
  redactFields: string[],
  secureEnv: string[]
) => {
  return pino(
    {
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
          : ['req.headers.host', 'req.headers["user-agent"]']),
        ...redactFields
      ],
      base: {
        category: 'app',
        instance: env.instanceId,
        commit: env.revision
      }
    },
    createRedactedStream(pino.destination(1), secureEnv)
  )
}

// --

export const createChildLogger = (
  baseLogger: Logger,
  category: string,
  { ...args } = {}
): Logger =>
  baseLogger.child({
    category,
    ...args
  })
