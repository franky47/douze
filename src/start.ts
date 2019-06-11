import { Server } from 'http'
import gracefulExit from 'express-graceful-exit'
import * as Sentry from '@sentry/node'
import checkEnv from '@47ng/check-env'
import { instanceId, __DEV__, __PROD__, Config, DouzeApp } from './defs'
import logger from './logger'

export interface AppServer extends Server {
  host: string
  port: string | number
}

export const mergeCheckEnvConfig = (
  required: string[],
  optional: string[],
  config?: Config
) => {
  return {
    required: required.concat(
      config && config.env ? config.env.required || [] : []
    ),
    optional: optional.concat(
      config && config.env ? config.env.optional || [] : []
    )
  }
}

// --

const startServer = async (app: DouzeApp): Promise<AppServer> => {
  const host = process.env.HOST || '0.0.0.0'
  const port = process.env.PORT || 3000
  return new Promise(resolve => {
    let server = app.listen(port, () => {
      // Graceful shutdown handler
      const handleSignal = (signal: NodeJS.Signals) => {
        logger.info(`${signal} received, shutting down gracefully`, 'APP', {
          signal
        })
        app.emit('stop')
        gracefulExit.gracefulExitHandler(app, server, {
          log: true,
          exitProcess: true,
          suicideTimeout: 10000, // 10 seconds
          logger: (message: any) => {
            logger.info(message, 'APP', { signal })
          },
          callback: (statusCode: any) => {
            logger.info('Bye bye', 'APP', {
              statusCode,
              signal
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
  logger.info('App is starting', 'INIT', {
    environment: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL
  })

  const requiredEnv = ['APP_NAME', 'POSTGRESQL_ADDON_URI']
  const optionalEnv = ['SENTRY_DSN']

  checkEnv({
    ...mergeCheckEnvConfig(requiredEnv, optionalEnv, app.config),
    logError: (name: string) => {
      logger.error(`Missing required environment variable ${name}`, 'INIT', {
        name
      })
    },
    logWarning: (name: string) => {
      logger.warn(`Missing optional environment variable ${name}`, 'INIT', {
        name
      })
    }
  })

  if (__PROD__) {
    // Setup Sentry error tracking
    // init will automatically find process.env.SENTRY_DSN if set
    Sentry.init({
      release: process.env.COMMIT_ID,
      environment: instanceId
    })
  }

  // await initDatabase()
  const server = await startServer(app)
  logger.info('App is ready to receive connections', 'INIT', {
    host: server.host,
    port: server.port
  })
}
