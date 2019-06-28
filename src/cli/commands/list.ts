import { CommanderStatic } from 'commander'
import { getAppBootstrap } from '../appBootstrap'
import Douze from '../../index'

// --

export interface ListOptions {
  app?: string // Path to the app bootstrap file
}

export const list = async (options: ListOptions) => {
  try {
    const createApp = await getAppBootstrap(options.app)
    const app = createApp()
    const douze: Douze = app.locals._douze
    await douze.listTasks()
  } catch (error) {
    console.error(`Failed to list tasks: ${error.message}`)
  }
}

export default async function defineCommand(program: CommanderStatic) {
  program
    .command('list')
    .alias('ls')
    .description('List available tasks')
    .option('-a, --app <file>', 'Path to app bootstrap file')
    .action(list)
}
