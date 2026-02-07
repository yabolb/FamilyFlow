import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

export interface CategoryGroup {
    title: string
    type: 'fixed' | 'variable'
    categories: Category[]
}

export async function getCategories(): Promise<Category[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or('is_system.eq.true,family_id.is.null')
        .order('sort_order', { ascending: true })

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
