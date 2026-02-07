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

export function groupCategoriesByType(categories: Category[]): CategoryGroup[] {
    const fixed = categories.filter(c => c.type === 'fixed' || c.type === 'both')
    const variable = categories.filter(c => c.type === 'variable' || c.type === 'both')

    return [
        { title: 'Vivienda', type: 'fixed', categories: fixed },
        { title: 'Vida Diaria', type: 'variable', categories: variable },
    ]
}
