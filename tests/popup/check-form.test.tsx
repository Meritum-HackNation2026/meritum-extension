/**
 * Popup paste box: the same field and messages as the web form, the AI notice at first
 * contact and the result shown in the popup, against a fake API.
 *
 * @feature US-WTY-02, US-WTY-04, US-BEZ-07, F-02, F-21
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CheckRequest, CheckResult } from '../../design-system/contracts/meritum.ts'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import { App } from '../../entrypoints/popup/App.tsx'

const storage = { get: async () => ({}), set: async () => undefined }

const result: CheckResult = {
  check_id: 'c1',
  status: 'done',
  corpus_version: 'v1',
  ai_disclosure: true,
  claims: [
    { claim: 'Ziemia jest płaska.', verdict: 'false', explanation: 'Pomiary pokazują kulę.' },
  ],
}

/** Fake API: health ok, every check is accepted and done on the first status poll. */
function fakeApi() {
  const sent: CheckRequest[] = []
  const handler = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/api/v1/checks') && init?.method === 'POST') {
      sent.push(JSON.parse(String(init.body)) as CheckRequest)
      return Promise.resolve(Response.json({ check_id: 'c1', steps: [] }, { status: 202 }))
    }
    if (url.endsWith('/api/v1/checks/c1')) {
      return Promise.resolve(Response.json({ check_id: 'c1', steps: [], result }))
    }
    return Promise.resolve(Response.json({ status: 'ok', env: 'prd', database: 'ok' }))
  }
  return { sent, handler }
}

function ask(value: string) {
  fireEvent.change(screen.getByLabelText(copy.form.input_label), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: copy.form.submit }))
}

test('on first opening the popup says an AI answers and nothing is sent without a click', (t) => {
  const api = fakeApi()
  t.mock.method(globalThis, 'fetch', api.handler)

  render(<App storage={storage} />)

  assert.ok(screen.getByText(copy.ai_notice.first_contact))
  assert.ok(screen.getByText(copy.extension.page_hint))
  assert.deepEqual(api.sent, [])
})

test('a pasted link goes to POST /api/v1/checks on the extension channel and the result shows', async (t) => {
  const api = fakeApi()
  t.mock.method(globalThis, 'fetch', api.handler)
  render(<App storage={storage} />)

  ask('https://example.pl/artykul')

  assert.ok(await screen.findByText(copy.verdict.false))
  assert.ok(screen.getByText('Ziemia jest płaska.'))
  assert.ok(screen.getByText(copy.result.ai_disclosure))
  assert.deepEqual(api.sent, [{ channel: 'extension', url: 'https://example.pl/artykul' }])
})

test('text over 4000 characters shows the web form message and sends nothing', (t) => {
  const api = fakeApi()
  t.mock.method(globalThis, 'fetch', api.handler)
  render(<App storage={storage} />)

  ask('a'.repeat(4001))

  assert.equal(screen.getByRole('alert').textContent, copy.errors.too_long)
  assert.deepEqual(api.sent, [])
})

test('a rejected input clears the previous answer', async (t) => {
  t.mock.method(globalThis, 'fetch', fakeApi().handler)
  render(<App storage={storage} />)
  ask('https://example.pl/artykul')
  await screen.findByText(copy.verdict.false)

  ask('ab')

  assert.equal(screen.getByRole('alert').textContent, copy.errors.empty)
  assert.ok(!screen.queryByText(copy.verdict.false), 'the old verdict is gone')
})

test('a check with no claims says that no result is not a denial', async (t) => {
  t.mock.method(globalThis, 'fetch', (_input: RequestInfo | URL, init?: RequestInit) => {
    const done = { ...result, claims: [] }
    return init?.method === 'POST'
      ? Promise.resolve(Response.json({ check_id: 'c1', steps: [], result: done }))
      : Promise.resolve(Response.json({ status: 'ok', env: 'prd', database: 'ok' }))
  })
  render(<App storage={storage} />)

  ask('Od stycznia nie zapłacisz w sklepie gotówką')

  assert.ok(await screen.findByText(copy.result.no_result_hint))
})

test('a rate-limited check shows the message, never a verdict', async (t) => {
  t.mock.method(globalThis, 'fetch', (input: RequestInfo | URL) =>
    String(input).endsWith('/api/v1/checks')
      ? Promise.resolve(new Response(null, { status: 429 }))
      : Promise.resolve(Response.json({ status: 'ok', env: 'prd', database: 'ok' })),
  )
  render(<App storage={storage} />)

  ask('Od stycznia nie zapłacisz w sklepie gotówką')

  assert.ok(await screen.findByText(copy.errors.rate_limited))
})

test('Esc closes the popup', (t) => {
  t.mock.method(globalThis, 'fetch', fakeApi().handler)
  const close = t.mock.method(window, 'close', () => undefined)
  render(<App storage={storage} />)

  fireEvent.keyDown(document, { key: 'Escape' })

  assert.equal(close.mock.callCount(), 1)
})
