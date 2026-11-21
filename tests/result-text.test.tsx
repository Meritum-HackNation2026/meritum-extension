/**
 * The card under a post and the popup answer word states and limitations from the contract
 * codes through copy/pl.json; CheckResult.message never reaches the screen.
 *
 * @feature US-WTY-02, F-02
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { render } from '@testing-library/react'
import type { CheckResult } from '../design-system/contracts/meritum.ts'
import copy from '../design-system/copy/pl.json' with { type: 'json' }
import { ResultCard } from '../entrypoints/content/ResultCard.tsx'
import { CheckAnswer } from '../entrypoints/popup/CheckAnswer.tsx'

const views = {
  card: (result: CheckResult) => render(<ResultCard outcome={{ result }} />).container,
  popup: (result: CheckResult) => render(<CheckAnswer outcome={{ result }} />).container,
}

const failure: CheckResult = {
  check_id: 'c1',
  status: 'technical_failure',
  message: 'status_hint.technical_failure',
  failure_code: 'url_unavailable',
  corpus_version: 'v1',
}

for (const [name, view] of Object.entries(views)) {
  test(`${name}: a technical failure shows the copy for its code, never the message`, () => {
    const text = view(failure).textContent ?? ''

    assert.ok(text.includes(copy.status.technical_failure))
    assert.ok(text.includes(copy.failure_code.url_unavailable))
    assert.ok(!text.includes('status_hint'), 'the raw message is not on screen')
  })

  test(`${name}: a technical failure without a code shows the status hint, never the message`, () => {
    const text = view({ ...failure, failure_code: null }).textContent ?? ''

    assert.ok(text.includes(copy.status_hint.technical_failure))
    assert.ok(!text.includes('status_hint'), 'the raw message is not on screen')
  })

  test(`${name}: a state that is not a verdict shows its hint, never the message`, () => {
    const result: CheckResult = {
      ...failure,
      status: 'needs_clarification',
      message: 'Wiadomość tylko do debugowania',
      failure_code: null,
    }
    const text = view(result).textContent ?? ''

    assert.ok(text.includes(copy.status_hint.needs_clarification))
    assert.ok(!text.includes(result.message ?? ''), 'the message is not on screen')
  })

  test(`${name}: codes newer than the synced copy fall back to the status hint`, () => {
    const result = {
      ...failure,
      failure_code: 'new_failure',
      limitation_codes: ['new_limitation'],
    } as unknown as CheckResult
    const container = view(result)

    assert.ok(container.textContent?.includes(copy.status_hint.technical_failure))
    assert.ok(!container.textContent?.includes(copy.result.limitations), 'no empty limitations')
  })

  test(`${name}: limitation codes are listed with their copy under the limitations heading`, () => {
    const result: CheckResult = {
      check_id: 'c1',
      status: 'done',
      claims: [],
      limitations: ['tekst ograniczenia z backendu'],
      limitation_codes: ['fact_check_unavailable', 'image_search_not_run'],
      corpus_version: 'v1',
    }
    const text = view(result).textContent ?? ''

    assert.ok(text.includes(copy.result.limitations))
    assert.ok(text.includes(copy.limitation_code.fact_check_unavailable))
    assert.ok(text.includes(copy.limitation_code.image_search_not_run))
    assert.ok(!text.includes('tekst ograniczenia z backendu'), 'only coded text is shown')
  })
}
