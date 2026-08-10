'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from './lib/supabase'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobUrl, setJobUrl] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(function (result) {
      setUser(result.data.user)
      setCheckingAuth(false)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleSubmit = async () => {
    if (!resumeFile || !jobUrl) return
    setLoading(true)
    setError('')

    try {
      setStatus('Reading your resume')
      const formData = new FormData()
      formData.append('resume', resumeFile)
      const resumeRes = await fetch('/api/parse-resume', { method: 'POST', body: formData })
      const resumeData = await resumeRes.json()
      if (!resumeRes.ok) throw new Error(resumeData.error || 'Resume parsing failed')

      setStatus('Reading the job posting')
      const jobRes = await fetch('/api/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl: jobUrl }),
      })
      const jobData = await jobRes.json()
      if (!jobRes.ok) throw new Error(jobData.error || 'Job parsing failed')

      setStatus('Researching the company and scoring your fit')
      const agentRes = await fetch('/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRunId: jobData.jobRunId }),
      })
      const agentData = await agentRes.json()
      if (!agentRes.ok) throw new Error(agentData.error || 'Agent run failed')

      router.push('/runs/' + jobData.jobRunId)
    } catch (err: any) {
      setError(err.message || String(err))
      setLoading(false)
      setStatus('')
    }
  }

  const pageStyle = { minHeight: '100vh', background: 'var(--bg)', padding: '3rem 1.5rem' }
  const containerStyle = { maxWidth: '480px', margin: '0 auto' }
  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }
  const inputStyle = { width: '100%', padding: '0.65rem 0.75rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.95rem' }
  const buttonStyle = {
    width: '100%',
    marginTop: '1.5rem',
    padding: '0.8rem',
    cursor: loading || !resumeFile || !jobUrl ? 'not-allowed' : 'pointer',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontWeight: 700,
    fontSize: '0.95rem',
  }
  const signOutButtonStyle = { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, textDecoration: 'underline' }

  if (checkingAuth) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <p style={{ color: 'var(--text-muted)' }}>Loading</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <h1>Scoutly</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.5 }}>
            An honest fit analysis for one specific job, built by an agent that researches the company, scores your real experience, and tells you where the gaps actually are.
          </p>
          <a href="/login" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.7rem 1.4rem', backgroundColor: 'var(--accent)', color: 'var(--accent-text)', borderRadius: 'var(--radius)', textDecoration: 'none', fontWeight: 700 }}>Sign In</a>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1>Scoutly</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
          {user.email} &middot; <a href="/runs">View past runs</a> &middot; <button onClick={handleSignOut} style={signOutButtonStyle}>Sign out</button>
        </p>

        <div style={{ ...cardStyle, marginTop: '2rem' }}>
          <div>
            <label style={labelStyle}>Your Resume</label>
            <input type="file" accept=".pdf,.docx" onChange={function (e) { setResumeFile(e.target.files ? e.target.files[0] : null) }} style={inputStyle} />
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <label style={labelStyle}>Job Posting URL</label>
            <input type="text" value={jobUrl} onChange={function (e) { setJobUrl(e.target.value) }} placeholder="https://..." style={inputStyle} />
          </div>

          <button onClick={handleSubmit} disabled={loading || !resumeFile || !jobUrl} style={buttonStyle}>
            {loading ? status : 'Analyze Fit'}
          </button>

          {loading && (
            <div style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>This takes about 15 seconds</span>
            </div>
          )}

          {error && <p style={{ color: 'var(--fit-weak)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
        </div>
      </div>
    </div>
  )
}
