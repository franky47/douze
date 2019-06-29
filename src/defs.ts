import { Express } from 'express'
import { Server } from 'http'
import Douze from './Douze'
import { Logger } from 'pino'
import { RuntimeEnvironment } from './env'

export const __DEV__ = process.env.NODE_ENV === 'development'
export const __PROD__ = process.env.NODE_ENV === 'production'

// --

export interface App<T = {}> extends Express {
  locals: T & {
    _douze: Douze
    logger: Logger
    env: RuntimeEnvironment
  }
}

export type AppFactory<T> = (() => App<T>) | (() => Promise<App<T>>)

export interface AppServer extends Server {
  host: string
  port: number | string
}

export type Metadata = { [key: string]: any }
