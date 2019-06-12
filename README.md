# `Douze`

[![MIT License](https://img.shields.io/github/license/franky47/douze.svg?color=blue)](https://github.com/franky47/douze/blob/master/LICENSE)
[![Travis CI Build](https://img.shields.io/travis/com/franky47/douze.svg)](https://travis-ci.com/franky47/douze)
[![Average issue resolution time](https://isitmaintained.com/badge/resolution/franky47/douze.svg)](https://isitmaintained.com/project/franky47/douze)
[![Number of open issues](https://isitmaintained.com/badge/open/franky47/douze.svg)](https://isitmaintained.com/project/franky47/douze)

A [Twelve Factor app](https://12factor.net/) framework for Node.js written in TypeScript.

## Features

- 🐘 PostgreSQL database with [Sequelize](https://github.com/RobinBuschmann/sequelize-typescript)
- 🏗️ App scaffolding with [Express](https://expressjs.com)
- 🌲 Logging with [Pino](https://getpino.io)
- ☁️ Deployment on [Clever Cloud](https://clever-cloud.com)
- 🚨 Error reporting with [Sentry](https://sentry.io)
- 🚀 _GraphQL with [Apollo Server 2.0](https://www.apollographql.com/docs/apollo-server/)_ (Coming soon)

## Installation

```shell
$ yarn add douze
# or
$ npm install douze
```

## Usage

```ts
// index.ts
import Douze, { Request, Response } from 'douze'

export default async function main() {
  // Create an application with default configuration
  const app = Douze.createApp()

  // Attach standard Express routes & middleware to your app:
  app.use('/', (req: Request, res: Response) => {
    res.json({ hello: 'world' })
  })

  await Douze.start(app)
}
```

This basic example shows sensible default configuration, overridable by environment
variables where relevant.

## Environment

Douze is configured by environment variables where relevant, rather than code.

Here is a list of configuration environment variables:

- `APP_NAME`: string - The name of your application
- `NODE_ENV`: 'development' | 'production' - Defines how Node is configured.
- `LOG_LEVEL`: any of the levels defined in Pino, defaults to `info` in production and `debug` in development.
- `HOST`: listening host, default `'0.0.0.0'`
- `PORT`: listening port, default 3000
- `SENTRY_DSN`: Enable Sentry error reporting by passing it the DSN to use.
- `FINGERPRINT_SALT`: A salt is applied to the anonimisation function, rotate it to anonymise against previous logs
- `DATABASE_FORCE_SYNC`: Set to true in development to reset the database and sync the models. Existing data will be lost !
- `DATABASE_SEED`: Run seeding functions in development to start with fresh data.

Deployment variables (used to track deployed instances, those are set by default
on Clever Cloud):

- `POSTGRESQL_ADDON_URI`: URI to the PostgreSQL database
- `COMMIT_ID`: Git commit ID of the deployment
- `INSTANCE_ID`
- `INSTANCE_NUMBER`
