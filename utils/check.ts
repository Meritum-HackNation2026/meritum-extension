/**
 * The popup's check: validates the pasted text or link like the web form, sends it to the
 * verification core and follows the AnalysisStatus until the CheckResult arrives.
 *
 * @feature US-WTY-02, US-WTY-04, F-02
 */
import type {
  AnalysisStatus,
  CheckRequest,
  CheckResult,
} from '../design-system/contracts/meritum.ts'
import {
  CHECKS_PATH,
  HTTP_SERVICE_UNAVAILABLE,
  HTTP_TOO_MANY_REQUESTS,
  MAX_TEXT_CHARS,
  MIN_TEXT_CHARS,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
} from './constants.ts'

/**
 * Why the input was not sent; each is a key of `errors` in copy/pl.json.
 *
 * @feature US-WTY-02, F-02
 */
export type InputError = 'empty' | 'invalid_url' | 'too_long'

/**
 * Why a sent check has no result: `errors` keys in copy/pl.json, `failed` is
 * `status_hint.technical_failure`.
 *
 * @feature US-WTY-02, F-02
 */
export type CheckProblem = 'rate_limited' | 'busy' | 'offline' | 'failed'

/**
 * What the popup shows after „Sprawdź”: the result, or why there is none.
 *
 * @feature US-WTY-02, F-02
 */
export type CheckOutcome = { result: CheckResult } | { problem: CheckProblem }

// One token that starts like an address (any scheme or www.) is checked as a link.
const looksLikeLink = /^(?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S*$/i

function toUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

/**
 * Turns the pasted value into a CheckRequest with the web form's rules: a full http(s)
 * link, or text of 3 to 4000 characters.
 *
 * @param raw - The field's value.
 * @returns The request to send, or the reason it cannot be sent.
 * @feature US-WTY-02, F-02
 */
export function toCheckRequest(raw: string): CheckRequest | InputError {
  const value = raw.trim()
  if (looksLikeLink.test(value)) {
    const url = toUrl(value)
    return url === null ? 'invalid_url' : { channel: 'extension', url }
  }
  // Code points, as the API's Python len() counts them.
  const length = [...value].length
  if (length < MIN_TEXT_CHARS) return 'empty'
  return length > MAX_TEXT_CHARS ? 'too_long' : { channel: 'extension', text: value }
}

class Problem extends Error {
  readonly key: CheckProblem
  constructor(key: CheckProblem) {
    super(key)
    this.key = key
  }
}

async function call(url: string, init?: RequestInit): Promise<AnalysisStatus> {
  const response = await fetch(url, init)
  if (response.status === HTTP_TOO_MANY_REQUESTS) throw new Problem('rate_limited')
  if (response.status === HTTP_SERVICE_UNAVAILABLE) throw new Problem('busy')
  if (!response.ok) throw new Problem('failed')
  const status = (await response.json()) as Partial<AnalysisStatus>
  if (typeof status.check_id !== 'string') throw new Problem('failed')
  return status as AnalysisStatus
}

async function waitForResult(url: string): Promise<CheckResult> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
    const { result } = await call(url)
    if (result) return result
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Problem('failed')
}

/**
 * Sends the request to POST /api/v1/checks and polls GET /api/v1/checks/{id} until the
 * result arrives. Nothing is sent until the user clicks „Sprawdź”.
 *
 * @param apiUrl - Base address of the verification core.
 * @param request - A request from {@link toCheckRequest}.
 * @returns The result, or the problem to show instead; never throws.
 * @feature US-WTY-02, US-WTY-04, F-02
 */
export async function sendCheck(apiUrl: string, request: CheckRequest): Promise<CheckOutcome> {
  try {
    const started = await call(`${apiUrl}${CHECKS_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    const statusUrl = `${apiUrl}${CHECKS_PATH}/${encodeURIComponent(started.check_id)}`
    return { result: started.result ?? (await waitForResult(statusUrl)) }
  } catch (error) {
    if (error instanceof Problem) return { problem: error.key }
    // fetch rejects with a TypeError only when the network is unreachable.
    return { problem: error instanceof TypeError ? 'offline' : 'failed' }
  }
}
