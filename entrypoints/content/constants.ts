/**
 * Constants of the content script: where it runs and which font file is the Latin one.
 *
 * @feature US-WTY-01, US-WTY-05, ADR-09, ADR-10
 */
/**
 * Pages the content script runs on: the five platforms and their mocks.
 *
 * @feature US-WTY-01, ADR-10
 */
export const CONTENT_MATCHES = [
  '*://x.com/*',
  '*://*.x.com/*',
  '*://twitter.com/*',
  '*://*.twitter.com/*',
  '*://*.facebook.com/*',
  '*://*.instagram.com/*',
  '*://*.reddit.com/*',
  '*://*.tiktok.com/*',
  'https://*.gburek.app/*',
]

/**
 * A code point every Latin subset has („a”): tells the basic Latin `@font-face` rule of
 * widget.css from the Latin Extended one.
 *
 * @feature US-WTY-05, ADR-09
 */
export const LATIN_PROBE = 0x61
