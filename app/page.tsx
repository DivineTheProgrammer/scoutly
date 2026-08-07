import { supabase } from './lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('users').select('*')

  return (
    <main style={{ padding: '2rem', color: 'white' }}>
      <h1>Supabase Connection Test</h1>
      {error ? (
        <p style={{ color: 'red' }}>Error: {error.message}</p>
      ) : (
        <p style={{ color: 'lightgreen' }}>
          Connected successfully! Found {data?.length ?? 0} users.
        </p>
      )}
    </main>
  )
}