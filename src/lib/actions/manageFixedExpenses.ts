'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface FixedExpenseResult {
    success: boolean
    error?: string
    templateId?: string
}

export interface FixedExpenseInput {
    name: string
    amount: number
    categoryId: string
    frequency: 'monthly' | 'annual'
    dueDay?: number // 1-31 for monthly
    dueMonth?: number // 1-12 for annual
}

/**
 * Añade un nuevo gasto fijo (template) para la familia del usuario
 */
export async function addFixedExpense(data: FixedExpenseInput): Promise<FixedExpenseResult> {
    try {
        const supabase = await createClient()

        // 1. Validate user session
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'No autorizado. Inicia sesión de nuevo.' }
        }

        // 2. Get user's family_id
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.family_id) {
            return { success: false, error: 'No se encontró tu familia.' }
        }

        // 3. Validate input
        if (!data.name?.trim()) {
            return { success: false, error: 'Introduce un nombre para el gasto.' }
        }

        if (!data.amount || data.amount <= 0) {
            return { success: false, error: 'Introduce un importe válido.' }
        }

        if (!data.categoryId) {
            return { success: false, error: 'Selecciona una categoría.' }
        }

        // Validate due_day based on frequency
        let dueDay = data.dueDay || 1
        if (data.frequency === 'monthly') {
            dueDay = Math.min(Math.max(dueDay, 1), 31)
        } else if (data.frequency === 'annual') {
            dueDay = Math.min(Math.max(dueDay, 1), 31)
        }

        // 4. Insert expense template
        const { data: template, error: insertError } = await supabase
            .from('expense_templates')
            .insert({
                family_id: profile.family_id,
                name: data.name.trim(),
                amount: data.amount,
                category_id: data.categoryId,
                frequency: data.frequency,
                due_day: dueDay,
                due_month: data.frequency === 'annual' ? (data.dueMonth || 1) : null,
                is_active: true,
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('Insert expense template error:', insertError)
            return {
                success: false,
                error: `Error al guardar: ${insertError.message}`
            }
        }

        // 5. Revalidate paths
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/recurrentes')

        return {
            success: true,
            templateId: template.id
        }

    } catch (error: any) {
        console.error('addFixedExpense error:', error)
        return {
            success: false,
            error: `Error inesperado: ${error.message}`
        }
    }
}

/**
 * Actualiza un gasto fijo existente
 */
export async function updateFixedExpense(
    templateId: string,
    data: Partial<FixedExpenseInput>
): Promise<FixedExpenseResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'No autorizado.' }
        }

        // Get user's family to verify ownership
        const { data: profile } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single()

        if (!profile?.family_id) {
            return { success: false, error: 'No se encontró tu familia.' }
        }

        // Build update object
        const updateData: Record<string, any> = {}
        if (data.name) updateData.name = data.name.trim()
        if (data.amount) updateData.amount = data.amount
        if (data.categoryId) updateData.category_id = data.categoryId
        if (data.frequency) updateData.frequency = data.frequency
        if (data.dueDay) updateData.due_day = data.dueDay
        if (data.dueMonth !== undefined) updateData.due_month = data.dueMonth

        const { error: updateError } = await supabase
            .from('expense_templates')
            .update(updateData)
            .eq('id', templateId)
            .eq('family_id', profile.family_id) // Security: only update own family's templates

        if (updateError) {
            return { success: false, error: `Error al actualizar: ${updateError.message}` }
        }

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/recurrentes')

        return { success: true, templateId }

    } catch (error: any) {
        console.error('updateFixedExpense error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Elimina un gasto fijo
 */
export async function deleteFixedExpense(templateId: string): Promise<FixedExpenseResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'No autorizado.' }
        }

        const { data: profile } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single()

        if (!profile?.family_id) {
            return { success: false, error: 'No se encontró tu familia.' }
        }

        const { error: deleteError } = await supabase
            .from('expense_templates')
            .delete()
            .eq('id', templateId)
            .eq('family_id', profile.family_id)

        if (deleteError) {
            return { success: false, error: `Error al eliminar: ${deleteError.message}` }
        }

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/recurrentes')

        return { success: true }

    } catch (error: any) {
        console.error('deleteFixedExpense error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Activa/Desactiva un gasto fijo
 */
export async function toggleFixedExpense(templateId: string, isActive: boolean): Promise<FixedExpenseResult> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado.' }

        const { data: profile } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single()

        if (!profile?.family_id) {
            return { success: false, error: 'No se encontró tu familia.' }
        }

        const { error } = await supabase
            .from('expense_templates')
            .update({ is_active: isActive })
            .eq('id', templateId)
            .eq('family_id', profile.family_id)

        if (error) {
            return { success: false, error: error.message }
        }

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/recurrentes')

        return { success: true }

    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
