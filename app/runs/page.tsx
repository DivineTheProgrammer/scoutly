'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase'

export default function Runs() {
  const supabase = createClient()
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRuns = async () => {
      const { data } = await supabase
        .from('job_runs')
        .select('*')
        .order('created_at', { ascending: false })

      setRuns(data || [])
      setLoading(false)
    }
    fetchRuns()
  }, [])

  const statusColor = (status: string) => {
    if (status === 'completed') return 'lightgreen'
    if (status === 'failed') return 'red'
    if (status === 'running') return 'orange'
    return '#999'
  }

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Your Job Runs</h1>
      <p style={{ marginTop: '0.5rem' }}>
        <a href="/" style={{ color: '#4ea8ff' }}>Back to new analysis</a>
      </p>

      {loading && <p style={{ marginTop: '1rem' }}>Loading...</p>}

      {!loading && runs.length === 0 && (
        <p style={{ marginTop: '1rem', color: '#999' }}>No job runs yet.</p>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        {runs.map((run) => (
          
            key={run.id}
            href={'/runs/' + run.id}
            style={{
              display: 'block',
              padding: '1rem',
              marginBottom: '0.75rem',
              backgroundColor: '#111',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{run.job_parsed_data && run.job_parsed_data.title ? run.job_parsed_data.title : 'Untitled'}</strong>
              <span style={{ color: statusColor(run.status) }}>{run.status}</span>
            </div>
            <div style={{ color: '#999', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {run.job_parsed_data && run.job_parsed_data.company ? run.job_parsed_data.company : 'Unknown company'}
              {run.fit_score && run.fit_score.overallFit ? ' - Fit: ' + run.fit_score.overallFit : ''}
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
