import { postCheckListener } from '../utils/post-check.ts'

// Build-time API of the verification core, the same one the popup calls.
const apiUrl = import.meta.env?.['WXT_API_URL'] ?? 'https://meritum.gburek.app'

/**
 * Service worker: answers „Sprawdź” from the content scripts with the popup's API client,
 * because a content script's fetch is bound by the host page's CORS and CSP.
 *
 * @feature US-WTY-01, US-WTY-04, F-02
 */
export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    postCheckListener(apiUrl, browser.storage.local, browser.runtime.id),
  )
})
