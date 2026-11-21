/**
 * The widget follows the host's theme: dark when the page background is dark.
 *
 * @feature US-WTY-05, ADR-09
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isDarkBackground } from './theme.ts'

test('black and Facebook dark backgrounds are dark, white is light', () => {
  assert.equal(isDarkBackground('rgb(0, 0, 0)'), true)
  assert.equal(isDarkBackground('rgb(28, 28, 29)'), true)
  assert.equal(isDarkBackground('rgb(255, 255, 255)'), false)
})

test('a transparent or unreadable background says nothing', () => {
  assert.equal(isDarkBackground('rgba(0, 0, 0, 0)'), null)
  assert.equal(isDarkBackground('transparent'), null)
})
