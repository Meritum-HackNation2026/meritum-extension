/**
 * Constants shared by the extension: supported platform hosts and mocks
 * (design-system/demo/platforms/SELECTORS.md), the API paths and limits, the session, and the
 * widget's messaging, scanning and theme settings.
 *
 * @feature US-WTY-01, US-WTY-02, US-WTY-05, US-BEZ-05, ADR-10
 */
import type { Status, Verdict } from '../design-system/contracts/meritum.ts'

/**
 * Platforms the extension recognises.
 *
 * @feature US-WTY-01, ADR-10
 */
export const PLATFORMS = ['x', 'facebook', 'instagram', 'reddit', 'tiktok'] as const

/**
 * Real sites by hostname without the www/m/mobile/old/new prefix.
 *
 * @feature US-WTY-01, ADR-10
 */
export const REAL_HOSTS = {
  'x.com': 'x',
  'twitter.com': 'x',
  'facebook.com': 'facebook',
  'instagram.com': 'instagram',
  'reddit.com': 'reddit',
  'tiktok.com': 'tiktok',
} as const

/**
 * Demo mocks of prd and dev; the group is the platform.
 *
 * @feature US-WTY-01, ADR-10
 */
export const MOCK_HOST = /^meritum-(x|facebook|instagram|reddit|tiktok)(?:-dev)?\.gburek\.app$/

/**
 * Subdomain prefixes that still mean the platform itself.
 *
 * @feature US-WTY-01, ADR-10
 */
export const SITE_PREFIX = /^(www|m|mobile|old|new)\./

/**
 * chrome.storage.local key of the random session_id sent with every check.
 *
 * @feature US-BEZ-05, US-BEZ-06
 */
export const SESSION_ID_KEY = 'session_id'

/**
 * API path that deletes every check of one session; `{session_id}` is the id.
 * shortcut: the name is ours until meritum-core and the backend define the endpoint (extension#24).
 *
 * @feature US-BEZ-05, US-BEZ-06
 */
export const DELETE_CHECKS_PATH = '/api/v1/sessions/{session_id}/checks'

/**
 * Shortest text the web form and the API accept (errors.empty in copy/pl.json).
 *
 * @feature US-WTY-02, F-02
 */
export const MIN_TEXT_CHARS = 3

/**
 * Longest text the web form and the API accept (CheckRequest, errors.too_long).
 *
 * @feature US-WTY-02, F-02
 */
export const MAX_TEXT_CHARS = 4000

/**
 * API path that accepts a CheckRequest and answers 202 with the check id (backend#16).
 *
 * @feature US-WTY-02, F-02
 */
export const CHECKS_PATH = '/api/v1/checks'

/**
 * Pause between two AnalysisStatus polls of a running check.
 *
 * @feature US-WTY-02, F-02
 */
export const POLL_INTERVAL_MS = 1000

/**
 * Polls before the popup gives up on a check and reports a technical failure (about 3 min).
 *
 * @feature US-WTY-02, F-02
 */
export const POLL_MAX_ATTEMPTS = 180

/**
 * HTTP status of the API's rate limit (errors.rate_limited).
 *
 * @feature US-WTY-02, F-02
 */
export const HTTP_TOO_MANY_REQUESTS = 429

/**
 * HTTP status of an overloaded API (errors.busy).
 *
 * @feature US-WTY-02, F-02
 */
export const HTTP_SERVICE_UNAVAILABLE = 503

/**
 * One token that starts like an address (any scheme or www.); such input is checked as a link.
 *
 * @feature US-WTY-02, F-02
 */
export const LINK_LIKE = /^(?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S*$/i

/**
 * Link schemes the web form and the API accept (errors.invalid_url otherwise).
 *
 * @feature US-WTY-02, F-02
 */
export const ALLOWED_URL_PROTOCOLS = ['http:', 'https:'] as const

/**
 * CheckResult statuses the popup can show (contract `Status`).
 *
 * @feature US-WTY-02, F-02
 */
export const KNOWN_STATUSES = [
  'done',
  'needs_clarification',
  'out_of_scope',
  'technical_failure',
] as const satisfies readonly Status[]

/**
 * Verdicts the popup can name (contract `Verdict`); anything else would be a badge without a word.
 *
 * @feature US-WTY-02, F-02
 */
export const KNOWN_VERDICTS = [
  'confirmed',
  'false',
  'misleading',
  'insufficient_evidence',
  'not_verifiable',
] as const satisfies readonly Verdict[]

/**
 * chrome.runtime message type the content script sends to the background after a trusted
 * click on „Sprawdź” under a post.
 *
 * @feature US-WTY-01, US-WTY-04, F-02
 */
export const CHECK_POST_MESSAGE = 'meritum:check-post'

/**
 * Relative luminance under which the host page counts as dark and the widget gets `.dark`
 * (design-system/extension/README.md, Theme detection).
 *
 * @feature US-WTY-05, ADR-09
 */
export const DARK_LUMINANCE = 0.4

/**
 * Background alpha below which a page element is treated as transparent for the theme.
 *
 * @feature US-WTY-05, ADR-09
 */
export const OPAQUE_ALPHA = 0.5

/**
 * Events that never leave the widget's shadow roots: X opens the post on click and has
 * one-key shortcuts.
 *
 * @feature US-WTY-01, ADR-09
 */
export const ISOLATED_EVENTS = ['click', 'keydown', 'keyup', 'keypress'] as const

/**
 * Pause after a page mutation before the content script rescans the feed, so a burst of
 * host re-renders costs one scan.
 *
 * @feature US-WTY-01, ADR-10
 */
export const SCAN_DELAY_MS = 150

/**
 * Attributes on <html> and <body> where the platforms switch their theme (X: style, Facebook,
 * Instagram and Reddit: class, TikTok: data-theme).
 *
 * @feature US-WTY-05, ADR-09
 */
export const THEME_ATTRIBUTES = ['class', 'style', 'data-theme'] as const

/**
 * Request header with the random session id; the API refuses a check without it
 * (meritum-backend `SESSION_HEADER`).
 *
 * @feature US-BEZ-05, US-BEZ-06
 */
export const SESSION_HEADER = 'X-Meritum-Session'

/**
 * Media query of the system dark mode, used when the page background says nothing.
 *
 * @feature US-WTY-05, ADR-09
 */
export const PREFERS_DARK = '(prefers-color-scheme: dark)'
