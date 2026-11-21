import { useEffect, useState } from 'react'

const API = import.meta.env.WXT_API_URL ?? 'https://meritum.gburek.app'

type Health = { status: string; env: string }

export function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/v1/health`)
      .then((r) => r.json() as Promise<Health>)
      .then(setHealth)
      .catch(() => setFailed(true))
  }, [])

  return (
    <main>
      <h1>Meritum</h1>
      <p>Obywatelski radar dezinformacji</p>
      <p className="status" aria-live="polite">
        {health
          ? `API: ${health.status} (${health.env})`
          : failed
            ? 'API nie odpowiada'
            : 'Łączę z API…'}
      </p>
    </main>
  )
}
