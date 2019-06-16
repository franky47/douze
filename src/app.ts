import express, { Request, Response, NextFunction } from 'express'
import * as Sentry from '@sentry/node'
import pino from 'pino'
import helmet from 'helmet'
import compression from 'compression'
import expressPino from 'express-pino-logger'
import { __DEV__, __PROD__, instanceId, App } from './defs'
import { createChildLogger } from './logger'
import * as gracefulExit from './middleware/gracefulExit'
import fingerprint from './middleware/fingerprint'
import { checkEnvironment } from './env'
import { PluginRegistry } from './plugin'

// --

export const appLogger = createChildLogger('app')

// --

const handleCleverCloudHealthCheck = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.headers['X-CleverCloud-Monitoring'] === 'telegraf') {
    // https://github.com/influxdata/telegraf/tree/master/plugins/outputs/health
    return res.sendStatus(200)
  }
  return next()
}

// --

export default function createApplication(plugins: PluginRegistry): App {
  try {
    checkEnvironment(appLogger, plugins.env)
  } catch (error) {
    appLogger.fatal({
      message: error.message,
      meta: {
        missing: error.missing
      }
    })
    process.exit(1)
  }

  appLogger.debug({
    message: 'Loaded plugins',
    meta: {
      plugins: plugins.names
    }
  })

  if (__PROD__ && process.env.SENTRY_DSN) {
    // Setup Sentry error tracking
    // init will automatically find process.env.SENTRY_DSN if set
    const release = process.env.COMMIT_ID
    const environment = instanceId
    Sentry.init({ release, environment })
    appLogger.info({
      msg: 'Sentry is setup for error reporting',
      meta: {
        release,
        environment
      }
    })
  }

  const app: App = express()
  app.enable('trust proxy')

  // Load middlewares --

  try {
    plugins.hooks.beforeMiddlewareLoad({ app })
  } catch (error) {
    Sentry.captureException(error)
    appLogger.fatal({
      msg: error.message,
      err: error,
      meta: {
        plugin: error.plugin,
        hook: 'beforeMiddlewareLoad'
      }
    })
    throw error
  }

  // - Logging
  app.use(fingerprint(process.env.DOUZE_FINGERPRINT_SALT))
  app.use(
    expressPino({
      logger: createChildLogger('http'),
      serializers: {
        req: (req: any) => {
          console.log(req.raw.ip, req.raw.ips)
          return {
            // Somehow this drops remoteAddress and remotePort as a side-effect..
            fingerprint: req.raw.fingerprint,
            ...pino.stdSerializers.req(req)
          }
        }
      }
    })
  )

  // - Body parsers
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Utility
  app.use(gracefulExit.middleware(app))
  app.use(helmet())
  app.use(compression())

  // Auth
  app.get('/', handleCleverCloudHealthCheck)

  try {
    plugins.hooks.afterMiddlewareLoad({ app })
  } catch (error) {
    Sentry.captureException(error)
    appLogger.fatal({
      msg: error.message,
      err: error,
      meta: {
        plugin: error.plugin,
        hook: 'afterMiddlewareLoad'
      }
    })
    throw error
  }

  return app
}
