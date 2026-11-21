import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import { deleteChecks, renewSessionId, type SessionStore, sessionId } from '../../utils/session.ts'

type Step = 'idle' | 'confirm' | 'busy' | 'done' | 'failed'

const { extension } = copy

/**
 * Button that deletes the checks sent from this extension, after a confirmation; on success
 * a new session_id is drawn, on a server error the id stays and a message says so.
 *
 * @param props.apiUrl - Base address of the verification core.
 * @param props.storage - chrome.storage.local or a fake.
 * @returns The delete block of the popup.
 * @feature US-BEZ-05, US-BEZ-06
 */
export function DeleteChecks({ apiUrl, storage }: { apiUrl: string; storage: SessionStore }) {
  const [step, setStep] = useState<Step>('idle')
  const openButton = useRef<HTMLButtonElement>(null)
  const confirmButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Creates the id on first use, so every later check can carry it.
    sessionId(storage).catch(() => undefined)
  }, [storage])

  useEffect(() => {
    if (step === 'confirm') confirmButton.current?.focus()
  }, [step])

  const ask = useCallback(() => setStep('confirm'), [])
  const cancel = useCallback(() => {
    setStep('idle')
    // Rendered again on the next frame; focus goes back to the button that opened the question.
    requestAnimationFrame(() => openButton.current?.focus())
  }, [])
  const onKeyDown = useCallback((e: KeyboardEvent) => e.key === 'Escape' && cancel(), [cancel])
  const confirm = useCallback(async () => {
    setStep('busy')
    const ok = await deleteChecks(apiUrl, await sessionId(storage))
    if (ok) await renewSessionId(storage)
    setStep(ok ? 'done' : 'failed')
  }, [apiUrl, storage])

  const asking = step === 'confirm' || step === 'busy'
  return (
    <section className="block quiet">
      {asking ? (
        // Esc on either button closes the question and returns focus (meritum-ui rule 7).
        <div>
          <p id="delete-question">{extension.popup_delete_confirm}</p>
          <span className="top-r">
            <button
              ref={confirmButton}
              type="button"
              className="btn sm p"
              aria-describedby="delete-question"
              disabled={step === 'busy'}
              onClick={confirm}
              onKeyDown={onKeyDown}
            >
              {extension.popup_delete_yes}
            </button>
            <button
              type="button"
              className="btn sm"
              disabled={step === 'busy'}
              onClick={cancel}
              onKeyDown={onKeyDown}
            >
              {extension.popup_delete_cancel}
            </button>
          </span>
        </div>
      ) : (
        <button ref={openButton} type="button" className="btn sm" onClick={ask}>
          {extension.popup_delete}
        </button>
      )}
      <p aria-live="polite">
        {step === 'done' && extension.popup_deleted}
        {step === 'failed' && extension.popup_delete_failed}
      </p>
    </section>
  )
}
