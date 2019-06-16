import checkEnv from '@47ng/check-env'
import { Logger } from 'pino'

type EnvSet = Set<string>

export interface EnvRequirementsRegistry {
  required: EnvSet
  optional: EnvSet
}

// --

export const createEnvRegistry = (): EnvRequirementsRegistry => ({
  required: new Set(),
  optional: new Set()
})

// --

export const registerRequiredEnv = (
  name: string,
  registry: EnvRequirementsRegistry
) => {
  registry.required.add(name)
}

export const registerOptionalEnv = (
  name: string,
  registry: EnvRequirementsRegistry
) => {
  registry.optional.add(name)
}

// --

export const _assembleEnvironment = (registry: EnvRequirementsRegistry) => {
  const requiredCoreEnv: string[] = ['NODE_ENV']
  const optionalCoreEnv: string[] = ['APP_NAME', 'SENTRY_DSN']
  return {
    required: [...requiredCoreEnv, ...registry.required],
    optional: [...optionalCoreEnv, ...registry.optional]
  }
}

// --

export const checkEnvironment = (
  logger: Logger,
  registry: EnvRequirementsRegistry
) => {
  const { required, optional } = _assembleEnvironment(registry)
  checkEnv({
    required,
    optional,
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
