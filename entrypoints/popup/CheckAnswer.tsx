import type { CheckResult, Verdict } from '../../design-system/contracts/meritum.ts'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import type { CheckOutcome, CheckProblem } from '../../utils/check.ts'
import { limitationTexts, statusHint } from '../../utils/result-copy.ts'

// Badge tone per verdict, as in design-system/extension/popup/popup.js; the rest stay neutral.
const tone: Partial<Record<Verdict, string>> = { confirmed: 'ok', false: 'bad', misleading: 'pend' }

const problemText: Record<CheckProblem, string> = {
  rate_limited: copy.errors.rate_limited,
  busy: copy.errors.busy,
  offline: copy.errors.offline,
  failed: copy.status_hint.technical_failure,
}

function Limitations({ result }: { result: CheckResult }) {
  const texts = limitationTexts(result)
  if (texts.length === 0) return null
  return (
    <>
      <h2>{copy.result.limitations}</h2>
      <ul className="rows">
        {texts.map((text) => (
          <li key={text} className="small">
            {text}
          </li>
        ))}
      </ul>
    </>
  )
}

function Result({ result }: { result: CheckResult }) {
  if (result.status !== 'done') {
    // Non-verdict states are neutral text, never a verdict badge (meritum-ui rule 4).
    return (
      <>
        <p className="summary">{copy.status[result.status]}</p>
        <p>{statusHint(result.status, result.failure_code)}</p>
        <Limitations result={result} />
      </>
    )
  }
  const claims = result.claims ?? []
  return (
    <>
      {claims.length === 0 && <p>{copy.result.no_result_hint}</p>}
      {claims.length > 0 && (
        <ul className="rows">
          {claims.map((claim, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: claims never reorder and two may share a text
            <li key={i}>
              <span className="grow">
                {claim.claim}
                <span className="m">{claim.explanation}</span>
              </span>
              <span className={`badge ${tone[claim.verdict] ?? ''}`}>
                {copy.verdict[claim.verdict]}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Limitations result={result} />
      <p className="muted small">{copy.result.ai_disclosure}</p>
    </>
  )
}

/**
 * The answer under the paste box: each claim with its verdict word, or the status, or why
 * the check failed, plus the limitations; all worded from the contract codes, never from
 * `message`. The live region is always there so screen readers announce the change.
 *
 * @param props.outcome - What sendCheck returned; null before the first check.
 * @returns The answer block of the popup.
 * @feature US-WTY-02, US-BEZ-07, F-02, F-21
 */
export function CheckAnswer({ outcome }: { outcome: CheckOutcome | null }) {
  return (
    <section className="block" aria-live="polite">
      {outcome && 'result' in outcome && <Result result={outcome.result} />}
      {outcome && 'problem' in outcome && <p>{problemText[outcome.problem]}</p>}
    </section>
  )
}
