import * as Sentry from '@sentry/node'
import { Request, Response, NextFunction } from 'express'
import { Logger } from 'pino'

interface LoggableRequest extends Request {
  log?: Logger
}

export default () => (
  error: Error,
  req: LoggableRequest,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(error)
  }
  Sentry.captureException(error)
  req.log && req.log.error({ error, category: 'APP' })
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  })
}
