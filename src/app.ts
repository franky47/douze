import express, { Request, Response } from 'express'
import gracefulExit from 'express-graceful-exit'
import helmet from 'helmet'
import compression from 'compression'
import expressPino from 'express-pino-logger'
// import fingerprint from './middleware/fingerprint'
// import extractJwt from './middleware/extractJwt'
//import { attachGraphQLServer } from './graphql/index'
import { __DEV__, DouzeApp, Config } from './defs'
// import authRoutes from './routes/auth'
// import errorHandler from './middleware/errorHandler'
import { NextFunction } from 'connect'
import logger from './logger'

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
  //app.use(fingerprint(process.env.FINGERPRINT_SALT))
  app.use(expressPino({ logger: logger.pino }))

  // - Body parsers
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Utility
  app.use(gracefulExit.middleware(app))
  app.use(helmet())
  app.use(compression())

  // Auth
  // app.use(extractJwt())

  // Mount routes --

  app.get('/', handleCleverCloudHealthCheck, (_, res) => {
    res.send('Hello, world !')
  })
  // app.use('/auth', authRoutes)
  // attachGraphQLServer(app)
  // app.use(errorHandler())

  return app
}
