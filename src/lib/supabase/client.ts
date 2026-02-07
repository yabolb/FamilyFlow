import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Durante el build o en servidor sin claves, devolvemos un cliente dummy para evitar el crash
    if (typeof window === 'undefined') {
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder'
      )
    }
    // En el navegador, esto es un error fatal
    throw new Error('Supabase keys are missing! Check your .env file.')
  }

  return createBrowserClient(url, key)
}
