# Scoutly

An AI agent that tells you the truth about whether you fit a job, not what you want to hear.

Live: https://scoutly-beryl.vercel.app

## The problem

Most AI resume tools flatter you. Paste in any resume and any job, and they will find a way to make it sound like a match. That is not useful. It wastes your time applying to roles you were never going to get, and it does not tell you what you actually need to work on.

Scoutly does the opposite. It is built to be honest, even when honest is disappointing.

## What it does

You upload your resume and paste a job posting URL. From there, an agent takes over and runs three real steps:

1. It researches the company, pulling live information about their tech stack, business, and culture.
2. It compares your actual experience against the job requirements, one requirement at a time, and only counts something as a match if there is real evidence for it in your resume.
3. If there is a genuine fit, it writes tailored resume bullets and a short outreach message based on what actually matched, not on what would sound impressive.

Every step is logged and shown to you afterward, so you can see exactly how the agent reached its conclusion instead of just trusting a black box.

## Why this matters for how it was built

The hardest part of Scoutly was not connecting an AI model to a form. It was making sure the agent would not just tell people what they wanted to hear. Early versions of the scoring prompt were too generous, finding "matches" that were not really there. The final version is explicit: only claim a match when there is real evidence, and say clearly when there is not.

There is a real example in the run history where the agent correctly told a candidate with a strong machine learning background that they were a weak fit for a backend engineering role, and explained exactly why. That is the point. An agent that agrees with everyone is worthless. One that tells you the truth is worth building.

## How it is built

- Next.js and TypeScript for the app itself, deployed on Vercel
- Supabase for the database and authentication, with row level security enforced on every table so users can only ever see their own data
- Passwordless sign in through email, so there are no passwords to manage or leak
- Groq running Llama 3.3 for the parsing and reasoning steps
- Tavily for live company research
- Every agent run is saved with its full reasoning trace, timestamped and stored, not thrown away after the response is shown

The agent itself is not a single prompt pretending to be smart. It is three separate steps that each do one job, log their own output, and can fail or retry independently without losing the work already done.

## Status

Fully working end to end. Sign in, submit a resume and a job posting, and get a real result in under 20 seconds.
