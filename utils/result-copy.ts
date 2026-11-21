/**
 * User-facing text of a check result, worded only from the contract codes through
 * copy/pl.json. CheckResult.message is debug text and never reaches the screen.
 *
 * @feature US-WTY-02, F-02
 */
import type { CheckResult, FailureCode, Status } from '../design-system/contracts/meritum.ts'
import copy from '../design-system/copy/pl.json' with { type: 'json' }

/**
 * The hint under a state that is not a verdict: the failure code's copy, else the status hint.
 *
 * @param status - The result's status, any but `done`.
 * @param failureCode - The result's failure code, set only for a technical failure.
 * @returns The Polish hint from copy/pl.json.
 * @feature US-WTY-02, F-02
 */
export function statusHint(status: Exclude<Status, 'done'>, failureCode?: FailureCode): string {
  // A code newer than the synced copy has no text yet: fall back to the status hint.
  const coded: string | undefined = failureCode ? copy.failure_code[failureCode] : undefined
  return coded ?? copy.status_hint[status]
}

/**
 * What the check could not do, one Polish sentence per limitation code.
 *
 * @param result - Any result; one without codes has no limitations to show.
 * @returns The texts from copy/pl.json, in the order of the codes, without unknown codes.
 * @feature US-WTY-02, F-02
 */
export function limitationTexts(result: CheckResult): string[] {
  // Codes newer than the synced copy have no text yet and are skipped.
  return (result.limitation_codes ?? [])
    .map((code): string | undefined => copy.limitation_code[code])
    .filter((text) => text !== undefined)
}
