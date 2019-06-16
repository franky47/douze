import * as env from './env'

describe('env', () => {
  test('registries should be empty at creation', () => {
    const registry = env.createEnvRegistry()
    expect(registry.required.size).toEqual(0)
    expect(registry.optional.size).toEqual(0)
  })

  test('all core variables but NODE_ENV should be optional', () => {
    const registry = env.createEnvRegistry()
    const { required, optional } = env._assembleEnvironment(registry)
    expect(required).toEqual(['NODE_ENV'])
    expect(optional).not.toEqual([])
  })

  test('define custom required variables', () => {
    const registry = env.createEnvRegistry()
    env.registerRequiredEnv('FOO', registry)
    const { required, optional } = env._assembleEnvironment(registry)
    expect(required).toContain('FOO')
    expect(optional).not.toContain('FOO')
  })

  test('define custom optional variables', () => {
    const registry = env.createEnvRegistry()
    env.registerOptionalEnv('FOO', registry)
    const { required, optional } = env._assembleEnvironment(registry)
    expect(required).not.toContain('FOO')
    expect(optional).toContain('FOO')
  })

  test('define custom variables', () => {
    const registry = env.createEnvRegistry()
    env.registerRequiredEnv('FOO', registry)
    env.registerOptionalEnv('BAR', registry)
    const { required, optional } = env._assembleEnvironment(registry)
    expect(required).toContain('FOO')
    expect(optional).toContain('BAR')
  })
})
