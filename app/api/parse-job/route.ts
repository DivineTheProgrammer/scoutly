import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../lib/supabase-server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to parse a job posting' }, { status: 401 })
    }

    const { jobUrl } = await req.json()

    if (!jobUrl) {
      return NextResponse.json({ error: 'jobUrl is required' }, { status: 400 })
    }

    // Step 1: Fetch the raw HTML of the job posting
    const pageResponse = await fetch(jobUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!pageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch job page: ${pageResponse.status} ${pageResponse.statusText}` },
        { status: 502 }
      )
    }

    const html = await pageResponse.text()

    // Step 2: Strip HTML tags down to readable text
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000)

    // Step 3: Ask the model to extract structured data
    const prompt = `You are a job posting parser. Extract structured data from the following job posting text and return ONLY valid JSON, no markdown formatting, no explanation.

Return this exact structure:
{
  "title": "job title",
  "company": "company name",
  "location": "location or 'Remote' if remote",
  "seniority": "junior | mid | senior | lead | unknown",
  "requirements": ["requirement 1", "requirement 2"],
  "niceToHave": ["nice to have 1"],
  "techStack": ["technology 1", "technology 2"]
}

Job posting text:
${textContent}`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
    })

    const responseText = completion.choices[0]?.message?.content || ''

    const cleanedJson = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsedData = JSON.parse(cleanedJson)

    return NextResponse.json({ success: true, data: parsedData })
  } catch (error) {
    console.error('Parse job error:', error)
    return NextResponse.json(
      { error: 'Failed to parse job posting', details: String(error) },
      { status: 500 }
    )
  }
}