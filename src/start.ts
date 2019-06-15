import * as Sentry from '@sentry/node'
import {
  instanceId,
  __DEV__,
  __PROD__,
  EnvConfig,
  App,
  AppServer
} from './defs'
import errorHandler from './middleware/errorHandler'
import * as gracefulExit from './middleware/gracefulExit'
import { createChildLogger } from './logger'
import { runHooks } from './hooks'
import { checkEnvironment } from './env'

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

const appLogger = createChildLogger('app')

const startServer = async (app: App): Promise<AppServer> => {
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
          exitProcess: true,
          suicideTimeout: 10000, // 10 seconds
          exitDelay: 10,
          force: false,
          logger: (message: any) => {
            appLogger.info({
              msg: message,
              meta: { signal }
            })
          },
          callback: (exitCode: number) => {
            runHooks.beforeExit({
              app,
              server: Object.assign({ host, port }, server),
              signal
            })
            appLogger.info({
              msg: 'Bye bye',
              meta: {
                exitCode,
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

export default async function start(app: App): Promise<boolean> {
  app.use(errorHandler()) // todo: move that to app.start

  appLogger.info({
    msg: 'App is starting',
    meta: {
      environment: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL
    }
  })

  try {
    checkEnvironment(appLogger)
  } catch (error) {
    appLogger.fatal({
      message: error.message,
      meta: {
        missing: error.missing
      }
    })
    process.exitCode = 1
    return false
  }

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
    const goForLaunch = await runHooks.beforeStart({ app })
    if (!goForLaunch) {
      appLogger.warn('App startup cancelled by beforeStart hook', {})
      return false
    }

    const server = await startServer(app)
    appLogger.info({
      msg: 'App is ready to receive connections',
      meta: {
        host: server.host,
        port: server.port
      }
    })
    return true
  } catch (error) {
    // todo: move this to douze-sequelize
    // if (
    //   error.name === 'SequelizeConnectionError' ||
    //   error.name === 'SequelizeConnectionRefusedError'
    // ) {
    //   appLogger.error({
    //     msg: 'Could not connect to database',
    //     meta: {
    //       ...error,
    //       message: error.message
    //     }
    //   })
    // } else {
    // }
    appLogger.fatal(error)
    Sentry.captureException(error)
    process.exitCode = 1
    return false
  }
}
