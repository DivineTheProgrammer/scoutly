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

  const statusColorMap: any = {
    completed: 'var(--status-completed)',
    running: 'var(--status-running)',
    pending: 'var(--status-pending)',
    failed: 'var(--status-failed)',
  }

  const pageStyle = { minHeight: '100vh', background: 'var(--bg)', padding: '3rem 1.5rem' }
  const containerStyle = { maxWidth: '700px', margin: '0 auto' }
  const cardStyle = { display: 'block', padding: '1.1rem 1.25rem', marginBottom: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textDecoration: 'none', color: 'var(--text-primary)' }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1>Your Job Runs</h1>
        <p style={{ marginTop: '0.5rem' }}><a href="/" style={{ fontSize: '0.85rem' }}>&larr; Back to new analysis</a></p>

        {loading && <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading</p>}

        {!loading && runs.length === 0 && (
          <div style={{ marginTop: '2rem', padding: '2rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No job runs yet.</p>
            <a href="/" style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.9rem' }}>Analyze your first job posting</a>
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          {runs.map(function (run) {
            const title = run.job_parsed_data && run.job_parsed_data.title ? run.job_parsed_data.title : 'Untitled'
            const company = run.job_parsed_data && run.job_parsed_data.company ? run.job_parsed_data.company : 'Unknown company'
            const fitText = run.fit_score && run.fit_score.overallFit ? ' \u00b7 Fit: ' + run.fit_score.overallFit : ''
            const statusColor = statusColorMap[run.status] || 'var(--text-muted)'
            return (
              <a key={run.id} href={'/runs/' + run.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{title}</strong>
                  <span style={{ color: statusColor, fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>{run.status}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>{company}{fitText}</div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
