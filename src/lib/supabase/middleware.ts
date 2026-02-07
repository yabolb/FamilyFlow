import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make your app insecure.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/auth/callback', '/auth/confirm']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // If not logged in and trying to access protected route
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If logged in and not on a public route or onboarding
    if (user && !isPublicRoute && pathname !== '/onboarding') {
        // Get user profile to check family_id
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single()

        // If profile doesn't exist OR has no family, redirect to onboarding
        if (profileError || !profile || profile.family_id === null) {
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
        }
    }

    // If on onboarding but already has a family, redirect to dashboard
    if (user && pathname === '/onboarding') {
        const { data: profile } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single()

        if (profile?.family_id) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // If logged in and on login page, check where to redirect
    if (user && pathname === '/login') {
        const { data: profile } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single()

        const url = request.nextUrl.clone()

        if (!profile || profile.family_id === null) {
            url.pathname = '/onboarding'
        } else {
            url.pathname = '/dashboard'
        }

        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
