/**
 * Selectors and placement of the post adapters (design-system/demo/platforms/SELECTORS.md).
 *
 * @feature US-WTY-01, US-WTY-05, ADR-10
 */

/**
 * Where posts, their text, their own link and the „Sprawdź” anchor are on each platform
 * (design-system/demo/platforms/SELECTORS.md; never by class, the sites hash them).
 * Reddit keeps the title and link in attributes of `shreddit-post` (and `shreddit-ad-post`)
 * and gets its own row.
 *
 * @feature US-WTY-01, US-WTY-05, ADR-10
 */
export const POST_SELECTORS = {
  x: {
    post: 'article[data-testid="tweet"]',
    text: '[data-testid="tweetText"]',
    link: 'a[href*="/status/"]',
    bar: '[role="group"]',
    before: '[data-testid="bookmark"]',
  },
  facebook: {
    author: '[data-ad-rendering-role="profile_name"]',
    unit: '[data-virtualized]',
    text: '[data-ad-preview="message"]',
    link: 'a[href*="/posts/"], a[href*="/videos/"], a[href*="story_fbid"]',
    like: '[data-ad-rendering-role="like_button"]',
    share: '[data-ad-rendering-role="share_button"]',
    button: '[role="button"]',
  },
  instagram: {
    post: 'main article',
    // The caption: the first span right after the author's link (comments come later).
    text: 'a + span[dir="auto"]',
    link: 'a[href*="/p/"], a[href*="/reel/"]',
    share: 'svg[aria-label="Udostępnij"], svg[aria-label="Share"]',
    button: '[role="button"]',
    bar: 'section',
  },
  reddit: {
    // Promoted posts are where the scams are, so they get „Sprawdź” too.
    post: 'shreddit-post, shreddit-ad-post',
    text: '[slot="text-body"]',
    title: 'post-title',
    link: 'permalink',
    // An ad has no permalink, only the address it advertises.
    adLink: 'href',
  },
  tiktok: {
    post: 'article[data-e2e="recommend-list-item-container"]',
    text: '[data-e2e="video-desc"]',
    link: 'a[href*="/video/"]',
    share: '[data-e2e="share-icon"]',
    video: '[data-e2e="feed-video"]',
  },
} as const

/**
 * Inline position of the TikTok result slot over the bottom of the full-height video;
 * inline because host-page CSS outranks `:host` rules (design-system/extension/README.md).
 *
 * @feature US-WTY-05, ADR-09
 */
export const TIKTOK_SLOT_STYLE =
  'position:absolute;left:12px;right:12px;bottom:12px;z-index:5;max-height:calc(100% - 24px);overflow:auto'
