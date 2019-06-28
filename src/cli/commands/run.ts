import { CommanderStatic } from 'commander'
import { getAppBootstrap } from '../appBootstrap'
import Douze from '../../index'

// --

export interface RunOptions {
  app?: string // Path to the app bootstrap file
}

export const run = async (taskName: string, options: RunOptions) => {
  try {
    const createApp = await getAppBootstrap(options.app)
    const app = createApp()
    const douze: Douze = app.locals._douze
    return douze.invokeTask(taskName, app)
  } catch (error) {
    console.error(`Failed to run task ${taskName}: ${error.message}`)
  }
}

export default async function defineCommand(program: CommanderStatic) {
  program
    .command('run <task>')
    .description('Invoke a task')
    .option('-a, --app <file>', 'Path to app bootstrap file')
    .action(run)
}
