/**
 * The popup's check: input validated like the web form, sent to POST /api/v1/checks and
 * followed until the result arrives, against a fake API.
 *
 * @feature US-WTY-02, US-WTY-04, F-02
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CheckResult } from '../design-system/contracts/meritum.ts'
import { sendCheck, toCheckRequest } from './check.ts'

const api = 'https://api.test'
const session = 'sesja-1234'
const result: CheckResult = { check_id: 'c1', status: 'out_of_scope', corpus_version: 'v1' }

test('a full http(s) link becomes a url request on the extension channel', () => {
  assert.deepEqual(toCheckRequest('  https://example.pl/artykul '), {
    channel: 'extension',
    url: 'https://example.pl/artykul',
  })
})

test('text becomes a text request on the extension channel', () => {
  assert.deepEqual(toCheckRequest(' Od stycznia nie zapłacisz gotówką '), {
    channel: 'extension',
    text: 'Od stycznia nie zapłacisz gotówką',
  })
})

test('input shorter than 3 characters is empty', () => {
  assert.equal(toCheckRequest('  ab  '), 'empty')
})

test('a link without http(s) is an invalid url', () => {
  assert.equal(toCheckRequest('ftp://example.com/plik'), 'invalid_url')
  assert.equal(toCheckRequest('www.example.pl/artykul'), 'invalid_url')
})

test('text of 4000 characters passes and 4001 is too long', () => {
  assert.equal(typeof toCheckRequest('a'.repeat(4000)), 'object')
  assert.equal(toCheckRequest('a'.repeat(4001)), 'too_long')
})

test('sendCheck posts the request with the session header and follows the status until the result', async (t) => {
  const calls: string[] = []
  let polls = 0
  t.mock.method(globalThis, 'fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const header = new Headers(init?.headers).get('X-Meritum-Session')
    calls.push(`${init?.method ?? 'GET'} ${String(input)} ${String(init?.body ?? '')} ${header}`)
    if (init?.method === 'POST') {
      return Promise.resolve(Response.json({ check_id: 'c1', steps: [] }, { status: 202 }))
    }
    polls += 1
    const done = polls > 1 ? { result } : {}
    return Promise.resolve(Response.json({ check_id: 'c1', steps: [], ...done }))
  })

  const outcome = await sendCheck(
    api,
    { channel: 'extension', url: 'https://example.pl/a' },
    session,
  )

  assert.deepEqual(outcome, { result })
  assert.deepEqual(calls, [
    `POST ${api}/api/v1/checks {"channel":"extension","url":"https://example.pl/a"} ${session}`,
    `GET ${api}/api/v1/checks/c1  ${session}`,
    `GET ${api}/api/v1/checks/c1  ${session}`,
  ])
})

test('sendCheck reports the rate limit, a busy server, no network and other failures', async (t) => {
  const answer = (status: number) => () => Promise.resolve(new Response(null, { status }))
  const request = { channel: 'extension', text: 'abc' } as const
  const fetchMock = t.mock.method(globalThis, 'fetch', answer(429))
  assert.deepEqual(await sendCheck(api, request, session), { problem: 'rate_limited' })

  fetchMock.mock.mockImplementation(answer(503))
  assert.deepEqual(await sendCheck(api, request, session), { problem: 'busy' })

  fetchMock.mock.mockImplementation(answer(500))
  assert.deepEqual(await sendCheck(api, request, session), { problem: 'failed' })

  fetchMock.mock.mockImplementation(() => Promise.reject(new TypeError('offline')))
  assert.deepEqual(await sendCheck(api, request, session), { problem: 'offline' })
})

test('sendCheck treats a result with an unknown status or verdict as a failure', async (t) => {
  const answer = (bad: object) => () =>
    Promise.resolve(Response.json({ check_id: 'c1', steps: [], result: { ...result, ...bad } }))
  const request = { channel: 'extension', text: 'abc' } as const
  const fetchMock = t.mock.method(globalThis, 'fetch', answer({ status: 'maybe' }))
  assert.deepEqual(await sendCheck(api, request, session), { problem: 'failed' })

  const claim = { claim: 'X', verdict: 'half_true', explanation: 'Y' }
  fetchMock.mock.mockImplementation(answer({ status: 'done', claims: [claim] }))
  assert.deepEqual(await sendCheck(api, request, session), { problem: 'failed' })
})

test('sendCheck treats a result the popup cannot render as a failure', async (t) => {
  const answer = (bad: object) => () =>
    Promise.resolve(Response.json({ check_id: 'c1', steps: [], result: { ...result, ...bad } }))
  const request = { channel: 'extension', text: 'abc' } as const
  const fetchMock = t.mock.method(globalThis, 'fetch', answer({ status: 'done', claims: 'abc' }))
  assert.deepEqual(await sendCheck(api, request, session), { problem: 'failed' })

  const claim = { claim: { x: 1 }, verdict: 'false', explanation: 'Y' }
  fetchMock.mock.mockImplementation(answer({ status: 'done', claims: [claim] }))
  assert.deepEqual(await sendCheck(api, request, session), { problem: 'failed' })

  fetchMock.mock.mockImplementation(answer({ message: { x: 1 } }))
  assert.deepEqual(await sendCheck(api, request, session), { problem: 'failed' })
})

test('sendCheck treats citations the widget cannot render as a failure', async (t) => {
  const withCitation = (citation: unknown) => () =>
    Promise.resolve(
      Response.json({
        check_id: 'c1',
        result: {
          ...result,
          status: 'done',
          claims: [{ claim: 'X', verdict: 'false', explanation: 'Y', citations: [citation] }],
        },
      }),
    )
  const request = { channel: 'extension', text: 'abc' } as const
  const source = { title: 'T', publisher: 'P', url: 'https://a.pl', kind: 'media', tier: 'primary' }
  const fetchMock = t.mock.method(globalThis, 'fetch', withCitation({ source, fragment: 'F' }))
  assert.ok('result' in (await sendCheck(api, request, session)))

  for (const bad of [
    null,
    { source, fragment: 1 },
    { source: { ...source, url: 2 }, fragment: 'F' },
  ]) {
    fetchMock.mock.mockImplementation(withCitation(bad))
    assert.deepEqual(await sendCheck(api, request, session), { problem: 'failed' })
  }
})
