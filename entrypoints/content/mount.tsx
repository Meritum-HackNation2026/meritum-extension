import { createRoot, type Root } from 'react-dom/client'
import {
  CHECK_POST_MESSAGE,
  DARK_CLASS,
  ISOLATED_EVENTS,
  WIDGET_TAG,
} from '../../utils/constants.ts'
import type { Platform } from '../../utils/platform.ts'
import type { PostCheckMessage, PostOutcome } from '../../utils/post-check.ts'
import type { PostAdapter } from '../../utils/posts/index.ts'
import { PostCheck } from './PostCheck.tsx'

/**
 * What the scanner needs from the page wiring.
 *
 * @feature US-WTY-01, US-WTY-05, ADR-09
 */
export type ScannerDeps = {
  platform: Platform
  adapter: PostAdapter
  /** widget.css as one constructed sheet, adopted by every shadow root. */
  sheet: CSSStyleSheet
  /** Whether the page is dark now; new hosts get the `dark` class. */
  dark: () => boolean
  send: (message: PostCheckMessage) => Promise<PostOutcome>
}

type Mounted = { url: string; button: Element; slot: Element; root: Root }

// <meritum-root> is a valid custom element name, so attachShadow works without a registry
// (design-system/extension/README.md, Shadow DOM recipe).
function host(part: string, deps: ScannerDeps): { el: Element; inner: HTMLElement } {
  const el = document.createElement(WIDGET_TAG)
  el.setAttribute('data-part', part)
  el.setAttribute('data-host', deps.platform)
  el.classList.toggle(DARK_CLASS, deps.dark())
  const shadow = el.attachShadow({ mode: 'open' })
  shadow.adoptedStyleSheets = [deps.sheet]
  for (const type of ISOLATED_EVENTS) shadow.addEventListener(type, (e) => e.stopPropagation())
  const inner = document.createElement('div')
  shadow.append(inner)
  return { el, inner }
}

function mount(post: Element, deps: ScannerDeps): Mounted | null {
  const button = host('button', deps)
  const slot = host('slot', deps)
  if (!deps.adapter.mount(post, button.el, slot.el)) return null
  const read = (): PostCheckMessage => ({
    type: CHECK_POST_MESSAGE,
    text: deps.adapter.text(post),
    pageUrl: deps.adapter.url(post),
  })
  const root = createRoot(button.inner)
  // biome-ignore lint/performance/noJsxPropsBind: rendered once per post, never re-rendered from here
  root.render(<PostCheck read={read} send={deps.send} slot={slot.inner} />)
  return { url: deps.adapter.url(post), button: button.el, slot: slot.el, root }
}

function unmount(old: Mounted): void {
  old.root.unmount()
  old.button.remove()
  old.slot.remove()
}

/**
 * Builds the scan that puts „Sprawdź” under every post. A scan only reads selectors and
 * attributes and never sends anything. A post keeps its widget while its address is the same
 * and the widget is still in the page; a recycled or re-rendered post gets a fresh one.
 *
 * @param deps - See {@link ScannerDeps}.
 * @returns The scan; call it on start and after page mutations.
 * @feature US-WTY-01, US-WTY-04, US-WTY-05, ADR-09, ADR-10
 */
export function scanner(deps: ScannerDeps): (root: ParentNode) => void {
  const mounted = new WeakMap<Element, Mounted>()
  const refresh = (post: Element) => {
    const old = mounted.get(post)
    if (old?.url === deps.adapter.url(post) && old.button.isConnected) return
    if (old) unmount(old)
    removeDeadHosts(post)
    const fresh = mount(post, deps)
    if (fresh) mounted.set(post, fresh)
  }
  return (root) => {
    for (const post of deps.adapter.posts(root)) refresh(post)
  }
}

// A cloned post (the mocks' infinite scroll) carries our hosts without shadow roots.
function removeDeadHosts(post: Element): void {
  for (const dead of (post.parentElement ?? post).querySelectorAll(WIDGET_TAG)) {
    if (!dead.shadowRoot) dead.remove()
  }
}
