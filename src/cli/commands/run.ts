import { CommanderStatic } from 'commander'
import Douze, { AppFactory } from '../../index'

// --

export default async function defineCommand<T>(
  program: CommanderStatic,
  createApp: AppFactory<T>
) {
  const exec = async (taskName: string) => {
    try {
      const app = await createApp()
      const douze: Douze = app.locals._douze
      return douze.invokeTask(taskName, app)
    } catch (error) {
      console.error(`Failed to run task ${taskName}: ${error.message}`)
    }
  }

  program
    .command('run <task>')
    .description('Invoke a task')
    .action(exec)
}
