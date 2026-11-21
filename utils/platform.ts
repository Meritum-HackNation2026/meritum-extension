import { MOCK_HOST, type PLATFORMS, REAL_HOSTS, SITE_PREFIX } from './constants.ts'

/**
 * One of the supported platforms.
 *
 * @feature US-WTY-01, ADR-10
 */
export type Platform = (typeof PLATFORMS)[number]

const realHosts: Record<string, Platform> = REAL_HOSTS

/**
 * Which supported platform a page belongs to.
 *
 * @param hostname - The page's `location.hostname`.
 * @returns The platform, or null for any other site.
 * @feature US-WTY-01, ADR-10
 */
export function platformOf(hostname: string): Platform | null {
  const mock = MOCK_HOST.exec(hostname)?.[1]
  if (mock !== undefined) {
    return mock as Platform
  }
  return realHosts[hostname.replace(SITE_PREFIX, '')] ?? null
}
