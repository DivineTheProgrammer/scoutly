import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { extractText, getDocumentProxy } from 'unpdf'
import { createServerSupabaseClient } from '../../lib/supabase-server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to parse a resume' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('resume') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''

    if (file.type === 'application/pdf') {
      const uint8Array = new Uint8Array(buffer)
      const pdf = await getDocumentProxy(uint8Array)
      const { text } = await extractText(pdf, { mergePages: true })
      extractedText = text
    } else if (
      file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or DOCX.' },
        { status: 400 }
      )
    }

    extractedText = extractedText.trim().slice(0, 15000)

    if (!extractedText) {
      return NextResponse.json(
        { error: 'Could not extract any text from the file' },
        { status: 400 }
      )
    }

    const prompt = `You are a resume parser. Extract structured data from the following resume text and return ONLY valid JSON, no markdown formatting, no explanation.

Return this exact structure:
{
  "name": "candidate name if found, else null",
  "email": "email if found, else null",
  "summary": "a 1-2 sentence professional summary based on the resume",
  "experience": [
    {
      "role": "job title",
      "company": "company name",
      "duration": "e.g. Jan 2022 - Present",
      "achievements": ["achievement 1", "achievement 2"]
    }
  ],
  "skills": ["skill 1", "skill 2"],
  "education": [
    {
      "degree": "degree name",
      "institution": "school name",
      "year": "graduation year if found"
    }
  ]
}

Resume text:
${extractedText}`

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

    // Save the parsed resume to the database
    const { data: savedResume, error: saveError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        original_filename: file.name,
        parsed_data: parsedData,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save resume:', saveError)
      return NextResponse.json(
        { error: 'Resume parsed but failed to save', details: saveError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: parsedData, resumeId: savedResume.id })
  } catch (error) {
    console.error('Parse resume error:', error)
    return NextResponse.json(
      { error: 'Failed to parse resume', details: String(error) },
      { status: 500 }
    )
  }
}