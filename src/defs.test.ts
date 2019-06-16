describe('defs', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules() // this is important - it clears the cache
    process.env = { ...OLD_ENV }
  })
  afterEach(() => {
    process.env = OLD_ENV
  })

  test('unspecified NODE_ENV mode', () => {
    // Note that Douze will shout at you if you don't specify NODE_ENV,
    // it's the only required environment variable.
    process.env.NODE_ENV = undefined
    const { __DEV__, __PROD__ } = require('./defs')
    expect(__DEV__).toBe(false)
    expect(__PROD__).toBe(false)
  })

  test('development mode', () => {
    process.env.NODE_ENV = 'development'
    const { __DEV__, __PROD__ } = require('./defs')
    expect(__DEV__).toBe(true)
    expect(__PROD__).toBe(false)
  })
  test('production mode', () => {
    process.env.NODE_ENV = 'production'
    const { __DEV__, __PROD__ } = require('./defs')
    expect(__DEV__).toBe(false)
    expect(__PROD__).toBe(true)
  })
})
