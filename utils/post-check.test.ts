/**
 * The „Sprawdź” under a post: the post's text and address become a CheckRequest, and the
 * background answers the content script's message through the popup's API client.
 *
 * @feature US-WTY-01, US-WTY-04, F-02
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CheckResult } from '../design-system/contracts/meritum.ts'
import { toPostRequest } from './check.ts'
import { CHECK_POST_MESSAGE } from './constants.ts'
import { answerPostCheck } from './post-check.ts'

const api = 'https://api.test'
const result: CheckResult = { check_id: 'c1', status: 'out_of_scope', corpus_version: 'v1' }
const postUrl = 'https://x.com/ktos/status/1'
const storage = { get: async () => ({ session_id: 'sesja-1234' }), set: async () => undefined }

test('a post becomes a text request with the post address as page_url', () => {
  assert.deepEqual(toPostRequest('  Od stycznia nie zapłacisz gotówką ', postUrl), {
    channel: 'extension',
    text: 'Od stycznia nie zapłacisz gotówką',
    page_url: postUrl,
  })
})

test('a post that is only a link is still sent as text from that post', () => {
  const request = toPostRequest('https://example.pl/artykul', postUrl)
  assert.deepEqual(request, {
    channel: 'extension',
    text: 'https://example.pl/artykul',
    page_url: postUrl,
  })
})

test('a post address that is not http(s) is left out', () => {
  assert.deepEqual(toPostRequest('Treść posta', 'javascript:alert(1)'), {
    channel: 'extension',
    text: 'Treść posta',
  })
})

test('a post without text is empty and one over 4000 characters is too long', () => {
  assert.equal(toPostRequest('  ', postUrl), 'empty')
  assert.equal(toPostRequest('a'.repeat(4001), postUrl), 'too_long')
})

test('the background sends the post with the stored session id and returns the result', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () =>
    Promise.resolve(Response.json({ check_id: 'c1', result })),
  )

  const message = { type: CHECK_POST_MESSAGE, text: 'Treść posta', pageUrl: postUrl }
  const outcome = await answerPostCheck(api, storage, message)

  assert.deepEqual(outcome, { result })
  const [url, init] = fetch.mock.calls[0]?.arguments ?? []
  assert.equal(url, `${api}/api/v1/checks`)
  assert.equal(new Headers(init?.headers).get('X-Meritum-Session'), 'sesja-1234')
  assert.deepEqual(JSON.parse(String(init?.body)), {
    channel: 'extension',
    text: 'Treść posta',
    page_url: postUrl,
  })
})

test('the background rejects a post without text before any request', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('no call')))

  const outcome = await answerPostCheck(api, storage, {
    type: CHECK_POST_MESSAGE,
    text: ' ',
    pageUrl: postUrl,
  })

  assert.deepEqual(outcome, { input: 'empty' })
  assert.equal(fetch.mock.callCount(), 0)
})

test('the background ignores messages that are not a post check', (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('no call')))

  for (const message of [null, 'x', { type: 'other' }, { type: CHECK_POST_MESSAGE, text: 1 }]) {
    assert.equal(answerPostCheck(api, storage, message), null)
  }
  assert.equal(fetch.mock.callCount(), 0)
})
