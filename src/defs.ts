import express from 'express'

export const __DEV__ = process.env.NODE_ENV === 'development'
export const __PROD__ = process.env.NODE_ENV === 'production'

export const instanceId = [
  process.env.APP_NAME || 'douze-app',
  (process.env.INSTANCE_ID || 'dev').slice(0, 8),
  process.env.INSTANCE_NUMBER || '0'
].join('.')

export interface Config {
  env?: {
    required: string[]
    optional?: string[]
  }
}

export type DouzeApp = express.Express & {
  readonly config: Config
}
