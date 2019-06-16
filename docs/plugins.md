# Plugins

Plugins are ways to extend the capabilities of Douze, through [hooks](#hooks).

In the spirit of the Twelve Factor App, plugins can also declare a list of
environment variables they require, that will be checked before the app
is even created (crash early policy).

Plugins are registered with Douze using the `extend` method:

```ts
Douze.extend({
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

Called before Douze starts loading middleware in `Douze.createApp`.
You can inject your own middleware here, the Express app is passed in the
object argument:

```ts
Douze.extend({
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
`Douze.createApp`.

### `afterMiddlewareLoad`

Acts exactly like `beforeMiddlewareLoad`, but is invoked after Douze
has loaded its own middleware.

As an application developer, you should probably not need to use this,
as the Express application is returned to you right after invoking this
hook, so you can setup your own middleware and routes after the call
to `Douze.createApp`. This hook will be useful for plugin developers who
want to add custom middleware and routes to your app before yours
(but after Douze's).

### `beforeStart`

Called before Douze starts the server, this hook acts like a last minute
preflight check, and can abort the launch if needed, by returning false
(or throwing an error, but returning false is cleaner and the preferred
way).

If you develop a plugin and find you need to abort, consider logging
the reason before returning `false`, to let the user know what happened.

### `appReady`

Called after the server has been started. These hooks will run in
parallel, and any error thrown from them will be logged, but will
not result in app shutdown.

### `beforeExit`

Called after the server has been cleanly stopped, before the app exits.
You can use it to release resources and perform cleanup tasks.

The name of the signal that caused the app to shutdown is passed in the
object argument, so you can implement different strategies, however you
can no longer cancel the shutdown at this time.

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
Douze.extend({
  name: 'can I haz env ?',
  env: {
    required: ['API_TOKEN', 'OAUTH_SECRET', 'JWT_SECRET_KEY']
  }
})
```

Environment validation is the first thing done when calling
`Douze.createApp`, and will log and throw an error if some of the
required environment variables are not set:

```
todo: Add error output here showing the name of the plugin
```

You can also declare optional environment variables, that will be checked
but won't abort the application start if not set (their absence will be
logged as a warning).

> _Tip: make sure these optional variables are only overrides for a default value implemented in your plugin._
