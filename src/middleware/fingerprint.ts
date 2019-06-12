import crypto from 'crypto'
import nanoid from 'nanoid'

import { Request, Response, NextFunction } from '../defs'
import { RequestHandler, Request as ExpressRequest } from 'express'

export default (salt: string = nanoid()): RequestHandler => (
  req: ExpressRequest,
  _: Response,
  next: NextFunction
) => {
  const hash = crypto.createHash('sha256')
  ;(req as Request).log.debug({
    msg: 'Generating request fingerprint'
  })
  hash.update(req.ip)
  hash.update(req.headers['user-agent'] || '')
  hash.update(salt)
  ;(req as Request).fingerprint = hash
    .digest('base64')
    .slice(0, 16)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  // Generate unique ID for the request
  ;(req as Request).id = nanoid()
  next()
}
