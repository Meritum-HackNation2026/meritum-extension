/**
 * Post adapters on DOM shaped like design-system/demo/platforms/SELECTORS.md: which elements
 * are posts, what a check sends from them and where the widget goes.
 *
 * @feature US-WTY-01, US-WTY-05, ADR-10
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Platform } from '../platform.ts'
import { postAdapter } from './index.ts'

// One post per platform, as the mocks and the real sites mark it up.
const markup: Record<Platform, string> = {
  x: `<article data-testid="tweet"><a href="/ktos/status/7"><time>1h</time></a>
    <div data-testid="tweetText">Tekst z X</div>
    <div role="group"><div><button data-testid="reply"></button></div>
    <div><button data-testid="bookmark"></button></div></div></article>`,
  facebook: `<div data-virtualized="false"><span data-ad-rendering-role="profile_name">Ktoś</span>
    <a href="https://www.facebook.com/ktos/posts/7">2 h</a>
    <div data-ad-preview="message">Tekst z Facebooka</div>
    <div class="bar"><div role="button"><span data-ad-rendering-role="share_button"></span></div></div></div>`,
  instagram: `<main><article><a href="/p/7/">x</a>
    <section><div class="left"><div role="button"><svg aria-label="Udostępnij"></svg></div></div></section>
    <span dir="auto">Tekst z Instagrama</span></article></main>`,
  reddit: `<article><shreddit-post id="t3_7" permalink="/r/polska/comments/7/" post-title="Tytuł">
    <div slot="text-body">Tekst z Reddita</div></shreddit-post></article>`,
  tiktok: `<article data-e2e="recommend-list-item-container"><section data-e2e="feed-video"></section>
    <a href="/@ktos/video/7">x</a><div data-e2e="video-desc">Tekst z TikToka</div>
    <section><div data-e2e="share-icon"></div></section></article>`,
}

const texts: Record<Platform, string> = {
  x: 'Tekst z X',
  facebook: 'Tekst z Facebooka',
  instagram: 'Tekst z Instagrama',
  reddit: 'Tytuł\nTekst z Reddita',
  tiktok: 'Tekst z TikToka',
}

const urls: Record<Platform, string> = {
  x: 'https://x.com/ktos/status/7',
  facebook: 'https://www.facebook.com/ktos/posts/7',
  instagram: 'https://x.com/p/7/',
  reddit: 'https://x.com/r/polska/comments/7/',
  tiktok: 'https://x.com/@ktos/video/7',
}

function page(html: string): HTMLElement {
  document.body.innerHTML = html
  return document.body
}

for (const platform of Object.keys(markup) as Platform[]) {
  test(`${platform}: finds the post, its text, its address and mounts both widget parts`, () => {
    // happy-dom's default location is about:blank; resolve relative links against a host.
    const base = 'https://x.com/home'
    const adapter = postAdapter(platform, () => base)
    const posts = adapter.posts(page(markup[platform]))
    assert.equal(posts.length, 1)
    const [post] = posts as [Element]

    assert.equal(adapter.text(post), texts[platform])
    assert.equal(adapter.url(post), urls[platform])

    const button = document.createElement('meritum-root')
    const slot = document.createElement('meritum-root')
    assert.equal(adapter.mount(post, button, slot), true)
    assert.ok(button.isConnected && slot.isConnected)
  })
}

test('x: the button goes into the action bar before the bookmark', () => {
  const adapter = postAdapter('x', () => 'https://x.com/')
  const [post] = adapter.posts(page(markup.x)) as [Element]
  const button = document.createElement('meritum-root')
  adapter.mount(post, button, document.createElement('meritum-root'))
  assert.equal(button.nextElementSibling?.querySelector('[data-testid="bookmark"]') !== null, true)
})

test('facebook: emptied virtualised units and units without an author are not posts', () => {
  const adapter = postAdapter('facebook', () => 'https://www.facebook.com/')
  const body = page(
    `<div data-virtualized="true"><span data-ad-rendering-role="profile_name"></span></div>
     <div data-virtualized="false"><div data-ad-preview="message">Rolka</div></div>`,
  )
  assert.deepEqual(adapter.posts(body), [])
})

test('a post whose action bar is not rendered yet is not mounted', () => {
  const adapter = postAdapter('x', () => 'https://x.com/')
  const [post] = adapter.posts(page('<article data-testid="tweet"></article>')) as [Element]
  const button = document.createElement('meritum-root')
  assert.equal(adapter.mount(post, button, document.createElement('meritum-root')), false)
  assert.equal(button.isConnected, false)
})

test('a post without its own link falls back to the page address', () => {
  const adapter = postAdapter('x', () => 'https://x.com/home')
  const [post] = adapter.posts(page('<article data-testid="tweet">Bez linku</article>')) as [
    Element,
  ]
  assert.equal(adapter.url(post), 'https://x.com/home')
})
