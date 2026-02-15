// import { redirect } from 'next/navigation'
// import { createClient } from '@/lib/supabase/server'
// import { getFamilyIntelligence } from '@/lib/intelligence'
// import { getMarketData } from '@/lib/actions/getMarketData'
// import InteligenciaClient from './inteligencia-client'

export const metadata = {
    title: 'Inteligencia - Family Fin',
    description: 'Análisis, predicciones y asesor financiero IA',
}

export default async function InteligenciaPage() {
    // const supabase = await createClient()
    //
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    // if (authError || !user) redirect('/login')
    //
    // const { data: profile } = await supabase
    //     .from('users')
    //     .select('family_id')
    //     .eq('id', user.id)
    //     .single()
    //
    // if (!profile?.family_id) redirect('/onboarding')
    //
    // // Fetch intelligence data and market data in parallel
    // const [intelligenceData, marketData] = await Promise.all([
    //     getFamilyIntelligence(profile.family_id),
    //     getMarketData(),
    // ])
    //
    // return (
    //     <InteligenciaClient
    //         data={intelligenceData}
    //         marketData={marketData}
    //     />
    // )

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24">
            <div className="text-6xl mb-4">🧠</div>
            <h1 className="text-2xl font-bold text-primary mb-2">Inteligencia</h1>
            <p className="text-secondary text-center">Coming Soon</p>
        </div>
    )
}
