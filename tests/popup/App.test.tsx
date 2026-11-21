import assert from 'node:assert/strict'
import { test } from 'node:test'
import { render, screen, within } from '@testing-library/react'
import { App } from '../../entrypoints/popup/App.tsx'

test('the popup header says the API is down when the health check fails', async (t) => {
  t.mock.method(globalThis, 'fetch', () => Promise.reject(new TypeError('offline')))

  render(<App />)

  const header = screen.getByRole('banner')
  assert.ok(within(header).getByText('meritum'))
  assert.ok(await within(header).findByText('API nie odpowiada'))
})

test('the popup header names the API environment when the health check passes', async (t) => {
  const health = { status: 'ok', env: 'prd', database: 'ok' }
  t.mock.method(globalThis, 'fetch', () => Promise.resolve(Response.json(health)))

  render(<App />)

  assert.ok(await screen.findByText('API: prd'))
})
