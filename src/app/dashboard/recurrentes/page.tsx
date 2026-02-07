import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RecurrentesClient from './recurrentes-client'

export const metadata = {
    title: 'Gastos Fijos - FamilyFlow',
    description: 'Gestiona tus gastos recurrentes mensuales y anuales',
}

export default async function RecurrentesPage() {
    const supabase = await createClient()

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/login')
    }

    // Get user's family
    const { data: profile } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single()

    if (!profile?.family_id) {
        redirect('/onboarding')
    }

    // Get expense templates with category
    const { data: templates, error: templatesError } = await supabase
        .from('expense_templates')
        .select(`
      *,
      category:categories(id, name, icon, type)
    `)
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false })

    if (templatesError) {
        console.error('Error fetching templates:', templatesError)
    }

    return <RecurrentesClient initialTemplates={templates || []} />
}
