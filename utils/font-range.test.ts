/**
 * Which `@font-face` rule of widget.css is the Latin one.
 *
 * @feature US-WTY-05
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rangeCovers } from './font-range.ts'

const a = 0x61

test('the basic Latin range covers „a”, the Latin Extended one does not', () => {
  assert.equal(rangeCovers('U+0000-00FF, U+0131, U+2000-206F', a), true)
  assert.equal(rangeCovers('U+0100-02BA, U+02BD-02C5, U+1E00-1E9F', a), false)
})

test('wildcards and single code points count', () => {
  assert.equal(rangeCovers('U+00??', a), true)
  assert.equal(rangeCovers('U+61', a), true)
  assert.equal(rangeCovers('', a), false)
})
