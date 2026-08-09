'use client'

import { useState } from 'react'
import { createClient } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Sign in to Scoutly</h1>

      {sent ? (
        <p style={{ color: 'lightgreen', marginTop: '1rem' }}>
          Check your email for a magic link to sign in.
        </p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '0.5rem',
              marginTop: '1rem',
              color: 'black',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={handleLogin}
            disabled={loading || !email}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              backgroundColor: 'white',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
          {error && <p style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</p>}
        </>
      )}
    </main>
  )
}