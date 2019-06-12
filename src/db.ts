import { Sequelize } from 'sequelize-typescript'
import { makeChildLogger } from './logger'
import { __DEV__, DbConfig } from './defs'

// --

const dbLogger = makeChildLogger('DB')

export default async function initDatabase(config: DbConfig) {
  const uri = <string>process.env.POSTGRESQL_ADDON_URI
  const sequelize = new Sequelize(uri, {
    logging: (sql: string) => {
      dbLogger.debug(sql)
    },
    define: {
      timestamps: true
    }
  })
  await sequelize.authenticate()
  dbLogger.info('Database is online')

  // Define models
  dbLogger.debug({ msg: 'Adding models', paths: config.modelPaths })
  await sequelize.addModels(config.modelPaths)

  if (__DEV__ && process.env.DATABASE_FORCE_SYNC === 'true') {
    dbLogger.warn('Force-syncing database')
    await sequelize.sync({ force: true })
  }

  if (__DEV__ && process.env.DATABASE_SEED === 'true' && config.seedModels) {
    await config.seedModels()
  }
}
