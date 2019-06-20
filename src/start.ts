import { Server } from 'http'
import * as Sentry from '@sentry/node'
import { __DEV__, App, AppServer } from './defs'
import errorHandler from './middleware/errorHandler'
import * as gracefulExit from './middleware/gracefulExit'
import { PluginRegistry } from './plugin'
import { HookError } from './hooks'
import { Logger } from 'pino'

// --

export const createAppServer = (
  server: Server,
  host: string,
  port: string | number
): AppServer => Object.assign({}, server, { host, port })

// --

const startServer = async (
  app: App,
  plugins: PluginRegistry,
  logger: Logger
): Promise<AppServer> => {
  const host = process.env.HOST || '0.0.0.0'
  const port = process.env.PORT || 3000
  return new Promise(resolve => {
    let server = app.listen(port, () => {
      const appServer = createAppServer(server, host, port)

      // Graceful shutdown handler
      const handleSignal = (signal: NodeJS.Signals) => {
        logger.info({
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
            logger.info({
              msg: message,
              meta: { signal }
            })
          },
          callback: (exitCode: number) => {
            try {
              plugins.hooks.beforeExit({ app, server: appServer, signal })
            } catch (error) {
              Sentry.captureException(error)
              logger.error({
                msg: error.message,
                err: error,
                details: error.errors,
                meta: {
                  hook: 'beforeExit',
                  plugins: error.errors.map((e: HookError) => e.plugin)
                }
              })
            }
            logger.info({
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

      resolve(appServer)
    })
  })
}

// --

export default async function start(
  app: App,
  plugins: PluginRegistry,
  logger: Logger
): Promise<boolean> {
  // Final error handler
  app.use(errorHandler())

  logger.info({
    msg: 'App is starting',
    meta: {
      environment: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL
    }
  })

  try {
    const { ok, reason } = await plugins.hooks.beforeStart({ app })
    if (!ok) {
      logger.fatal({
        msg: 'App startup cancelled by beforeStart hook',
        meta: {
          reason
        }
      })
      return false
    }
  } catch (error) {
    Sentry.captureException(error)
    logger.fatal({
      msg: error.message,
      err: error,
      details: error.errors,
      meta: {
        hook: 'beforeStart',
        plugins: error.errors.map((e: HookError) => e.plugin)
      }
    })
    return false
  }

  let server
  try {
    server = await startServer(app, plugins, logger)
    logger.info({
      msg: 'App is ready to receive connections',
      meta: {
        host: server.host,
        port: server.port
      }
    })
  } catch (error) {
    Sentry.captureException(error)
    logger.fatal({ msg: error.message, err: error })
    return false
  }

  try {
    await plugins.hooks.appReady({ app, server })
  } catch (error) {
    Sentry.captureException(error)
    logger.error({
      msg: error.message,
      err: error,
      details: error.errors,
      meta: {
        hook: 'appReady',
        plugins: error.errors.map((e: HookError) => e.plugin)
      }
    })
  }

  return true
}
