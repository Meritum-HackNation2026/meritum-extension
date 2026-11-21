import { useEffect, useState } from 'react'

const API = import.meta.env.WXT_API_URL ?? 'https://meritum.gburek.app'

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

export function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/v1/health`)
      .then((r) => r.json() as Promise<Health>)
      .then(setHealth)
      .catch(() => setFailed(true))
  }, [])

  const ok = health?.status === 'ok'
  return (
    <>
      <header className="top">
        <span className="logo">
          <Mark />
          meritum
        </span>
        <span
          className={`badge ${ok ? 'ok' : failed || health ? 'bad' : 'pend'}`}
          aria-live="polite"
        >
          {ok ? `API: ${health.env}` : failed || health ? 'API nie odpowiada' : 'Łączę…'}
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
