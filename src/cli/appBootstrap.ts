import path from 'path'
import readPkg from 'read-pkg'
import { PackageJson } from 'type-fest'
import { App } from '../index'
import { appRoot } from './paths'

interface AppPackage extends PackageJson {
  douze?: {
    app?: string
  }
}

export const getAppBootstrap = async (
  appBootstrapFile?: string
): Promise<() => App> => {
  let filePath = appBootstrapFile
  if (!filePath) {
    const pkg: AppPackage = await readPkg({ cwd: appRoot })
    if (!pkg.douze || !pkg.douze.app) {
      throw new Error('App package is missing douze.app configuration')
    }
    filePath = path.join(appRoot, pkg.douze!.app!)
  }
  if (filePath.endsWith('.ts')) {
    throw new Error(
      'TypeScript files are not supported at this time, use a Node.js-requirable file.'
    )
  }

  return require(filePath).default
}
