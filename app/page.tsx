'use client'

import { useState } from 'react'

export default function Home() {
  const [jobUrl, setJobUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleParse = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setResult(data.data)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Scoutly — Job Parser Test</h1>
      <input
        type="text"
        value={jobUrl}
        onChange={(e) => setJobUrl(e.target.value)}
        placeholder="Paste a job posting URL"
        style={{
          width: '100%',
          padding: '0.5rem',
          marginTop: '1rem',
          color: 'black',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      />
      <button
        onClick={handleParse}
        disabled={loading || !jobUrl}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          backgroundColor: 'white',
          color: 'black',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        {loading ? 'Parsing...' : 'Parse Job'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</p>}

      {result && (
        <pre
          style={{
            background: '#111',
            padding: '1rem',
            marginTop: '1rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  )
}