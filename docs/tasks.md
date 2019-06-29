# Tasks

> **DISCLAIMER** This document is a draft of the Task specification, it does not
> accurately reflect the state of the API yet, nor follows its implementation.
> This disclaimer will be removed once the API is stable.

---

Tasks are the [admin processes](https://12factor.net/admin-processes)
mentioned in the Twelve Factor App.

Douze apps are single-process applications with a built-in CLI. Running your
app without any arguments or configuration will start the HTTP web server,
but other tasks can be invoked in your app:

```zsh
$ node my-app # => starts the HTTP server
$ node my-app run db:init # run task db:init
```

Tasks are functions that are executed instead of starting the HTTP server:

```ts
import Douze from 'douze'

const douze = new Douze()

douze.registerTask('my-task', async ({ app }) => {
  // Do stuff here
})
```

```zsh
# Run it from your app's main entrypoint:
$ node my-app run my-task
```

Plugins can define tasks for you. For example
[`douze-sequelize`](https://github.com/franky47/douze-sequelize)
will define admin tasks to manage a database so a minimal amount of code
is required on your part to get started.

## Bootstrapping tasks

```ts
import Douze from 'douze'

const douze = new Douze()

const createApp = () => {
  const app = douze.createApp()

  // Setup the app here

  return app
}

if (require.main === module) {
  // Calling douze.run will parse the CLI arguments
  // and handle task invokation for you:
  douze.run(createApp)
}
```
