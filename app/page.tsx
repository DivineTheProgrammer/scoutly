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

  const handleSubmit = async () => {
    if (!resumeFile || !jobUrl) return
    setLoading(true)
    setError('')

    try {
      setStatus('Parsing resume...')
      const formData = new FormData()
      formData.append('resume', resumeFile)
      const resumeRes = await fetch('/api/parse-resume', { method: 'POST', body: formData })
      const resumeData = await resumeRes.json()
      if (!resumeRes.ok) throw new Error(resumeData.error || 'Resume parsing failed')

      setStatus('Parsing job posting...')
      const jobRes = await fetch('/api/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl: jobUrl }),
      })
      const jobData = await jobRes.json()
      if (!jobRes.ok) throw new Error(jobData.error || 'Job parsing failed')

      setStatus('Running agent...')
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

  const signInLinkStyle = { display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: 'white', color: 'black', borderRadius: '4px', textDecoration: 'none' }

  if (checkingAuth) {
    return <main style={{ padding: '2rem', color: 'white' }}>Loading...</main>
  }

  if (!user) {
    return (
      <main style={{ padding: '2rem', color: 'white', maxWidth: '500px', margin: '0 auto' }}>
        <h1>Scoutly</h1>
        <p style={{ color: '#999', marginTop: '1rem' }}>Sign in to get started with tailored job applications.</p>
        <a href="/login" style={signInLinkStyle}>Sign In</a>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Scoutly</h1>
      <p style={{ color: '#999', marginTop: '0.5rem' }}>
        Signed in as {user.email} - <a href="/runs" style={{ color: '#4ea8ff' }}>View past runs</a>
      </p>

      <div style={{ marginTop: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Your Resume</label>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={function (e) { setResumeFile(e.target.files ? e.target.files[0] : null) }}
          style={{ width: '100%', padding: '0.5rem', color: 'black', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Job Posting URL</label>
        <input
          type="text"
          value={jobUrl}
          onChange={function (e) { setJobUrl(e.target.value) }}
          placeholder="https://..."
          style={{ width: '100%', padding: '0.5rem', color: 'black', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !resumeFile || !jobUrl}
        style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', cursor: 'pointer', backgroundColor: 'white', color: 'black', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
      >
        {loading ? (status || 'Working...') : 'Analyze Fit'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</p>}
    </main>
  )
}
