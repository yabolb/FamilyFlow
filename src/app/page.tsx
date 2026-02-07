import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user profile exists and has a family
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist or has no family, go to onboarding
  if (profileError || !profile || profile.family_id === null) {
    redirect('/onboarding')
  }

  // User has a family, go to dashboard
  redirect('/dashboard')
}
