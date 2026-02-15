import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

export interface CategoryGroup {
    title: string
    type: 'fixed' | 'variable'
    categories: Category[]
}

export async function getCategories(): Promise<Category[]> {
    const supabase = createClient()

    // Get current user's family_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: userData } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single()

    // Fetch only system categories (family_id IS NULL) + this family's categories
    const query = supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

    if (userData?.family_id) {
        query.or(`family_id.eq.${userData.family_id},family_id.is.null`)
    } else {
        query.is('family_id', null) // No family? Only system categories
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching categories:', error)
        return []
    }

    return data as Category[]
}

export type CategoryContext = 'fixed' | 'variable' | 'all'

export function groupCategoriesByType(
    categories: Category[],
    context: CategoryContext = 'all'
): CategoryGroup[] {
    // Filtrar por contexto
    const filtered = categories.filter(c => {
        if (context === 'all') return true
        return c.type === context || c.type === 'both'
    })

    // Devolver un solo grupo con todas las categorías filtradas
    return [{ title: 'Categorías', type: 'variable', categories: filtered }]
}
