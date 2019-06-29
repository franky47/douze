import { CommanderStatic } from 'commander'
import { AppFactory } from '../../index'

// --

export default async function defineCommand<T>(
  program: CommanderStatic,
  createApp: AppFactory<T>
) {
  const exec = async () => {
    try {
      const app = await createApp()
      const douze = app.locals._douze
      await douze.listTasks()
    } catch (error) {
      console.error(`Failed to list tasks: ${error.message}`)
    }
  }

  program
    .command('list')
    .alias('ls')
    .description('List available tasks')
    .action(exec)
}
