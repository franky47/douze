import { Logger } from 'pino'
import Douze from './Douze'
import { App, Metadata } from './defs'

export interface TaskArgs {
  douze: Douze
  app: App
}

export type TaskCallback = (args: TaskArgs) => Promise<any>

export type TaskRegistry = Map<string, TaskCallback>

// --

export const createTaskRegistry = (): TaskRegistry => new Map()

// --

export const registerTask = (
  name: string,
  callback: TaskCallback,
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

export const invokeTask = async (
  name: string,
  args: TaskArgs,
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
