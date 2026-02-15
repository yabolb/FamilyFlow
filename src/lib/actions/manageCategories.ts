'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateCategoryData {
    name: string
    icon: string
    type: 'fixed' | 'variable' | 'both'
}

export async function createCategory(data: CreateCategoryData) {
    try {
        const supabase = await createClient()

        // 1. Obtener el family_id del usuario actual
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single()

        if (userError || !userData?.family_id) {
            return { success: false, error: 'No se encontró la familia del usuario' }
        }

        // 2. Comprobar si ya existe una categoría con el mismo nombre para esta familia (o del sistema)
        const { data: existingCategories } = await supabase
            .from('categories')
            .select('id')
            .or(`family_id.eq.${userData.family_id},family_id.is.null`)
            .ilike('name', data.name.trim())
            .limit(1)

        if (existingCategories && existingCategories.length > 0) {
            return { success: false, error: 'Esta categoría ya existe' }
        }

        // 3. Insertar la nueva categoría
        const { data: newCategory, error } = await supabase
            .from('categories')
            .insert({
                name: data.name,
                icon: data.icon,
                type: data.type,
                family_id: userData.family_id,
                is_system: false,
                sort_order: 0 // Al principio por defecto
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating category:', error)
            return { success: false, error: error.message }
        }

        // Revalidar para que se vean las categorías actualizadas
        revalidatePath('/dashboard')

        return { success: true, category: newCategory }
    } catch (err: any) {
        console.error('Unexpected error creating category:', err)
        return { success: false, error: 'Error inesperado al crear la categoría' }
    }
}
