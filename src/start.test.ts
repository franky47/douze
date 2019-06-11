import { Config } from './defs'
import { mergeCheckEnvConfig } from './start'

describe('Start', () => {
  test('merge checkEnv config', () => {
    const config: Config = {
      env: {
        required: ['FOO', 'BAR'],
        optional: ['EGG', 'SPAM']
      }
    }
    const result = mergeCheckEnvConfig(['REQ_A'], ['OPT_B'], config)
    expect(result.required).toEqual(['REQ_A', 'FOO', 'BAR'])
    expect(result.optional).toEqual(['OPT_B', 'EGG', 'SPAM'])
  })
})
