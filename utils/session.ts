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

// Draws a new random session_id (UUID v4) and stores it, replacing the old one.
async function renewSessionId(store: SessionStore): Promise<SessionId> {
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
export function getOrCreateSessionId(store: SessionStore): Promise<SessionId> {
  // One read-or-create per store at a time: StrictMode mounts twice and must not draw two ids.
  const running = pending.get(store) ?? readOrCreate(store).finally(() => pending.delete(store))
  pending.set(store, running)
  return running
}

const pending = new WeakMap<SessionStore, Promise<SessionId>>()

async function readOrCreate(store: SessionStore): Promise<SessionId> {
  const id = (await store.get(SESSION_ID_KEY))[SESSION_ID_KEY]
  return typeof id === 'string' && id ? id : renewSessionId(store)
}

/**
 * Asks the API to delete every check of this session and, once the server confirms,
 * draws a new session_id; on any failure the stored id stays as it was.
 *
 * @param apiUrl - Base address of the verification core.
 * @param store - chrome.storage.local or a fake.
 * @returns True when the checks were deleted and the id renewed; false on an error answer,
 *   no network or a storage failure.
 * @feature US-BEZ-05, US-BEZ-06
 */
export async function deleteMyChecks(apiUrl: string, store: SessionStore): Promise<boolean> {
  try {
    const id = await getOrCreateSessionId(store)
    const path = DELETE_CHECKS_PATH.replace('{session_id}', encodeURIComponent(id))
    if (!(await fetch(`${apiUrl}${path}`, { method: 'DELETE' })).ok) return false
    await renewSessionId(store)
    return true
  } catch {
    return false
  }
}
