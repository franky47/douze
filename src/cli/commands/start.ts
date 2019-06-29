import { CommanderStatic } from 'commander'
import { AppFactory } from '../../index'

// --

export const start = <T>(createApp: AppFactory<T>) => async () => {
  try {
    const app = await createApp()
    const douze = app.locals._douze
    await douze.start(app)
  } catch (error) {
    // todo: Handle error
  }
}

export default async function defineCommand<T>(
  program: CommanderStatic,
  createApp: AppFactory<T>
) {
  program
    .command('start')
    .description('Start the HTTP server')
    .action(start(createApp))
}
