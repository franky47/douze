import { Server } from 'http'
import gracefulExit from 'express-graceful-exit'
import * as Sentry from '@sentry/node'
import checkEnv from '@47ng/check-env'
import { instanceId, __DEV__, __PROD__, EnvConfig, DouzeApp } from './defs'
import { makeChildLogger } from './logger'
import initDatabase from './db'

export interface AppServer extends Server {
  host: string
  port: string | number
}

export const mergeCheckEnvConfig = (
  required: string[],
  optional: string[],
  config?: EnvConfig
) => {
  return {
    required: required.concat(config ? config.required || [] : []),
    optional: optional.concat(config ? config.optional || [] : [])
  }
}

// --

const appLogger = makeChildLogger('APP')

const startServer = async (app: DouzeApp): Promise<AppServer> => {
  const host = process.env.HOST || '0.0.0.0'
  const port = process.env.PORT || 3000
  return new Promise(resolve => {
    let server = app.listen(port, () => {
      // Graceful shutdown handler
      const handleSignal = (signal: NodeJS.Signals) => {
        appLogger.info({
          msg: `${signal} received, shutting down gracefully`,
          meta: { signal }
        })
        app.emit('stop')
        gracefulExit.gracefulExitHandler(app, server, {
          log: true,
          exitProcess: true,
          suicideTimeout: 10000, // 10 seconds
          logger: (message: any) => {
            appLogger.info({
              msg: message,
              meta: { signal }
            })
          },
          callback: (statusCode: any) => {
            appLogger.info({
              msg: 'Bye bye',
              meta: {
                statusCode,
                signal
              }
            })
          }
        })
      }
      process
        .on('SIGINT', handleSignal)
        .on('SIGABRT', handleSignal)
        .on('SIGTERM', handleSignal)

      if (__DEV__) {
        // For nodemon
        process.on('SIGUSR2', handleSignal)
      }

      resolve(Object.assign({ port, host }, server))
    })
  })
}

// --

export default async function start(app: DouzeApp) {
  appLogger.info({
    msg: 'App is starting',
    meta: {
      environment: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL
    }
  })

  const requiredEnv = ['APP_NAME', 'POSTGRESQL_ADDON_URI']
  const optionalEnv = ['SENTRY_DSN']

  checkEnv({
    ...mergeCheckEnvConfig(requiredEnv, optionalEnv, app.config.env),
    logError: (name: string) => {
      appLogger.error({
        msg: `Missing required environment variable ${name}`,
        meta: { name }
      })
    },
    logWarning: (name: string) => {
      appLogger.warn({
        msg: `Missing optional environment variable ${name}`,
        meta: { name }
      })
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

  try {
    await initDatabase(app.config.db)
    const server = await startServer(app)
    appLogger.info({
      msg: 'App is ready to receive connections',
      meta: {
        host: server.host,
        port: server.port
      }
    })
  } catch (error) {
    if (
      error.name === 'SequelizeConnectionError' ||
      error.name === 'SequelizeConnectionRefusedError'
    ) {
      appLogger.error({
        msg: 'Could not connect to database',
        meta: {
          ...error,
          message: error.message
        }
      })
      Sentry.captureException(error)
      process.exit(1)
    }
    appLogger.error(error)
    Sentry.captureException(error)
    process.exit(1)
  }
}
