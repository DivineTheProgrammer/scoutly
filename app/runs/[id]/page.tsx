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

  const cardStyle = {
    backgroundColor: '#111',
    padding: '1.25rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  }

  const fitColor =
    run.fit_score && run.fit_score.overallFit === 'strong'
      ? 'lightgreen'
      : run.fit_score && run.fit_score.overallFit === 'moderate'
      ? 'orange'
      : 'red'

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      <p>
        <a href="/runs" style={{ color: '#4ea8ff' }}>Back to all runs</a>
      </p>

      <h1 style={{ marginTop: '1rem' }}>
        {run.job_parsed_data && run.job_parsed_data.title ? run.job_parsed_data.title : 'Untitled'}
      </h1>
      <p style={{ color: '#999' }}>
        {run.job_parsed_data && run.job_parsed_data.company ? run.job_parsed_data.company : 'Unknown company'}
        {' - Status: '}{run.status}
      </p>

      {run.fit_score && (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>
            Fit: <span style={{ color: fitColor }}>{run.fit_score.overallFit}</span>
          </h2>

          {run.fit_score.matchedRequirements && run.fit_score.matchedRequirements.length > 0 && (
            <div>
              <h3>Matched Requirements</h3>
              <ul>
                {run.fit_score.matchedRequirements.map((m: any, i: number) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>
                    <strong>{m.requirement}</strong>
                    <br />
                    <span style={{ color: '#999' }}>{m.evidence}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {run.fit_score.genuineGaps && run.fit_score.genuineGaps.length > 0 && (
            <div>
              <h3>Genuine Gaps</h3>
              <ul>
                {run.fit_score.genuineGaps.map((g: any, i: number) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>
                    <strong>{g.requirement}</strong>
                    <br />
                    <span style={{ color: '#999' }}>{g.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {run.fit_score.standoutPoints && run.fit_score.standoutPoints.length > 0 && (
            <div>
              <h3>Standout Points</h3>
              <ul>
                {run.fit_score.standoutPoints.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {run.generated_output && (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Tailored Output</h2>

          <h3>Resume Bullets</h3>
          <ul>
            {run.generated_output.tailoredBullets &&
              run.generated_output.tailoredBullets.map((b: string, i: number) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>{b}</li>
              ))}
          </ul>

          <h3>Outreach Message</h3>
          <p style={{ color: '#ccc' }}>{run.generated_output.outreachMessage}</p>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Reasoning Trace</h2>
        {steps && steps.length > 0 ? (
          steps.map((step: any) => (
            <div
              key={step.id}
              style={{
                borderLeft: '3px solid #4ea8ff',
                paddingLeft: '1rem',
                marginBottom: '1rem',
              }}
            >
              <strong>
                Step {step.step_number}: {step.step_name}
              </strong>
              <div style={{ color: '#999', fontSize: '0.85rem' }}>
                {step.latency_ms}ms
              </div>
              <pre
                style={{
                  fontSize: '0.8rem',
                  color: '#ccc',
                  whiteSpace: 'pre-wrap',
                  marginTop: '0.5rem',
                }}
              >
                {JSON.stringify(step.step_output, null, 2)}
              </pre>
            </div>
          ))
        ) : (
          <p style={{ color: '#999' }}>No steps recorded yet.</p>
        )}
      </div>
    </main>
  )
}
