import widgetCss from '../../design-system/extension/widget.css?inline'
import {
  DARK_CLASS,
  PREFERS_DARK,
  SCAN_DELAY_MS,
  THEME_ATTRIBUTES,
  WIDGET_TAG,
} from '../../utils/constants.ts'
import { platformOf } from '../../utils/platform.ts'
import { type PostCheckMessage, type PostOutcome, toPostOutcome } from '../../utils/post-check.ts'
import { postAdapter } from '../../utils/posts/index.ts'
import { isDarkBackground } from '../../utils/theme.ts'
import { CONTENT_MATCHES } from './constants.ts'
import { registerFonts } from './fonts.ts'
import { scanner } from './mount.tsx'

// Computed background of <body>, then <html>; with neither opaque, the system setting.
function pageIsDark(): boolean {
  for (const el of [document.body, document.documentElement]) {
    const dark = isDarkBackground(getComputedStyle(el).backgroundColor)
    if (dark !== null) return dark
  }
  return matchMedia(PREFERS_DARK).matches
}

function followTheme(): void {
  const apply = () => {
    const dark = pageIsDark()
    for (const el of document.querySelectorAll(WIDGET_TAG)) el.classList.toggle(DARK_CLASS, dark)
  }
  const observer = new MutationObserver(() => requestAnimationFrame(apply))
  for (const el of [document.documentElement, document.body]) {
    observer.observe(el, { attributes: true, attributeFilter: [...THEME_ATTRIBUTES] })
  }
  matchMedia(PREFERS_DARK).addEventListener('change', apply)
}

/**
 * Content script on the five platforms and their mocks: puts „Sprawdź” under every post in
 * its own Shadow DOM (ADR-09) by the shared selector contract (ADR-10). The post goes to the
 * background, and from there to the API, only after a trusted click; the feed is never sent.
 *
 * @feature US-WTY-01, US-WTY-04, US-WTY-05, F-02, ADR-09, ADR-10
 */
export default defineContentScript({
  matches: CONTENT_MATCHES,
  runAt: 'document_idle',
  main() {
    const platform = platformOf(location.hostname)
    if (!platform) return
    document.documentElement.dataset['meritumPlatform'] = platform
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(widgetCss)
    // A font that fails to load leaves the fallback face; the widget still works.
    registerFonts(sheet).catch(() => undefined)
    const scan = scanner({
      platform,
      adapter: postAdapter(platform, () => location.href),
      sheet,
      dark: pageIsDark,
      // The background validates the API answer (utils/check.ts); a missing or foreign reply fails.
      send: async (message: PostCheckMessage): Promise<PostOutcome> =>
        toPostOutcome(await browser.runtime.sendMessage(message)),
    })
    scan(document)
    // Feeds load posts without a reload: one throttled rescan per burst of mutations.
    let pending = false
    new MutationObserver(() => {
      if (pending) return
      pending = true
      setTimeout(() => {
        pending = false
        scan(document)
      }, SCAN_DELAY_MS)
    }).observe(document.body, { childList: true, subtree: true })
    followTheme()
  },
})
