# Plugins

Plugins are ways to extend the capabilities of Douze, through [hooks](#hooks).

In the spirit of the Twelve Factor App, plugins can also declare a list of
environment variables they require, that will be checked before the app
is even created (crash early policy).

Plugins are registered with Douze using the `extend` method:

```ts
douze.extend({
  name: 'myPlugin'
})
```

> _Note: giving your plugin a `name` is recommended to track errors thrown from it, but it is not required._

## Hooks

Hooks are callbacks invoked by Douze at some critical points in the
lifetime of your app, that give you access to the internals and let you
override and add behaviour and capabilities.

The following hooks are available:

- [`beforeMiddlewareLoad`](#beforeMiddlewareLoad)
- [`afterMiddlewareLoad`](#afterMiddlewareLoad)
- [`beforeStart`](#beforeStart)
- [`appReady`](#appReady)
- [`beforeExit`](#beforeExit)

### `beforeMiddlewareLoad`

Called before Douze starts loading middleware in `douze.createApp`.
You can inject your own middleware here, the Express app is passed in the
object argument:

```ts
douze.extend({
  hooks: {
    beforeMiddlewareLoad: ({ app }) => {
      app.use((req, res, next) => {
        // this runs first on every request
      })
    }
  }
})
```

This hook is called synchronously and in a sequence given by the order of
plugin registration with `extend`.

Any error thrown in the hook will be logged and thrown back from
`douze.createApp`.

### `afterMiddlewareLoad`

Acts exactly like `beforeMiddlewareLoad`, but is invoked after Douze
has loaded its own middleware.

As an application developer, you should probably not need to use this,
as the Express application is returned to you right after invoking this
hook, so you can setup your own middleware and routes after the call
to `douze.createApp`. This hook will be useful for plugin developers who
want to add custom middleware and routes to your app before yours
(but after Douze's).

### `beforeStart`

Called before Douze starts the server, this hook acts like a last minute
preflight check, and can abort the launch if needed.

The return value for this hook is an object:

```ts
interface BeforeStartResult {
  ok: boolean // if set to false, will request to abort launch
  reason?: any // required when ok === false
}
```

You have to provide a reason (can be a string or something more complex)
for requesting to abort the launch, which will be logged to help the
users of your plugin troubleshoot issues.

Example:

```ts
douze.extend({
  name: 'beforeStart-demo',
  hooks: {
    beforeStart: async ({ app }) => {
      if (app.disabled('some-critical-setting')) {
        return {
          ok: false,
          reason: 'not secure, some-critical-setting is disabled'
        }
      }
      return { ok: true }
    }
  }
})
```

Note that all `beforeStart` hooks from registered plugins will be allowed
to run to completion concurrently (even if one throws), and the decision
to abort launch will be taken if any of them has returned `ok: false` or
thrown an error.

> _Tip: you should try and catch most errors yourself and return a user-understandable reason for aborting, rather than the error object itself as a reason._

### `appReady`

Called after the server has been started. These hooks will run in
concurrently, and any error thrown from them will be logged, but will
not result in app shutdown.

### `beforeExit`

Called after the server has been cleanly stopped, before the app exits.
You can use it to release resources and perform cleanup tasks.

The name of the signal that caused the app to shutdown is passed in the
object argument, so you can implement different strategies, however you
can no longer cancel the shutdown at this time.

This hook is an async method, but calls to `beforeExit` from registered
plugins will be made sequencially (in the order of plugin registration),
to avoid race conditions on exit.

### Error handling in hooks

Douze will log errors that are thrown in hooks, and usually will throw
them back for you to handle where relevant.

Errors thrown from hooks will be added the following properties:

- `plugin`, containing the name of the plugin
- `hook`, containing the name of the hook

These properties will show up in the logs to make debugging easier.

## Environment variable requirements

A plugin can declare it requires some environment variables to be set to
work:

```ts
douze.extend({
  name: 'can I haz env ?',
  env: {
    required: ['API_TOKEN', 'OAUTH_SECRET', 'JWT_SECRET_KEY']
  }
})
```

Environment validation is the first thing done when calling
`douze.createApp`, and will log and throw an error if some of the
required environment variables are not set:

```
todo: Add error output here showing the name of the plugin
```

You can also declare optional environment variables, that will be checked
but won't abort the application start if not set (their absence will be
logged as a warning).

> _Tip: make sure these optional variables are only overrides for a default value implemented in your plugin._

## Return value

Plugins can optionally declare a value to return from `douze.extend`,
which can be any type. If it is callable, it will be called at the end of
plugin registration and the result will be returned instead.

This can be useful for plugins creating middleware that need only to be
injected in some sub-routes of your app:

```ts
const customMiddleware = douze.extend({
  name: 'custom-middleware'
  return: () => (req, res, next) => {
    // custom route-specific middleware logic
  }
})

// --

app.use('/api', customMiddleware, apiRoutes)
```
