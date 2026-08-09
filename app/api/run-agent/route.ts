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

    // STEP B: Fit Scoring
    const scoringStart = Date.now()

    const scoringPrompt = `You are an honest, rigorous career coach analyzing fit between a candidate and a job. Do NOT be generous — only claim a match if there is real evidence in the resume. Do NOT fabricate gaps that aren't real either.

JOB REQUIREMENTS:
${JSON.stringify(jobData.requirements)}

NICE TO HAVE:
${JSON.stringify(jobData.niceToHave)}

CANDIDATE'S RESUME DATA:
${JSON.stringify(resumeData)}

COMPANY CONTEXT:
${researchSummary.slice(0, 1500)}

Return ONLY valid JSON, no markdown, no explanation, in this exact structure:
{
  "overallFit": "strong | moderate | weak",
  "matchedRequirements": [
    { "requirement": "the requirement text", "evidence": "specific evidence from the resume that supports this" }
  ],
  "genuineGaps": [
    { "requirement": "the requirement text", "reason": "why the resume doesn't show evidence of this" }
  ],
  "standoutPoints": ["anything from the resume that's a genuine differentiator for this specific role"]
}`

    const scoringCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: scoringPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    })

    const scoringResponseText = scoringCompletion.choices[0]?.message?.content || ''
    const scoringCleanedJson = scoringResponseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    const fitScore = JSON.parse(scoringCleanedJson)

    await supabase.from('run_steps').insert({
      job_run_id: jobRunId,
      step_number: stepNumber++,
      step_name: 'score_fit',
      step_input: { requirements: jobData.requirements },
      step_output: fitScore,
      latency_ms: Date.now() - scoringStart,
    })

    // Save fit score to the job_runs row itself
    await supabase
      .from('job_runs')
      .update({ fit_score: fitScore, status: 'scored' })
      .eq('id', jobRunId)

    // STEP C: Generate Tailored Output
    const generationStart = Date.now()

    const generationPrompt = `You are a career coach helping a candidate apply to a specific job. Based on the job requirements, the candidate's real resume data, and the fit analysis below, write:

1. Three tailored resume bullet points that honestly highlight the candidate's MOST relevant experience for this specific role (do not fabricate anything not in the resume — only reframe and emphasize what's real)
2. A short, genuine cold outreach message (3-4 sentences) the candidate could send to a recruiter or hiring manager at this company

JOB: ${jobData.title} at ${jobData.company}
JOB REQUIREMENTS: ${JSON.stringify(jobData.requirements)}

CANDIDATE RESUME DATA: ${JSON.stringify(resumeData)}

FIT ANALYSIS: ${JSON.stringify(fitScore)}

Return ONLY valid JSON, no markdown, no explanation, in this exact structure:
{
  "tailoredBullets": ["bullet 1", "bullet 2", "bullet 3"],
  "outreachMessage": "the message text"
}`

    const generationCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: generationPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
    })

    const generationResponseText = generationCompletion.choices[0]?.message?.content || ''
    const generationCleanedJson = generationResponseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    const generatedOutput = JSON.parse(generationCleanedJson)

    await supabase.from('run_steps').insert({
      job_run_id: jobRunId,
      step_number: stepNumber++,
      step_name: 'generate_output',
      step_input: { jobTitle: jobData.title, company: jobData.company },
      step_output: generatedOutput,
      latency_ms: Date.now() - generationStart,
    })

    // Mark the job run as fully completed with all output saved
    await supabase
      .from('job_runs')
      .update({ generated_output: generatedOutput, status: 'completed' })
      .eq('id', jobRunId)

    return NextResponse.json({
      success: true,
      message: 'Agent run complete — research, scoring, and generation all done',
      researchSummary,
      fitScore,
      generatedOutput,
    })
  } catch (error) {
    console.error('Run agent error:', error)
    return NextResponse.json(
      { error: 'Agent run failed', details: String(error) },
      { status: 500 }
    )
  }
}