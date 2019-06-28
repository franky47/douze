#!/usr/bin/env node
import program from 'commander'
import readPkg from 'read-pkg'
import { douzeRoot } from './paths'
import defineRunCommand from './commands/run'
import defineListCommand from './commands/list'

const readArguments = async () => {
  const pkg = await readPkg({ cwd: douzeRoot })
  program
    .name(pkg.name!)
    .version(pkg.version!)
    .description('CLI for Douze')

  defineRunCommand(program)
  defineListCommand(program)

  program.parse(process.argv)
}

async function main() {
  readArguments()
}

if (require.main === module) {
  main()
}
