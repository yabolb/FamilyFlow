import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './perfil-client'
import type { User as UserType, Family } from '@/types'

interface Member {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    is_family_admin: boolean
}

export default async function PerfilPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile with family
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
            *,
            family:families(*)
        `)
        .eq('id', user.id)
        .single()

    if (profileError || !profile?.family_id) {
        redirect('/onboarding')
    }

    // Get family members
    const { data: members } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, is_family_admin')
        .eq('family_id', profile.family_id)
        .order('is_family_admin', { ascending: false })
        .order('full_name', { ascending: true })

    const typedUser = profile as unknown as UserType
    const typedFamily = (profile as unknown as { family: Family }).family
    const typedMembers = (members ?? []) as Member[]

    return (
        <ProfileClient
            user={typedUser}
            family={typedFamily}
            members={typedMembers}
        />
    )
}
