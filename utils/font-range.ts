/**
 * Reading the CSS `unicode-range` descriptor.
 *
 * @feature US-WTY-05
 */

/**
 * Whether a CSS `unicode-range` value covers one code point.
 *
 * @param range - The descriptor, e.g. `U+0000-00FF, U+0131, U+04??`.
 * @param point - The code point.
 * @returns True when one of its ranges holds `point`.
 * @feature US-WTY-05
 */
export function rangeCovers(range: string, point: number): boolean {
  return range.split(',').some((part) => {
    const match = /U\+([0-9a-f?]+)(?:-([0-9a-f]+))?/i.exec(part)
    if (!match?.[1]) return false
    const from = Number.parseInt(match[1].replaceAll('?', '0'), 16)
    const to = Number.parseInt(match[2] ?? match[1].replaceAll('?', 'f'), 16)
    return point >= from && point <= to
  })
}
