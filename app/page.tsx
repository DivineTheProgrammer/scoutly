'use client'

import { useState } from 'react'

export default function Home() {
  // Job parser state
  const [jobUrl, setJobUrl] = useState('')
  const [jobLoading, setJobLoading] = useState(false)
  const [jobResult, setJobResult] = useState<any>(null)
  const [jobError, setJobError] = useState('')

  // Resume parser state
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeResult, setResumeResult] = useState<any>(null)
  const [resumeError, setResumeError] = useState('')

  // Agent state
  const [jobRunId, setJobRunId] = useState('')
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentResult, setAgentResult] = useState<any>(null)
  const [agentError, setAgentError] = useState('')

  const handleParseJob = async () => {
    setJobLoading(true)
    setJobError('')
    setJobResult(null)

    try {
      const res = await fetch('/api/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl }),
      })
      const data = await res.json()

      if (!res.ok) {
        setJobError(data.error || 'Something went wrong')
      } else {
        setJobResult(data.data)
      }
    } catch (err) {
      setJobError(String(err))
    } finally {
      setJobLoading(false)
    }
  }

  const handleParseResume = async () => {
    if (!resumeFile) return

    setResumeLoading(true)
    setResumeError('')
    setResumeResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setResumeError(data.error || 'Something went wrong')
      } else {
        setResumeResult(data.data)
      }
    } catch (err) {
      setResumeError(String(err))
    } finally {
      setResumeLoading(false)
    }
  }

  const handleRunAgent = async () => {
    setAgentLoading(true)
    setAgentError('')
    setAgentResult(null)

    try {
      const res = await fetch('/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRunId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAgentError(data.error || 'Something went wrong')
      } else {
        setAgentResult(data)
      }
    } catch (err) {
      setAgentError(String(err))
    } finally {
      setAgentLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginTop: '1rem',
    color: 'black',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
  }

  const buttonStyle = {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    backgroundColor: 'white',
    color: 'black',
    border: 'none',
    borderRadius: '4px',
  }

  const resultStyle = {
    background: '#111',
    padding: '1rem',
    marginTop: '1rem',
    overflow: 'auto',
    whiteSpace: 'pre-wrap' as const,
  }

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Scoutly — Job Parser Test</h1>
      <input
        type="text"
        value={jobUrl}
        onChange={(e) => setJobUrl(e.target.value)}
        placeholder="Paste a job posting URL"
        style={inputStyle}
      />
      <button onClick={handleParseJob} disabled={jobLoading || !jobUrl} style={buttonStyle}>
        {jobLoading ? 'Parsing...' : 'Parse Job'}
      </button>

      {jobError && <p style={{ color: 'red', marginTop: '1rem' }}>Error: {jobError}</p>}
      {jobResult && <pre style={resultStyle}>{JSON.stringify(jobResult, null, 2)}</pre>}

      <hr style={{ margin: '3rem 0', borderColor: '#333' }} />

      <h1>Resume Parser Test</h1>
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
        style={{ ...inputStyle, padding: '0.5rem' }}
      />
      <button
        onClick={handleParseResume}
        disabled={resumeLoading || !resumeFile}
        style={buttonStyle}
      >
        {resumeLoading ? 'Parsing...' : 'Parse Resume'}
      </button>

      {resumeError && <p style={{ color: 'red', marginTop: '1rem' }}>Error: {resumeError}</p>}
      {resumeResult && <pre style={resultStyle}>{JSON.stringify(resumeResult, null, 2)}</pre>}

      <hr style={{ margin: '3rem 0', borderColor: '#333' }} />

      <h1>Agent Test</h1>
      <p style={{ color: '#999', fontSize: '0.9rem' }}>
        Paste a jobRunId from your job_runs table (copy from Supabase Table Editor)
      </p>
      <input
        type="text"
        value={jobRunId}
        onChange={(e) => setJobRunId(e.target.value)}
        placeholder="Paste a job_run id"
        style={inputStyle}
      />
      <button onClick={handleRunAgent} disabled={agentLoading || !jobRunId} style={buttonStyle}>
        {agentLoading ? 'Running...' : 'Run Agent'}
      </button>

      {agentError && <p style={{ color: 'red', marginTop: '1rem' }}>Error: {agentError}</p>}
      {agentResult && <pre style={resultStyle}>{JSON.stringify(agentResult, null, 2)}</pre>}
    </main>
  )
}