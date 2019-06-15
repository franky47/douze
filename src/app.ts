import express, { Request, Response, NextFunction } from 'express'
import pino from 'pino'
import helmet from 'helmet'
import compression from 'compression'
import expressPino from 'express-pino-logger'
import { __DEV__, App } from './defs'
import { makeChildLogger } from './logger'
import * as gracefulExit from './middleware/gracefulExit'
import fingerprint from './middleware/fingerprint'
import { runHooks } from './hooks'

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

// const defaultConfig: Config = {
//   db: {
//     modelPaths: []
//   }
// }

export default function createApplication(): App {
  const app: App = express()
  app.enable('trust proxy')

  // Load middlewares --

  runHooks.beforeMiddlewareLoad({ app })

  // - Logging
  app.use(fingerprint(process.env.DOUZE_FINGERPRINT_SALT))
  app.use(
    expressPino({
      logger: makeChildLogger('HTTP'),
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

  runHooks.afterMiddlewareLoad({ app })

  return app
}
