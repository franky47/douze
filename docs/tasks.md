# Tasks

> **DISCLAIMER** This document is a draft of the Task specification, it does not
> accurately reflect the state of the API yet, nor follows its implementation.
> This disclaimer will be removed once the API is stable.

---

Tasks are the [admin processes](https://12factor.net/admin-processes)
mentioned in the Twelve Factor App.

By default, Douze has only one default process, which runs an HTTP web
server.

Tasks are mini-CLI executables that are a part of the application bundle,
built and shipped along with it, and that can be invoked simply by running
them. They are bootstrapped with your application stack, but they run code
that you define, rather than start an HTTP server.

Plugins can define tasks for you. For example
[`douze-sequelize`](https://github.com/franky47/douze-sequelize)
will define admin tasks to manage a database so a minimal amount of code
is required on your part to get started.

## Defining tasks

Tasks can be added to an application by:

1. Registering them with your douze instance:

```ts
import Douze, { TaskArgs } from 'douze'

const douze = new Douze()

douze.registerTask('task-name', async ({ douze, app }: TaskArgs) => {
  // Do whatever you need with
  douze.logger.info('Hello from task-name')
})
```

2. Telling Douze where to find your app bootstrap code:

```json
// package.json
{
  "douze": {
    "app": "./dist/app.js"
  }
}
```

<!--

Note: Passing the path to the .ts file is good for development, not so much for
production, where the files are moved to the build directory.

For now, it would be simpler to target production only and require Node.js
files.
-->

`src/app.ts` will export as `default` a function that creates the
application stack used for both the HTTP server and running tasks:

```ts
// src/app.ts
import Douze from 'douze'

const douze = new Douze()

// Register plugins and tasks here

export default function createApp() {
  const app = douze.createApp()

  // Configure app stack here

  return app
}
```

## Running tasks

The Douze CLI provides a way to invoke tasks:

```zsh
# Shorthand
$ douze task-name

# The longer version
$ douze run task-name
```

Tasks can also be invoked from within the app:

```ts
douze.invokeTask('task-name', app)
```

## Task orchestration

Tasks may have to run in a specific order to be successful. We recommend
you use the Unix way of running processes in sequence to do it simply:

```zsh
$ douze db:init && douze db:migrate && douze db:seed && douze start
```
