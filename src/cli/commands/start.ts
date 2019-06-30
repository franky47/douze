import { CommanderStatic } from 'commander'
import { AppFactory } from '../../index'

// --

export const start = async <T>(createApp: AppFactory<T>) => {
  try {
    const app = await createApp()
    const douze = app.locals._douze
    await douze.start(app)
  } catch (error) {
    // todo: Handle error
    return
  }
}

export default async function defineCommand<T>(
  program: CommanderStatic,
  createApp: AppFactory<T>
) {
  program
    .command('start')
    .description('Start the HTTP server')
    .action(async () => await start(createApp))
}
