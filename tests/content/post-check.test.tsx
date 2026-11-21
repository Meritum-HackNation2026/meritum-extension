/**
 * „Sprawdź” under posts on a fake X feed: buttons in our own Shadow DOM, nothing sent without
 * a trusted click, the post's text and address sent after one, the result shown under the post.
 *
 * @feature US-WTY-01, US-WTY-04, US-WTY-05, F-02
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { act } from 'react'
import type { CheckResult } from '../../design-system/contracts/meritum.ts'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import { scanner } from '../../entrypoints/content/mount.tsx'
import { CHECK_POST_MESSAGE } from '../../utils/constants.ts'
import type { Platform } from '../../utils/platform.ts'
import type { PostCheckMessage, PostOutcome } from '../../utils/post-check.ts'
import { postAdapter } from '../../utils/posts/index.ts'

// React's act() warns unless the test runner says it supports it.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const result: CheckResult = {
  check_id: 'c1',
  status: 'done',
  corpus_version: 'v1',
  claims: [
    {
      claim: 'Od stycznia nie zapłacisz gotówką',
      verdict: 'false',
      explanation: 'Ustawa nie znosi gotówki.',
      citations: [
        {
          source: {
            id: 's1',
            title: 'Ustawa o płatnościach',
            publisher: 'Sejm',
            publisher_id: 'sejm',
            url: 'https://isap.sejm.gov.pl/ustawa',
            kind: 'akt_prawny',
            tier: 'primary',
            published_at: '2026-01-02',
          },
          fragment: 'Gotówka pozostaje prawnym środkiem płatniczym.',
          stance: 'refutes',
        },
      ],
    },
  ],
} as CheckResult

function feed(count: number): void {
  document.body.innerHTML = Array.from(
    { length: count },
    (_, i) => `<article data-testid="tweet"><a href="/ktos/status/${i}">1 h</a>
      <div data-testid="tweetText">Post numer ${i}: od stycznia nie zapłacisz gotówką</div>
      <div role="group"><div><button data-testid="reply"></button></div></div></article>`,
  ).join('')
}

function setup(send: (m: PostCheckMessage) => Promise<PostOutcome>, platform: Platform = 'x') {
  const sent: PostCheckMessage[] = []
  const scan = scanner({
    platform,
    adapter: postAdapter(platform, () => 'https://x.com/home'),
    sheet: new CSSStyleSheet(),
    dark: () => false,
    send: (m) => {
      sent.push(m)
      return send(m)
    },
  })
  act(() => scan(document))
  return { scan, sent }
}

const hosts = (part: string) => [...document.querySelectorAll(`meritum-root[data-part="${part}"]`)]
const shadow = (host: Element | undefined) => host?.shadowRoot ?? assert.fail('no shadow root')
const buttonOf = (i: number) =>
  shadow(hosts('button')[i]).querySelector('button') ?? assert.fail('no button')

async function click(button: HTMLButtonElement, trusted: boolean): Promise<void> {
  const event = new MouseEvent('click', { bubbles: true, composed: true })
  // happy-dom has no isTrusted; a browser sets it to true only for a real user's click.
  Object.defineProperty(event, 'isTrusted', { value: trusted })
  await act(async () => {
    button.dispatchEvent(event)
    await Promise.resolve()
  })
}

test('a feed of 20 posts gets 20 „Sprawdź” buttons in Shadow DOM and sends nothing', (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => assert.fail('no network request'))
  feed(20)
  const { scan, sent } = setup(() => assert.fail('nothing may be sent'))
  act(() => scan(document))
  document.querySelector('article')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  assert.equal(hosts('button').length, 20)
  assert.equal(hosts('slot').length, 20)
  assert.equal(buttonOf(0).textContent, copy.extension.check)
  assert.equal(hosts('button')[0]?.getAttribute('data-host'), 'x')
  assert.equal(sent.length, 0)
  assert.equal(fetch.mock.callCount(), 0)
})

test('a click that is not trusted sends nothing', async () => {
  feed(1)
  const { sent } = setup(() => assert.fail('nothing may be sent'))

  await click(buttonOf(0), false)

  assert.equal(sent.length, 0)
})

test('a trusted click sends the post text and address and shows the verdict with sources', async () => {
  feed(2)
  const { sent } = setup(() => Promise.resolve({ result }))

  await click(buttonOf(1), true)

  assert.deepEqual(sent, [
    {
      type: CHECK_POST_MESSAGE,
      text: 'Post numer 1: od stycznia nie zapłacisz gotówką',
      pageUrl: 'https://x.com/ktos/status/1',
    },
  ])
  const slot = shadow(hosts('slot')[1])
  const live = slot.querySelector('[aria-live="polite"]')
  assert.ok(live?.textContent?.includes(copy.verdict.false))
  assert.ok(slot.querySelector('.m-badge.false'))
  assert.ok(live?.textContent?.includes(copy.result.label))
  assert.ok(live?.textContent?.includes(copy.result.sources_title))
  assert.ok(live?.textContent?.includes('Gotówka pozostaje prawnym środkiem płatniczym.'))
  assert.equal(slot.querySelector('a')?.getAttribute('href'), 'https://isap.sejm.gov.pl/ustawa')
  assert.ok(live?.textContent?.includes(copy.result.ai_disclosure))
  assert.equal(buttonOf(1).textContent, copy.extension.checked)
  assert.equal(shadow(hosts('slot')[0]).textContent, '')
})

test('a post without text is not sent and says images are not checked yet', async () => {
  document.body.innerHTML = `<article data-testid="tweet"><div role="group"></div></article>`
  const { sent } = setup(() => assert.fail('nothing may be sent'))

  await click(buttonOf(0), true)

  assert.equal(sent.length, 0)
  assert.ok(shadow(hosts('slot')[0]).textContent?.includes(copy.status_hint.out_of_scope_image))
})

test('no answer from the background is a technical problem, never a verdict', async () => {
  feed(1)
  setup(() => Promise.reject(new Error('background gone')))

  await click(buttonOf(0), true)

  const slot = shadow(hosts('slot')[0])
  assert.ok(slot.textContent?.includes(copy.status_hint.technical_failure))
  assert.equal(slot.querySelector('.m-badge'), null)
  assert.equal(buttonOf(0).textContent, copy.extension.check)
})

test('a rescan keeps the mounted widget and mounts a post re-rendered without it', () => {
  feed(1)
  const { scan } = setup(() => Promise.resolve({ result }))
  const first = hosts('button')[0]

  act(() => scan(document))
  assert.equal(hosts('button')[0], first)

  first?.remove()
  act(() => scan(document))
  assert.equal(hosts('button').length, 1)
  assert.notEqual(hosts('button')[0], first)
})

test('on Instagram the widget takes the Instagram skin and keeps the Meritum verdict and sources', async () => {
  document.body.innerHTML = `<main><article><a href="/p/7/">x</a>
    <section><div><div role="button"><svg aria-label="Udostępnij"></svg></div></div></section>
    <div><a href="/ktos/">ktos</a><span dir="auto">Od stycznia nie zapłacisz gotówką</span></div>
    </article></main>`
  setup(() => Promise.resolve({ result }), 'instagram')

  await click(buttonOf(0), true)

  for (const host of [...hosts('button'), ...hosts('slot')]) {
    assert.equal(host.getAttribute('data-host'), 'instagram')
  }
  const slot = shadow(hosts('slot')[0])
  assert.ok(slot.querySelector('.m-badge.false')?.textContent === copy.verdict.false)
  assert.ok(slot.querySelector('.m-srcs .m-frag'))
  assert.ok(slot.querySelector('.m-top .m-mark'))
})
