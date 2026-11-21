import { useEffect, useState } from 'react'
import copy from '../../design-system/copy/pl.json' with { type: 'json' }

// Build-time API of the verification core (prd unless WXT_API_URL says otherwise).
// `?.`: Vite fills import.meta.env at build time; under node --test it is undefined.
const apiUrl = import.meta.env?.['WXT_API_URL'] ?? 'https://meritum.gburek.app'

type Health = { status: string; env: string; database: string }

// Logo B "Dwa łuki", same markup as design-system/extension/popup/popup.html.
function Mark() {
  return (
    <svg className="mark" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M10 40V25c0-5.5 3.1-9 7-9s7 3.5 7 9v15M24 25c0-5.5 3.1-9 7-9s7 3.5 7 9v15"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path className="acc" d="M24 25v15" fill="none" strokeWidth="4" strokeLinecap="round" />
      <circle className="dot" cx="24" cy="7.6" r="3.5" />
    </svg>
  )
}

function badge(health: Health | null, failed: boolean): { state: string; text: string } {
  if (health?.status === 'ok') {
    return { state: 'ok', text: copy.extension.popup_api_ok.replace('{api}', apiUrl) }
  }
  const answeredBadly = failed || health !== null
  return answeredBadly
    ? { state: 'bad', text: copy.extension.popup_api_down }
    : { state: 'pend', text: copy.extension.popup_connecting }
}

/**
 * The popup: the Meritum header with the API status and, later, the paste-to-check box.
 *
 * @returns The popup content.
 * @feature US-WTY-02
 */
export function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/health`)
      .then((r) => r.json() as Promise<Health>)
      .then(setHealth)
      .catch(() => setFailed(true))
  }, [])

  const status = badge(health, failed)
  return (
    <>
      <header className="top">
        <span className="logo">
          <Mark />
          meritum
        </span>
        <span className={`badge ${status.state}`} aria-live="polite">
          {status.text}
        </span>
      </header>
      <main>
        <section className="block quiet">
          <p>
            Obywatelski radar dezinformacji. Przycisk „Sprawdź” pod postem i okienko do wklejenia
            tekstu są w budowie.
          </p>
        </section>
      </main>
    </>
  )
}
