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
        <div className="screen pt-8 px-gutter flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-6">🧠</div>
            <h1 className="text-h1 mb-2">Inteligencia</h1>
            <p className="text-sub">Próximamente</p>
        </div>
    )
}
