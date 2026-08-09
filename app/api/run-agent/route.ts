import Groq from 'groq-sdk'
import { tavily } from '@tavily/core'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../lib/supabase-server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to run the agent' }, { status: 401 })
    }

    const { jobRunId } = await req.json()

    if (!jobRunId) {
      return NextResponse.json({ error: 'jobRunId is required' }, { status: 400 })
    }

    // Fetch the job run and confirm it belongs to this user
    const { data: jobRun, error: fetchError } = await supabase
      .from('job_runs')
      .select('*, resumes(*)')
      .eq('id', jobRunId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !jobRun) {
      return NextResponse.json({ error: 'Job run not found' }, { status: 404 })
    }

    const jobData = jobRun.job_parsed_data
    const resumeData = jobRun.resumes?.parsed_data

    if (!resumeData) {
      return NextResponse.json({ error: 'No resume linked to this job run' }, { status: 400 })
    }

    await supabase.from('job_runs').update({ status: 'running' }).eq('id', jobRunId)

    let stepNumber = 1

    // STEP A: Company Research
    const researchStart = Date.now()
    const searchResults = await tvly.search(`${jobData.company} company overview tech stack culture`, {
      maxResults: 3,
    })
    const researchSummary = searchResults.results
      .map((r: any) => `${r.title}: ${r.content}`)
      .join('\n\n')
      .slice(0, 3000)

    await supabase.from('run_steps').insert({
      job_run_id: jobRunId,
      step_number: stepNumber++,
      step_name: 'research_company',
      step_input: { query: `${jobData.company} company overview` },
      step_output: { summary: researchSummary },
      latency_ms: Date.now() - researchStart,
    })

    return NextResponse.json({
      success: true,
      message: 'Step 1 (research) complete — more steps coming next',
      researchSummary,
    })
  } catch (error) {
    console.error('Run agent error:', error)
    return NextResponse.json(
      { error: 'Agent run failed', details: String(error) },
      { status: 500 }
    )
  }
}