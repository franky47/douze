import crypto from 'crypto'
import nanoid from 'nanoid'
import { Request, Response, NextFunction, RequestHandler } from 'express'

export default (salt: string = nanoid()): RequestHandler => (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  req.id = nanoid(8) // Generate unique ID for the request
  const hash = crypto.createHash('sha256')
  hash.update(req.ip)
  hash.update(req.headers['user-agent'] || '')
  hash.update(salt)
  req.fingerprint = hash
    .digest('base64')
    .slice(0, 16)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  next()
}
