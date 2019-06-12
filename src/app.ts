import express, { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import compression from 'compression'
import expressPino from 'express-pino-logger'
import { __DEV__, DouzeApp, Config } from './defs'
import { makeChildLogger } from './logger'
import * as gracefulExit from './middleware/gracefulExit'
import fingerprint from './middleware/fingerprint'

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

const httpLogger = makeChildLogger('HTTP')

const defaultConfig: Config = {
  db: {
    modelPaths: []
  }
}

export default function createApplication(
  config: Config = defaultConfig
): DouzeApp {
  const app: DouzeApp = Object.assign(express(), { config })
  app.enable('trust proxy')

  // Load middlewares --

  // - Logging
  app.use(expressPino({ logger: httpLogger }))
  app.use(fingerprint(process.env.FINGERPRINT_SALT))

  // - Body parsers
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Utility
  app.use(gracefulExit.middleware(app))
  app.use(helmet())
  app.use(compression())

  // Auth
  app.get('/', handleCleverCloudHealthCheck)

  return app
}
