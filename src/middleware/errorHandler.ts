import * as Sentry from '@sentry/node'
import { Request, Response, NextFunction } from '../defs'

export default () => (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(error)
  }
  Sentry.captureException(error)
  req.log.error({ error, category: 'APP' })
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  })
}
