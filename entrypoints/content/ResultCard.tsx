import type { CheckResult, Citation, ClaimResult } from '../../design-system/contracts/meritum.ts'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import type { InputError } from '../../utils/check.ts'
import type { PostOutcome } from '../../utils/post-check.ts'
import { limitationTexts, problemText, statusHint } from '../../utils/result-copy.ts'
import { Mark } from '../shared/Mark.tsx'

const inputText: Record<InputError, string> = {
  empty: copy.extension.post_too_short,
  invalid_url: copy.errors.invalid_url,
  too_long: copy.errors.too_long,
}

const day = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
const isHttps = (url: string) => url.startsWith('https://')

function Source({ citation }: { citation: Citation }) {
  const { source, fragment } = citation
  const meta = source.published_at
    ? copy.result.source_meta
        .replace('{publisher}', source.publisher)
        .replace('{date}', day.format(new Date(source.published_at)))
    : copy.result.source_undated.replace('{publisher}', source.publisher)
  return (
    <li>
      <blockquote className="m-frag">
        <span className="m-sr">{copy.result.fragment}: </span>
        {fragment}”
      </blockquote>
      <span className="m-sub">
        {isHttps(source.url) ? (
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.title}
          </a>
        ) : (
          <span>{source.title}</span>
        )}{' '}
        {meta}
      </span>
    </li>
  )
}

function Claim({ claim }: { claim: ClaimResult }) {
  const citations = claim.citations ?? []
  return (
    <article className="m-claim">
      <span className={`m-verdict ${claim.verdict}`}>{copy.verdict[claim.verdict]}</span>
      <h3>
        <span className="m-sr">{copy.result.claim}: </span>„{claim.claim}”
      </h3>
      <p className="m-sub">{copy.verdict_hint[claim.verdict]}</p>
      <p className="m-expl">{claim.explanation}</p>
      {citations.length > 0 && (
        <>
          <h4 className="m-h">{copy.result.sources_title}</h4>
          <ul className="m-srcs">
            {citations.map((citation) => (
              <Source key={`${citation.source.url} ${citation.fragment}`} citation={citation} />
            ))}
          </ul>
        </>
      )}
    </article>
  )
}

// Non-verdict states are neutral text with an icon, never a verdict badge (meritum-ui rule 4).
function Status({ title, text }: { title?: string; text: string }) {
  return (
    <div className="m-status">
      <svg className="m-ic" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M8 4.6v4.3M8 11.2v.1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <div>
        {title && <b>{title}</b>}
        <p>{text}</p>
      </div>
    </div>
  )
}

function Body({ result }: { result: CheckResult }) {
  if (result.status !== 'done') {
    const text = statusHint(result.status, result.failure_code)
    return <Status title={copy.status[result.status]} text={text} />
  }
  const claims = result.claims ?? []
  if (claims.length === 0) return <Status text={copy.result.no_result_hint} />
  // biome-ignore lint/suspicious/noArrayIndexKey: claims never reorder and two may share a text
  return claims.map((claim, i) => <Claim key={i} claim={claim} />)
}

function Limitations({ result }: { result: CheckResult }) {
  const texts = limitationTexts(result)
  if (texts.length === 0) return null
  return (
    <div>
      <h4 className="m-h">{copy.result.limitations}</h4>
      <ul>
        {texts.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </div>
  )
}

function Outcome({ outcome }: { outcome: PostOutcome }) {
  if ('result' in outcome) return <Body result={outcome.result} />
  return 'problem' in outcome ? (
    <Status text={problemText[outcome.problem]} />
  ) : (
    <Status text={inputText[outcome.input]} />
  )
}

/**
 * The result card under a post (DESIGN_SYSTEM.md 6.4, widget.css `.m-card`): the Meritum mark
 * and name, each claim's verdict word and colour, the sources with their quotes and the AI
 * notice with the limitations above it; statuses and problems are neutral, worded from the
 * contract codes, never from `message`. The platform skin changes only the frame.
 *
 * @param props.outcome - What the background answered; null before the first check.
 * @returns The live region with the card, empty until there is an outcome.
 * @feature US-WTY-01, US-WTY-05, US-BEZ-07, F-02, F-21
 */
export function ResultCard({ outcome }: { outcome: PostOutcome | null }) {
  return (
    <div aria-live="polite">
      {outcome && (
        <section className="m-card" aria-label={copy.result.label}>
          <div className="m-top">
            <Mark where="widget" size={14} />
            {copy.result.label}
          </div>
          <Outcome outcome={outcome} />
          <footer className="m-foot">
            {'result' in outcome && <Limitations result={outcome.result} />}
            <p>{copy.result.ai_disclosure}</p>
          </footer>
        </section>
      )}
    </div>
  )
}
