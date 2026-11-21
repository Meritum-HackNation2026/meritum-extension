/**
 * Host theme detection for the widget: the platforms mark dark mode in different ways
 * (SELECTORS.md), so the widget reads the computed page background instead.
 *
 * @feature US-WTY-05, ADR-09
 */
import { DARK_LUMINANCE, OPAQUE_ALPHA } from './constants.ts'

// sRGB channel (0-255) to linear light, as in WCAG relative luminance.
const linear = (channel: number) => {
  const v = channel / 255
  return v <= 0.039_28 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/**
 * Whether a computed `background-color` is dark (relative luminance under 0.4).
 *
 * @param color - An `rgb()` / `rgba()` value from getComputedStyle.
 * @returns True for dark, false for light, null when transparent or unreadable.
 * @feature US-WTY-05, ADR-09
 */
export function isDarkBackground(color: string): boolean | null {
  const [r, g, b, alpha = 1] = (color.match(/[\d.]+/g) ?? []).map(Number)
  if (r === undefined || g === undefined || b === undefined || alpha < OPAQUE_ALPHA) return null
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b) < DARK_LUMINANCE
}
