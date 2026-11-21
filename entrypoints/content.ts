import { platformOf } from '@/utils/platform'

/**
 * Content script on the supported platforms. Bootstrap: marks the page with its
 * platform; the „Sprawdź” button under posts (Shadow DOM, sends the post only after
 * a click) builds on this.
 *
 * @feature US-WTY-01, US-WTY-04, ADR-09
 */
export default defineContentScript({
  matches: [
    '*://x.com/*',
    '*://*.x.com/*',
    '*://twitter.com/*',
    '*://*.twitter.com/*',
    '*://*.facebook.com/*',
    '*://*.instagram.com/*',
    '*://*.reddit.com/*',
    '*://*.tiktok.com/*',
    'https://*.gburek.app/*',
  ],
  runAt: 'document_idle',
  main() {
    const platform = platformOf(location.hostname)
    if (platform) document.documentElement.dataset['meritumPlatform'] = platform
  },
})
