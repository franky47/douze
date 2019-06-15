type EnvSet = Set<string>
import checkEnv from '@47ng/check-env'
import { Logger } from 'pino'

interface EnvRequirementsStorage {
  required: EnvSet
  optional: EnvSet
}

const envRequirements: EnvRequirementsStorage = {
  required: new Set(),
  optional: new Set()
}

export const addRequiredEnv = (name: string) => {
  envRequirements.required.add(name)
}

export const addOptionalEnv = (name: string) => {
  envRequirements.optional.add(name)
}

export const checkEnvironment = (logger: Logger) => {
  const requiredCoreEnv = ['APP_NAME']
  const optionalCoreEnv = ['SENTRY_DSN']

  checkEnv({
    required: [...requiredCoreEnv, ...envRequirements.required],
    optional: [...optionalCoreEnv, ...envRequirements.optional],
    logError: (name: string) => {
      logger.error({
        msg: `Missing required environment variable ${name}`,
        meta: { name }
      })
    },
    logWarning: (name: string) => {
      logger.warn({
        msg: `Missing optional environment variable ${name}`,
        meta: { name }
      })
    }
  })
}
