/**
 * The extension's anonymous session: a random id in chrome.storage.local that ties the
 * user's checks together so they can delete them (US-BEZ-05, US-BEZ-06).
 *
 * @feature US-BEZ-05, US-BEZ-06
 */
import type { SessionId } from '../design-system/contracts/meritum.ts'
import { DELETE_CHECKS_PATH, SESSION_ID_KEY } from './constants.ts'

/**
 * The part of chrome.storage.local (`browser.storage.local`) the session needs.
 *
 * @feature US-BEZ-05, US-BEZ-06
 */
export type SessionStore = {
  get(key: string): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

/**
 * Draws a new random session_id (UUID v4) and stores it, replacing the old one.
 *
 * @param store - chrome.storage.local or a fake.
 * @returns The new id.
 * @feature US-BEZ-05, US-BEZ-06
 */
export async function renewSessionId(store: SessionStore): Promise<SessionId> {
  const id = crypto.randomUUID()
  await store.set({ [SESSION_ID_KEY]: id })
  return id
}

/**
 * Returns the stored session_id, creating it on first use.
 *
 * @param store - chrome.storage.local or a fake.
 * @returns The session id to send with every check.
 * @feature US-BEZ-05, US-BEZ-06
 */
export async function sessionId(store: SessionStore): Promise<SessionId> {
  const id = (await store.get(SESSION_ID_KEY))[SESSION_ID_KEY]
  return typeof id === 'string' && id ? id : renewSessionId(store)
}

/**
 * Asks the API to delete every check of the session.
 *
 * @param apiUrl - Base address of the verification core.
 * @param id - The session whose checks go.
 * @returns True when the server confirmed the deletion; false on an error answer or no network.
 * @feature US-BEZ-05, US-BEZ-06
 */
export async function deleteChecks(apiUrl: string, id: SessionId): Promise<boolean> {
  const path = DELETE_CHECKS_PATH.replace('{session_id}', encodeURIComponent(id))
  try {
    return (await fetch(`${apiUrl}${path}`, { method: 'DELETE' })).ok
  } catch {
    return false
  }
}
