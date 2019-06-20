import dotenv from 'dotenv'
import checkEnv from '@47ng/check-env'
import { Logger } from 'pino'
import envAlias, { Alias } from 'env-alias'

export interface RuntimeEnvironment {
  env: NodeJS.ProcessEnv
  aliases: Alias[]
  appName: string
  instanceId: string
  revision?: string
}

// --

export const setupEnvironment = (): RuntimeEnvironment => {
  dotenv.config()
  const aliases = envAlias({ prefix: 'DOUZE_ENV_ALIAS_' })
  const appName = process.env.APP_NAME || 'douze-app'
  return {
    env: process.env,
    aliases,
    appName,
    revision: process.env.COMMIT_ID,
    instanceId: [
      appName,
      process.env.INSTANCE_ID || 'dev',
      process.env.INSTANCE_NUMBER || '0'
    ].join('.')
  }
}

// --

type EnvName = string

export interface EnvRequirementsRegistry {
  required: Set<EnvName>
  optional: Set<EnvName>
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
  registry: EnvRequirementsRegistry,
  runtimeEnvironment: RuntimeEnvironment
) => {
  // Log aliased environment variables
  if (runtimeEnvironment.aliases.length > 0) {
    logger.debug({
      msg: 'Aliased environment variables',
      aliases: runtimeEnvironment.aliases.map(alias => ({
        // Note: be careful not to leak env values in the logs
        source: alias.sourceName,
        dest: alias.destName,
        set: process.env[alias.destName] !== undefined
      }))
    })
  }

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
