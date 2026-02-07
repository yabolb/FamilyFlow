import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './profile-client'
import type { User as UserType, Family } from '@/types'

interface ProfileWithFamily extends UserType {
    family: Family
}

interface FamilyMember {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    is_family_admin: boolean
}

export default async function ProfilePage() {
    const supabase = await createClient()

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

    const typedProfile = profile as unknown as ProfileWithFamily

    // Get family members
    const { data: members } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, is_family_admin')
        .eq('family_id', typedProfile.family_id)
        .order('is_family_admin', { ascending: false })

    return (
        <ProfileClient
            user={typedProfile}
            family={typedProfile.family}
            members={(members ?? []) as FamilyMember[]}
        />
    )
}
