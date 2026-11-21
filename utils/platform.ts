// Which supported platform a page belongs to: the real sites and the demo mocks
// (meritum-<platform>[-dev].gburek.app, design-system/demo/platforms/SELECTORS.md).
export const PLATFORMS = ['x', 'facebook', 'instagram', 'reddit', 'tiktok'] as const
export type Platform = (typeof PLATFORMS)[number]

const REAL: Record<string, Platform> = {
  'x.com': 'x',
  'twitter.com': 'x',
  'facebook.com': 'facebook',
  'instagram.com': 'instagram',
  'reddit.com': 'reddit',
  'tiktok.com': 'tiktok',
}
const MOCK = /^meritum-(x|facebook|instagram|reddit|tiktok)(?:-dev)?\.gburek\.app$/

export function platformOf(hostname: string): Platform | null {
  const mock = MOCK.exec(hostname)
  if (mock) return mock[1] as Platform
  const site = hostname.replace(/^(www|m|mobile|old|new)\./, '')
  return REAL[site] ?? null
}
