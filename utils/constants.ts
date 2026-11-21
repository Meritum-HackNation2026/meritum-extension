/**
 * Hosts of the supported platforms: the real sites and the demo mocks
 * (meritum-<platform>[-dev].gburek.app, design-system/demo/platforms/SELECTORS.md).
 *
 * @feature US-WTY-01, ADR-10
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
