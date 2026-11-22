/**
 * The result card under a post for every state that is not a verdict: a status other than
 * `done`, a done result without claims, and the problems; none shows a verdict badge.
 *
 * @feature US-WTY-01, US-WTY-05, US-BEZ-07, F-02
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { render } from '@testing-library/react'
import type { CheckResult } from '../../design-system/contracts/meritum.ts'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import { ResultCard } from '../../entrypoints/content/ResultCard.tsx'
import type { PostOutcome } from '../../utils/post-check.ts'

const base = { check_id: 'c1', corpus_version: 'v1' }

function card(outcome: PostOutcome | null): HTMLElement {
  return render(<ResultCard outcome={outcome} />).container
}

test('every status but done shows its own word and hint, never a verdict badge', () => {
  const cases = [
    ['needs_clarification', copy.status_hint.needs_clarification],
    ['out_of_scope', copy.status_hint.out_of_scope],
    ['technical_failure', copy.status_hint.technical_failure],
  ] as const
  for (const [status, hint] of cases) {
    const result = { ...base, status } as CheckResult
    const { container } = render(<ResultCard outcome={{ result }} />)
    assert.ok(container.textContent?.includes(copy.status[status]), status)
    assert.ok(container.textContent?.includes(hint), status)
    assert.equal(container.querySelector('.m-badge'), null, status)
  }
})

test('a done result without claims says there is no result instead of an empty card', () => {
  const none = card({ result: { ...base, status: 'done' } as CheckResult })
  assert.ok(none.textContent?.includes(copy.result.no_result_hint))
  assert.equal(none.querySelector('.m-badge'), null)
  const empty = card({ result: { ...base, status: 'done', claims: [] } as CheckResult })
  assert.ok(empty.textContent?.includes(copy.result.no_result_hint))
})

test('a problem shows its text, and a post with too little text its own', () => {
  assert.ok(card({ problem: 'offline' }).textContent?.includes(copy.errors.offline))
  assert.ok(card({ input: 'empty' }).textContent?.includes(copy.extension.post_too_short))
})
