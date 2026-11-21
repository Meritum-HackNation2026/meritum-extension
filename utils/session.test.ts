import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getOrCreateSessionId } from './session.ts'

test('two concurrent first uses draw one session_id, not two', async () => {
  const data: Record<string, unknown> = {}
  const store = {
    get: (key: string) => Promise.resolve({ [key]: data[key] }),
    set: (items: Record<string, unknown>) => {
      Object.assign(data, items)
      return Promise.resolve()
    },
  }

  const [a, b] = await Promise.all([getOrCreateSessionId(store), getOrCreateSessionId(store)])

  assert.equal(a, b)
  assert.equal(data['session_id'], a)
})
