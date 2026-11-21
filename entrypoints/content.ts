import { platformOf } from '@/utils/platform'

// Bootstrap: marks the page with its platform. The „Sprawdź” button under posts
// (Shadow DOM, sends the post only after a click) builds on this.
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
    if (platform) document.documentElement.dataset.meritumPlatform = platform
  },
})
