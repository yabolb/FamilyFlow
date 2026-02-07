import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFamilyIntelligence } from '@/lib/intelligence'
import InteligenciaClient from './inteligencia-client'

export const metadata = {
    title: 'Inteligencia - FamilyFlow',
    description: 'Análisis y predicciones de gastos familiares',
}

export default async function InteligenciaPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single()

    if (!profile?.family_id) redirect('/onboarding')

    const intelligenceData = await getFamilyIntelligence(profile.family_id)

    return <InteligenciaClient data={intelligenceData} />
}
