/**
 * Hosts of the supported platforms: the real sites and the demo mocks
 * (meritum-<platform>[-dev].gburek.app, design-system/demo/platforms/SELECTORS.md).
 *
 * @feature US-WTY-01, ADR-10
 */

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
