#!/usr/bin/env node
import program from 'commander'
import readPkg from 'read-pkg'
import { AppFactory } from '../defs'
import { douzeRoot, appRoot } from './paths'
import defineStartCommand from './commands/start'
import defineRunCommand from './commands/run'
import defineListCommand from './commands/list'

export default async function main<T>(createApp: AppFactory<T>) {
  const pkg = await readPkg({ cwd: douzeRoot })
  const app = await readPkg({ cwd: appRoot })
  program
    .name(app.name!)
    .version(
      `${app.name} ${app.version} - Douze CLI ${pkg.version}`,
      '-v, --version'
    )
    .description(app.description!)

  await defineStartCommand(program, createApp)
  await defineListCommand(program, createApp)
  await defineRunCommand(program, createApp)

  program.parse(process.argv)
}
