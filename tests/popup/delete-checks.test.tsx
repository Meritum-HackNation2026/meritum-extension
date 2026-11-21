/**
 * Popup: the user deletes the checks sent from this extension (US-BEZ-05, US-BEZ-06),
 * against a fake API and a fake chrome.storage.local.
 *
 * @feature US-BEZ-05, US-BEZ-06
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fireEvent, render, screen } from '@testing-library/react'
import type { SessionId } from '../../design-system/contracts/meritum.ts'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import { App } from '../../entrypoints/popup/App.tsx'
import type { SessionStore } from '../../utils/session.ts'

const { extension } = copy
const deletePath = /\/api\/v1\/sessions\/([^/]+)\/checks$/
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function fakeStorage(
  initial: Record<string, unknown> = {},
): SessionStore & { data: Record<string, unknown> } {
  const data = { ...initial }
  return {
    data,
    get: (key) => Promise.resolve({ [key]: data[key] }),
    set: (items) => {
      Object.assign(data, items)
      return Promise.resolve()
    },
  }
}

/** Fake API: health is ok, deleting a session's checks answers `deleteStatus`. */
function fakeApi(deleteStatus: number) {
  const deleted: SessionId[] = []
  const handler = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const match = deletePath.exec(url)
    if (match?.[1] && init?.method === 'DELETE') {
      deleted.push(decodeURIComponent(match[1]))
      return Promise.resolve(new Response(null, { status: deleteStatus }))
    }
    return Promise.resolve(Response.json({ status: 'ok', env: 'prd', database: 'ok' }))
  }
  return { deleted, handler }
}

test('the popup creates a random UUID v4 session_id on first use', async (t) => {
  t.mock.method(globalThis, 'fetch', fakeApi(204).handler)
  const storage = fakeStorage()

  render(<App storage={storage} />)

  await screen.findByRole('button', { name: extension.popup_delete })
  await new Promise((r) => setTimeout(r, 0))
  assert.match(String(storage.data['session_id']), uuidV4)
})

test('deleting after confirmation sends the session_id and draws a new one', async (t) => {
  const api = fakeApi(204)
  t.mock.method(globalThis, 'fetch', api.handler)
  const old = '0b9a3c3e-6f1e-4c55-9a51-7d1f0c4b2a10'
  const storage = fakeStorage({ session_id: old })

  render(<App storage={storage} />)
  fireEvent.click(await screen.findByRole('button', { name: extension.popup_delete }))
  assert.ok(screen.getByText(extension.popup_delete_confirm))
  fireEvent.click(screen.getByRole('button', { name: extension.popup_delete_yes }))

  assert.ok(await screen.findByText(extension.popup_deleted))
  assert.deepEqual(api.deleted, [old])
  assert.match(String(storage.data['session_id']), uuidV4)
  assert.notEqual(storage.data['session_id'], old)
})

test('cancelling the confirmation deletes nothing', async (t) => {
  const api = fakeApi(204)
  t.mock.method(globalThis, 'fetch', api.handler)

  render(<App storage={fakeStorage({ session_id: 'a' })} />)
  fireEvent.click(await screen.findByRole('button', { name: extension.popup_delete }))
  fireEvent.click(screen.getByRole('button', { name: extension.popup_delete_cancel }))

  assert.equal(screen.queryByText(extension.popup_delete_confirm), null)
  assert.deepEqual(api.deleted, [])
})

test('a server error shows a message and keeps the session_id', async (t) => {
  t.mock.method(globalThis, 'fetch', fakeApi(500).handler)
  const old = '0b9a3c3e-6f1e-4c55-9a51-7d1f0c4b2a10'
  const storage = fakeStorage({ session_id: old })

  render(<App storage={storage} />)
  fireEvent.click(await screen.findByRole('button', { name: extension.popup_delete }))
  fireEvent.click(screen.getByRole('button', { name: extension.popup_delete_yes }))

  assert.ok(await screen.findByText(extension.popup_delete_failed))
  assert.equal(storage.data['session_id'], old)
})

test('Esc closes the confirmation without deleting', async (t) => {
  const api = fakeApi(204)
  t.mock.method(globalThis, 'fetch', api.handler)

  render(<App storage={fakeStorage({ session_id: 'a' })} />)
  fireEvent.click(await screen.findByRole('button', { name: extension.popup_delete }))
  fireEvent.keyDown(screen.getByRole('button', { name: extension.popup_delete_yes }), {
    key: 'Escape',
  })

  assert.equal(screen.queryByText(extension.popup_delete_confirm), null)
  assert.deepEqual(api.deleted, [])
})
