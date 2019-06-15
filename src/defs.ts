import { Express } from 'express'
import { Server } from 'http'

export const __DEV__ = process.env.NODE_ENV === 'development'
export const __PROD__ = process.env.NODE_ENV === 'production'

export const appName = process.env.APP_NAME || 'douze-app'

export const instanceId = [
  appName,
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

// export interface Config {
//   env?: EnvConfig
//   db: DbConfig
// }

export type App = Express

export interface AppServer extends Server {
  host: string
  port: number | string
}
