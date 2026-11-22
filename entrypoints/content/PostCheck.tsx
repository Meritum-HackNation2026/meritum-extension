import { type MouseEvent, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import { toPostRequest } from '../../utils/check.ts'
import type { PostCheckMessage, PostOutcome } from '../../utils/post-check.ts'
import { Mark } from '../shared/Mark.tsx'
import { ResultCard } from './ResultCard.tsx'

/**
 * What one „Sprawdź” needs from the content script.
 *
 * @feature US-WTY-01, US-WTY-04, F-02
 */
export type PostCheckProps = {
  /** Reads the post now; called only after a trusted click. */
  read: () => PostCheckMessage
  /** Sends the post to the background, which calls the API. */
  send: (message: PostCheckMessage) => Promise<PostOutcome>
  /** The container in the slot's shadow root under the post. */
  slot: Element
}

function label(busy: boolean, outcome: PostOutcome | null): string {
  if (busy) return copy.form.checking
  return outcome && 'result' in outcome ? copy.extension.checked : copy.extension.check
}

/**
 * The „Sprawdź” button in the post's action bar and, through a portal, the result under the
 * post. Reads and sends the post only on a trusted click (a real user's, not a script's).
 *
 * @param props - See {@link PostCheckProps}.
 * @returns The button; the result renders into `props.slot`.
 * @feature US-WTY-01, US-WTY-04, US-WTY-05, F-02
 */
export function PostCheck({ read, send, slot }: PostCheckProps) {
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<PostOutcome | null>(null)

  const check = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      const isUserClick = event.nativeEvent.isTrusted === true
      if (!isUserClick || busy) return
      const message = read()
      const request = toPostRequest(message.text, message.pageUrl)
      if (typeof request === 'string') {
        setOutcome({ input: request })
        return
      }
      setBusy(true)
      setOutcome(null)
      // No answer from the background (service worker gone) is a technical problem.
      setOutcome(await send(message).catch((): PostOutcome => ({ problem: 'failed' })))
      setBusy(false)
    },
    [busy, read, send],
  )

  return (
    <>
      <button
        className={outcome && 'result' in outcome ? 'm-check done' : 'm-check'}
        type="button"
        title={copy.extension.page_hint}
        aria-busy={busy}
        onClick={check}
      >
        <Mark where="widget" size={18} />
        <span>{label(busy, outcome)}</span>
      </button>
      {createPortal(<ResultCard outcome={outcome} />, slot)}
    </>
  )
}
