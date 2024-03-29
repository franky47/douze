import { Logger } from 'pino'
import { App, AppFactory, Metadata } from './defs'
import { createRootLogger, createChildLogger } from './logger'
import { setupEnvironment, RuntimeEnvironment } from './env'
import {
  createPluginRegistry,
  registerPlugin,
  Plugin,
  PluginRegistry,
  PluginFactory
} from './plugin'
import {
  createTaskRegistry,
  registerTask,
  invokeTask,
  listTasks,
  TaskCallback,
  TaskRegistry,
  TaskArgs
} from './tasks'
import createApplication from './app'
import startApplication from './start'
import cliMain from './cli/main'

// --

export interface DouzeCtorArgs {
  secureEnv?: string[]
  redactFields?: string[]
}

export default class Douze {
  readonly env: RuntimeEnvironment
  readonly logger: Logger
  private plugins: PluginRegistry
  private tasks: TaskRegistry

  constructor({ secureEnv = [], redactFields = [] }: DouzeCtorArgs = {}) {
    const secureEnvNames = [...secureEnv, 'SENTRY_DSN']
    this.env = setupEnvironment(secureEnvNames)
    this.logger = createRootLogger(this.env, redactFields, secureEnvNames)
    this.plugins = createPluginRegistry()
    this.tasks = createTaskRegistry()
  }

  // CLI --

  /**
   * Main entrypoint for your application.
   *
   * It handles both starting the HTTP server (default behaviour) or
   * invoking tasks (admin processes).
   *
   * Call this in a `if (require.main === module) {}` block to make sure
   * it runs only when called from the command-line and not required
   * from another script.
   */
  public static async main<T>(appFactory: AppFactory<T>) {
    return cliMain(appFactory)
  }

  // App --

  /**
   * createApp
   */
  public createApp<T>() {
    const app = createApplication<T>(this.plugins, this.logger, this.env)
    // Store context in app local storage:
    app.locals._douze = this
    app.locals.logger = this.logger
    app.locals.env = this.env
    return app
  }

  /**
   * Start the application HTTP server.
   */
  public async start<T>(app: App<T>) {
    if (app.locals._douze !== this) {
      throw new Error(
        'This application was not created with this Douze instance'
      )
    }
    return startApplication(app, this.plugins, this.logger)
  }

  // Plugins --

  /**
   * Add a plugin to this instance of Douze.
   *
   * Can be either a plugin object or a function returning a plugin object.
   * Use a function to get access to the Douze instance, to register tasks
   * for example.
   */
  public extend<T, R>(input: Plugin<T, R> | PluginFactory<T, R>) {
    const plugin = typeof input === 'function' ? input(this) : input
    return registerPlugin(plugin, this.plugins, this.logger)
  }

  // Tasks --

  /**
   * registerTask
   */
  public registerTask<T>(
    name: string,
    task: TaskCallback<T>,
    meta: Metadata = {}
  ) {
    return registerTask(name, task, this.tasks, this.logger, meta)
  }

  /**
   * invokeTask
   */
  public invokeTask<T>(name: string, app: App<T>) {
    if (app.locals._douze !== this) {
      // Error: not started from the right instance
    }
    const args: TaskArgs<T> = {
      douze: this,
      app
    }
    return invokeTask(name, args, this.tasks)
  }

  /**
   * List the available tasks that can be invoked on this instance.
   */
  public listTasks(silent: boolean = false) {
    return listTasks(this.tasks, silent ? undefined : this.logger)
  }

  // --

  /**
   * createLogger
   */
  public createLogger(category: string, args: { [key: string]: any } = {}) {
    return createChildLogger(this.logger, category, args)
  }
}
