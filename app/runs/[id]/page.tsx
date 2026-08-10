import { createServerSupabaseClient } from '../../lib/supabase-server'
import { notFound } from 'next/navigation'

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: run } = await supabase
    .from('job_runs')
    .select('*, resumes(*)')
    .eq('id', id)
    .single()

  if (!run) {
    notFound()
  }

  const { data: steps } = await supabase
    .from('run_steps')
    .select('*')
    .eq('job_run_id', id)
    .order('step_number', { ascending: true })

  const pageStyle = { minHeight: '100vh', background: 'var(--bg)', padding: '3rem 1.5rem' }
  const containerStyle = { maxWidth: '780px', margin: '0 auto' }
  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.25rem' }

  const fitColorMap: any = { strong: 'var(--fit-strong)', moderate: 'var(--fit-moderate)', weak: 'var(--fit-weak)' }
  const fitColor = run.fit_score && fitColorMap[run.fit_score.overallFit] ? fitColorMap[run.fit_score.overallFit] : 'var(--text-muted)'

  const stepLabels: any = {
    research_company: 'Company Research',
    score_fit: 'Fit Scoring',
    generate_output: 'Generating Tailored Output',
  }

  const stepDescriptions: any = {
    research_company: 'Searched the web for company context, tech stack, and culture signals.',
    score_fit: 'Compared job requirements against the resume, evidence by evidence.',
    generate_output: 'Wrote tailored resume bullets and an outreach message based on what actually matched.',
  }

  const originalBullets: string[] = []
  if (run.resumes && run.resumes.parsed_data && run.resumes.parsed_data.experience) {
    run.resumes.parsed_data.experience.forEach(function (exp: any) {
      if (exp.achievements) {
        exp.achievements.forEach(function (a: string) { originalBullets.push(a) })
      }
    })
  }

  const tailoredBullets = run.generated_output && run.generated_output.tailoredBullets ? run.generated_output.tailoredBullets : []

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <a href="/runs" style={{ fontSize: '0.85rem' }}>&larr; Back to all runs</a>

        <div style={{ marginTop: '1rem' }}>
          <h1>{run.job_parsed_data && run.job_parsed_data.title ? run.job_parsed_data.title : 'Untitled'}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
            {run.job_parsed_data && run.job_parsed_data.company ? run.job_parsed_data.company : 'Unknown company'} &middot; {run.status}
          </p>
        </div>

        {run.fit_score && (
          <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
              <h2>Fit</h2>
              <span style={{ color: fitColor, fontWeight: 700, textTransform: 'capitalize' }}>{run.fit_score.overallFit}</span>
            </div>

            {run.fit_score.matchedRequirements && run.fit_score.matchedRequirements.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <h3>Matched Requirements</h3>
                {run.fit_score.matchedRequirements.map(function (m: any, i: number) {
                  return (
                    <div key={i} style={{ marginTop: '0.6rem', paddingLeft: '0.9rem', borderLeft: '2px solid var(--fit-strong)' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{m.requirement}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{m.evidence}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {run.fit_score.genuineGaps && run.fit_score.genuineGaps.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <h3>Genuine Gaps</h3>
                {run.fit_score.genuineGaps.map(function (g: any, i: number) {
                  return (
                    <div key={i} style={{ marginTop: '0.6rem', paddingLeft: '0.9rem', borderLeft: '2px solid var(--fit-weak)' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{g.requirement}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{g.reason}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {run.fit_score.standoutPoints && run.fit_score.standoutPoints.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <h3>Standout Points</h3>
                <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.2rem' }}>
                  {run.fit_score.standoutPoints.map(function (s: string, i: number) {
                    return <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{s}</li>
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {(originalBullets.length > 0 || tailoredBullets.length > 0) && (
          <div style={cardStyle}>
            <h2>Before &amp; After</h2>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <div style={{ flex: '1 1 280px' }}>
                <h3>Original</h3>
                <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.2rem' }}>
                  {originalBullets.map(function (b, i) {
                    return <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{b}</li>
                  })}
                </ul>
              </div>
              <div style={{ flex: '1 1 280px' }}>
                <h3 style={{ color: 'var(--fit-strong)' }}>Tailored for This Role</h3>
                <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.2rem' }}>
                  {tailoredBullets.map(function (b: string, i: number) {
                    return <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{b}</li>
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        {run.generated_output && (
          <div style={cardStyle}>
            <h2>Outreach Message</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '0.75rem' }}>{run.generated_output.outreachMessage}</p>
          </div>
        )}

        <div style={cardStyle}>
          <h2>How the Agent Got Here</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Every step the agent took, in order, with real timing.</p>

          <div style={{ marginTop: '1.25rem' }}>
            {steps && steps.length > 0 ? steps.map(function (step: any, index: number) {
              const label = stepLabels[step.step_name] || step.step_name
              const description = stepDescriptions[step.step_name] || ''
              return (
                <div key={step.id} style={{ display: 'flex', gap: '1rem', marginBottom: index === steps.length - 1 ? 0 : '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {step.step_number}
                    </div>
                    {index !== steps.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border)', marginTop: '4px' }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{label}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.latency_ms}ms</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{description}</p>
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary style={{ fontSize: '0.8rem', color: 'var(--accent)', cursor: 'pointer' }}>View raw output</summary>
                      <pre style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', marginTop: '0.5rem', background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        {JSON.stringify(step.step_output, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )
            }) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No steps recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
