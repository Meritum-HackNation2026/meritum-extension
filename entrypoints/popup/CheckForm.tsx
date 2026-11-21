import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }
import { type CheckOutcome, sendCheck, toCheckRequest } from '../../utils/check.ts'
import { getOrCreateSessionId, type SessionStore } from '../../utils/session.ts'
import { CheckAnswer } from './CheckAnswer.tsx'

/**
 * The paste box: the web form's field, validation and messages, the AI notice shown at first
 * contact (AI Act art. 50) and the note that nothing is sent before „Sprawdź”.
 *
 * @param props.apiUrl - Base address of the verification core.
 * @param props.storage - chrome.storage.local (or a fake) holding the session id sent with the check.
 * @returns The paste box and the answer under it.
 * @feature US-WTY-02, US-WTY-04, US-BEZ-07, F-02, F-21
 */
export function CheckForm({ apiUrl, storage }: { apiUrl: string; storage: SessionStore }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null)

  const edit = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    setError(null)
  }, [])

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      const request = toCheckRequest(value)
      if (typeof request === 'string') {
        setError(copy.errors[request])
        setOutcome(null) // an old verdict under rejected input would read as its answer
        return
      }
      setBusy(true)
      setOutcome(null)
      const outcome = await getOrCreateSessionId(storage).then(
        (id) => sendCheck(apiUrl, request, id),
        (): CheckOutcome => ({ problem: 'failed' }),
      )
      setOutcome(outcome)
      setBusy(false)
    },
    [apiUrl, storage, value],
  )

  return (
    <>
      <form className="block ask" aria-labelledby="ask-h" noValidate onSubmit={submit}>
        <h1 id="ask-h">{copy.extension.popup_title}</h1>
        <p className="muted small">{copy.ai_notice.first_contact}</p>
        <label className="sr" htmlFor="ask">
          {copy.form.input_label}
        </label>
        <textarea
          id="ask"
          className="field"
          rows={4}
          placeholder={copy.form.input_placeholder}
          value={value}
          aria-invalid={error !== null}
          aria-describedby="ask-err ask-hint"
          onChange={edit}
        />
        <p className="err" id="ask-err" role="alert" hidden={error === null}>
          {error}
        </p>
        <button className="btn p wide" type="submit" disabled={busy}>
          {busy ? copy.form.checking : copy.form.submit}
        </button>
        <p className="muted small" id="ask-hint">
          {copy.extension.page_hint}
        </p>
      </form>
      <CheckAnswer outcome={outcome} />
    </>
  )
}
