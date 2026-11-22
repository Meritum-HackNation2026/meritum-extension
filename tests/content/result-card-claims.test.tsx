/**
 * The result card with claims (design-system#108): the verdict leads each claim, the quote is
 * evidence with its attribution under it, the AI notice appears once.
 *
 * @feature US-WTY-01, US-BEZ-07, F-02
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { render } from '@testing-library/react'
import type { CheckResult } from '../../design-system/contracts/meritum.ts'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import { ResultCard } from '../../entrypoints/content/ResultCard.tsx'

const source = {
  id: 's1',
  title: 'Rozporządzenie w sprawie płacy minimalnej',
  publisher: 'Dziennik Ustaw',
  published_at: '2025-09-15',
  url: 'https://example.org/a',
  kind: 'akt_prawny',
  tier: 'primary',
}
const claim = (verdict: string, text: string) => ({
  claim: text,
  verdict,
  explanation: `Wyjaśnienie: ${text}`,
  citations: [{ stance: 'supports', fragment: `Cytat: ${text}`, source }],
})
const result = {
  check_id: 'c1',
  corpus_version: 'v1',
  status: 'done',
  claims: [claim('confirmed', 'Pierwsze'), claim('false', 'Drugie')],
} as unknown as CheckResult

function card(): HTMLElement {
  return render(<ResultCard outcome={{ result }} />).container
}

test('each claim starts with its verdict word, no pill, then the claim and the explanation', () => {
  const root = card()
  assert.equal(root.querySelector('.m-badge'), null)
  const first = root.querySelector('.m-claim') as HTMLElement
  const order = [
    first.querySelector('.m-verdict.confirmed'),
    first.querySelector('h3'),
    first.querySelector('.m-expl'),
    first.querySelector('.m-frag'),
  ]
  assert.equal(order[0]?.textContent, copy.verdict.confirmed)
  for (let i = 1; i < order.length; i++) {
    assert.ok(order[i - 1]?.compareDocumentPosition(order[i] as Node) === 4, `position ${i}`)
  }
  assert.ok(root.querySelector('.m-verdict.false'))
})

test('the claim is quoted with Polish quotation marks', () => {
  assert.ok(card().querySelector('h3')?.textContent?.includes('„Pierwsze”'))
})

test('the quote comes before its attribution, which links the source', () => {
  const li = card().querySelector('.m-srcs li') as HTMLElement
  const quote = li.querySelector('blockquote') as HTMLElement
  const link = li.querySelector('a') as HTMLElement
  assert.ok(quote.compareDocumentPosition(link) === 4)
  assert.ok(quote.textContent?.endsWith('Pierwsze”'))
  assert.ok(!quote.textContent?.includes('„'), 'the opening mark is drawn by CSS, in the margin')
  assert.equal(link.getAttribute('href'), source.url)
})

test('the AI notice appears once, in the footer', () => {
  const root = card()
  assert.equal(root.textContent?.split(copy.result.explanation_hint).length, 1)
  assert.equal(root.textContent?.split(copy.result.ai_disclosure).length, 2)
})
