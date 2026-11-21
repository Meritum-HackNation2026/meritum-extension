/**
 * The background side of „Sprawdź” under a post: the content script cannot call the API
 * itself (the host page's CORS and CSP apply to it), so it sends the post here and the
 * background checks it with the popup's API client.
 *
 * @feature US-WTY-01, US-WTY-04, F-02
 */
import { type CheckOutcome, type InputError, sendCheck, toPostRequest } from './check.ts'
import { CHECK_POST_MESSAGE } from './constants.ts'
import { getOrCreateSessionId, type SessionStore } from './session.ts'

/**
 * What the content script sends after a trusted click: the post's text and address.
 *
 * @feature US-WTY-01, US-WTY-04, F-02
 */
export type PostCheckMessage = { type: typeof CHECK_POST_MESSAGE; text: string; pageUrl: string }

/**
 * What the widget under a post shows: the check's outcome, or why the post was not sent.
 *
 * @feature US-WTY-01, US-WTY-04, F-02
 */
export type PostOutcome = CheckOutcome | { input: InputError }

// Trust boundary: a runtime message is checked field by field before anything is sent.
function isPostCheckMessage(message: unknown): message is PostCheckMessage {
  if (typeof message !== 'object' || message === null) return false
  const fields = message as Record<string, unknown>
  const isOurs = fields['type'] === CHECK_POST_MESSAGE
  return isOurs && typeof fields['text'] === 'string' && typeof fields['pageUrl'] === 'string'
}

/**
 * Answers a post-check message: validates it, sends the post to POST /api/v1/checks with the
 * extension's session id and waits for the result.
 *
 * @param apiUrl - Base address of the verification core.
 * @param storage - chrome.storage.local holding the session id (the one „Usuń” deletes).
 * @param message - Any runtime message; only a {@link PostCheckMessage} is handled.
 * @returns The outcome to show under the post, or null when the message is not ours.
 * @feature US-WTY-01, US-WTY-04, US-BEZ-05, F-02
 */
export function answerPostCheck(
  apiUrl: string,
  storage: SessionStore,
  message: unknown,
): Promise<PostOutcome> | null {
  if (!isPostCheckMessage(message)) return null
  const request = toPostRequest(message.text, message.pageUrl)
  return typeof request === 'string'
    ? Promise.resolve({ input: request })
    : getOrCreateSessionId(storage).then(
        (id) => sendCheck(apiUrl, request, id),
        (): PostOutcome => ({ problem: 'failed' }),
      )
}

/**
 * The background's chrome.runtime.onMessage listener for post checks. Answers only messages
 * from this extension (`sender.id`); the answer is asynchronous, so it returns true.
 *
 * @param apiUrl - Base address of the verification core.
 * @param storage - chrome.storage.local holding the session id.
 * @param extensionId - `chrome.runtime.id` of this extension.
 * @returns The listener to pass to `chrome.runtime.onMessage.addListener`.
 * @feature US-WTY-01, US-WTY-04, F-02
 */
export function postCheckListener(
  apiUrl: string,
  storage: SessionStore,
  extensionId: string,
): (message: unknown, sender: { id?: string }, reply: (outcome: PostOutcome) => void) => boolean {
  return (message, sender, reply) => {
    const answer = sender.id === extensionId ? answerPostCheck(apiUrl, storage, message) : null
    if (!answer) return false
    answer.then(reply)
    return true
  }
}
