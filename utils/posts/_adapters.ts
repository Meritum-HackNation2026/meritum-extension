/**
 * Post adapters: one per platform, from the selector contract shared by the mocks and the
 * real sites (design-system/demo/platforms/SELECTORS.md, ADR-10). They only read the page and
 * place our elements; nothing here sends anything.
 *
 * @feature US-WTY-01, US-WTY-05, ADR-10
 */
import type { Platform } from '../platform.ts'
import { POST_SELECTORS, TIKTOK_SLOT_STYLE } from './constants.ts'

/**
 * How the content script finds posts on one platform and where the widget goes.
 *
 * @feature US-WTY-01, US-WTY-05, ADR-10
 */
export type PostAdapter = {
  /** Every post now in the page under `root`. */
  posts(root: ParentNode): Element[]
  /** The post's visible text, sent only after a click. */
  text(post: Element): string
  /** The post's own address, or the page's when the post has no link. */
  url(post: Element): string
  /** Puts the „Sprawdź” button and the result slot in place; false while the bar is missing. */
  mount(post: Element, button: Element, slot: Element): boolean
}

type Parts = {
  posts(root: ParentNode): Element[]
  text(post: Element): string
  href(post: Element): string | null | undefined
  mount(post: Element, button: Element, slot: Element): boolean
}

const all = (root: ParentNode, selector: string) => [...root.querySelectorAll(selector)]
const textOf = (el: Element | null | undefined) =>
  // biome-ignore lint/performance/useDomNodeTextContent: innerText keeps the post's line breaks; read once, on click
  (el instanceof HTMLElement ? el.innerText : el?.textContent) ?? ''

const { x, facebook, instagram, reddit, tiktok } = POST_SELECTORS

const parts: Record<Platform, Parts> = {
  x: {
    posts: (root) => all(root, x.post),
    text: (post) => textOf(post.querySelector(x.text)),
    href: (post) => post.querySelector(x.link)?.getAttribute('href'),
    mount(post, button, slot) {
      const bar = post.querySelector(x.bar)
      if (!bar) return false
      const bookmark = bar.querySelector(x.before)
      bar.insertBefore(button, [...bar.children].find((c) => c.contains(bookmark)) ?? null)
      bar.after(slot)
      return true
    },
  },
  facebook: {
    // Emptied virtualised units and units without an author (reels, suggestions) are skipped.
    posts: (root) => [
      ...new Set(
        all(root, facebook.author)
          .map((author) => author.closest(facebook.unit))
          .filter(
            (unit): unit is Element => !!unit && unit.getAttribute('data-virtualized') !== 'true',
          ),
      ),
    ],
    text: (post) => textOf(post.querySelector(facebook.text)),
    href: (post) => post.querySelector(facebook.link)?.getAttribute('href'),
    mount(post, button, slot) {
      const share = post.querySelector(facebook.share)?.closest(facebook.button)
      const row = share?.parentElement
      if (!row) return false
      row.append(button)
      row.after(slot)
      return true
    },
  },
  instagram: {
    posts: (root) => all(root, instagram.post),
    text: (post) => textOf(post.querySelector(instagram.text)),
    href: (post) => post.querySelector(instagram.link)?.getAttribute('href'),
    mount(post, button, slot) {
      const share = post.querySelector(instagram.share)?.closest(instagram.button)
      const bar = share?.closest(instagram.bar)
      if (!(share?.parentElement && bar)) return false
      share.parentElement.append(button)
      bar.after(slot)
      return true
    },
  },
  reddit: {
    // The action row is inside the post's shadow root and re-renders: we add our own row.
    posts: (root) => all(root, reddit.post),
    text: (post) =>
      [post.getAttribute(reddit.title), textOf(post.querySelector(reddit.text))]
        .filter(Boolean)
        .join('\n'),
    href: (post) => post.getAttribute(reddit.link),
    mount(post, button, slot) {
      post.after(button, slot)
      return true
    },
  },
  tiktok: {
    posts: (root) => all(root, tiktok.post),
    text: (post) => textOf(post.querySelector(tiktok.text)),
    href: (post) => post.querySelector(tiktok.link)?.getAttribute('href'),
    mount(post, button, slot) {
      const share = post.querySelector(tiktok.share)
      if (!share) return false
      share.after(button)
      // No room under a full-height video: the slot floats over its bottom.
      const media = post.querySelector(tiktok.video)?.parentElement ?? post
      const isStatic = getComputedStyle(media).position === 'static'
      if (isStatic && media instanceof HTMLElement) media.style.position = 'relative'
      slot.setAttribute('style', TIKTOK_SLOT_STYLE)
      media.append(slot)
      return true
    },
  },
}

/**
 * The adapter of one platform.
 *
 * @param platform - The page's platform from {@link platformOf}.
 * @param pageUrl - Reads the page address now (SPAs change it); relative links resolve against it.
 * @returns How to find posts and mount the widget there.
 * @feature US-WTY-01, US-WTY-05, ADR-10
 */
export function postAdapter(platform: Platform, pageUrl: () => string): PostAdapter {
  const { href, ...rest } = parts[platform]
  const url = (post: Element) => {
    try {
      return new URL(href(post) ?? '', pageUrl()).href
    } catch {
      return pageUrl() // a malformed link must not stop the scan of the rest of the feed
    }
  }
  return { ...rest, url }
}
