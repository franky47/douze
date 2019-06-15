import { App } from '../defs'
import { Request, Response, NextFunction } from 'express'

export interface GracefulExitOptions {
  suicideTimeout: number
  exitProcess: boolean
  exitDelay: number
  force: boolean
  logger: (msg: any) => void
  callback: (exitCode: number) => void
}

const defaultOptions: GracefulExitOptions = {
  suicideTimeout: 10000, // 10 seconds
  exitProcess: true,
  exitDelay: 10, // wait in ms before process.exit, if exitProcess true
  force: false,
  logger: () => {},
  callback: () => {}
}

let hardExitTimer: NodeJS.Timeout | undefined
let connectionsClosed = false

// --

const exit = (code: number, options: GracefulExitOptions) => {
  if (!hardExitTimer) {
    return // server.close has finished, don't callback/exit twice
  }
  options.callback(code)
  if (!options.exitProcess) {
    return
  }
  options.logger('Exiting process with code ' + code)
  // Leave a bit of time to write logs, callback to complete, etc
  setTimeout(() => {
    process.exit(code)
  }, options.exitDelay)
}

// --

export const middleware = (app: App) => {
  // This flag is used to signal the below middleware when the server wants to stop.
  // New connections are handled for us by Node, but existing connections using the
  // Keep-Alive header require this workaround to close.
  app.set('graceful_exit', false)

  return function(req: Request, _: Response, next: NextFunction) {
    if (app.settings.graceful_exit === true) {
      // sorry keep-alive connections, but we need to part ways
      req.connection.setTimeout(1)
    }
    next()
  }
}

// --

export function gracefulExitHandler(
  app: any,
  server: any,
  options: GracefulExitOptions = defaultOptions
) {
  if (options.exitProcess) {
    options.logger(
      'Callback has ' + options.exitDelay + 'ms to complete before hard exit'
    )
  }
  options.logger('Closing down the http server')

  // Let everything know that we wish to exit gracefully
  app.set('graceful_exit', true)

  // Time to stop accepting new connections
  server.close(() => {
    // Everything was closed successfully, mission accomplished!
    connectionsClosed = true

    options.logger('No longer accepting connections')
    exit(0, options)

    if (hardExitTimer) {
      clearTimeout(hardExitTimer) // must be cleared after calling exit()
      hardExitTimer = undefined
    }
  })

  // If any connections linger past the suicide timeout, exit the process.
  // When this fires we've run out of time to exit gracefully.
  hardExitTimer = setTimeout(hardExitHandler, options.suicideTimeout)
}

/**
 * Track open connections to forcibly close sockets if and when the hard exit handler runs
 * @param server HTTP server
 */
// exports.init = function init(server) {
//   server.on('connection', function(socket) {
//     sockets.push(socket)
//
//     socket.on('close', function() {
//       sockets.splice(sockets.indexOf(socket), 1)
//     })
//   })
// }

const hardExitHandler = (options: GracefulExitOptions) => {
  if (connectionsClosed) {
    // this condition should never occur, see serverClosedCallback() below.
    // the user callback, if any, has already been called
    if (options.exitProcess) {
      process.exit(1)
    }
    return
  }
  // if (options.force) {
  //   sockets = sockets || []
  //   options.logger('Destroying ' + sockets.length + ' open sockets')
  //   sockets.forEach(function(socket) {
  //     socket.destroy()
  //   })
  // } else {
  // }
  options.logger('Suicide timer ran out before some connections closed')
  exit(1, options)
  hardExitTimer = undefined
}
