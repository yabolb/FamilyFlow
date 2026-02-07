import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Get the authenticated user
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if user profile exists and has a family
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('family_id')
                    .eq('id', user.id)
                    .single()

                // If profile doesn't exist or has no family, redirect to onboarding
                if (profileError || !profile || !profile.family_id) {
                    return NextResponse.redirect(`${origin}/onboarding`)
                }

                // User has a family, go to dashboard
                return NextResponse.redirect(`${origin}/dashboard`)
            }
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth`)
}
