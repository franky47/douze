import { CommanderStatic } from 'commander'
import { AppFactory } from '../../index'

// --

export default async function defineCommand<T>(
  program: CommanderStatic,
  createApp: AppFactory<T>
) {
  const exec = (taskName: string) => async () => {
    try {
      const app = await createApp()
      const douze = app.locals._douze
      return douze.invokeTask(taskName, app)
    } catch (error) {
      console.error(`Failed to run task ${taskName}: ${error.message}`)
    }
  }

  program
    .command('run <task>')
    .description('Invoke a task (from the list below)')
    .action(taskName => exec(taskName)())

  // Inject shorthand task invokation directly
  try {
    const silent = process.env.DOUZE_SILENT
    process.env.DOUZE_SILENT = 'true'
    const app = await createApp()
    const douze = app.locals._douze
    const tasks = await douze.listTasks(true)
    process.env.DOUZE_SILENT = silent
    for (const task of tasks) {
      program
        .command(task)
        .description(`Shorthand for ${program.name()} run ${task}`)
        .action(exec(task))
    }
  } catch (error) {
    console.error(`Failed to list tasks: ${error.message}`)
  }
}
