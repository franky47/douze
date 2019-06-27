import { Express } from 'express'
import { Server } from 'http'

export const __DEV__ = process.env.NODE_ENV === 'development'
export const __PROD__ = process.env.NODE_ENV === 'production'

// --

export type App = Express

export interface AppServer extends Server {
  host: string
  port: number | string
}

export type Metadata = { [key: string]: any }
