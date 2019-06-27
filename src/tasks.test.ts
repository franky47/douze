import { Logger } from 'pino'
import {
  createTaskRegistry,
  registerTask,
  invokeTask,
  listTasks,
  TaskArgs
} from './tasks'

describe('tasks', () => {
  test('registries should be empty at creation', () => {
    const registry = createTaskRegistry()
    expect(registry.size).toEqual(0)
  })

  test('registering a task', () => {
    const registry = createTaskRegistry()
    const task = async () => {}
    const received = registerTask('foo', task, registry)
    expect(received).toBeUndefined()
    expect(registry.size).toBe(1)
    expect(registry.has('foo')).toBe(true)
  })

  test('invoking a registered task', async () => {
    const mockFn = jest.fn()
    const registry = createTaskRegistry()
    const task = async () => {
      mockFn()
      return 'bar'
    }
    const args = {}
    registerTask('foo', task, registry)
    const p = invokeTask('foo', <TaskArgs>args, registry)
    await expect(p).resolves.toBe('bar')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  test('invoking an uknown task throws an error', async () => {
    const args = {}
    const registry = createTaskRegistry()
    const p = invokeTask('foo', <TaskArgs>args, registry)
    await expect(p).rejects.toThrowError('Cannot invoke unknown task `foo`')
  })

  test('errors thrown in tasks are passed to the invoker', async () => {
    const registry = createTaskRegistry()
    const task = () => {
      throw new Error('bar')
    }
    const args = {}
    registerTask('foo', task, registry)
    const p = invokeTask('foo', <TaskArgs>args, registry)
    await expect(p).rejects.toThrowError('bar')
  })

  test('list tasks', () => {
    const registry = createTaskRegistry()
    registerTask('foo', async () => {}, registry)
    registerTask('bar', async () => {}, registry)
    const logger = {
      info: jest.fn()
    }
    const received = listTasks(registry, (logger as unknown) as Logger)
    expect(received).toEqual(['foo', 'bar'])
    expect(logger.info).toHaveBeenCalledTimes(1)
  })

  test('list tasks silently', () => {
    const registry = createTaskRegistry()
    registerTask('foo', async () => {}, registry)
    registerTask('bar', async () => {}, registry)
    const received = listTasks(registry)
    expect(received).toEqual(['foo', 'bar'])
  })
})
