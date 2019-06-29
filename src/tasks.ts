import { Logger } from 'pino'
import Douze from './Douze'
import { App, Metadata } from './defs'

export interface TaskArgs<T = {}> {
  douze: Douze
  app: App<T>
}

export type TaskCallback<T> = (args: TaskArgs<T>) => Promise<any>

export type TaskRegistry = Map<string, TaskCallback<any>>

// --

export const createTaskRegistry = (): TaskRegistry => new Map()

// --

export const registerTask = <T>(
  name: string,
  callback: TaskCallback<T>,
  registry: TaskRegistry,
  logger?: Logger,
  meta: Metadata = {}
) => {
  registry.set(name, callback)
  if (logger) {
    logger.debug({
      msg: 'Registering task ' + name,
      meta
    })
  }
}

// --

export const invokeTask = async <T>(
  name: string,
  args: TaskArgs<T>,
  registry: TaskRegistry
): Promise<any> => {
  if (!registry.has(name)) {
    throw new Error(`Cannot invoke unknown task \`${name}\``)
  }
  const callback = registry.get(name)!
  return callback(args)
}

// --

export const listTasks = (
  registry: TaskRegistry,
  logger?: Logger
): string[] => {
  const tasks = Array.from(registry.keys())
  if (logger) {
    logger.info({ msg: 'Available tasks:', tasks })
  }
  return tasks
}
