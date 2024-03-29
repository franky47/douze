import Douze from './Douze'

export default Douze

// Export types
export { __DEV__, __PROD__, App, AppFactory } from './defs'
export { RuntimeEnvironment } from './env'
export { Plugin, PluginFactory } from './plugin'
export {
  Hooks,
  MiddlewareLoadArgs,
  BeforeStartArgs,
  AppReadyArgs,
  BeforeExitArgs,
  BeforeStartResult
} from './hooks'
export { TaskArgs, TaskCallback } from './tasks'
