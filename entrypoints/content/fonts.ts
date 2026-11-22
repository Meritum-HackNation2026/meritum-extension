/**
 * The widget's fonts. Chrome ignores `@font-face` inside shadow roots, so the rules of
 * widget.css are registered on the document instead (design-system/extension/widget.css), with
 * the packaged files: no request to fonts.gstatic.com. The content-script build inlines them as
 * data URLs, so no web-accessible resource lets a page probe for Meritum, and the faces are built
 * from bytes, so the host page's font-src policy cannot block them.
 *
 * @feature US-WTY-05, ADR-09
 */

import monoLatin from '@fontsource/azeret-mono/files/azeret-mono-latin-400-normal.woff2?url'
import monoExt from '@fontsource/azeret-mono/files/azeret-mono-latin-ext-400-normal.woff2?url'
import archivoExt from '@fontsource-variable/archivo/files/archivo-latin-ext-wdth-normal.woff2?url'
import archivoLatin from '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2?url'
import { rangeCovers } from '../../utils/font-range.ts'
import { LATIN_PROBE } from './constants.ts'

// Bundled file per widget.css family and subset.
const files: Record<string, { latin: string; ext: string }> = {
  'Meritum Archivo': { latin: archivoLatin, ext: archivoExt },
  'Meritum Azeret Mono': { latin: monoLatin, ext: monoExt },
}

/**
 * Registers widget.css's `@font-face` rules on the document with the packaged font files.
 *
 * @param sheet - widget.css as the constructed sheet the shadow roots adopt.
 * @returns Resolves when every face is added to `document.fonts`.
 * @feature US-WTY-05, ADR-09
 */
export async function registerFonts(sheet: CSSStyleSheet) {
  const faces = [...sheet.cssRules].flatMap((rule) => {
    if (!(rule instanceof CSSFontFaceRule)) return []
    const family = rule.style.getPropertyValue('font-family').replaceAll(/["']/g, '').trim()
    const range = rule.style.getPropertyValue('unicode-range')
    const file = files[family]?.[rangeCovers(range, LATIN_PROBE) ? 'latin' : 'ext']
    if (!file) return []
    const descriptors: FontFaceDescriptors = {
      style: rule.style.getPropertyValue('font-style') || 'normal',
      weight: rule.style.getPropertyValue('font-weight') || 'normal',
      stretch: rule.style.getPropertyValue('font-stretch') || 'normal',
      unicodeRange: range || 'U+0-10FFFF',
      display: 'swap',
    }
    return [{ family, file, descriptors }]
  })
  await Promise.all(
    faces.map(async ({ family, file, descriptors }) => {
      const bytes = await (await fetch(file)).arrayBuffer()
      document.fonts.add(new FontFace(family, bytes, descriptors))
    }),
  )
}
