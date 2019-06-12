import {
  Express,
  Request as ExpressRequest,
  Response,
  NextFunction
} from 'express'
import { Logger } from 'pino'

export const __DEV__ = process.env.NODE_ENV === 'development'
export const __PROD__ = process.env.NODE_ENV === 'production'

export const instanceId = [
  process.env.APP_NAME || 'douze-app',
  (process.env.INSTANCE_ID || 'dev').slice(0, 8),
  process.env.INSTANCE_NUMBER || '0'
].join('.')

// --

export interface DbConfig {
  modelPaths: string[]
  seedModels?: () => Promise<void>
}

export interface EnvConfig {
  required: string[]
  optional?: string[]
}

export interface Config {
  env?: EnvConfig
  db: DbConfig
}

export type DouzeApp = Express & {
  readonly config: Config
}

// --

export interface Request extends ExpressRequest {
  log: Logger
  fingerprint: string
  id: string
}
export { Response, NextFunction }
