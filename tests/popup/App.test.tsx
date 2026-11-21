import assert from 'node:assert/strict'
import { test } from 'node:test'
import { render, screen, within } from '@testing-library/react'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import { App } from '../../entrypoints/popup/App.tsx'

const storage = { get: async () => ({}), set: async () => undefined }

const { extension } = copy

test('the popup header shows the connecting text while the health check is pending', (t) => {
  t.mock.method(globalThis, 'fetch', () => new Promise(() => undefined))

  render(<App storage={storage} />)

  const header = screen.getByRole('banner')
  assert.ok(within(header).getByText(extension.popup_connecting))
})

test('the popup header says the server is down when the health check fails', async (t) => {
  t.mock.method(globalThis, 'fetch', () => Promise.reject(new TypeError('offline')))

  render(<App storage={storage} />)

  const header = screen.getByRole('banner')
  assert.ok(within(header).getByText('meritum'))
  assert.ok(await within(header).findByText(extension.popup_api_down))
})

test('the popup header names the server address when the health check passes', async (t) => {
  const health = { status: 'ok', env: 'prd', database: 'ok' }
  t.mock.method(globalThis, 'fetch', () => Promise.resolve(Response.json(health)))

  render(<App storage={storage} />)

  // getByRole throws on two headers, so this also fails when setup-dom skips cleanup.
  const header = screen.getByRole('banner')
  const text = extension.popup_api_ok.replace('{api}', 'https://meritum.gburek.app')
  assert.ok(await within(header).findByText(text))
})
